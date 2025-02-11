# AI Development Assistant MCP Server

A Model Context Protocol (MCP) server implementation for Cursor IDE, providing programmatic access to AI-powered development tools. This project serves as a reference implementation for custom tool integration.

## Features

### Code Architecture Analysis

Advanced language model integration for generating architectural plans and implementation instructions.

### UI Analysis

Automated screenshot capture and analysis capabilities for UI development workflows.

### Code Review

Automated code review using git diff analysis.

### Project Structure Visualization

Two visualization tools for codebase analysis:

- **Text Tree Generator**: Creates hierarchical text-based representations of project structure
- **Mermaid Diagram Generator**: Generates flowchart diagrams using Mermaid.js syntax

Both tools implement intelligent filtering to exclude build artifacts, cache files, and development-specific files.

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
Review code in current file
Generate architecture plan for new feature
Analyze UI screenshot
Generate project structure diagram
Create codebase flowchart
```

## Project Structure

```
src/
├── tools/
│   ├── architect.ts      # Architecture analysis
│   ├── screenshot.ts     # UI capture and analysis
│   ├── codeReview.ts     # Diff-based review
│   ├── fileStructure.ts  # Tree visualization
│   └── mermaidStructure.ts # Flowchart generation
├── env/
│   └── keys.ts          # Environment configuration
└── index.ts            # Entry point
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
