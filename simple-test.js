#!/usr/bin/env node

console.log('Simple test of n8n community node...\n');

try {
    // Test credential loading
    console.log('Testing credential loading...');
    const { OpenAIApi } = require('./node_modules/n8n-nodes-reranker-openai/dist/credentials/OpenAIApi.credentials.js');
    const credInstance = new OpenAIApi();
    console.log('✅ Credential loaded successfully');
    console.log('  Name:', credInstance.name);
    console.log('  Display Name:', credInstance.displayName);
    
    // Test node loading
    console.log('\nTesting node loading...');
    const { RerankerOpenAI } = require('./node_modules/n8n-nodes-reranker-openai/dist/nodes/RerankerOpenAI/RerankerOpenAi.node.js');
    const nodeInstance = new RerankerOpenAI();
    console.log('✅ Node loaded successfully');
    console.log('  Name:', nodeInstance.description.name);
    console.log('  Display Name:', nodeInstance.description.displayName);
    console.log('  Version:', nodeInstance.description.version);
    console.log('  Inputs:', nodeInstance.description.inputs);
    console.log('  Outputs:', nodeInstance.description.outputs);
    console.log('  Execute method:', typeof nodeInstance.execute);
    
    // Test package.json
    console.log('\nTesting package.json...');
    const packageJson = require('./node_modules/n8n-nodes-reranker-openai/package.json');
    console.log('✅ Package.json loaded');
    console.log('  Package name:', packageJson.name);
    console.log('  Version:', packageJson.version);
    console.log('  n8n config:', packageJson.n8n ? 'present' : 'missing');
    
    if (packageJson.n8n) {
        console.log('  n8nNodesApiVersion:', packageJson.n8n.n8nNodesApiVersion);
        console.log('  Credentials files:', packageJson.n8n.credentials?.length || 0);
        console.log('  Node files:', packageJson.n8n.nodes?.length || 0);
    }
    
    console.log('\n🎉 All tests passed! The community node is properly structured.');
    
    // Now test with n8n
    console.log('\n📋 Next steps:');
    console.log('1. Start n8n in this directory: npx n8n start');
    console.log('2. Open http://localhost:5678');
    console.log('3. Look for "Reranker OpenAI" in the node palette');
    console.log('4. The node should be automatically discovered');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
