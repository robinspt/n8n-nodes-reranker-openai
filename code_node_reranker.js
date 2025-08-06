// Code节点 - Reranker实现
// 模式：Run Once for All Items

// API配置
const API_KEY = 'sk-khmxowddjnscazgwsgcxfbcyeoxwqlkqqczcxewjraovoctf';
const BASE_URL = 'https://api.siliconflow.cn';
const MODEL = 'Qwen/Qwen3-Embedding-8B';
const TOP_N = 3;

// 获取输入数据
const inputItems = $input.all();
console.log('=== Code Node Reranker Started ===');
console.log('Input items count:', inputItems.length);

// 检查是否有输入数据
if (!inputItems || inputItems.length === 0) {
  console.error('No input items received');
  return [{
    json: {
      error: 'No input data received',
      reranked_documents: [],
      total_results: 0
    }
  }];
}

// 获取用户查询（从chat trigger传递过来）
const userQuery = $('When chat message received').first().json.chatInput;
console.log('User query:', userQuery);

if (!userQuery) {
  console.error('No user query found');
  return [{
    json: {
      error: 'No user query found',
      reranked_documents: [],
      total_results: 0
    }
  }];
}

// 提取文档数据
const documents = [];
for (const item of inputItems) {
  if (item.json) {
    // 处理MongoDB Atlas Vector Store返回的格式
    if (item.json.document && item.json.document.pageContent) {
      // MongoDB Vector Store格式: {document: {pageContent: ..., metadata: ...}, score: ...}
      const doc = item.json.document;
      let pageContent = doc.pageContent;

      // 如果pageContent是对象，提取实际文本内容
      if (typeof pageContent === 'object' && pageContent.main_text) {
        pageContent = pageContent.main_text;
      } else if (typeof pageContent === 'object' && pageContent.embedding_text) {
        pageContent = pageContent.embedding_text;
      } else if (typeof pageContent === 'object') {
        pageContent = JSON.stringify(pageContent);
      }

      documents.push({
        pageContent: pageContent,
        metadata: {
          ...doc.metadata,
          similarity_score: item.json.score || 0
        }
      });
    } else if (item.json.pageContent) {
      // 标准LangChain文档格式
      documents.push({
        pageContent: item.json.pageContent,
        metadata: item.json.metadata || {}
      });
    } else if (item.json.text) {
      // 文本格式
      documents.push({
        pageContent: item.json.text,
        metadata: item.json.metadata || {}
      });
    } else if (typeof item.json === 'string') {
      // 纯字符串
      documents.push({
        pageContent: item.json,
        metadata: {}
      });
    } else {
      // 其他格式，转换为字符串
      documents.push({
        pageContent: JSON.stringify(item.json),
        metadata: {}
      });
    }
  }
}

console.log(`Extracted ${documents.length} documents for reranking`);

if (documents.length === 0) {
  console.error('No valid documents found');
  return [{
    json: {
      error: 'No valid documents found in input',
      reranked_documents: [],
      total_results: 0
    }
  }];
}

// 准备rerank API请求
const documentTexts = documents.map(doc => doc.pageContent);
const requestBody = {
  model: MODEL,
  query: userQuery,
  documents: documentTexts,
  top_n: Math.min(TOP_N, documentTexts.length)
};

console.log('Rerank API request:', JSON.stringify(requestBody, null, 2));

try {
  // 使用 $http 替代 fetch (n8n Code节点不支持fetch)
  const response = await $http.request({
    method: 'POST',
    url: `${BASE_URL}/v1/rerank`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: requestBody,
    json: true
  });

  console.log('Rerank API response:', JSON.stringify(response, null, 2));
  const result = response;

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
        return {
          pageContent: originalDoc.pageContent,
          metadata: {
            ...originalDoc.metadata,
            relevance_score: item.relevance_score,
            original_index: item.index,
            rerank_status: 'success'
          }
        };
      });

    console.log(`=== Reranking Success ===`);
    console.log(`Returned ${rankedResults.length} reranked documents`);
    
    // 返回重排序后的文档
    return [{
      json: {
        reranked_documents: rankedResults,
        total_results: rankedResults.length,
        query: userQuery,
        chatInput: userQuery // 添加chatInput字段供AI Agent使用
      }
    }];
  } else {
    console.warn('Unexpected API response format');

    // 响应格式不符合预期时返回原始文档
    const fallbackDocs = documents.slice(0, TOP_N).map((doc, index) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        relevance_score: 1.0 - (index * 0.1),
        rerank_status: 'format_error_fallback'
      }
    }));

    return [{
      json: {
        reranked_documents: fallbackDocs,
        total_results: fallbackDocs.length,
        query: userQuery,
        chatInput: userQuery, // 添加chatInput字段供AI Agent使用
        warning: 'Unexpected API response format. Using original order.'
      }
    }];
  }

} catch (error) {
  console.error('=== Reranker Error ===');
  console.error('Error:', error.message);

  // API失败时返回原始文档的前TOP_N个
  const fallbackDocs = documents.slice(0, TOP_N).map((doc, index) => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      relevance_score: 1.0 - (index * 0.1),
      rerank_status: 'api_failed_fallback'
    }
  }));

  return [{
    json: {
      reranked_documents: fallbackDocs,
      total_results: fallbackDocs.length,
      query: userQuery,
      chatInput: userQuery, // 添加chatInput字段供AI Agent使用
      warning: `Rerank API failed: ${error.message}. Using original order.`
    }
  }];
}
