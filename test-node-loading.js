#!/usr/bin/env node

/**
 * 测试社区节点加载
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 测试社区节点加载...\n');

// 1. 检查 package.json 配置
console.log('📋 检查 package.json 配置:');
const packageJson = require('./package.json');

console.log(`   包名: ${packageJson.name}`);
console.log(`   版本: ${packageJson.version}`);
console.log(`   Node.js 要求: ${packageJson.engines.node}`);

if (packageJson.n8n) {
    console.log('   ✅ n8n 配置存在');
    
    if (packageJson.n8n.nodes) {
        console.log(`   📄 节点文件: ${packageJson.n8n.nodes.join(', ')}`);
        
        // 检查节点文件是否存在
        packageJson.n8n.nodes.forEach(nodePath => {
            const fullPath = path.join(__dirname, nodePath);
            if (fs.existsSync(fullPath)) {
                console.log(`   ✅ ${nodePath} 存在`);
            } else {
                console.log(`   ❌ ${nodePath} 不存在`);
            }
        });
    }
    
    if (packageJson.n8n.credentials) {
        console.log(`   🔑 凭据文件: ${packageJson.n8n.credentials.join(', ')}`);
        
        // 检查凭据文件是否存在
        packageJson.n8n.credentials.forEach(credPath => {
            const fullPath = path.join(__dirname, credPath);
            if (fs.existsSync(fullPath)) {
                console.log(`   ✅ ${credPath} 存在`);
            } else {
                console.log(`   ❌ ${credPath} 不存在`);
            }
        });
    }
} else {
    console.log('   ❌ n8n 配置缺失');
}

// 2. 检查构建输出
console.log('\n🏗️ 检查构建输出:');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    console.log('   ✅ dist 目录存在');
    
    // 检查节点文件
    const nodeDistPath = path.join(distPath, 'nodes/RerankerOpenAI/RerankerOpenAI.node.js');
    if (fs.existsSync(nodeDistPath)) {
        console.log('   ✅ 节点 JS 文件存在');
    } else {
        console.log('   ❌ 节点 JS 文件不存在');
    }
    
    // 检查凭据文件
    const credDistPath = path.join(distPath, 'credentials/OpenAIApi.credentials.js');
    if (fs.existsSync(credDistPath)) {
        console.log('   ✅ 凭据 JS 文件存在');
    } else {
        console.log('   ❌ 凭据 JS 文件不存在');
    }
    
    // 检查图标文件
    const iconPath = path.join(distPath, 'nodes/RerankerOpenAI/openai.svg');
    if (fs.existsSync(iconPath)) {
        console.log('   ✅ 图标文件存在');
    } else {
        console.log('   ❌ 图标文件不存在');
    }
} else {
    console.log('   ❌ dist 目录不存在 - 需要运行 npm run build');
}

// 3. 尝试加载节点
console.log('\n🔄 尝试加载节点:');
try {
    if (fs.existsSync(path.join(__dirname, 'dist/nodes/RerankerOpenAI/RerankerOpenAI.node.js'))) {
        const { RerankerOpenAI } = require('./dist/nodes/RerankerOpenAI/RerankerOpenAI.node.js');
        const node = new RerankerOpenAI();
        
        console.log('   ✅ 节点加载成功');
        console.log(`   📝 节点名称: ${node.description.displayName}`);
        console.log(`   🔧 节点类型: ${node.description.name}`);
        console.log(`   📊 版本: ${node.description.version}`);
        console.log(`   🔌 输入: ${node.description.inputs.length} 个`);
        console.log(`   📤 输出: ${node.description.outputs.length} 个`);
        console.log(`   ⚙️ 属性: ${node.description.properties.length} 个`);
        
        if (node.description.credentials) {
            console.log(`   🔑 凭据: ${node.description.credentials.length} 个`);
        }
    } else {
        console.log('   ❌ 节点文件不存在，无法加载');
    }
} catch (error) {
    console.log(`   ❌ 节点加载失败: ${error.message}`);
}

// 4. 尝试加载凭据
console.log('\n🔑 尝试加载凭据:');
try {
    if (fs.existsSync(path.join(__dirname, 'dist/credentials/OpenAIApi.credentials.js'))) {
        const { OpenAIApi } = require('./dist/credentials/OpenAIApi.credentials.js');
        const credentials = new OpenAIApi();
        
        console.log('   ✅ 凭据加载成功');
        console.log(`   📝 凭据名称: ${credentials.displayName}`);
        console.log(`   🔧 凭据类型: ${credentials.name}`);
        console.log(`   ⚙️ 属性: ${credentials.properties.length} 个`);
    } else {
        console.log('   ❌ 凭据文件不存在，无法加载');
    }
} catch (error) {
    console.log(`   ❌ 凭据加载失败: ${error.message}`);
}

console.log('\n✅ 测试完成！');
console.log('\n💡 如果所有检查都通过，您的社区节点应该可以正常安装和使用。');
console.log('📦 运行 "npm run build" 来构建项目');
console.log('🚀 运行 "npm publish" 来发布到 npm');
