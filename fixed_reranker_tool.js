// 修复的 Reranker 工具实现 - 专门为 n8n AI Agent 优化
const { DynamicTool } = require('@langchain/core/tools');

// API 配置
const API_KEY = 'sk-khmxowddjnscazgwsgcxfbcyeoxwqlkqqczcxewjraovoctf';
const BASE_URL = 'https://api.siliconflow.cn';
const MODEL = 'Qwen/Qwen3-Embedding-8B';
const TOP_N = 3;

// 创建 reranker 工具
const rerankerTool = new DynamicTool({
  name: 'rerank_documents',
  description: `Rerank and filter documents by relevance to a query. 
Input format: {"query": "user question", "documents": [{"pageContent": "text", "metadata": {...}}, ...]}
Returns: {"reranked_documents": [...], "total_results": number}
Use this tool AFTER getting documents from vector store to improve relevance.`,
  
  func: async (input) => {
    try {
      console.log('=== Reranker Tool Called ===');
      console.log('Raw input:', input);
      
      // 解析输入
      let parsed;
      try {
        parsed = JSON.parse(input);
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        return JSON.stringify({
          error: `Invalid JSON format: ${parseError.message}`,
          reranked_documents: [],
          total_results: 0
        });
      }

      const { query, documents } = parsed;
      
      // 验证必需字段
      if (!query || typeof query !== 'string') {
        return JSON.stringify({
          error: 'Missing or invalid "query" field (must be non-empty string)',
          reranked_documents: [],
          total_results: 0
        });
      }

      if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return JSON.stringify({
          error: 'Missing or invalid "documents" field (must be non-empty array)',
          reranked_documents: [],
          total_results: 0
        });
      }

      console.log(`Processing ${documents.length} documents for query: "${query}"`);

      // 提取文档文本内容
      const documentTexts = documents.map((doc, index) => {
        if (typeof doc === 'string') {
          return doc;
        } else if (doc && typeof doc === 'object') {
          return doc.pageContent || doc.text || doc.content || JSON.stringify(doc);
        } else {
          return String(doc);
        }
      });

      // 过滤空文档
      const validDocs = documentTexts.filter(text => text && text.trim().length > 0);
      if (validDocs.length === 0) {
        return JSON.stringify({
          error: 'No valid document content found',
          reranked_documents: [],
          total_results: 0
        });
      }

      // 调用 rerank API
      const requestBody = {
        model: MODEL,
        query: query.trim(),
        documents: validDocs,
        top_n: Math.min(TOP_N, validDocs.length)
      };

      console.log('API Request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${BASE_URL}/v1/rerank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${response.status} - ${errorText}`);
        
        // 如果API失败，返回原始文档的前TOP_N个
        const fallbackDocs = documents.slice(0, TOP_N).map((doc, index) => ({
          pageContent: typeof doc === 'string' ? doc : (doc.pageContent || String(doc)),
          metadata: {
            ...(typeof doc === 'object' && doc.metadata ? doc.metadata : {}),
            relevance_score: 1.0 - (index * 0.1), // 模拟递减的相关性分数
            rerank_status: 'api_failed_fallback'
          }
        }));

        return JSON.stringify({
          reranked_documents: fallbackDocs,
          total_results: fallbackDocs.length,
          warning: `Rerank API failed: ${response.status}. Using original order.`
        });
      }

      const result = await response.json();
      console.log('API Response:', JSON.stringify(result, null, 2));

      // 处理API响应
      if (result.results && Array.isArray(result.results)) {
        const rankedResults = result.results
          .filter(item => 
            typeof item.index === 'number' && 
            item.index >= 0 && 
            item.index < documents.length &&
            typeof item.relevance_score === 'number'
          )
          .sort((a, b) => b.relevance_score - a.relevance_score)
          .slice(0, TOP_N)
          .map(item => {
            const originalDoc = documents[item.index];
            
            // 构建标准化的文档格式
            const rerankedDoc = {
              pageContent: typeof originalDoc === 'string' 
                ? originalDoc 
                : (originalDoc.pageContent || originalDoc.text || originalDoc.content || String(originalDoc)),
              metadata: {
                ...(typeof originalDoc === 'object' && originalDoc.metadata ? originalDoc.metadata : {}),
                relevance_score: item.relevance_score,
                original_index: item.index,
                rerank_status: 'success'
              }
            };

            return rerankedDoc;
          });

        const finalResult = {
          reranked_documents: rankedResults,
          total_results: rankedResults.length,
          query: query
        };

        console.log('=== Reranker Success ===');
        console.log(`Returned ${rankedResults.length} reranked documents`);
        console.log('Final result:', JSON.stringify(finalResult, null, 2));
        
        return JSON.stringify(finalResult);
      } else {
        console.warn('Unexpected API response format');
        
        // 如果响应格式不符合预期，返回原始文档
        const fallbackDocs = documents.slice(0, TOP_N).map((doc, index) => ({
          pageContent: typeof doc === 'string' ? doc : (doc.pageContent || String(doc)),
          metadata: {
            ...(typeof doc === 'object' && doc.metadata ? doc.metadata : {}),
            relevance_score: 1.0 - (index * 0.1),
            rerank_status: 'format_error_fallback'
          }
        }));

        return JSON.stringify({
          reranked_documents: fallbackDocs,
          total_results: fallbackDocs.length,
          warning: 'Unexpected API response format. Using original order.'
        });
      }

    } catch (error) {
      console.error('=== Reranker Tool Error ===');
      console.error('Error:', error);
      
      return JSON.stringify({
        error: `Reranker tool failed: ${error.message}`,
        reranked_documents: [],
        total_results: 0
      });
    }
  }
});

console.log('Reranker tool created successfully');
return rerankerTool;
