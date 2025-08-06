# n8n-nodes-reranker-openai

> **⚠️ IMPORTANT NOTICE: This node is currently NOT FUNCTIONAL**
>
> This community node cannot be used as a reranker because n8n does not support community nodes with `AiReranker` connection type.
>
> **Please use the [HTTP Request + Code Node Workaround](#-workaround-http-request--code-nodes) instead.**
>
> This node will become functional when n8n officially supports community nodes with `AiReranker` connection type.

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

## 🔧 Workaround: HTTP Request + Code Nodes

Since the dedicated reranker node cannot be used, here's a working implementation using HTTP Request and Code nodes:

### Workflow Structure
```
Chat Trigger → MongoDB Vector Store → Document Processor (Code) → HTTP Request (Rerank API) → Result Processor (Code) → AI Agent
                        ↑                                                                                                    ↑
Qwen3-Embedding ────────┘                                                                                                    │
DeepSeek Chat Model ─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Document Processor (Code Node)
```javascript
// Process MongoDB Vector Store output and prepare for rerank API
const inputItems = $input.all();
const userQuery = $('When chat message received').first().json.chatInput;

const processedDocuments = [];
for (const item of inputItems) {
  if (item.json && item.json.document) {
    const doc = item.json.document;
    let pageContent = '';

    // Extract content from metadata if needed
    if (doc.metadata && doc.metadata.embedding_text) {
      pageContent = doc.metadata.embedding_text;
    } else if (doc.pageContent) {
      pageContent = doc.pageContent;
    }

    if (pageContent && pageContent.trim() !== '') {
      processedDocuments.push({
        pageContent: pageContent,
        metadata: {
          ...doc.metadata,
          similarity_score: item.json.score || 0
        }
      });
    }
  }
}

return [{
  json: {
    query: userQuery,
    documents: processedDocuments,
    chatInput: userQuery
  }
}];
```

### 2. HTTP Request Node Configuration
- **Method**: POST
- **URL**: `https://api.siliconflow.cn/v1/rerank`
- **Authentication**: Bearer Token
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "model": "Qwen/Qwen3-Reranker-8B",
  "query": "{{ $json.query }}",
  "documents": {{ JSON.stringify($json.documents.map(doc => doc.pageContent)) }},
  "top_n": 3
}
```

### 3. Result Processor (Code Node)
```javascript
// Process rerank API response and format for AI Agent
const rerankResponse = $input.first().json;
const originalDocuments = $('Document Processor').first().json.documents;
const userQuery = $('Document Processor').first().json.query;

let rerankedDocuments = [];
if (rerankResponse.results && Array.isArray(rerankResponse.results)) {
  rerankedDocuments = rerankResponse.results
    .filter(item => item.index >= 0 && item.index < originalDocuments.length)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .map(item => {
      const originalDoc = originalDocuments[item.index];
      return {
        pageContent: originalDoc.pageContent,
        metadata: {
          ...originalDoc.metadata,
          relevance_score: item.relevance_score
        }
      };
    });
}

const contextText = rerankedDocuments.map((doc, index) => {
  const metadata = doc.metadata;
  let docInfo = `【文档${index + 1}】`;
  if (metadata.id) docInfo += ` 条款${metadata.id}`;
  if (metadata.standard_name) docInfo += ` - ${metadata.standard_name}`;
  if (metadata.relevance_score) docInfo += ` [相关度: ${(metadata.relevance_score * 100).toFixed(1)}%]`;
  return `${docInfo}\n内容：${doc.pageContent}\n`;
}).join('\n---\n');

return [{
  json: {
    chatInput: userQuery,
    query: userQuery,
    reranked_documents: rerankedDocuments,
    context: contextText,
    systemContext: `用户问题：${userQuery}\n\n相关规范文档：\n${contextText}`
  }
}];
```

### 4. AI Agent System Message
```
你是一个规范查询助手。

{{ $json.systemContext }}

请基于以上文档回答用户问题，要求：
1. 提供准确、详细的回答
2. 标明信息来源的具体条款编号
3. 如果文档中没有直接相关信息，请明确说明
4. 按相关度优先使用排序靠前的文档
```

## ⚠️ Current Limitations

This community node is currently **NOT FUNCTIONAL** due to n8n's architecture limitations:

- ❌ **Cannot be used**: n8n doesn't support community nodes with `AiReranker` connection type
- ❌ **No direct connection**: Cannot connect to Vector Store's reranker input
- ✅ **Workaround available**: Use HTTP Request + Code nodes (see above)
- ✅ **Future ready**: Will work when n8n adds official support

We are waiting for n8n to add `AiReranker` support for community nodes.

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

## 🐛 Issues & Feature Requests

If you encounter any issues or have feature requests, please [open an issue](https://github.com/robinspt/n8n-nodes-reranker-openai/issues) on GitHub.

---

**Note**: This is a community-maintained node and is not officially supported by n8n or OpenAI.
