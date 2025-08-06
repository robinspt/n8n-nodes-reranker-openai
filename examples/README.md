# Reranker Workflow Examples

This directory contains working examples for implementing document reranking in n8n workflows using HTTP Request and Code nodes.

## 📁 Files

- `rerank-workflow-example.json` - Complete n8n workflow that can be imported
- `document-processor.js` - Standalone Document Processor code
- `result-processor.js` - Standalone Result Processor code

## 🚀 Quick Start

### 1. Import the Workflow

1. Open your n8n instance
2. Go to **Workflows** → **Import from File**
3. Select `rerank-workflow-example.json`
4. Configure the credentials (see below)

### 2. Configure Credentials

You'll need to set up the following credentials:

#### MongoDB Atlas Credential
- **Type**: MongoDB
- **Connection String**: Your MongoDB Atlas connection string
- **Database**: Your database name

#### SiliconFlow API Credential (for Embedding)
- **Type**: OpenAI API
- **API Key**: Your SiliconFlow API key
- **Base URL**: `https://api.siliconflow.cn`

#### SiliconFlow Bearer Token (for Rerank API)
- **Type**: Bearer Token
- **Token**: Your SiliconFlow API key

#### DeepSeek API Credential
- **Type**: DeepSeek API
- **API Key**: Your DeepSeek API key

### 3. Update Node Parameters

#### MongoDB Atlas Vector Store
- **Collection**: Update to your collection name
- **Vector Index Name**: Update to your vector index name
- **Embedding Field**: Update to your embedding field name
- **Metadata Field**: Update to your metadata field name

#### HTTP Request Node
- **Model**: Change to your preferred rerank model (e.g., `Qwen/Qwen3-Reranker-8B`)
- **Top N**: Adjust the number of documents to return (default: 3)

## 🔧 How It Works

### Workflow Flow
```
Chat Trigger → Vector Store → Document Processor → Rerank API → Result Processor → AI Agent
                     ↑                                                                    ↑
Embedding Model ─────┘                                                                    │
Chat Model ─────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Process

1. **Chat Trigger**: Receives user input
2. **Vector Store**: Searches for similar documents using embeddings
3. **Document Processor**: Extracts and formats documents from Vector Store output
4. **Rerank API**: Calls SiliconFlow rerank API to reorder documents by relevance
5. **Result Processor**: Processes API response and formats for AI Agent
6. **AI Agent**: Generates response based on reranked documents

## 📝 Code Explanations

### Document Processor
- Extracts documents from MongoDB Vector Store output
- Handles different document formats and metadata structures
- Sorts documents by similarity score
- Prepares data for rerank API call

### Result Processor
- Processes rerank API response
- Maps reranked results back to original documents
- Builds formatted context text for AI Agent
- Handles API errors with fallback to original order

## 🛠️ Customization

### Changing the Rerank Model
Update the HTTP Request node's JSON body:
```json
{
  "model": "your-preferred-model",
  "query": "{{ $json.query }}",
  "documents": {{ JSON.stringify($json.documents.map(doc => doc.pageContent)) }},
  "top_n": 3
}
```

### Adjusting Document Count
- **Vector Store Top K**: Number of documents to retrieve (e.g., 10)
- **Rerank Top N**: Number of documents to return after reranking (e.g., 3)

### Modifying Context Format
Edit the Result Processor code to change how documents are formatted for the AI Agent:

```javascript
// Custom context formatting
contextText = rerankedDocuments.map((doc, index) => {
  const metadata = doc.metadata;
  return `Document ${index + 1}: ${doc.pageContent}`;
}).join('\n\n');
```

## 🐛 Troubleshooting

### Common Issues

1. **"No documents found"**
   - Check MongoDB connection and collection name
   - Verify vector index exists and is properly configured
   - Ensure embedding model is working

2. **"Rerank API failed"**
   - Verify SiliconFlow API key is correct
   - Check if the model name is valid
   - Ensure API quota is not exceeded

3. **"Invalid JSON format"**
   - Check HTTP Request node JSON body syntax
   - Verify document array is properly formatted

### Debug Tips

1. **Enable Console Logs**: Check the Code node outputs for detailed logs
2. **Test Individual Nodes**: Run each node separately to isolate issues
3. **Check API Responses**: Examine HTTP Request node output for API errors

## 📊 Performance Optimization

### Best Practices

1. **Limit Vector Store Results**: Use reasonable Top K values (5-20)
2. **Optimize Rerank Count**: Balance quality vs. speed (3-5 documents)
3. **Cache Results**: Consider caching for repeated queries
4. **Monitor API Usage**: Track API calls to avoid quota limits

### Scaling Considerations

- **Batch Processing**: For multiple queries, consider batching
- **Error Handling**: Implement robust fallback mechanisms
- **Rate Limiting**: Respect API rate limits
- **Cost Management**: Monitor API usage costs

## 🔗 Related Resources

- [SiliconFlow API Documentation](https://docs.siliconflow.cn/)
- [n8n Code Node Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/)
- [n8n HTTP Request Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [MongoDB Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/)

## 💡 Tips

- Test with simple queries first
- Monitor API response times
- Keep document content concise for better performance
- Use meaningful metadata for better context formatting
