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

import {
  consoleLogsToolDescription,
  consoleLogsToolName,
  ConsoleLogsToolSchema,
  runConsoleLogsTool,
} from "./tools/consoleLogs.js";

import {
  browserToolDescription,
  browserToolName,
  BrowserToolSchema,
  runBrowserTool,
} from "./tools/browser.js";

/**
 * A minimal MCP server providing four Cursor Tools:
 *   1) Screenshot
 *   2) Architect
 *   3) CodeReview
 *   4) FileStructure
 *   5) MermaidStructure
 *   6) Condensate
 *   7) ConsoleLogs
 *   8) Browser
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
      {
        name: consoleLogsToolName,
        description: consoleLogsToolDescription,
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Full URL to capture console logs from",
            },
            relativePath: {
              type: "string",
              description: "Relative path appended to http://localhost:3000",
            },
            timeoutMs: {
              type: "number",
              description: "Timeout in milliseconds (default: 5000)",
            },
            includeNetworkErrors: {
              type: "boolean",
              description: "Whether to include network errors in the logs (default: true)",
            },
            browserPath: {
              type: "string",
              description: "Path to Brave browser executable (optional)",
            },
          },
          required: [],
        },
      },
      {
        name: browserToolName,
        description: browserToolDescription,
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Full URL to visit",
            },
            relativePath: {
              type: "string",
              description: "Relative path appended to http://localhost:3000",
            },
            timeoutMs: {
              type: "number",
              description: "Timeout in milliseconds (default: 5000)",
            },
            waitForSelector: {
              type: "string",
              description: "CSS selector to wait for before extracting content",
            },
            extractSelector: {
              type: "string",
              description: "CSS selector to extract content from (extracts all visible text if not provided)",
            },
            includeMetadata: {
              type: "boolean",
              description: "Whether to include page metadata like title and description (default: false)",
            },
            getRawHtml: {
              type: "boolean",
              description: "Whether to return raw HTML instead of extracted text (default: false)",
            },
            maxLength: {
              type: "number",
              description: "Maximum length of content in characters before truncation (default: 900000 [900KB])",
            },
            contentMode: {
              type: "string",
              enum: ["full", "summary", "structured"],
              description: "Content extraction mode: 'full' (all visible text), 'summary' (headings + first paragraphs), or 'structured' (JSON with organized sections) (default: 'full')",
            }
          },
          required: [],
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
    case consoleLogsToolName: {
      const validated = ConsoleLogsToolSchema.parse(args);
      return await runConsoleLogsTool(validated);
    }
    case browserToolName: {
      const validated = BrowserToolSchema.parse(args);
      return await runBrowserTool(validated);
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
  [consoleLogsToolName]: {
    name: consoleLogsToolName,
    description: consoleLogsToolDescription,
    schema: ConsoleLogsToolSchema,
    func: runConsoleLogsTool,
  },
  [browserToolName]: {
    name: browserToolName,
    description: browserToolDescription,
    schema: BrowserToolSchema,
    func: runBrowserTool,
  },
};
