// 简化的Code节点 - 文档处理和格式化
// 模式：Run Once for All Items

// 获取输入数据
const inputItems = $input.all();
console.log('=== Document Processor Started ===');
console.log('Input items count:', inputItems.length);

// 获取用户查询
const userQuery = $('When chat message received').first().json.chatInput;
console.log('User query:', userQuery);

if (!inputItems || inputItems.length === 0) {
  return [{
    json: {
      error: 'No input data received',
      documents: [],
      total_results: 0,
      chatInput: userQuery || 'No query'
    }
  }];
}

// 提取和处理文档数据
const processedDocuments = [];
for (const item of inputItems) {
  if (item.json) {
    console.log('Processing item:', JSON.stringify(item.json, null, 2));
    
    let pageContent = '';
    let metadata = {};
    let score = 0;
    
    // 处理MongoDB Atlas Vector Store返回的格式
    if (item.json.document) {
      const doc = item.json.document;
      metadata = doc.metadata || {};
      score = item.json.score || 0;
      
      // 提取页面内容
      if (doc.pageContent) {
        if (typeof doc.pageContent === 'object') {
          // 如果pageContent是对象，尝试提取文本
          if (doc.pageContent.main_text) {
            pageContent = doc.pageContent.main_text;
          } else if (doc.pageContent.embedding_text) {
            pageContent = doc.pageContent.embedding_text;
          } else {
            pageContent = JSON.stringify(doc.pageContent);
          }
        } else {
          pageContent = doc.pageContent;
        }
      }
      
      // 如果pageContent为空或无效，尝试从metadata中提取
      if (!pageContent || pageContent === '[object Object]' || pageContent.trim() === '') {
        if (metadata.embedding_text) {
          pageContent = metadata.embedding_text;
        } else if (metadata.content && metadata.content.main_text) {
          pageContent = metadata.content.main_text;
        } else if (metadata.content && metadata.content.embedding_text) {
          pageContent = metadata.content.embedding_text;
        }
      }
    } else if (item.json.pageContent) {
      // 标准格式
      pageContent = item.json.pageContent;
      metadata = item.json.metadata || {};
      score = item.json.score || 0;
    }
    
    // 确保有有效的内容
    if (pageContent && pageContent.trim() !== '' && pageContent !== '[object Object]') {
      processedDocuments.push({
        pageContent: pageContent,
        metadata: {
          ...metadata,
          similarity_score: score,
          processed_status: 'success'
        }
      });
    }
  }
}

console.log(`Processed ${processedDocuments.length} valid documents`);

// 按相似度分数排序（降序）
processedDocuments.sort((a, b) => {
  const scoreA = a.metadata.similarity_score || 0;
  const scoreB = b.metadata.similarity_score || 0;
  return scoreB - scoreA;
});

// 取前3个最相关的文档
const topDocuments = processedDocuments.slice(0, 3);

console.log('Top documents:', topDocuments.map(doc => ({
  content: doc.pageContent.substring(0, 100) + '...',
  score: doc.metadata.similarity_score
})));

// 构建给AI Agent的完整上下文
const contextText = topDocuments.map((doc, index) => {
  const metadata = doc.metadata;
  let docInfo = `文档${index + 1}`;
  
  if (metadata.id) {
    docInfo += ` (条款${metadata.id})`;
  }
  if (metadata.standard_name) {
    docInfo += ` - ${metadata.standard_name}`;
  }
  if (metadata.similarity_score) {
    docInfo += ` [相似度: ${metadata.similarity_score.toFixed(3)}]`;
  }
  
  return `${docInfo}:\n${doc.pageContent}\n`;
}).join('\n---\n');

// 返回处理后的结果
return [{
  json: {
    chatInput: userQuery,
    query: userQuery,
    documents: topDocuments,
    total_results: topDocuments.length,
    context: contextText,
    // 为AI Agent提供结构化的提示
    systemContext: `用户问题：${userQuery}\n\n相关文档：\n${contextText}\n\n请基于以上文档回答用户问题，并标明信息来源的具体条款编号。`
  }
}];
