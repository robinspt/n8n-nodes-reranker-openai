import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

class OpenAIRerank {
	// Implement the interface expected by LangChain
	private apiKey: string;
	private baseURL: string;
	private model: string;
	private topK?: number;

	constructor(fields: {
		apiKey: string;
		baseURL: string;
		model: string;
		topK?: number;
	}) {
		this.apiKey = fields.apiKey;
		this.baseURL = fields.baseURL.replace(/\/$/, ''); // Remove trailing slash
		this.model = fields.model;
		this.topK = fields.topK;
	}

	async compressDocuments(documents: any[], query: string): Promise<any[]> {
		if (documents.length === 0) {
			return [];
		}

		try {
			// Prepare the request payload for reranking API
			const requestBody = {
				model: this.model,
				query,
				documents: documents.map((doc) => doc.pageContent || doc.text || doc),
				top_n: this.topK || documents.length,
			};

			const response = await (globalThis as any).fetch(`${this.baseURL}/v1/rerank`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			// Handle the response format
			if (result.results && Array.isArray(result.results)) {
				// Sort by relevance score (descending) and map back to documents
				const rankedResults = result.results
					.sort((a: any, b: any) => (b.relevance_score || 0) - (a.relevance_score || 0))
					.filter((item: any) => {
						// Validate index is within bounds
						return typeof item.index === 'number' &&
							   item.index >= 0 &&
							   item.index < documents.length;
					})
					.slice(0, this.topK) // Limit to topK results after filtering
					.map((item: any) => {
						const originalDoc = documents[item.index];
						return {
							...originalDoc,
							metadata: {
								...(originalDoc.metadata || {}),
								relevanceScore: item.relevance_score,
							},
						};
					});

				return rankedResults;
			}

			// Fallback: return original documents if response format is unexpected
			return documents;
		} catch (error) {
			throw error;
		}
	}
}

export class RerankerOpenAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Reranker OpenAI',
		name: 'rerankerOpenAi',
		icon: 'file:openai.svg',
		group: ['transform'],
		version: 1,
		description: 'Use OpenAI-compatible Reranker to reorder documents by relevance to a given query',
		defaults: {
			name: 'Reranker OpenAI',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Rerankers'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.rerankerOpenAI/',
					},
				],
			},
		},
		// Standard node with main input/output for compatibility
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'openAIApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				description: 'The search query to rank documents against',
				placeholder: 'What is machine learning?',
			},
			{
				displayName: 'Model',
				name: 'modelName',
				type: 'string',
				description: 'The model that should be used to rerank the documents',
				default: 'rerank-1',
				placeholder: 'rerank-1',
				required: true,
			},
			{
				displayName: 'Documents Field',
				name: 'documentsField',
				type: 'string',
				default: 'documents',
				description: 'Name of the field containing the documents array to rerank',
				required: true,
			},
			{
				displayName: 'Text Field',
				name: 'textField',
				type: 'string',
				default: 'text',
				description: 'Name of the field containing the document text within each document object',
				required: true,
			},
			{
				displayName: 'Top N',
				name: 'topN',
				type: 'number',
				description: 'Maximum number of documents to return after reranking',
				default: 10,
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const query = this.getNodeParameter('query', itemIndex) as string;
				const modelName = this.getNodeParameter('modelName', itemIndex) as string;
				const documentsField = this.getNodeParameter('documentsField', itemIndex) as string;
				const textField = this.getNodeParameter('textField', itemIndex) as string;
				const topN = this.getNodeParameter('topN', itemIndex) as number;

				const credentials = await this.getCredentials('openAIApi');

				const reranker = new OpenAIRerank({
					apiKey: credentials.apiKey as string,
					baseURL: credentials.url as string,
					model: modelName,
					topK: topN,
				});

				// Get documents from input data
				const inputData = items[itemIndex].json;
				const documents = inputData[documentsField] as any[];

				if (!documents || !Array.isArray(documents)) {
					throw new Error(`Field "${documentsField}" not found or is not an array`);
				}

				if (documents.length === 0) {
					returnData.push({
						json: {
							reranked_documents: [],
							query,
							total_results: 0,
						},
						pairedItem: itemIndex,
					});
					continue;
				}

				// Use the reranker to process documents
				const rerankedDocuments = await reranker.compressDocuments(documents, query);

				returnData.push({
					json: {
						reranked_documents: rerankedDocuments,
						query,
						total_results: rerankedDocuments.length,
					},
					pairedItem: itemIndex,
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: errorMessage,
							query: this.getNodeParameter('query', itemIndex, ''),
							reranked_documents: [],
							total_results: 0,
						},
						pairedItem: itemIndex,
					});
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}
