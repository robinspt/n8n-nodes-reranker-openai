// 优化的 Reranker 工具实现
const { DynamicTool } = require('@langchain/core/tools');

// 配置您的 API 信息
const API_KEY = 'sk-khmxowddjnscazgwsgcxfbcyeoxwqlkqqczcxewjraovoctf';
const BASE_URL = 'https://api.siliconflow.cn';
const MODEL = 'Qwen/Qwen3-Embedding-8B';
const TOP_N = 3;

// 创建 reranker 工具
const rerankerTool = new DynamicTool({
  name: 'rerank_documents',
  description: 'Rerank documents by relevance to a query. Input should be a JSON string with "query" and "documents" fields.',
  func: async (input) => {
    try {
      console.log('Reranker tool input:', input);
      
      // 解析输入
      let parsed;
      try {
        parsed = JSON.parse(input);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return JSON.stringify({
          error: 'Invalid JSON input format',
          reranked_documents: [],
          total_results: 0,
        });
      }

      const { query, documents } = parsed;
      
      // 验证输入
      if (!query || typeof query !== 'string') {
        return JSON.stringify({
          error: 'Missing or invalid "query" field (must be string)',
          reranked_documents: [],
          total_results: 0,
        });
      }

      if (!documents || !Array.isArray(documents)) {
        return JSON.stringify({
          error: 'Missing or invalid "documents" field (must be array)',
          reranked_documents: [],
          total_results: 0,
        });
      }

      if (documents.length === 0) {
        return JSON.stringify({
          reranked_documents: [],
          query,
          total_results: 0,
        });
      }

      // 提取文档内容
      const documentTexts = documents.map((doc, index) => {
        if (typeof doc === 'string') {
          return doc;
        } else if (doc && typeof doc === 'object') {
          return doc.pageContent || doc.text || doc.content || String(doc);
        } else {
          return String(doc);
        }
      });

      console.log(`Processing ${documentTexts.length} documents for query: "${query}"`);

      // 调用 rerank API
      const requestBody = {
        model: MODEL,
        query,
        documents: documentTexts,
        top_n: Math.min(TOP_N, documentTexts.length),
      };

      console.log('API request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${BASE_URL}/v1/rerank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('API response:', JSON.stringify(result, null, 2));

      // 处理 API 响应
      if (result.results && Array.isArray(result.results)) {
        const rankedResults = result.results
          .filter((item) => {
            return typeof item.index === 'number' && 
                   item.index >= 0 && 
                   item.index < documents.length;
          })
          .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
          .slice(0, TOP_N)
          .map((item) => {
            const originalDoc = documents[item.index];
            
            // 确保返回的文档格式一致
            let processedDoc;
            if (typeof originalDoc === 'string') {
              processedDoc = {
                pageContent: originalDoc,
                metadata: {}
              };
            } else if (originalDoc && typeof originalDoc === 'object') {
              processedDoc = {
                pageContent: originalDoc.pageContent || originalDoc.text || originalDoc.content || String(originalDoc),
                metadata: originalDoc.metadata || {}
              };
            } else {
              processedDoc = {
                pageContent: String(originalDoc),
                metadata: {}
              };
            }

            // 添加相关性分数到元数据
            processedDoc.metadata.relevance_score = item.relevance_score;
            processedDoc.metadata.original_index = item.index;

            return processedDoc;
          });

        const finalResult = {
          reranked_documents: rankedResults,
          query,
          total_results: rankedResults.length,
        };

        console.log('Final result:', JSON.stringify(finalResult, null, 2));
        return JSON.stringify(finalResult);
      }

      // 如果 API 响应格式不符合预期，返回原始文档
      console.warn('Unexpected API response format, returning original documents');
      const fallbackResult = {
        reranked_documents: documents.slice(0, TOP_N),
        query,
        total_results: Math.min(documents.length, TOP_N),
      };

      return JSON.stringify(fallbackResult);

    } catch (error) {
      console.error('Reranker tool error:', error);
      return JSON.stringify({
        error: error.message || String(error),
        reranked_documents: [],
        total_results: 0,
      });
    }
  },
});

// 返回工具
return rerankerTool;
