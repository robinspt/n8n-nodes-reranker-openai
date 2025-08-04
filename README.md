# n8n-nodes-reranker-openai

This is an n8n community node that provides OpenAI-compatible reranking functionality for your n8n AI workflows.

The Reranker OpenAI node allows you to reorder documents by relevance to a given query using OpenAI's reranking API or any compatible service. It implements the LangChain `BaseDocumentCompressor` interface for seamless integration with AI workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## 🚀 Features

- **True AI Sub-node**: Implements LangChain `BaseDocumentCompressor` interface
- **OpenAI Compatible**: Works with OpenAI and other compatible reranking APIs
- **Seamless Integration**: Designed to work with Vector Stores and AI Agents
- **Configurable**: Support for different models and top-N results
- **Error Handling**: Graceful fallbacks and comprehensive error handling

## 📦 Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Quick Install

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `n8n-nodes-reranker-openai` as the npm package name
4. Agree to the risks of using community nodes
5. Select **Install**

After installation restart n8n to register the new nodes.

## 🔧 Configuration

### Credentials

Create OpenAI API credentials:

1. Create an OpenAI API account at [platform.openai.com](https://platform.openai.com)
2. Generate an API key from your OpenAI dashboard
3. In n8n, create new credentials of type "OpenAI API"
4. Enter your API key and base URL (default: https://api.openai.com)

### Node Parameters

- **Model**: The reranking model to use (default: "rerank-1")
- **Top N**: Maximum number of documents to return after reranking (default: 10)

## 🔄 Usage

### AI Workflow Integration

The Reranker OpenAI node is designed to work as an AI sub-node in LangChain workflows:

```
Vector Store → Reranker OpenAI → AI Agent
```

### Example Workflow

1. **Vector Store**: Retrieves relevant documents
2. **Reranker OpenAI**: Reorders documents by relevance
3. **AI Agent**: Uses the reranked documents for better responses

### Supported Services

- **OpenAI**: When reranking APIs become available
- **SiliconFlow**: Use models like `Qwen/Qwen3-Reranker-8B`
- **Custom APIs**: Any service implementing the OpenAI reranking API format

## ⚠️ Current Limitations

Due to n8n's current architecture, this community node uses `AiTool` connection type instead of the ideal `AiReranker` type. This means:

- ✅ **Works**: Functions correctly as an AI sub-node
- ✅ **Integrates**: Can be used in AI workflows
- ❌ **Connection**: Cannot directly connect to Vector Store's reranker input
- ❌ **UI**: May not appear in the ideal location in the node palette

We have submitted a feature request to n8n to add `AiReranker` support for community nodes.

## 🛠️ Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm run lint
npm test
```

## 📋 Compatibility

- **Minimum n8n version**: 0.198.0
- **Tested with n8n versions**: 0.198.0+
- **Node.js**: >=18.10
- **LangChain**: Compatible with @langchain/core

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE.md)

## 🔗 Links

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [OpenAI Reranking API Documentation](https://platform.openai.com/docs/guides/reranking)
- [LangChain Document Compressors](https://js.langchain.com/docs/modules/data_connection/retrievers/how_to/contextual_compression)

## 🐛 Issues & Feature Requests

If you encounter any issues or have feature requests, please [open an issue](https://github.com/robinspt/n8n-nodes-reranker-openai/issues) on GitHub.

---

**Note**: This is a community-maintained node and is not officially supported by n8n or OpenAI.
