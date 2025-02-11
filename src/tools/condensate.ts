import fs from "fs";
import path from "path";
import { z } from "zod";

export const condensateToolName = "condensate";
export const condensateToolDescription =
    "Concatenates contents from multiple files into one text file with headers for each file. IMPORTANT: All file paths (both input and output) must be absolute paths (e.g., '/Users/username/path/to/file.ts' or 'C:\\Users\\username\\path\\to\\file.ts').";

export const CondensateToolSchema = z.object({
    files: z.array(z.string().min(1, "File path must not be empty"))
        .nonempty("At least one file path is required.")
        .describe("Array of absolute file paths to concatenate (e.g., ['/Users/username/path/to/file1.ts', '/Users/username/path/to/file2.ts'])"),
    outputPath: z.string()
        .min(1, "Output file path is required.")
        .describe("Absolute path where the concatenated file will be saved (e.g., '/Users/username/path/to/output.txt')"),
});

export async function runCondensateTool(
    args: z.infer<typeof CondensateToolSchema>
) {
    const { files, outputPath } = args;
    let finalContent = "";

    try {
        for (const filePath of files) {
            const fileName = path.basename(filePath);
            let fileContent: string;
            try {
                fileContent = await fs.promises.readFile(filePath, "utf8");
            } catch (readError: any) {
                fileContent = `Error reading file: ${readError.message}`;
            }
            finalContent += `# ${fileName}\n<content>\n${fileContent}\n</content>\n\n`;
        }

        const fullOutputPath = path.resolve(outputPath);
        await fs.promises.writeFile(fullOutputPath, finalContent, "utf8");

        return {
            content: [
                {
                    type: "text",
                    text: `Successfully created condensate file at ${fullOutputPath}`,
                },
            ],
        };
    } catch (error: any) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error during condensate tool execution: ${error.message || error}`,
                },
            ],
        };
    }
} 