import puppeteer from "puppeteer";
import { z } from "zod";

export const consoleLogsToolName = "consoleLogs";
export const consoleLogsToolDescription =
    "Capture console logs from a URL or a local path using Brave browser.";

// Constants for timeouts
const DEFAULT_REMOTE_TIMEOUT = 5000;
const DEFAULT_LOCALHOST_TIMEOUT = 30000; // 30 seconds for localhost to account for compilation

export const ConsoleLogsToolSchema = z.object({
    url: z.string().optional(),
    relativePath: z.string().optional(),
    timeoutMs: z.number().optional(), // Now optional without default - we'll set it based on URL type
    includeNetworkErrors: z.boolean().optional().default(true),
    browserPath: z.string().optional(), // Path to Brave browser executable
});

interface ConsoleMessage {
    type: string;
    text: string;
    timestamp: string;
    source?: string;
    lineNumber?: number;
}

export async function runConsoleLogsTool(
    args: z.infer<typeof ConsoleLogsToolSchema>,
) {
    // Determine final URL
    let finalUrl = args.url;
    if (!finalUrl) {
        if (!args.relativePath) {
            throw new Error("Must provide either 'url' or 'relativePath'");
        }
        finalUrl = `http://localhost:3000/${args.relativePath.replace(/^\//, "")}`;
    }

    // Set timeout based on whether it's a localhost URL or remote URL
    const isLocalhost = finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1');
    const timeout = args.timeoutMs || (isLocalhost ? DEFAULT_LOCALHOST_TIMEOUT : DEFAULT_REMOTE_TIMEOUT);

    const consoleLogs: ConsoleMessage[] = [];

    // Launch Puppeteer with Brave if path is provided
    const browser = await puppeteer.launch(args.browserPath ? {
        executablePath: args.browserPath,
    } : undefined);

    const page = await browser.newPage();

    // Capture console logs
    page.on('console', (msg) => {
        consoleLogs.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString(),
            source: msg.location()?.url,
            lineNumber: msg.location()?.lineNumber,
        });
    });

    // Capture errors if requested
    if (args.includeNetworkErrors) {
        page.on('pageerror', (err) => {
            consoleLogs.push({
                type: 'error',
                text: err.message,
                timestamp: new Date().toISOString(),
            });
        });

        page.on('requestfailed', (request) => {
            consoleLogs.push({
                type: 'network-error',
                text: `Failed loading: ${request.url()} ${request.failure()?.errorText || ''}`,
                timestamp: new Date().toISOString(),
            });
        });
    }

    try {
        // Navigate to the page and wait for network idle
        await page.goto(finalUrl, {
            waitUntil: 'networkidle0',
            timeout,
        });

        await browser.close();

        // Format logs for output
        const formattedLogs = consoleLogs
            .map(log => `[${log.timestamp}] [${log.type}]${log.source ? ` [${log.source}:${log.lineNumber}]` : ''} ${log.text}`)
            .join('\n');

        return {
            content: [
                {
                    type: "text",
                    text: `Total messages captured: ${consoleLogs.length}\n\nConsole Logs:\n${formattedLogs}`,
                },
            ],
        };
    } catch (error: any) {
        await browser.close();
        return {
            content: [
                {
                    type: "text",
                    text: `Error capturing console logs: ${error.message || error}`,
                },
            ],
        };
    }
} 