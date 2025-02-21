/**
 * File Structure tool
 *   - Takes a directory path and generates a text-based tree diagram of its contents
 *   - Parameters:
 *     - directoryPath: Path to directory to analyze (optional, defaults to current directory)
 *     - maxDepth: Maximum depth to traverse (optional, default: 3)
 *     - excludePatterns: Array of patterns to exclude (optional, default: ['node_modules', '.git', 'build', 'dist'])
 *     - fullPathToOutput: Path where the tree structure will be saved
 *   - Returns a text-based tree structure with:
 *     - Directories marked with trailing "/"
 *     - Files and directories sorted alphabetically (directories first)
 *     - Tree connectors: "├── " for items with siblings, "└── " for last items
 *     - Proper indentation showing hierarchy
 */

import fs from "fs/promises";
import path from "path";
import { z } from "zod";

export const fileStructureToolName = "file_structure";
export const fileStructureToolDescription =
    "Generates a text-based tree diagram showing the file structure of a specified directory.";

export const FileStructureToolSchema = z.object({
    directoryPath: z.string().optional(),
    maxDepth: z.number().optional().default(3),
    excludePatterns: z.array(z.string()).optional().default([
        "node_modules",
        ".git",
        "build",
        "dist"
    ]),
    fullPathToOutput: z.string()  // Now required, not optional
});

async function scanDirectory(
    currentPath: string,
    prefix: string = "",
    isLast: boolean = true,
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
        const isLastEntry = i === sortedEntries.length - 1;
        const connector = isLastEntry ? "└── " : "├── ";
        const newPrefix = prefix + (isLast ? "    " : "│   ");

        if (entry.isDirectory()) {
            lines.push(prefix + connector + entry.name + "/");
            const subDirLines = await scanDirectory(
                path.join(currentPath, entry.name),
                newPrefix,
                isLastEntry,
                depth + 1,
                maxDepth,
                excludePatterns
            );
            lines.push(...subDirLines);
        } else {
            lines.push(prefix + connector + entry.name);
        }
    }

    return lines;
}

export async function runFileStructureTool(
    args: z.infer<typeof FileStructureToolSchema>
) {
    try {
        const {
            directoryPath = process.cwd(),
            maxDepth = 3,
            excludePatterns = [],
            fullPathToOutput
        } = args;

        const resolvedDirectoryPath = path.resolve(directoryPath);
        const treeLines = [
            path.basename(resolvedDirectoryPath) + "/",
            ...(await scanDirectory(resolvedDirectoryPath, "", true, 0, maxDepth, excludePatterns))
        ];

        const treeOutput = treeLines.join("\n");
        const resolvedOutputPath = path.resolve(fullPathToOutput);
        await fs.writeFile(resolvedOutputPath, treeOutput);

        return {
            content: [{
                type: "text",
                text: `Tree structure saved to ${resolvedOutputPath}. Before continuing, you MUST ask the user to drag and drop the file into the chat window.
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