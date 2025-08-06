# 完整解决方案：使用HTTP Request节点实现Reranking

## 方案概述

由于n8n Code节点不支持HTTP请求，我们需要使用HTTP Request节点来调用rerank API。

## 新的工作流架构

```
Chat Trigger → MongoDB Vector Store → Code Node (数据处理) → HTTP Request (Rerank API) → Code Node (结果处理) → AI Agent
                        ↑                                                                                              ↑
Qwen3-Embedding ────────┘                                                                                              │
DeepSeek Chat Model ───────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 节点配置

### 1. MongoDB Atlas Vector Store
- **模式**: `load` (Get Many)
- **其他配置**: 保持现有设置

### 2. Code Node 1 (数据预处理)
- **名称**: "Document Processor"
- **代码**: 使用 `simple_code_node.js` 的内容
- **作用**: 提取和格式化文档，准备rerank API请求

### 3. HTTP Request Node (Rerank API)
- **方法**: POST
- **URL**: `https://api.siliconflow.cn/v1/rerank`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer sk-khmxowddjnscazgwsgcxfbcyeoxwqlkqqczcxewjraovoctf`
- **Body**: 
```json
{
  "model": "Qwen/Qwen3-Embedding-8B",
  "query": "{{ $json.query }}",
  "documents": "{{ $json.documents.map(doc => doc.pageContent) }}",
  "top_n": 3
}
```

### 4. Code Node 2 (结果处理)
- **名称**: "Rerank Result Processor"
- **作用**: 处理rerank API响应，格式化最终结果

### 5. AI Agent
- **Prompt**: `{{ $json.chatInput }}`
- **System Message**: 
```
你是一个规范查询助手。

用户问题：{{ $json.query }}

你收到的是经过重排序的相关文档，请基于这些文档回答用户问题：

{{ $json.context }}

请提供准确、详细的回答，并标明信息来源的具体条款编号。
```

## 实施步骤

### 步骤1: 修改现有Code节点
将Code7节点的代码替换为 `simple_code_node.js` 的内容

### 步骤2: 添加HTTP Request节点
1. 在Code节点后添加HTTP Request节点
2. 配置API调用参数
3. 设置请求体格式

### 步骤3: 添加结果处理Code节点
处理HTTP Request的响应，格式化给AI Agent

### 步骤4: 修改AI Agent配置
更新System Message以正确使用重排序后的文档

## 优势

1. ✅ **避免Code节点HTTP限制**: 使用专门的HTTP Request节点
2. ✅ **真正的Reranking**: 调用实际的rerank API
3. ✅ **更好的错误处理**: HTTP Request节点有内置错误处理
4. ✅ **易于调试**: 每个步骤都可以单独查看结果
5. ✅ **灵活配置**: 可以轻松修改API参数

## 临时解决方案

如果您想快速测试，可以：
1. 暂时使用 `simple_code_node.js` 替代当前Code节点
2. 这会按相似度分数排序文档（模拟reranking效果）
3. 修改AI Agent的System Message来正确使用文档上下文
