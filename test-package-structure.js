#!/usr/bin/env node

// Test script to verify package structure for n8n community nodes
console.log('Testing package structure for n8n community nodes...\n');

const fs = require('fs');
const path = require('path');

try {
    // 1. Check package.json
    console.log('1. Checking package.json...');
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    // Check required fields
    const requiredFields = ['name', 'version', 'description', 'keywords', 'n8n'];
    for (const field of requiredFields) {
        if (packageJson[field]) {
            console.log(`   ✅ ${field}: ${typeof packageJson[field] === 'object' ? 'present' : packageJson[field]}`);
        } else {
            console.log(`   ❌ Missing required field: ${field}`);
        }
    }
    
    // Check n8n configuration
    if (packageJson.n8n) {
        console.log('   ✅ n8n configuration found');
        console.log(`   ✅ n8nNodesApiVersion: ${packageJson.n8n.n8nNodesApiVersion}`);
        console.log(`   ✅ credentials: ${packageJson.n8n.credentials?.length || 0} files`);
        console.log(`   ✅ nodes: ${packageJson.n8n.nodes?.length || 0} files`);
    }
    
    // Check keywords
    if (packageJson.keywords && packageJson.keywords.includes('n8n-community-node-package')) {
        console.log('   ✅ Contains n8n-community-node-package keyword');
    } else {
        console.log('   ❌ Missing n8n-community-node-package keyword');
    }
    
    // 2. Check file existence
    console.log('\n2. Checking file existence...');
    
    // Check credentials
    if (packageJson.n8n?.credentials) {
        for (const credFile of packageJson.n8n.credentials) {
            if (fs.existsSync(credFile)) {
                console.log(`   ✅ Credential file exists: ${credFile}`);
            } else {
                console.log(`   ❌ Credential file missing: ${credFile}`);
            }
        }
    }
    
    // Check nodes
    if (packageJson.n8n?.nodes) {
        for (const nodeFile of packageJson.n8n.nodes) {
            if (fs.existsSync(nodeFile)) {
                console.log(`   ✅ Node file exists: ${nodeFile}`);
            } else {
                console.log(`   ❌ Node file missing: ${nodeFile}`);
            }
        }
    }
    
    // 3. Check main entry point
    console.log('\n3. Checking main entry point...');
    const mainFile = packageJson.main || 'index.js';
    if (fs.existsSync(mainFile)) {
        console.log(`   ✅ Main file exists: ${mainFile}`);
    } else {
        console.log(`   ❌ Main file missing: ${mainFile}`);
    }
    
    // 4. Test actual loading
    console.log('\n4. Testing actual module loading...');
    
    // Test credentials
    if (packageJson.n8n?.credentials) {
        for (const credFile of packageJson.n8n.credentials) {
            try {
                const credModule = require(`./${credFile}`);
                const credKeys = Object.keys(credModule);
                console.log(`   ✅ Credential module loads: ${credFile} (exports: ${credKeys.join(', ')})`);
            } catch (error) {
                console.log(`   ❌ Credential module load error: ${credFile} - ${error.message}`);
            }
        }
    }
    
    // Test nodes
    if (packageJson.n8n?.nodes) {
        for (const nodeFile of packageJson.n8n.nodes) {
            try {
                const nodeModule = require(`./${nodeFile}`);
                const nodeKeys = Object.keys(nodeModule);
                console.log(`   ✅ Node module loads: ${nodeFile} (exports: ${nodeKeys.join(', ')})`);
                
                // Test node instantiation
                for (const key of nodeKeys) {
                    try {
                        const NodeClass = nodeModule[key];
                        const instance = new NodeClass();
                        if (instance.description) {
                            console.log(`     ✅ Node instantiates: ${key} (name: ${instance.description.name})`);
                        } else {
                            console.log(`     ❌ Node missing description: ${key}`);
                        }
                    } catch (error) {
                        console.log(`     ❌ Node instantiation error: ${key} - ${error.message}`);
                    }
                }
            } catch (error) {
                console.log(`   ❌ Node module load error: ${nodeFile} - ${error.message}`);
            }
        }
    }
    
    console.log('\n🎉 Package structure test completed!');
    
} catch (error) {
    console.error('❌ Error during package structure test:', error.message);
    process.exit(1);
}
