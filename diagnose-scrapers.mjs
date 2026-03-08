import { ApifyClient } from 'apify-client';
import fs from 'fs';

// Manually read .env.local to get the token
const envContent = fs.readFileSync('.env.local', 'utf-8');
const apifyToken = envContent.match(/APIFY_API_TOKEN=(.*)/)?.[1]?.trim();

const client = new ApifyClient({
    token: apifyToken,
});

async function runDiagnostics() {
    console.log('--- Starting Scraper Diagnostics ---');
    console.log('Token:', process.env.APIFY_API_TOKEN?.substring(0, 10) + '...');

    const testLinkedinUrls = [
        'https://www.linkedin.com/in/williamhgates',
        'https://www.linkedin.com/in/satyanadella',
        'https://www.linkedin.com/in/jeffbezos',
        'https://www.linkedin.com/in/elonmusk',
        'https://www.linkedin.com/in/timcook'
    ];
    const testWebsiteUrl = 'https://www.microsoft.com';

    // 1. Test LinkedIn Post Scraper (Batch)
    console.log(`\n--- Testing LinkedIn Post Scraper (Batch of ${testLinkedinUrls.length}) ---`);
    try {
        const run = await client.actor("supreme_coder/linkedin-post").call({
            urls: testLinkedinUrls,
            limitPerSource: 1,
            deepScrape: false
        });
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`Success! Found ${items.length} items.`);
        if (items.length > 0) console.log('Snippet:', items[0].text?.substring(0, 100));
    } catch (err) {
        console.error('LinkedIn Post Scraper Failed:', err.message);
    }

    // 2. Test Website Content Crawler
    console.log('\n--- Testing Website Crawler (apify/website-content-crawler) ---');
    try {
        const run = await client.actor("apify/website-content-crawler").call({
            startUrls: [{ url: testWebsiteUrl }],
            maxPagesPerCrawl: 1,
            crawlerType: 'cheerio',
        });
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`Success! Found ${items.length} items.`);
        if (items.length > 0) console.log('Snippet:', (items[0].text || items[0].markdown)?.substring(0, 100));
    } catch (err) {
        console.error('Website Crawler Failed:', err.message);
    }
}

runDiagnostics();
