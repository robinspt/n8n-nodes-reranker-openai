#!/usr/bin/env node

// Test script to verify node loading
console.log('Testing node loading...');

try {
    // Test credential loading
    console.log('Loading OpenAI credentials...');
    const { OpenAIApi } = require('./dist/credentials/OpenAIApi.credentials.js');
    console.log('✅ OpenAI credentials loaded successfully');
    console.log('Credential name:', new OpenAIApi().name);
    console.log('Credential displayName:', new OpenAIApi().displayName);
    
    // Test node loading
    console.log('\nLoading Reranker OpenAI node...');
    const { RerankerOpenAI } = require('./dist/nodes/RerankerOpenAI/RerankerOpenAi.node.js');
    console.log('✅ Reranker OpenAI node loaded successfully');
    
    const nodeInstance = new RerankerOpenAI();
    console.log('Node name:', nodeInstance.description.name);
    console.log('Node displayName:', nodeInstance.description.displayName);
    console.log('Node version:', nodeInstance.description.version);
    console.log('Node inputs:', nodeInstance.description.inputs);
    console.log('Node outputs:', nodeInstance.description.outputs);
    console.log('Node credentials:', nodeInstance.description.credentials);
    
    // Check if execute method exists
    if (typeof nodeInstance.execute === 'function') {
        console.log('✅ Execute method exists');
    } else {
        console.log('❌ Execute method missing');
    }
    
    console.log('\n🎉 All tests passed! Node should load correctly in n8n.');
    
} catch (error) {
    console.error('❌ Error loading node:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
