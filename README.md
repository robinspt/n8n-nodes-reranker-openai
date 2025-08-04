# n8n-nodes-reranker-openai

This is an n8n community node that provides OpenAI-compatible reranking functionality for your n8n workflows.

The Reranker OpenAI node allows you to reorder documents by relevance to a given query using OpenAI's reranking API or any compatible service.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation) | [Operations](#operations) | [Credentials](#credentials) | [Compatibility](#compatibility) | [Usage](#usage) | [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

To install this community node package:

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `n8n-nodes-reranker-openai` as the npm package name
4. Agree to the risks of using community nodes
5. Select **Install**

After installation restart n8n to register the new nodes.

## Operations

The Reranker OpenAI node supports the following operation:

- **Rerank Documents**: Reorder an array of documents by relevance to a given query using OpenAI's reranking API

## Credentials

To use this node, you need to configure OpenAI API credentials:

1. Create an OpenAI API account at [platform.openai.com](https://platform.openai.com)
2. Generate an API key from your OpenAI dashboard
3. In n8n, create new credentials of type "OpenAI API"
4. Enter your API key and base URL (default: https://api.openai.com)

The node also supports OpenAI-compatible services by changing the base URL.

## Compatibility

- Minimum n8n version: 0.198.0
- Tested with n8n versions: 0.198.0+

## Usage

### Input Data Format

The node expects input data with an array of documents to rerank. Configure these parameters:

- **Query**: The search query to rank documents against
- **Model**: The reranking model to use (default: "rerank-1")
- **Documents Field**: Name of the field containing the documents array (default: "documents")
- **Text Field**: Name of the field containing the document text within each document (default: "text")
- **Top N**: Maximum number of documents to return after reranking (default: 10)

### Example Input

```json
{
  "documents": [
    {
      "text": "Machine learning is a subset of artificial intelligence.",
      "id": "doc1"
    },
    {
      "text": "Deep learning uses neural networks with multiple layers.",
      "id": "doc2"
    },
    {
      "text": "Natural language processing helps computers understand text.",
      "id": "doc3"
    }
  ]
}
```

### Example Output

```json
{
  "reranked_documents": [
    {
      "text": "Machine learning is a subset of artificial intelligence.",
      "id": "doc1",
      "relevance_score": 0.95,
      "original_index": 0
    },
    {
      "text": "Deep learning uses neural networks with multiple layers.",
      "id": "doc2",
      "relevance_score": 0.87,
      "original_index": 1
    }
  ],
  "query": "What is machine learning?",
  "total_results": 2
}
```

## Supported Services

- **OpenAI**: When reranking APIs become available
- **SiliconFlow**: Use models like `Qwen/Qwen3-Reranker-8B`
- **Custom APIs**: Any service implementing the OpenAI reranking API format

## Resources

- [OpenAI Reranking API Documentation](https://platform.openai.com/docs/guides/reranking)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE.md)
