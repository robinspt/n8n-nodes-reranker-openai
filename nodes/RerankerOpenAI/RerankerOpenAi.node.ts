import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

export class RerankerOpenAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Reranker OpenAI',
		name: 'rerankerOpenAi',
		icon: 'fa:robot',
		group: ['transform'],
		version: 1,
		description: 'Use OpenAI-compatible Reranker to reorder documents by relevance to a given query',
		defaults: {
			name: 'Reranker OpenAI',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
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
			const query = this.getNodeParameter('query', itemIndex) as string;

			returnData.push({
				json: {
					message: `Reranker test with query: ${query}`,
					timestamp: new Date().toISOString(),
				},
				pairedItem: itemIndex,
			});
		}

		return [returnData];
	}
}
