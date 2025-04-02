import * as PDFParser from "pdf2json";
import { z } from "zod";

export const pdfToJsonToCsvToolName = "pdf_to_json_to_csv";
export const pdfToJsonToCsvToolDescription = "Converts PDF file to JSON and then to CSV format, focusing on extracting tabular data";

export const PdfToJsonToCsvToolSchema = z.object({
    pdfFilePath: z.string().describe("Path to the PDF file"),
    targetPages: z.array(z.number()).optional().describe("Specific pages to extract (1-based indexing). If not provided, all pages will be processed"),
    includeHeaders: z.boolean().optional().default(true).describe("Whether to include the first row as headers"),
});

type PdfText = {
    x: number;
    y: number;
    text: string;
};

export async function runPdfToJsonToCsvTool({
    pdfFilePath,
    targetPages,
    includeHeaders = true
}: z.infer<typeof PdfToJsonToCsvToolSchema>) {
    try {
        // Initialize PDF parser
        const pdfParser = new PDFParser.default();

        // Process the PDF and convert to CSV
        const csvResult = await new Promise<string>((resolve, reject) => {
            pdfParser.on('pdfParser_dataError', (errData: any) => {
                reject(new Error(`PDF parsing error: ${errData.parserError}`));
            });

            pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
                try {
                    let csv = '';

                    // Process pages based on targetPages or all if not specified
                    pdfData.Pages.forEach((page: any, index: number) => {
                        const pageNum = index + 1; // 1-based indexing
                        if (targetPages && !targetPages.includes(pageNum)) return; // Skip non-target pages

                        // Extract text items with coordinates
                        const texts = page.Texts.map((text: any) => ({
                            x: text.x,
                            y: text.y,
                            text: decodeURIComponent(text.R[0].T).trim()
                        }));

                        // Group texts by Y-coordinate to approximate rows
                        const rowMap: { [key: string]: Array<{ x: number, text: string }> } = {};
                        texts.forEach((item: PdfText) => {
                            if (!item.text) return; // Skip empty
                            const y = Math.round(item.y * 10); // Group by approximate Y-coordinate
                            if (!rowMap[y]) rowMap[y] = [];
                            rowMap[y].push({ x: item.x, text: item.text });
                        });

                        // Sort rows by Y-coordinate (top to bottom)
                        const rows = Object.keys(rowMap)
                            .sort((a, b) => parseFloat(a) - parseFloat(b))
                            .map(y => rowMap[y].sort((a, b) => a.x - b.x)); // Sort columns by X-coordinate

                        // Filter rows likely to be part of a table (e.g., multiple columns)
                        const tableRows = rows.filter(row => row.length > 1);

                        // Convert to CSV
                        tableRows.forEach(row => {
                            const columns = row.map(item => `"${item.text.replace(/"/g, '""')}"`); // Escape quotes
                            csv += columns.join(',') + '\n';
                        });

                        csv += '\n'; // Separator between pages
                    });

                    resolve(csv);
                } catch (error) {
                    reject(error);
                }
            });

            // Load the PDF file
            pdfParser.loadPDF(pdfFilePath);
        });

        // Return the CSV data
        return {
            content: [{
                type: "text",
                text: csvResult
            }]
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{
                type: "text",
                text: `Error converting PDF to CSV: ${errorMessage}`
            }],
            isError: true
        };
    }
} 