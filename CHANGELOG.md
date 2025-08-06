# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2025-01-06

### ⚠️ BREAKING CHANGES
- **Node is currently NON-FUNCTIONAL**: Due to n8n limitations, this community node cannot be used as a reranker
- The node now uses `AiReranker` connection type which is not supported for community nodes

### Added
- **HTTP Request + Code Node Workaround**: Complete working implementation using HTTP Request and Code nodes
- **Comprehensive Examples**: Added `examples/` directory with:
  - Complete workflow JSON file for import
  - Detailed setup instructions
  - Standalone code snippets
  - Troubleshooting guide
- **Warning Notice**: Added prominent warning in node UI about current limitations
- **Future Compatibility**: Node is ready for when n8n officially supports `AiReranker` for community nodes

### Changed
- **Connection Type**: Changed from `AiTool` to `AiReranker` (currently unsupported)
- **Default Model**: Updated default model to `Qwen/Qwen3-Reranker-8B`
- **README**: Completely rewritten with:
  - Prominent warning about current limitations
  - Complete workaround implementation
  - Step-by-step setup guide
  - Code examples for all components
- **Description**: Updated package description to reflect current status

### Fixed
- **Model Configuration**: Corrected default model name for SiliconFlow compatibility
- **Error Handling**: Improved error handling in reranker implementation
- **Documentation**: Fixed outdated API references and examples

### Technical Details
- **Node Implementation**: Uses custom `AiReranker` type definition for future compatibility
- **Workaround Architecture**: 
  ```
  Vector Store → Document Processor → HTTP Request → Result Processor → AI Agent
  ```
- **API Integration**: Direct integration with SiliconFlow rerank API
- **Document Processing**: Robust handling of MongoDB Vector Store output formats

## [0.7.3] - 2024-12-XX

### Added
- Initial release with basic reranker functionality
- OpenAI-compatible API support
- LangChain BaseDocumentCompressor implementation

### Known Issues
- Could not connect to Vector Store reranker input due to connection type limitations

## Future Releases

### Planned for 0.9.0 (When n8n supports AiReranker for community nodes)
- **Full Functionality**: Direct connection to Vector Store reranker inputs
- **Seamless Integration**: Native reranker workflow support
- **Deprecate Workaround**: HTTP Request + Code node workaround will become optional
- **Enhanced UI**: Proper placement in AI node palette

---

## Migration Guide

### From 0.7.x to 0.8.0

**Important**: The dedicated reranker node is currently non-functional. You must use the HTTP Request + Code node workaround.

1. **Remove old reranker node** from your workflows
2. **Import the example workflow** from `examples/rerank-workflow-example.json`
3. **Configure credentials** as described in the examples README
4. **Update node parameters** to match your setup
5. **Test the workflow** with a simple query

### When 0.9.0 becomes available

1. **Replace workaround nodes** with the dedicated reranker node
2. **Connect directly** to Vector Store reranker input
3. **Remove HTTP Request and Code nodes** used for workaround
4. **Enjoy native reranker functionality**

---

## Support

- **Issues**: [GitHub Issues](https://github.com/robinspt/n8n-nodes-reranker-openai/issues)
- **Examples**: See `examples/` directory
- **Documentation**: See README.md for complete setup guide
