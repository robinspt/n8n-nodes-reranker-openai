import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

export class RerankerOpenAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Reranker OpenAI',
		name: 'rerankerOpenAI',
		icon: 'file:openai.svg',
		group: ['transform'],
		version: 1,
		description: 'Use OpenAI-compatible Reranker to reorder documents by relevance to a given query',
		defaults: {
			name: 'Reranker OpenAI',
		},
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
				displayName: 'Model',
				name: 'modelName',
				type: 'string',
				description: 'The model that should be used to rerank the documents',
				default: 'rerank-1',
				placeholder: 'rerank-1',
				required: true,
			},
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
				const baseURL = (credentials.url as string).replace(/\/$/, '');
				const apiKey = credentials.apiKey as string;

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

				// Extract text from documents
				const documentTexts = documents.map((doc, index) => {
					if (typeof doc === 'string') {
						return doc;
					} else if (typeof doc === 'object' && doc[textField]) {
						return doc[textField];
					} else {
						throw new Error(`Document at index ${index} does not have field "${textField}"`);
					}
				});

				// Prepare the request payload for reranking API
				const requestBody = {
					model: modelName,
					query,
					documents: documentTexts,
					top_n: topN,
				};

				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseURL}/v1/rerank`,
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${apiKey}`,
					},
					body: requestBody,
				});

				// Handle the response format
				if (response.results && Array.isArray(response.results)) {
					// Sort by relevance score (descending) and map back to documents
					const rankedResults = response.results
						.sort((a: any, b: any) => (b.relevance_score || 0) - (a.relevance_score || 0))
						.filter((item: any) => {
							// Validate index is within bounds
							return typeof item.index === 'number' && 
								   item.index >= 0 && 
								   item.index < documents.length;
						})
						.slice(0, topN) // Limit to topN results after filtering
						.map((item: any) => {
							const originalDoc = documents[item.index];
							return {
								...originalDoc,
								relevance_score: item.relevance_score,
								original_index: item.index,
							};
						});

					returnData.push({
						json: {
							reranked_documents: rankedResults,
							query,
							total_results: rankedResults.length,
						},
						pairedItem: itemIndex,
					});
				} else {
					// Fallback: return original documents if response format is unexpected
					const fallbackResults = documents.slice(0, topN).map((doc, index) => ({
						...doc,
						relevance_score: 1.0 - (index * 0.1), // Fake decreasing scores
						original_index: index,
					}));

					returnData.push({
						json: {
							reranked_documents: fallbackResults,
							query,
							total_results: fallbackResults.length,
							warning: 'Unexpected API response format, returned original order',
						},
						pairedItem: itemIndex,
					});
				}
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
