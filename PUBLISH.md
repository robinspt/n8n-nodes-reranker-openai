# 发布指南

## 发布到 npm registry

### 前置条件
1. 确保您有 npm 账户
2. 确保您已登录 npm

### 发布步骤

1. **登录 npm**
   ```bash
   npm login
   ```
   输入您的 npm 用户名、密码和邮箱

2. **验证登录状态**
   ```bash
   npm whoami
   ```

3. **最终构建和检查**
   ```bash
   npm run build
   npm run lint
   ```

4. **发布包**
   ```bash
   npm publish
   ```

### 发布后验证

1. **检查包是否发布成功**
   ```bash
   npm view n8n-nodes-reranker-openai
   ```

2. **在 n8n 中安装测试**
   - 打开 n8n 实例
   - 进入 Settings > Community Nodes
   - 点击 Install
   - 输入包名: `n8n-nodes-reranker-openai`
   - 点击 Install

### 包信息
- **包名**: n8n-nodes-reranker-openai
- **版本**: 0.1.0
- **大小**: ~17.9 kB
- **文件数**: 15

### 包含的文件
- OpenAI API 凭据配置
- Reranker OpenAI 节点实现
- TypeScript 声明文件
- SVG 图标文件（浅色和深色主题）
- 完整的包配置

### 注意事项
- 首次发布可能需要几分钟才能在 npm registry 中可见
- 确保包名 `n8n-nodes-reranker-openai` 在 npm 上可用
- 发布后无法撤销，请确保代码质量
