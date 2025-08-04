import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

export class MinimalTest implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Minimal Test',
		name: 'minimalTest',
		icon: 'fa:test',
		group: ['transform'],
		version: 1,
		description: 'A minimal test node',
		defaults: {
			name: 'Minimal Test',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: 'Hello World',
				description: 'The message to output',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const message = this.getNodeParameter('message', i) as string;
			
			returnData.push({
				json: {
					message,
					timestamp: new Date().toISOString(),
				},
				pairedItem: i,
			});
		}

		return [returnData];
	}
}
