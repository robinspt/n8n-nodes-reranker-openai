#!/usr/bin/env node

// Test script to simulate n8n community node loading
console.log('Testing n8n community node loading...\n');

const fs = require('fs');
const path = require('path');

try {
    // 1. Find the installed community node
    console.log('1. Looking for installed community node...');
    const nodeModulesPath = './node_modules/n8n-nodes-reranker-openai';
    
    if (!fs.existsSync(nodeModulesPath)) {
        throw new Error('Community node package not found in node_modules');
    }
    console.log('   ✅ Package found in node_modules');
    
    // 2. Read package.json
    console.log('\n2. Reading package.json...');
    const packageJsonPath = path.join(nodeModulesPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log(`   ✅ Package name: ${packageJson.name}`);
    console.log(`   ✅ Package version: ${packageJson.version}`);
    
    // 3. Check n8n configuration
    console.log('\n3. Checking n8n configuration...');
    if (!packageJson.n8n) {
        throw new Error('No n8n configuration found in package.json');
    }
    
    console.log(`   ✅ n8nNodesApiVersion: ${packageJson.n8n.n8nNodesApiVersion}`);
    console.log(`   ✅ Credentials: ${packageJson.n8n.credentials?.length || 0} files`);
    console.log(`   ✅ Nodes: ${packageJson.n8n.nodes?.length || 0} files`);
    
    // 4. Test loading credentials
    console.log('\n4. Testing credential loading...');
    if (packageJson.n8n.credentials) {
        for (const credFile of packageJson.n8n.credentials) {
            const credPath = path.join(nodeModulesPath, credFile);
            if (!fs.existsSync(credPath)) {
                throw new Error(`Credential file not found: ${credPath}`);
            }
            
            try {
                const credModule = require(path.resolve(credPath));
                const credKeys = Object.keys(credModule);
                console.log(`   ✅ Credential loaded: ${credFile} (exports: ${credKeys.join(', ')})`);
                
                // Test instantiation
                for (const key of credKeys) {
                    const CredClass = credModule[key];
                    const credInstance = new CredClass();
                    console.log(`     ✅ Credential instantiated: ${key} (name: ${credInstance.name})`);
                }
            } catch (error) {
                throw new Error(`Failed to load credential ${credFile}: ${error.message}`);
            }
        }
    }
    
    // 5. Test loading nodes
    console.log('\n5. Testing node loading...');
    if (packageJson.n8n.nodes) {
        for (const nodeFile of packageJson.n8n.nodes) {
            const nodePath = path.join(nodeModulesPath, nodeFile);
            if (!fs.existsSync(nodePath)) {
                throw new Error(`Node file not found: ${nodePath}`);
            }
            
            try {
                const nodeModule = require(path.resolve(nodePath));
                const nodeKeys = Object.keys(nodeModule);
                console.log(`   ✅ Node loaded: ${nodeFile} (exports: ${nodeKeys.join(', ')})`);
                
                // Test instantiation
                for (const key of nodeKeys) {
                    const NodeClass = nodeModule[key];
                    const nodeInstance = new NodeClass();
                    
                    if (!nodeInstance.description) {
                        throw new Error(`Node ${key} missing description property`);
                    }
                    
                    console.log(`     ✅ Node instantiated: ${key}`);
                    console.log(`       - Name: ${nodeInstance.description.name}`);
                    console.log(`       - Display Name: ${nodeInstance.description.displayName}`);
                    console.log(`       - Version: ${nodeInstance.description.version}`);
                    console.log(`       - Inputs: ${JSON.stringify(nodeInstance.description.inputs)}`);
                    console.log(`       - Outputs: ${JSON.stringify(nodeInstance.description.outputs)}`);
                    
                    // Check required methods
                    if (typeof nodeInstance.execute !== 'function') {
                        throw new Error(`Node ${key} missing execute method`);
                    }
                    console.log(`       - Execute method: ✅ present`);
                    
                    // Check credentials
                    if (nodeInstance.description.credentials) {
                        console.log(`       - Credentials: ${nodeInstance.description.credentials.length} required`);
                        for (const cred of nodeInstance.description.credentials) {
                            console.log(`         - ${cred.name} (required: ${cred.required})`);
                        }
                    }
                    
                    // Check properties
                    if (nodeInstance.description.properties) {
                        console.log(`       - Properties: ${nodeInstance.description.properties.length} defined`);
                    }
                }
            } catch (error) {
                throw new Error(`Failed to load node ${nodeFile}: ${error.message}`);
            }
        }
    }
    
    // 6. Simulate n8n node discovery
    console.log('\n6. Simulating n8n node discovery...');
    
    // This simulates how n8n discovers and loads community nodes
    const discoveredNodes = [];
    const discoveredCredentials = [];
    
    if (packageJson.n8n.nodes) {
        for (const nodeFile of packageJson.n8n.nodes) {
            const nodePath = path.join(nodeModulesPath, nodeFile);
            const nodeModule = require(nodePath);
            
            for (const [exportName, NodeClass] of Object.entries(nodeModule)) {
                const instance = new NodeClass();
                discoveredNodes.push({
                    name: instance.description.name,
                    displayName: instance.description.displayName,
                    className: exportName,
                    file: nodeFile
                });
            }
        }
    }
    
    if (packageJson.n8n.credentials) {
        for (const credFile of packageJson.n8n.credentials) {
            const credPath = path.join(nodeModulesPath, credFile);
            const credModule = require(credPath);
            
            for (const [exportName, CredClass] of Object.entries(credModule)) {
                const instance = new CredClass();
                discoveredCredentials.push({
                    name: instance.name,
                    displayName: instance.displayName,
                    className: exportName,
                    file: credFile
                });
            }
        }
    }
    
    console.log(`   ✅ Discovered ${discoveredNodes.length} nodes:`);
    for (const node of discoveredNodes) {
        console.log(`     - ${node.displayName} (${node.name})`);
    }
    
    console.log(`   ✅ Discovered ${discoveredCredentials.length} credentials:`);
    for (const cred of discoveredCredentials) {
        console.log(`     - ${cred.displayName} (${cred.name})`);
    }
    
    console.log('\n🎉 All tests passed! The community node should work correctly in n8n.');
    console.log('\nTo test in actual n8n:');
    console.log('1. Start n8n in this directory');
    console.log('2. The node should be automatically discovered');
    console.log('3. Look for "Reranker OpenAI" in the node palette');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
