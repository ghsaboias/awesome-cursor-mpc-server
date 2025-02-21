import fetch from "node-fetch";
import { z } from "zod";

export const npmVersionToolName = "npm_version_info";
export const npmVersionToolDescription = "Returns the latest version of an NPM package. Use it to check for the latest NPM package version when installing new JavaScript dependencies";

export const NpmVersionToolSchema = z.object({
    package_name: z.string().describe("NPM package name to check version for"),
});

interface NpmPackageData {
    version: string;
    [key: string]: unknown;
}

export async function runNpmVersionTool({ package_name }: z.infer<typeof NpmVersionToolSchema>) {
    try {
        const response = await fetch(`https://registry.npmjs.org/${package_name}/latest`);
        if (!response.ok) {
            return {
                content: [{
                    type: "text",
                    text: `Failed to fetch version: ${response.statusText}`
                }],
                isError: true
            };
        }

        const data = await response.json() as NpmPackageData;

        return {
            content: [{
                type: "text",
                text: `${package_name}: ${data.version}`
            }]
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{
                type: "text",
                text: `Error fetching package version: ${errorMessage}`
            }],
            isError: true
        };
    }
} 