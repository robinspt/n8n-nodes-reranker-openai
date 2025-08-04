#!/usr/bin/env node

// Deep debugging script to simulate n8n's package loading process
console.log('🔍 Deep debugging n8n package loading...\n');

const fs = require('fs');
const path = require('path');

function validatePackageStructure(packagePath) {
    console.log(`📦 Validating package structure: ${packagePath}`);
    
    // 1. Check package.json exists and is valid
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
    }
    
    let packageJson;
    try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        console.log('   ✅ package.json is valid JSON');
    } catch (error) {
        throw new Error(`Invalid package.json: ${error.message}`);
    }
    
    // 2. Check required fields
    const requiredFields = ['name', 'version', 'description', 'keywords', 'n8n'];
    for (const field of requiredFields) {
        if (!packageJson[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
        console.log(`   ✅ ${field}: present`);
    }
    
    // 3. Check n8n-specific requirements
    if (!packageJson.keywords.includes('n8n-community-node-package')) {
        throw new Error('Missing n8n-community-node-package keyword');
    }
    console.log('   ✅ n8n-community-node-package keyword present');
    
    if (!packageJson.n8n.n8nNodesApiVersion) {
        throw new Error('Missing n8nNodesApiVersion');
    }
    console.log(`   ✅ n8nNodesApiVersion: ${packageJson.n8n.n8nNodesApiVersion}`);
    
    return packageJson;
}

function validateNodeFiles(packagePath, packageJson) {
    console.log('\n🔧 Validating node files...');
    
    if (!packageJson.n8n.nodes || packageJson.n8n.nodes.length === 0) {
        throw new Error('No nodes defined in package.json');
    }
    
    for (const nodeFile of packageJson.n8n.nodes) {
        console.log(`   Checking node file: ${nodeFile}`);
        
        const nodePath = path.join(packagePath, nodeFile);
        if (!fs.existsSync(nodePath)) {
            throw new Error(`Node file not found: ${nodeFile}`);
        }
        console.log('     ✅ File exists');
        
        // Try to require the module
        try {
            const absoluteNodePath = path.resolve(nodePath);
            delete require.cache[absoluteNodePath];
            const nodeModule = require(absoluteNodePath);
            console.log(`     ✅ Module loads successfully`);
            
            // Check exports
            const exports = Object.keys(nodeModule);
            if (exports.length === 0) {
                throw new Error(`No exports found in ${nodeFile}`);
            }
            console.log(`     ✅ Exports: ${exports.join(', ')}`);
            
            // Validate each exported class
            for (const exportName of exports) {
                console.log(`     Validating class: ${exportName}`);
                
                const NodeClass = nodeModule[exportName];
                if (typeof NodeClass !== 'function') {
                    throw new Error(`Export ${exportName} is not a constructor function`);
                }
                
                let nodeInstance;
                try {
                    nodeInstance = new NodeClass();
                    console.log('       ✅ Can instantiate');
                } catch (error) {
                    throw new Error(`Cannot instantiate ${exportName}: ${error.message}`);
                }
                
                // Check required properties
                if (!nodeInstance.description) {
                    throw new Error(`${exportName} missing description property`);
                }
                console.log('       ✅ Has description');
                
                const desc = nodeInstance.description;
                const requiredDescFields = ['name', 'displayName', 'version', 'inputs', 'outputs'];
                for (const field of requiredDescFields) {
                    if (desc[field] === undefined) {
                        throw new Error(`${exportName} description missing ${field}`);
                    }
                    console.log(`       ✅ description.${field}: ${JSON.stringify(desc[field])}`);
                }
                
                // Check execute method
                if (typeof nodeInstance.execute !== 'function') {
                    throw new Error(`${exportName} missing execute method`);
                }
                console.log('       ✅ Has execute method');
                
                // Validate node name format
                if (!/^[a-z][a-zA-Z0-9]*$/.test(desc.name)) {
                    console.log(`       ⚠️  Warning: Node name '${desc.name}' may not follow conventions`);
                }
                
                // Check inputs/outputs format
                if (!Array.isArray(desc.inputs) || !Array.isArray(desc.outputs)) {
                    throw new Error(`${exportName} inputs/outputs must be arrays`);
                }
                console.log('       ✅ inputs/outputs are arrays');
            }
            
        } catch (error) {
            throw new Error(`Error loading node ${nodeFile}: ${error.message}`);
        }
    }
}

function validateCredentialFiles(packagePath, packageJson) {
    console.log('\n🔐 Validating credential files...');
    
    if (!packageJson.n8n.credentials || packageJson.n8n.credentials.length === 0) {
        console.log('   No credentials defined (optional)');
        return;
    }
    
    for (const credFile of packageJson.n8n.credentials) {
        console.log(`   Checking credential file: ${credFile}`);
        
        const credPath = path.join(packagePath, credFile);
        if (!fs.existsSync(credPath)) {
            throw new Error(`Credential file not found: ${credFile}`);
        }
        console.log('     ✅ File exists');
        
        // Try to require the module
        try {
            const absoluteCredPath = path.resolve(credPath);
            delete require.cache[absoluteCredPath];
            const credModule = require(absoluteCredPath);
            console.log(`     ✅ Module loads successfully`);
            
            // Check exports
            const exports = Object.keys(credModule);
            if (exports.length === 0) {
                throw new Error(`No exports found in ${credFile}`);
            }
            console.log(`     ✅ Exports: ${exports.join(', ')}`);
            
            // Validate each exported class
            for (const exportName of exports) {
                console.log(`     Validating credential class: ${exportName}`);
                
                const CredClass = credModule[exportName];
                if (typeof CredClass !== 'function') {
                    throw new Error(`Export ${exportName} is not a constructor function`);
                }
                
                let credInstance;
                try {
                    credInstance = new CredClass();
                    console.log('       ✅ Can instantiate');
                } catch (error) {
                    throw new Error(`Cannot instantiate ${exportName}: ${error.message}`);
                }
                
                // Check required properties
                const requiredCredFields = ['name', 'displayName', 'properties'];
                for (const field of requiredCredFields) {
                    if (!credInstance[field]) {
                        throw new Error(`${exportName} missing ${field} property`);
                    }
                    console.log(`       ✅ Has ${field}`);
                }
            }
            
        } catch (error) {
            throw new Error(`Error loading credential ${credFile}: ${error.message}`);
        }
    }
}

function checkDependencies(packagePath, packageJson) {
    console.log('\n📚 Checking dependencies...');
    
    // Check if n8n-workflow is available
    try {
        const n8nWorkflowPath = path.join(packagePath, 'node_modules', 'n8n-workflow');
        if (fs.existsSync(n8nWorkflowPath)) {
            console.log('   ✅ n8n-workflow dependency found');
        } else {
            console.log('   ⚠️  n8n-workflow not found in node_modules (may be provided by n8n)');
        }
    } catch (error) {
        console.log('   ⚠️  Could not check n8n-workflow dependency');
    }
}

async function main() {
    try {
        const packagePath = './node_modules/n8n-nodes-reranker-openai';
        
        if (!fs.existsSync(packagePath)) {
            throw new Error('Package not found. Please install it first.');
        }
        
        console.log(`🎯 Testing package: ${packagePath}\n`);
        
        // Step 1: Validate package structure
        const packageJson = validatePackageStructure(packagePath);
        
        // Step 2: Check dependencies
        checkDependencies(packagePath, packageJson);
        
        // Step 3: Validate credential files
        validateCredentialFiles(packagePath, packageJson);
        
        // Step 4: Validate node files
        validateNodeFiles(packagePath, packageJson);
        
        console.log('\n🎉 All validations passed!');
        console.log('\n📋 Package Summary:');
        console.log(`   Name: ${packageJson.name}`);
        console.log(`   Version: ${packageJson.version}`);
        console.log(`   Nodes: ${packageJson.n8n.nodes.length}`);
        console.log(`   Credentials: ${packageJson.n8n.credentials?.length || 0}`);
        console.log(`   API Version: ${packageJson.n8n.n8nNodesApiVersion}`);
        
        console.log('\n🔍 If n8n still fails to load this package, the issue may be:');
        console.log('   1. n8n version compatibility');
        console.log('   2. Runtime environment differences');
        console.log('   3. n8n internal validation logic');
        console.log('   4. Missing peer dependencies');
        
    } catch (error) {
        console.error('\n❌ Validation failed:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

main();
