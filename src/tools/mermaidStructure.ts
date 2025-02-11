/**
 * Mermaid Structure tool
 *   - Takes a directory path and generates a Mermaid diagram of its contents
 *   - Parameters:
 *     - directoryPath: Path to directory to analyze (optional, defaults to current directory)
 *     - maxDepth: Maximum depth to traverse (optional, default: 3)
 *     - excludePatterns: Array of patterns to exclude (optional, default: see below)
 *     - fullPathToOutput: Path where the Mermaid diagram will be saved (will be saved as .md)
 *   - Returns a Mermaid diagram with:
 *     - Directory hierarchy using flowchart syntax
 *     - Files and directories as nodes
 *     - Connections showing parent-child relationships
 */

import fs from "fs/promises";
import path from "path";
import { z } from "zod";

export const mermaidStructureToolName = "mermaid-structure";
export const mermaidStructureToolDescription =
    "Generates a Mermaid diagram showing the file structure of a specified directory.";

export const MermaidStructureToolSchema = z.object({
    directoryPath: z.string().optional(),
    maxDepth: z.number().optional().default(3),
    excludePatterns: z.array(z.string()).optional().default([
        // Build and cache directories
        "node_modules",
        ".git",
        "build",
        "dist",
        ".next",
        "cache",

        // Build artifacts and generated files
        "*.woff2",
        "*.hot-update.*",
        "webpack.*",
        "*.chunk.*",

        // Temporary and cache files
        "*.tmp",
        "*.temp",
        ".cache",

        // IDE and system files
        ".DS_Store",
        ".idea",
        ".vscode",
    ]),
    fullPathToOutput: z.string().transform(val => {
        // Ensure the path ends with .md
        const parsedPath = path.parse(val);
        return path.format({
            ...parsedPath,
            base: undefined,
            ext: '.md'
        });
    })
});

async function scanDirectoryMermaid(
    currentPath: string,
    parentId: string = "root",
    depth: number = 0,
    maxDepth: number,
    excludePatterns: string[]
): Promise<string[]> {
    if (depth > maxDepth) return [];

    const lines: string[] = [];
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    // Sort: directories first, then files alphabetically
    const sortedEntries = entries.sort((a, b) => {
        if (a.isDirectory() === b.isDirectory()) {
            return a.name.localeCompare(b.name);
        }
        return a.isDirectory() ? -1 : 1;
    }).filter(entry => !excludePatterns.some(pattern => entry.name.includes(pattern)));

    for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        const currentId = `${parentId}_${entry.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

        if (entry.isDirectory()) {
            lines.push(`    ${currentId}[${entry.name}/]`);
            lines.push(`    ${parentId} --> ${currentId}`);
            const subDirLines = await scanDirectoryMermaid(
                path.join(currentPath, entry.name),
                currentId,
                depth + 1,
                maxDepth,
                excludePatterns
            );
            lines.push(...subDirLines);
        } else {
            lines.push(`    ${currentId}[${entry.name}]`);
            lines.push(`    ${parentId} --> ${currentId}`);
        }
    }

    return lines;
}

export async function runMermaidStructureTool(
    args: z.infer<typeof MermaidStructureToolSchema>
) {
    try {
        const {
            directoryPath = process.cwd(),
            maxDepth = 3,
            excludePatterns = [],
            fullPathToOutput
        } = args;

        const resolvedDirectoryPath = path.resolve(directoryPath);
        const rootName = path.basename(resolvedDirectoryPath);

        const mermaidLines = [
            '```mermaid',
            'flowchart TD',
            `    root[${rootName}/]`,
            ...(await scanDirectoryMermaid(resolvedDirectoryPath, "root", 0, maxDepth, excludePatterns)),
            '```'
        ];

        const mermaidOutput = mermaidLines.join('\n');
        const resolvedOutputPath = path.resolve(fullPathToOutput); // fullPathToOutput is already transformed to .md
        await fs.writeFile(resolvedOutputPath, mermaidOutput);

        return {
            content: [{
                type: "text",
                text: `Mermaid diagram saved to ${resolvedOutputPath}. Before continuing, you MUST ask the user to drag and drop the file into the chat window.
                The path to the file is ${resolvedOutputPath}.`
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error: ${error.message || error}`
            }]
        };
    }
} 