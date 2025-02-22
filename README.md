# AI Development Assistant MCP Server

A Model Context Protocol (MCP) server implementation for Cursor IDE, providing programmatic access to AI-powered development tools. This project serves as a reference implementation for custom tool integration.

## Features

### Code Analysis & Development

- **Architecture Analysis**: Advanced language model integration for generating architectural plans and implementation instructions
- **Code Review**: Automated code review using git diff analysis
- **NPM Version Management**:
  - Single package version lookup
  - Batch version comparison for multiple packages

### UI & Browser Tools

- **Screenshot Capture**: Automated screenshot capture for UI development workflows
- **Browser Content Reader**: Extract and analyze content from web pages
- **Console Log Capture**: Monitor and analyze browser console output

### Project Structure & Documentation

- **Text Tree Generator**: Creates hierarchical text-based representations of project structure
- **Mermaid Diagram Generator**: Generates flowchart diagrams using Mermaid.js syntax
- **File Condensate**: Concatenate multiple files with headers for documentation or analysis

All visualization tools implement intelligent filtering to exclude build artifacts, cache files, and development-specific files.

## Setup

### Environment Configuration

Create `src/env/keys.ts`:

```typescript
export const OPENAI_API_KEY = "your_key_here";
```

Note: For production environments, use proper secret management. This implementation is for development purposes only.

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

### Cursor Integration

1. Navigate to `Cursor Settings > Features > MCP`
2. Add New MCP Server:
   - Name: AI Development Assistant
   - Type: stdio
   - Command: `node /path/to/project/dist/index.js`

Note: Use absolute paths to the built index.js file.

For detailed MCP configuration, refer to the [Cursor MCP Documentation](https://docs.cursor.com/advanced/model-context-protocol).

## Usage

The tools can be invoked through Cursor's Composer interface. Example commands:

```
# Code Analysis
Review code in current file
Generate architecture plan for new feature
Check latest version of npm package react
Compare versions of multiple packages

# UI & Browser
Analyze UI screenshot
Capture console logs from localhost:3000
Extract content from webpage

# Project Structure
Generate project structure diagram
Create codebase flowchart
Combine multiple source files into one
```

## Project Structure

```
src/
├── tools/
│   ├── architect.ts        # Architecture analysis
│   ├── browser.ts         # Web content extraction
│   ├── codeReview.ts      # Diff-based review
│   ├── condensate.ts      # File concatenation
│   ├── consoleLogs.ts     # Browser console capture
│   ├── fileStructure.ts   # Tree visualization
│   ├── mermaidStructure.ts # Flowchart generation
│   ├── npmVersionInfo.ts  # NPM version lookup
│   ├── npmBatchVersionInfo.ts # NPM batch version check
│   └── screenshot.ts      # UI capture and analysis
├── env/
│   └── keys.ts           # Environment configuration
└── index.ts             # Entry point
```

## Contributing

Contributions should follow the existing code style and include appropriate tests.

## License

MIT License - See LICENSE file for details.

## Issue Reporting

For bug reports, include:

1. Operation attempted
2. Actual result
3. Reproduction steps
4. Environment details

Note: This is a reference implementation. While issues are tracked, maintenance is limited.
