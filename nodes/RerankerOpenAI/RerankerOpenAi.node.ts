import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

interface RerankDocument {
	text: string;
	metadata?: Record<string, any>;
}

interface RerankResult {
	index: number;
	relevance_score: number;
	document?: RerankDocument;
}

interface RerankResponse {
	results: RerankResult[];
}

export class RerankerOpenAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Reranker OpenAI',
		name: 'rerankerOpenAi',
		icon: { light: 'file:openai.svg', dark: 'file:openai.dark.svg' },
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
				const topN = this.getNodeParameter('topN', itemIndex, 10) as number;

				const credentials = await this.getCredentials<{
					apiKey: string;
					url: string;
				}>('openAIApi');

				const item = items[itemIndex];
				const documents = item.json[documentsField] as any[];

				if (!Array.isArray(documents)) {
					throw new NodeOperationError(
						this.getNode(),
						`Field '${documentsField}' must contain an array of documents`,
						{ itemIndex }
					);
				}

				if (documents.length === 0) {
					returnData.push({
						json: {
							...item.json,
							reranked_documents: [],
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
						throw new NodeOperationError(
							this.getNode(),
							`Document at index ${index} does not contain field '${textField}'`,
							{ itemIndex }
						);
					}
				});

				// Prepare the request payload for reranking API
				const requestBody = {
					model: modelName,
					query,
					documents: documentTexts,
					top_n: Math.min(topN, documents.length),
				};

				const baseURL = credentials.url.replace(/\/$/, ''); // Remove trailing slash
				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseURL}/v1/rerank`,
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${credentials.apiKey}`,
					},
					body: requestBody,
				});

				const result = response as RerankResponse;

				// Handle the response format
				if (result.results && Array.isArray(result.results)) {
					// Sort by relevance score (descending) and map back to documents
					const rankedResults = result.results
						.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
						.filter((item) => {
							// Validate index is within bounds
							return (
								typeof item.index === 'number' && 
								item.index >= 0 && 
								item.index < documents.length
							);
						})
						.slice(0, topN) // Limit to topN results after filtering
						.map((item) => {
							const originalDoc = documents[item.index];
							return {
								...originalDoc,
								relevance_score: item.relevance_score,
								original_index: item.index,
							};
						});

					returnData.push({
						json: {
							...item.json,
							reranked_documents: rankedResults,
							query,
							total_results: rankedResults.length,
						},
						pairedItem: itemIndex,
					});
				} else {
					// Fallback: return original documents if response format is unexpected
					returnData.push({
						json: {
							...item.json,
							reranked_documents: documents.slice(0, topN),
							query,
							total_results: Math.min(topN, documents.length),
						},
						pairedItem: itemIndex,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: itemIndex,
					});
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex });
				}
			}
		}

		return [returnData];
	}
}
