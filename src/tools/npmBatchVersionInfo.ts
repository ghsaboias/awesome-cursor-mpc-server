import fetch from "node-fetch";
import semver from "semver";
import { z } from "zod";

export const npmBatchVersionToolName = "npm_batch_version_info";
export const npmBatchVersionToolDescription = "Returns the latest versions of multiple NPM packages in a single call, comparing them with current versions and showing update types (major, minor, patch). Format: [package]: [current] -> [latest] (update-type)";

export const NpmBatchVersionToolSchema = z.object({
    package_names: z.array(z.string()).describe("List of NPM package names to check versions for"),
    current_versions: z.array(z.string().optional()).describe("Optional list of current versions corresponding to package_names. If not provided, only latest versions will be shown").optional(),
});

interface NpmPackageData {
    version: string;
    [key: string]: unknown;
}

function getUpdateType(current: string, latest: string): string {
    if (!semver.valid(current) || !semver.valid(latest)) {
        return "unknown";
    }

    if (semver.major(latest) > semver.major(current)) {
        return "major";
    }
    if (semver.minor(latest) > semver.minor(current)) {
        return "minor";
    }
    if (semver.patch(latest) > semver.patch(current)) {
        return "patch";
    }
    return "current";
}

export async function runNpmBatchVersionTool({ package_names, current_versions }: z.infer<typeof NpmBatchVersionToolSchema>) {
    try {
        const results = await Promise.allSettled(
            package_names.map(async (package_name, index) => {
                try {
                    const response = await fetch(`https://registry.npmjs.org/${package_name}/latest`);
                    if (!response.ok) {
                        return { package_name, error: `Failed to fetch version: ${response.statusText}` };
                    }
                    const data = await response.json() as NpmPackageData;
                    const currentVersion = current_versions?.[index];
                    return {
                        package_name,
                        latest_version: data.version,
                        current_version: currentVersion
                    };
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

                const { package_name, latest_version, current_version } = result.value;

                if (!current_version) {
                    return `${package_name}: ${latest_version} (latest)`;
                }

                const updateType = getUpdateType(current_version, latest_version);
                return `${package_name}: ${current_version} -> ${latest_version} (${updateType})`;
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