import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  runScreenshotTool,
  screenshotToolDescription,
  screenshotToolName,
  ScreenshotToolSchema,
} from "./tools/screenshot.js";

import {
  architectToolDescription,
  architectToolName,
  ArchitectToolSchema,
  runArchitectTool,
} from "./tools/architect.js";

import {
  codeReviewToolDescription,
  codeReviewToolName,
  CodeReviewToolSchema,
  runCodeReviewTool,
} from "./tools/codeReview.js";

import {
  fileStructureToolDescription,
  fileStructureToolName,
  FileStructureToolSchema,
  runFileStructureTool,
} from "./tools/fileStructure.js";

import {
  mermaidStructureToolDescription,
  mermaidStructureToolName,
  MermaidStructureToolSchema,
  runMermaidStructureTool
} from "./tools/mermaidStructure.js";

import {
  condensateToolDescription,
  condensateToolName,
  CondensateToolSchema,
  runCondensateTool,
} from "./tools/condensate.js";


/**
 * A minimal MCP server providing four Cursor Tools:
 *   1) Screenshot
 *   2) Architect
 *   3) CodeReview
 *   4) FileStructure
 */

// 1. Create an MCP server instance
const server = new Server(
  {
    name: "cursor-tools",
    version: "2.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// 2. Define the list of tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: screenshotToolName,
        description: screenshotToolDescription,
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Full URL to screenshot",
            },
            relativePath: {
              type: "string",
              description: "Relative path appended to http://localhost:3000",
            },
            fullPathToScreenshot: {
              type: "string",
              description:
                "Path to where the screenshot file should be saved. This should be a cwd-style full path to the file (not relative to the current working directory) including the file name and extension.",
            },
            width: {
              type: "number",
              description: "Viewport width in pixels (default: 1920)",
            },
            height: {
              type: "number",
              description: "Viewport height in pixels (default: 1080)",
            },
            deviceScaleFactor: {
              type: "number",
              description: "Device scale factor for the viewport (default: 1)",
            },
          },
          required: [],
        },
      },
      {
        name: architectToolName,
        description: architectToolDescription,
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Description of the task",
            },
            code: {
              type: "string",
              description: "Concatenated code from one or more files",
            },
          },
          required: ["task", "code"],
        },
      },
      {
        name: codeReviewToolName,
        description: codeReviewToolDescription,
        inputSchema: {
          type: "object",
          properties: {
            folderPath: {
              type: "string",
              description:
                "Path to the full root directory of the repository to diff against main",
            },
          },
          required: ["folderPath"],
        },
      },
      {
        name: fileStructureToolName,
        description: fileStructureToolDescription,
        inputSchema: {
          type: "object",
          properties: {
            directoryPath: {
              type: "string",
              description: "Path to the directory to analyze",
            },
            maxDepth: {
              type: "number",
              description: "Maximum depth to traverse (default: 3)",
            },
            excludePatterns: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Patterns to exclude from the structure (default: ['node_modules', '.git', 'build', 'dist'])",
            },
          },
          required: ["directoryPath"],
        },
      },
      {
        name: mermaidStructureToolName,
        description: mermaidStructureToolDescription,
        inputSchema: {
          type: "object",
          properties: {
            directoryPath: {
              type: "string",
              description: "Path to directory to analyze (optional, defaults to current directory)",
            },
            maxDepth: {
              type: "number",
              description: "Maximum depth to traverse (default: 3)",
            },
            excludePatterns: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Patterns to exclude from the structure (default: ['node_modules', '.git', 'build', 'dist'])",
            },
            fullPathToOutput: {
              type: "string",
              description: "Path where the Mermaid diagram will be saved",
            }
          },
          required: ["fullPathToOutput"],
        },
      },
      {
        name: condensateToolName,
        description: condensateToolDescription,
        inputSchema: {
          type: "object",
          properties: {
            files: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Array of absolute file paths to concatenate (e.g., ['/Users/username/path/to/file1.ts', '/Users/username/path/to/file2.ts'])"
            },
            outputPath: {
              type: "string",
              description: "Absolute path where the concatenated file will be saved (e.g., '/Users/username/path/to/output.txt')"
            }
          },
          required: ["files", "outputPath"]
        },
      },
    ],
  };
});

// 3. Implement the tool call logic
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case screenshotToolName: {
      const validated = ScreenshotToolSchema.parse(args);
      return await runScreenshotTool(validated);
    }
    case architectToolName: {
      const validated = ArchitectToolSchema.parse(args);
      return await runArchitectTool(validated);
    }
    case codeReviewToolName: {
      const validated = CodeReviewToolSchema.parse(args);
      return await runCodeReviewTool(validated);
    }
    case fileStructureToolName: {
      const validated = FileStructureToolSchema.parse(args);
      return await runFileStructureTool(validated);
    }
    case mermaidStructureToolName: {
      const validated = MermaidStructureToolSchema.parse(args);
      return await runMermaidStructureTool(validated);
    }
    case condensateToolName: {
      const validated = CondensateToolSchema.parse(args);
      return await runCondensateTool(validated);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// 4. Start the MCP server with a stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Cursor Tools MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

export const tools = {
  [screenshotToolName]: {
    name: screenshotToolName,
    description: screenshotToolDescription,
    schema: ScreenshotToolSchema,
    func: runScreenshotTool,
  },
  [architectToolName]: {
    name: architectToolName,
    description: architectToolDescription,
    schema: ArchitectToolSchema,
    func: runArchitectTool,
  },
  [codeReviewToolName]: {
    name: codeReviewToolName,
    description: codeReviewToolDescription,
    schema: CodeReviewToolSchema,
    func: runCodeReviewTool,
  },
  [fileStructureToolName]: {
    name: fileStructureToolName,
    description: fileStructureToolDescription,
    schema: FileStructureToolSchema,
    func: runFileStructureTool,
  },
  [mermaidStructureToolName]: {
    name: mermaidStructureToolName,
    description: mermaidStructureToolDescription,
    schema: MermaidStructureToolSchema,
    func: runMermaidStructureTool,
  },
  [condensateToolName]: {
    name: condensateToolName,
    description: condensateToolDescription,
    schema: CondensateToolSchema,
    func: runCondensateTool,
  },
};
