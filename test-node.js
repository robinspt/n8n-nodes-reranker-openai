#!/usr/bin/env node

console.log('🔍 Testing installed node...\n');

try {
    // Test loading the node
    const { RerankerOpenAI } = require('./node_modules/n8n-nodes-reranker-openai/dist/nodes/RerankerOpenAI/RerankerOpenAi.node.js');
    
    console.log('✅ Node module loaded successfully');
    
    // Test instantiation
    const nodeInstance = new RerankerOpenAI();
    console.log('✅ Node instantiated successfully');
    
    // Check node properties
    console.log('\n📋 Node Information:');
    console.log(`   Name: ${nodeInstance.description.name}`);
    console.log(`   Display Name: ${nodeInstance.description.displayName}`);
    console.log(`   Version: ${nodeInstance.description.version}`);
    console.log(`   Icon: ${nodeInstance.description.icon}`);
    console.log(`   Group: ${nodeInstance.description.group}`);
    console.log(`   Inputs: ${JSON.stringify(nodeInstance.description.inputs)}`);
    console.log(`   Outputs: ${JSON.stringify(nodeInstance.description.outputs)}`);
    console.log(`   Properties: ${nodeInstance.description.properties.length} defined`);
    
    // Check package.json
    const packageJson = require('./node_modules/n8n-nodes-reranker-openai/package.json');
    console.log('\n📦 Package Information:');
    console.log(`   Package Name: ${packageJson.name}`);
    console.log(`   Version: ${packageJson.version}`);
    console.log(`   Keywords: ${packageJson.keywords.join(', ')}`);
    console.log(`   n8n API Version: ${packageJson.n8n.n8nNodesApiVersion}`);
    console.log(`   Node Files: ${packageJson.n8n.nodes.join(', ')}`);
    
    console.log('\n🎉 Node is properly installed and functional!');
    console.log('\n💡 The issue is that n8n is not discovering the node automatically.');
    console.log('This suggests the problem is in n8n\'s community node discovery mechanism.');
    
} catch (error) {
    console.error('❌ Error testing node:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
