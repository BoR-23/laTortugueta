
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

// --- Configuration ---

const COMPETITORS = [
    { name: 'La Tortugueta (Nosotros)', url: 'https://latortugueta.com' },
    { name: 'Traje Regional', url: 'https://trajeregional.com/79-medias-regionales' },
    { name: 'Mari Capella', url: 'https://www.maricapella.com' },
    { name: 'Álvaro Moliner', url: 'https://alvaromoliner.com/39-calcetines' },
    { name: "D'aquela", url: 'https://trajestradicionales.es/79-medias-regionales' }
];

const TARGET_KEYWORDS = [
    // Generic
    'calcetines fallera',
    'calcetines tradicionales',
    'indumentaria valenciana',
    'siglo xviii',
    'seda',
    'algodón',
    'artesanal',
    'hecho a mano',

    // Specific Niche
    'medias regionales',
    'medias de garbanzo',
    'medias de espiga',
    'bordados'
];

// --- Types ---

interface PageAnalysis {
    name: string;
    url: string;
    title: string;
    description: string;
    h1: string[];
    h2: string[];
    h3: string[];
    wordCount: number;
    keywordDensity: Record<string, number>;
    sampleText: string;
}

// --- Helpers ---

async function fetchPage(url: string): Promise<string | null> {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            },
            timeout: 15000,
            validateStatus: (status) => status < 500
        });
        return data;
    } catch (error: any) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}

function analyzeContent(html: string, name: string, url: string): PageAnalysis {
    const $ = cheerio.load(html);

    // Remove scripts, styles for word count
    $('script').remove();
    $('style').remove();
    $('noscript').remove();
    $('nav').remove(); // remove menu items to see real content
    $('header').remove();
    $('footer').remove();

    // Basic Meta
    const title = $('title').text().trim() || '';
    const description = $('meta[name="description"]').attr('content') || '';

    // Headings
    const h1 = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    const h2 = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    const h3 = $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean);

    // Content Text (Cleaned)
    const bodyEl = $('body');
    // Try to find main content wrapper if possible to avoid menu noise, but fallback to body
    const mainContent = $('main').length ? $('main') : bodyEl;

    const bodyText = mainContent.text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(' ').length;
    const sampleText = bodyText.slice(0, 2000); // Get first 2000 chars

    // Keyword Density
    const keywordDensity: Record<string, number> = {};
    TARGET_KEYWORDS.forEach(keyword => {
        const regex = new RegExp(keyword.toLowerCase(), 'g');
        const matches = bodyText.toLowerCase().match(regex); // Ensure lowercase comparison
        keywordDensity[keyword] = matches ? matches.length : 0;
    });

    return {
        name,
        url,
        title,
        description,
        h1,
        h2,
        h3,
        wordCount,
        keywordDensity,
        sampleText
    };
}

function generateMarkdownReport(analyses: PageAnalysis[]): string {
    const timestamp = new Date().toISOString().split('T')[0];
    let report = `# Competitor SEO Analysis Report (${timestamp})\n\n`;

    report += `## Executive Summary\n`;
    report += `This report compares 'La Tortugueta' against top competitors for key terms like 'medias regionales', 'garbanzo', 'espiga', etc.\n\n`;

    // 1. Keyword Gap Analysis Table
    report += `## 1. Keyword Gap Analysis\n\n`;
    report += `| Keyword | ${analyses.map(a => a.name).join(' | ')} |\n`;
    report += `| :--- | ${analyses.map(() => ':---:').join(' | ')} |\n`;

    TARGET_KEYWORDS.forEach(keyword => {
        const row = analyses.map(a => a.keywordDensity[keyword] || 0);
        report += `| **${keyword}** | ${row.join(' | ')} |\n`;
    });
    report += `\n`;

    // 2. Detailed Technical Comparison
    report += `## 2. Technical & Content Structure\n\n`;

    analyses.forEach(a => {
        report += `### ${a.name}\n`;
        report += `- **URL**: ${a.url}\n`;
        report += `- **Title**: ${a.title}\n`;
        report += `- **Description**: ${a.description}\n`;
        report += `- **Word Count**: ${a.wordCount}\n`;
        report += `- **H1**: ${a.h1.join(', ') || 'None'}\n`;
        report += `- **Top H2s**: ${a.h2.slice(0, 3).join(', ')}...\n`;
        report += `\n---\n\n`;
    });

    // 3. Content Samples
    report += `## 3. Content Samples (First 2000 chars)\n`;
    report += `Here is a preview of the text that generates their high word count:\n\n`;

    analyses.forEach(a => {
        if (a.name.includes('Tortugueta')) return; // Skip us
        report += `### ${a.name}\n`;
        report += `> ${a.sampleText.replace(/\n/g, '\n> ')}\n`;
        report += `\n... [truncated]\n\n`;
    });

    return report;
}

// --- Main ---

async function main() {
    console.log('Starting SEO Competitor Analysis...');
    const results: PageAnalysis[] = [];

    for (const comp of COMPETITORS) {
        console.log(`Analyzing ${comp.name}...`);
        const html = await fetchPage(comp.url);
        if (html) {
            const analysis = analyzeContent(html, comp.name, comp.url);
            results.push(analysis);
        }
    }

    const report = generateMarkdownReport(results);
    const outputPath = path.join(process.cwd(), 'competitor_analysis_report.md');

    await fs.writeFile(outputPath, report, 'utf-8');
    console.log(`\n✅ Analysis complete! Report saved to: ${outputPath}`);
}

main().catch(console.error);
