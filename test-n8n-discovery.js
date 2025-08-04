#!/usr/bin/env node

// Test script to simulate n8n's node discovery process
console.log('Testing n8n node discovery process...\n');

const fs = require('fs');
const path = require('path');

try {
    // 1. Simulate n8n's package discovery
    console.log('1. Simulating n8n package discovery...');
    
    const nodeModulesPath = './node_modules';
    const packages = fs.readdirSync(nodeModulesPath).filter(dir => {
        const packagePath = path.join(nodeModulesPath, dir);
        if (!fs.statSync(packagePath).isDirectory()) return false;
        
        const packageJsonPath = path.join(packagePath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) return false;
        
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            return packageJson.keywords && packageJson.keywords.includes('n8n-community-node-package');
        } catch {
            return false;
        }
    });
    
    console.log(`   Found ${packages.length} n8n community packages:`);
    packages.forEach(pkg => console.log(`     - ${pkg}`));
    
    if (packages.length === 0) {
        throw new Error('No n8n community packages found');
    }
    
    // 2. Test each package
    for (const packageName of packages) {
        console.log(`\n2. Testing package: ${packageName}`);
        
        const packagePath = path.join(nodeModulesPath, packageName);
        const packageJsonPath = path.join(packagePath, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        console.log(`   Package version: ${packageJson.version}`);
        console.log(`   n8n API version: ${packageJson.n8n?.n8nNodesApiVersion}`);
        
        // 3. Test credential loading (simulate n8n's process)
        if (packageJson.n8n?.credentials) {
            console.log('\n3. Testing credential discovery...');
            for (const credFile of packageJson.n8n.credentials) {
                const credPath = path.join(packagePath, credFile);
                console.log(`   Loading: ${credFile}`);
                
                if (!fs.existsSync(credPath)) {
                    throw new Error(`Credential file not found: ${credPath}`);
                }
                
                try {
                    // Clear require cache to ensure fresh load
                    delete require.cache[require.resolve(credPath)];
                    const credModule = require(credPath);
                    
                    for (const [exportName, CredClass] of Object.entries(credModule)) {
                        console.log(`     Discovered credential class: ${exportName}`);
                        
                        // Test instantiation
                        const credInstance = new CredClass();
                        console.log(`       ✅ Name: ${credInstance.name}`);
                        console.log(`       ✅ Display Name: ${credInstance.displayName}`);
                        
                        // Validate required properties
                        if (!credInstance.name || !credInstance.displayName || !credInstance.properties) {
                            throw new Error(`Invalid credential structure for ${exportName}`);
                        }
                    }
                } catch (error) {
                    throw new Error(`Failed to load credential ${credFile}: ${error.message}`);
                }
            }
        }
        
        // 4. Test node loading (simulate n8n's process)
        if (packageJson.n8n?.nodes) {
            console.log('\n4. Testing node discovery...');
            for (const nodeFile of packageJson.n8n.nodes) {
                const nodePath = path.join(packagePath, nodeFile);
                console.log(`   Loading: ${nodeFile}`);
                
                if (!fs.existsSync(nodePath)) {
                    throw new Error(`Node file not found: ${nodePath}`);
                }
                
                try {
                    // Clear require cache to ensure fresh load
                    delete require.cache[require.resolve(nodePath)];
                    const nodeModule = require(nodePath);
                    
                    for (const [exportName, NodeClass] of Object.entries(nodeModule)) {
                        console.log(`     Discovered node class: ${exportName}`);
                        
                        // Test instantiation
                        const nodeInstance = new NodeClass();
                        console.log(`       ✅ Name: ${nodeInstance.description.name}`);
                        console.log(`       ✅ Display Name: ${nodeInstance.description.displayName}`);
                        console.log(`       ✅ Version: ${nodeInstance.description.version}`);
                        
                        // Validate required properties
                        const desc = nodeInstance.description;
                        if (!desc.name || !desc.displayName || !desc.inputs || !desc.outputs) {
                            throw new Error(`Invalid node structure for ${exportName}`);
                        }
                        
                        // Validate execute method
                        if (typeof nodeInstance.execute !== 'function') {
                            throw new Error(`Node ${exportName} missing execute method`);
                        }
                        
                        // Test node name format
                        if (!/^[a-z][a-zA-Z0-9]*$/.test(desc.name)) {
                            console.log(`       ⚠️  Warning: Node name '${desc.name}' may not follow n8n conventions`);
                        }
                        
                        console.log(`       ✅ Execute method: present`);
                        console.log(`       ✅ Properties: ${desc.properties?.length || 0} defined`);
                        console.log(`       ✅ Credentials: ${desc.credentials?.length || 0} required`);
                    }
                } catch (error) {
                    throw new Error(`Failed to load node ${nodeFile}: ${error.message}`);
                }
            }
        }
    }
    
    console.log('\n🎉 All discovery tests passed!');
    console.log('\n📋 Ready for n8n testing:');
    console.log('   The package structure is correct and should be discoverable by n8n');
    console.log('   All nodes and credentials can be instantiated successfully');
    console.log('   All required methods and properties are present');
    
} catch (error) {
    console.error('❌ Discovery test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
