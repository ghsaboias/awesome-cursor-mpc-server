import fetch from "node-fetch";
import { z } from "zod";

export const npmBatchVersionToolName = "npm_batch_version_info";
export const npmBatchVersionToolDescription = "Returns the latest versions of multiple NPM packages in a single call. Use it to check for the latest NPM package versions when installing multiple JavaScript dependencies";

export const NpmBatchVersionToolSchema = z.object({
    package_names: z.array(z.string()).describe("List of NPM package names to check versions for"),
});

interface NpmPackageData {
    version: string;
    [key: string]: unknown;
}

export async function runNpmBatchVersionTool({ package_names }: z.infer<typeof NpmBatchVersionToolSchema>) {
    try {
        const results = await Promise.allSettled(
            package_names.map(async (package_name) => {
                try {
                    const response = await fetch(`https://registry.npmjs.org/${package_name}/latest`);
                    if (!response.ok) {
                        return { package_name, error: `Failed to fetch version: ${response.statusText}` };
                    }
                    const data = await response.json() as NpmPackageData;
                    return { package_name, version: data.version };
                } catch (error) {
                    return { package_name, error: error instanceof Error ? error.message : String(error) };
                }
            })
        );

        const formattedResults = results.map(result => {
            if (result.status === 'fulfilled') {
                if ('error' in result.value) {
                    return `${result.value.package_name}: Error - ${result.value.error}`;
                }
                return `${result.value.package_name}: ${result.value.version}`;
            }
            return `${package_names[results.indexOf(result)]}: Error - ${result.reason}`;
        });

        return {
            content: [{
                type: "text",
                text: formattedResults.join('\n')
            }]
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{
                type: "text",
                text: `Error fetching package versions: ${errorMessage}`
            }],
            isError: true
        };
    }
} 