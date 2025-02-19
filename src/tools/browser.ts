import puppeteer from "puppeteer";
import { z } from "zod";

export const browserToolName = "browser";
export const browserToolDescription =
    "Visit a URL and read its content. Can handle both full URLs and local paths (relative URL appended to http://localhost:3000).";

export const BrowserToolSchema = z.object({
    url: z.string().optional(),
    relativePath: z.string().optional(),
    timeoutMs: z.number().optional().default(5000),
    waitForSelector: z.string().optional(),
    extractSelector: z.string().optional(),
    includeMetadata: z.boolean().optional().default(false),
    getRawHtml: z.boolean().optional().default(false),
    maxLength: z.number().optional().default(900000), // Default to 900KB
    contentMode: z.enum(['full', 'summary', 'structured']).optional().default('full')
});

export async function runBrowserTool(
    args: z.infer<typeof BrowserToolSchema>,
) {
    // Determine final URL
    let finalUrl = args.url;
    if (!finalUrl) {
        if (!args.relativePath) {
            throw new Error("Must provide either 'url' or 'relativePath'");
        }
        finalUrl = `http://localhost:3000/${args.relativePath.replace(/^\//, "")}`;
    }

    // Launch Puppeteer with specific configurations
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"'
        ]
    });

    const page = await browser.newPage();

    // Set extra headers to look more like a real browser
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
    });

    try {
        // Enable JavaScript
        await page.setJavaScriptEnabled(true);

        // Navigate to the page and wait for network to be idle
        await page.goto(finalUrl, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: args.timeoutMs
        });

        // Wait for specific selector if provided
        if (args.waitForSelector) {
            await page.waitForSelector(args.waitForSelector, { timeout: args.timeoutMs });
        }

        // If getRawHtml is true, return the raw HTML (truncated if needed)
        if (args.getRawHtml) {
            const html = await page.content();
            const truncatedHtml = html.slice(0, args.maxLength);
            await browser.close();
            return {
                content: [
                    {
                        type: "text",
                        text: truncatedHtml
                    }
                ]
            };
        }

        // Extract content based on contentMode
        let content = '';
        let metadata = {};

        if (args.extractSelector) {
            // Extract content from specific selector
            const element = await page.$(args.extractSelector);
            if (element) {
                content = await page.evaluate(el => el.textContent || '', element);
            }
        } else {
            // Extract content based on contentMode
            content = await page.evaluate((mode) => {
                const getVisibleText = (element: Element): boolean => {
                    const style = window.getComputedStyle(element);
                    return style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0';
                };

                switch (mode) {
                    case 'summary':
                        // Get main headings and first paragraph of each section
                        const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
                        const mainContent = headings.map(heading => {
                            let content = heading.textContent || '';
                            let nextElement = heading.nextElementSibling;
                            while (nextElement && nextElement.tagName.toLowerCase() !== 'h1' &&
                                nextElement.tagName.toLowerCase() !== 'h2' &&
                                nextElement.tagName.toLowerCase() !== 'h3') {
                                if (nextElement.tagName.toLowerCase() === 'p' && getVisibleText(nextElement)) {
                                    content += '\n' + (nextElement.textContent || '');
                                    break;
                                }
                                nextElement = nextElement.nextElementSibling;
                            }
                            return content;
                        }).join('\n\n');
                        return mainContent;

                    case 'structured':
                        // Return a structured format with sections
                        const structure = {
                            title: document.title,
                            mainHeading: (document.querySelector('h1')?.textContent || '').trim(),
                            sections: Array.from(document.querySelectorAll('h2, h3')).map(heading => ({
                                heading: heading.textContent || '',
                                content: heading.nextElementSibling?.textContent || ''
                            }))
                        };
                        return JSON.stringify(structure, null, 2);

                    case 'full':
                    default:
                        // Get all visible text content
                        return Array.from(document.querySelectorAll('body *'))
                            .filter(element => getVisibleText(element))
                            .map(element => element.textContent || '')
                            .join(' ')
                            .replace(/\s+/g, ' ')
                            .trim();
                }
            }, args.contentMode);
        }

        if (args.includeMetadata) {
            metadata = await page.evaluate(() => ({
                title: document.title,
                description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
                url: window.location.href,
                lastModified: document.lastModified
            }));
        }

        // Truncate content if it exceeds maxLength
        if (content.length > args.maxLength) {
            content = content.slice(0, args.maxLength) + '\n[Content truncated due to length...]';
        }

        await browser.close();

        return {
            content: [
                {
                    type: "text",
                    text: args.includeMetadata
                        ? `Metadata:\n${JSON.stringify(metadata, null, 2)}\n\nContent:\n${content}`
                        : content
                }
            ]
        };
    } catch (error: any) {
        await browser.close();
        return {
            content: [
                {
                    type: "text",
                    text: `Error reading page content: ${error.message || error}`
                }
            ]
        };
    }
} 