#!/usr/bin/env node

console.log('🔍 Simple debugging of n8n package...\n');

const fs = require('fs');
const path = require('path');

try {
    const packagePath = './node_modules/n8n-nodes-reranker-openai';
    
    // 1. Check package.json
    console.log('1. Checking package.json...');
    const packageJson = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
    console.log(`   Name: ${packageJson.name}`);
    console.log(`   Version: ${packageJson.version}`);
    console.log(`   Keywords: ${packageJson.keywords.join(', ')}`);
    console.log(`   n8n API version: ${packageJson.n8n.n8nNodesApiVersion}`);
    
    // 2. Test credential loading
    console.log('\n2. Testing credential loading...');
    const credFile = packageJson.n8n.credentials[0];
    console.log(`   Credential file: ${credFile}`);
    
    const credPath = path.join(packagePath, credFile);
    console.log(`   Full path: ${credPath}`);
    console.log(`   File exists: ${fs.existsSync(credPath)}`);
    
    const credModule = require(credPath);
    console.log(`   Exports: ${Object.keys(credModule).join(', ')}`);
    
    const { OpenAIApi } = credModule;
    const credInstance = new OpenAIApi();
    console.log(`   ✅ Credential instantiated: ${credInstance.name}`);
    
    // 3. Test node loading
    console.log('\n3. Testing node loading...');
    const nodeFile = packageJson.n8n.nodes[0];
    console.log(`   Node file: ${nodeFile}`);
    
    const nodePath = path.join(packagePath, nodeFile);
    console.log(`   Full path: ${nodePath}`);
    console.log(`   File exists: ${fs.existsSync(nodePath)}`);
    
    const nodeModule = require(nodePath);
    console.log(`   Exports: ${Object.keys(nodeModule).join(', ')}`);
    
    const { RerankerOpenAI } = nodeModule;
    const nodeInstance = new RerankerOpenAI();
    console.log(`   ✅ Node instantiated: ${nodeInstance.description.name}`);
    
    // 4. Check for potential issues
    console.log('\n4. Checking for potential issues...');
    
    // Check node name format
    const nodeName = nodeInstance.description.name;
    if (!/^[a-z][a-zA-Z0-9]*$/.test(nodeName)) {
        console.log(`   ⚠️  Node name '${nodeName}' may not follow n8n conventions`);
    } else {
        console.log(`   ✅ Node name '${nodeName}' follows conventions`);
    }
    
    // Check inputs/outputs
    const inputs = nodeInstance.description.inputs;
    const outputs = nodeInstance.description.outputs;
    console.log(`   Inputs: ${JSON.stringify(inputs)}`);
    console.log(`   Outputs: ${JSON.stringify(outputs)}`);
    
    if (!Array.isArray(inputs) || !Array.isArray(outputs)) {
        console.log('   ❌ Inputs/outputs must be arrays');
    } else {
        console.log('   ✅ Inputs/outputs are arrays');
    }
    
    // Check execute method
    if (typeof nodeInstance.execute !== 'function') {
        console.log('   ❌ Missing execute method');
    } else {
        console.log('   ✅ Execute method present');
    }
    
    // Check credentials reference
    const nodeCredentials = nodeInstance.description.credentials;
    if (nodeCredentials && nodeCredentials.length > 0) {
        const credName = nodeCredentials[0].name;
        if (credName !== credInstance.name) {
            console.log(`   ⚠️  Credential name mismatch: node expects '${credName}', credential provides '${credInstance.name}'`);
        } else {
            console.log(`   ✅ Credential reference matches: '${credName}'`);
        }
    }
    
    // 5. Check for common n8n issues
    console.log('\n5. Checking for common n8n issues...');
    
    // Check if main entry point exists
    const mainFile = packageJson.main || 'index.js';
    const mainPath = path.join(packagePath, mainFile);
    if (fs.existsSync(mainPath)) {
        console.log(`   ✅ Main entry point exists: ${mainFile}`);
    } else {
        console.log(`   ❌ Main entry point missing: ${mainFile}`);
    }
    
    // Check for TypeScript declaration files
    const nodeJsFile = nodeFile.replace('.ts', '.js');
    const nodeDtsFile = nodeFile.replace('.ts', '.d.ts');
    const nodeDtsPath = path.join(packagePath, nodeDtsFile);
    if (fs.existsSync(nodeDtsPath)) {
        console.log(`   ✅ TypeScript declarations exist: ${nodeDtsFile}`);
    } else {
        console.log(`   ⚠️  TypeScript declarations missing: ${nodeDtsFile}`);
    }
    
    console.log('\n🎉 Basic validation completed!');
    console.log('\n💡 If n8n still fails to load, possible issues:');
    console.log('   1. n8n version compatibility (this package requires n8n >= 0.198.0)');
    console.log('   2. Node.js version compatibility');
    console.log('   3. Missing peer dependencies');
    console.log('   4. n8n internal validation that we cannot replicate');
    console.log('   5. Runtime environment differences');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
