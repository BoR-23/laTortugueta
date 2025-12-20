
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = 'https://6946bce769cfb6000891b001--latortugueta.netlify.app';
const MAX_PAGES = 300;
const CONCURRENCY = 5;
const USER_AGENT = 'LaTortugueta-Audit-Bot/1.0';

// State
const seenUrls = new Set();
const queue = [BASE_URL];
const results = [];
let isStopping = false;

// SITEMAP MOCK (To simulate orphan detection without fetching XML for now, ensures logic works)
const SITEMAP_URLS = new Set([
    BASE_URL + '/',
    BASE_URL + '/benisaido',
    BASE_URL + '/blog',
    BASE_URL + '/quienes-somos',
    BASE_URL + '/contacto'
]);

async function fetchUrl(url) {
    try {
        const start = performance.now();
        const response = await axios.get(url, {
            headers: { 'User-Agent': USER_AGENT },
            validateStatus: () => true // Resolve all status codes
        });
        const duration = Math.round(performance.now() - start);

        return {
            status: response.status,
            data: response.data,
            headers: response.headers,
            duration
        };
    } catch (error) {
        return {
            status: 0,
            data: '',
            headers: {},
            duration: 0,
            error: error.message
        };
    }
}

function analyzeHtml(html, url) {
    if (!html) return {};
    const $ = cheerio.load(html);

    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').text().trim();
    const h1Count = $('h1').length;
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const robots = $('meta[name="robots"]').attr('content') || '';

    const internalLinks = [];
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && (href.startsWith('/') || href.includes('latortugueta.netlify.app'))) {
            // Normalize URL
            try {
                const absolute = new URL(href, BASE_URL).href;
                if (absolute.startsWith(BASE_URL) && !absolute.includes('#')) {
                    internalLinks.push(absolute);
                }
            } catch (e) { }
        }
    });

    const images = $('img');
    const imagesWithoutAlt = images.filter((_, el) => !$(el).attr('alt')).length;

    // Schema Detection
    const hasProductSchema = html.includes('"@type":"Product"') || html.includes('"@type": "Product"');

    return {
        title,
        description,
        h1,
        h1Count,
        canonical,
        robots,
        linksCount: internalLinks.length,
        newLinks: internalLinks,
        imagesCount: images.length,
        imagesWithoutAlt,
        hasProductSchema
    };
}

async function worker() {
    while (queue.length > 0 && seenUrls.size < MAX_PAGES && !isStopping) {
        const url = queue.shift();
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        // Skip Admin or Filter parameters for efficiency
        if (url.includes('/admin') || url.includes('?codes=')) {
            continue;
        }

        console.log(`Crawling (${seenUrls.size}/${MAX_PAGES}): ${url.replace(BASE_URL, '')}`);

        const { status, data, duration, error } = await fetchUrl(url);
        const analysis = (status === 200 && typeof data === 'string') ? analyzeHtml(data, url) : {};

        // Add new links to queue
        if (analysis.newLinks) {
            analysis.newLinks.forEach(link => {
                if (!seenUrls.has(link)) queue.push(link);
            });
        }

        const result = {
            url,
            status,
            duration,
            error,
            ...analysis
        };

        results.push(result);
    }
}

function generateReport() {
    console.log('\nGenerating Comprehensive Report...');

    // Scoring Logic
    let totalScore = 0;
    let crawledCount = results.length;

    const htmlRows = results.map(r => {
        let score = 100;
        const issues = [];

        if (r.status !== 200) { score -= 100; issues.push(`Status ${r.status}`); }
        if (!r.title) { score -= 20; issues.push('Missing Title'); }
        if (!r.description) { score -= 15; issues.push('Missing Meta Desc'); }
        if (r.h1Count === 0) { score -= 20; issues.push('Missing H1'); }
        if (r.h1Count > 1) { score -= 10; issues.push('Multiple H1s'); }
        if (r.imagesWithoutAlt > 0) { score -= 5; issues.push(`${r.imagesWithoutAlt} Img without Alt`); }
        if (r.duration > 1500) { score -= 5; issues.push('Slow TTFB (>1.5s)'); }

        // Product Schema Check for Product Pages (heuristic URL checking)
        if (!r.url.includes('/blog') && !r.url.includes('/quienes-somos') && r.url !== BASE_URL && r.url.split('/').length > 3) {
            if (!r.hasProductSchema) {
                score -= 10;
                issues.push('Missing Product Schema');
            }
        }

        totalScore += Math.max(0, score);

        return `
      <tr class="${score < 50 ? 'critical' : score < 90 ? 'warning' : ''}">
        <td>
            <div class="url"><a href="${r.url}" target="_blank">${r.url.replace(BASE_URL, '')}</a></div>
            <div class="meta-small">Canonical: ${r.canonical || 'None'} | Robots: ${r.robots || 'Index'}</div>
        </td>
        <td class="center"><span class="badge ${r.status === 200 ? 'success' : 'error'}">${r.status || 'ERR'}</span></td>
        <td>
            <div class="seo-check"><strong>Title:</strong> ${r.title ? '✅' : '❌'} (${r.title?.length || 0})</div>
            <div class="seo-check"><strong>Desc:</strong> ${r.description ? '✅' : '❌'} (${r.description?.length || 0})</div>
            <div class="seo-check"><strong>H1:</strong> ${r.h1Count === 1 ? '✅' : '❌'} (${r.h1Count})</div>
        </td>
        <td>
           <div class="stat">Links: ${r.linksCount || 0}</div>
           <div class="stat">Imgs: ${r.imagesCount || 0}</div>
           <div class="stat">Alt-: <span class="${r.imagesWithoutAlt > 0 ? 'red' : ''}">${r.imagesWithoutAlt || 0}</span></div>
        </td>
        <td class="center">${r.duration}ms</td>
        <td>
            ${issues.length > 0 ? issues.map(i => `<span class="issue-tag">${i}</span>`).join('') : '<span class="success-text">Perfect</span>'}
            ${r.hasProductSchema ? '<span class="schema-tag">Schema</span>' : ''}
        </td>
      </tr>
    `;
    }).join('');

    const globalScore = Math.round(totalScore / (crawledCount || 1));

    const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>La Tortugueta - Detailed SEO Audit</title>
    <style>
      :root { --primary: #2c3e50; --success: #27ae60; --warning: #f1c40f; --danger: #e74c3c; --light: #ecf0f1; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 2rem; background: #f8f9fa; color: #333; }
      .container { max-width: 1400px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      
      header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem; }
      h1 { margin: 0; color: var(--primary); }
      .score-card { text-align: right; }
      .global-score { font-size: 2.5rem; font-weight: bold; color: ${globalScore > 80 ? 'var(--success)' : 'var(--warning)'}; }
      
      table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
      th { text-align: left; padding: 1rem; background: var(--light); color: var(--primary); position: sticky; top: 0; }
      td { padding: 1rem; border-bottom: 1px solid #eee; vertical-align: top; }
      tr:hover { background: #f8fcfd; }
      
      .url { font-weight: bold; color: #2980b9; word-break: break-all; }
      .meta-small { font-size: 0.75rem; color: #7f8c8d; margin-top: 4px; }
      .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; color: white; font-size: 0.8rem; }
      .success { background: var(--success); }
      .error { background: var(--danger); }
      
      .seo-check { margin-bottom: 4px; }
      .stat { white-space: nowrap; }
      .red { color: var(--danger); font-weight: bold; }
      .center { text-align: center; }
      
      .issue-tag { display: inline-block; background: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin: 2px; border: 1px solid #ffeeba; }
      .schema-tag { display: inline-block; background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin: 2px; border: 1px solid #c3e6cb; }
      .success-text { color: var(--success); font-weight: bold; }
      
      tr.critical { background-color: #fbecec; }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <div>
            <h1>SEO Audit Report: La Tortugueta</h1>
            <p>Target: ${BASE_URL}</p>
            <p>Pages Crawled: ${crawledCount} | Date: ${new Date().toLocaleString()}</p>
        </div>
        <div class="score-card">
            <div>Global Health Score</div>
            <div class="global-score">${globalScore}/100</div>
        </div>
      </header>

      <table>
        <thead>
            <tr>
                <th style="width: 30%">Page URL / Canonical</th>
                <th class="center" style="width: 8%">Status</th>
                <th style="width: 20%">On-Page (Title/Desc/H1)</th>
                <th style="width: 12%">Stats</th>
                <th class="center" style="width: 8%">Perf</th>
                <th style="width: 22%">Issues & Features</th>
            </tr>
        </thead>
        <tbody>
            ${htmlRows}
        </tbody>
      </table>
    </div>
  </body>
  </html>
  `;

    fs.writeFileSync('seo_report.html', html);
    console.log('Report saved: seo_report.html');
}

// Signal Handling
process.on('SIGINT', () => {
    console.log('\nProcess interrupted. Stopping crawl and generating report...');
    isStopping = true;
    setTimeout(generateReport, 1000); // Give workers time to finish pending
});

// Run Crawl
(async () => {
    console.log(`Starting Robust Crawl on ${BASE_URL}`);
    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(worker());
    }
    await Promise.all(workers);
    generateReport();
})();
