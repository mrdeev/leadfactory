import { ApifyClient } from 'apify-client';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const apifyToken = envContent.match(/APIFY_API_TOKEN=(.*)/)?.[1]?.trim();
const client = new ApifyClient({ token: apifyToken });

async function testPostScraper() {
    console.log('--- Testing LinkedIn Post Scraper Mapping ---');
    const url = 'https://www.linkedin.com/in/williamhgates';

    try {
        const run = await client.actor("supreme_coder/linkedin-post").call({
            urls: [url],
            limitPerSource: 2,
            deepScrape: false
        });
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`Found ${items.length} items.`);

        items.forEach((item, i) => {
            console.log(`\nItem ${i}:`);
            console.log('url:', item.url);
            console.log('authorUrl:', item.authorUrl);
            console.log('authorProfileUrl:', item.authorProfileUrl);
            console.log('authorProfileId:', item.authorProfileId);
            console.log('inputUrl:', item.inputUrl);
            console.log('text snippet:', item.text?.substring(0, 50));
        });
    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

testPostScraper();
