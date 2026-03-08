import { ApifyClient } from 'apify-client';
import fs from 'fs';
import crypto from 'crypto';

// Setup Token
const envContent = fs.readFileSync('.env.local', 'utf-8');
const apifyToken = envContent.match(/APIFY_API_TOKEN=(.*)/)?.[1]?.trim();

const apifyClient = new ApifyClient({ token: apifyToken });

async function simulateSearch() {
    console.log('--- STARTING SIMULATED SEARCH ---');

    // INPUTS (Common query for high yield)
    const jobTitles = ["Software Engineer"];
    const industry = ["Technology"];
    const maxResults = 5;
    const scrapePosts = true;

    // Helper functions (Copied from route.ts)
    const normalizeUrl = (url) => {
        if (!url) return '';
        return url.toLowerCase()
            .split('?')[0]
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '')
            .trim();
    };

    const extractLinkedInUsername = (url) => {
        if (!url) return '';
        const inMatch = url.match(/linkedin\.com\/in\/([^\/?#]+)/i);
        if (inMatch) return inMatch[1].toLowerCase();
        const postMatch = url.match(/linkedin\.com\/posts\/([^\/?#_-]+)/i);
        if (postMatch) return postMatch[1].toLowerCase();
        return '';
    };

    // --- STEP A: Search for Leads ---
    console.log('--- Step A: Searching for leads ---');
    // Using a simpler query and only totalResults to avoid 400 errors
    const leadScraperInput = {
        queries: [`"Software Engineer" Technology San Francisco`],
        totalResults: 20
    };

    try {
        const leadRun = await apifyClient.actor("kVYdvNOefemtiDXO5").call(leadScraperInput);
        const { items: rawLeads } = await apifyClient.dataset(leadRun.defaultDatasetId).listItems();

        console.log(`Found ${rawLeads.length} candidate leads.`);

        const leads = rawLeads.map((item) => ({
            fullName: item.fullName || `${item.firstName} ${item.lastName}`,
            linkedinUrl: item.linkedinUrl || item.profileUrl || `https://www.linkedin.com/in/${item.username}`,
            orgWebsite: item.orgWebsite || ''
        })).filter(l => l.linkedinUrl && l.linkedinUrl.includes('linkedin.com/in/'));

        console.log(`Normalized to ${leads.length} valid LinkedIn profiles.`);

        if (leads.length === 0) return console.log('Zero leads found in Step A. Stopping.');

        // --- STEP C: Scrape Posts ---
        const linkedinUrls = leads.map(l => l.linkedinUrl);
        let postsMap = {};

        console.log(`--- Step C: Scraping posts for ${linkedinUrls.length} leads ---`);
        const postRun = await apifyClient.actor("supreme_coder/linkedin-post").call({
            urls: linkedinUrls,
            limitPerSource: 3,
            deepScrape: false
        });

        const { items: posts } = await apifyClient.dataset(postRun.defaultDatasetId).listItems();
        posts.forEach(post => {
            const inputUrl = post.inputUrl ? normalizeUrl(post.inputUrl) : '';
            const authorUrl = post.authorProfileUrl || post.authorUrl || post.url || '';
            const normalizedAuthorUrl = normalizeUrl(authorUrl);
            const username = post.authorProfileId || extractLinkedInUsername(authorUrl) || extractLinkedInUsername(post.inputUrl);

            const content = (post.text || post.content || '').trim();
            if (content) {
                if (inputUrl) postsMap[inputUrl] = (postsMap[inputUrl] || '') + '\n' + content;
                if (normalizedAuthorUrl && normalizedAuthorUrl !== inputUrl) {
                    postsMap[normalizedAuthorUrl] = (postsMap[normalizedAuthorUrl] || '') + '\n' + content;
                }
                if (username) postsMap[username] = (postsMap[username] || '') + '\n' + content;
            }
        });

        console.log(`Successfully mapped activity for ${Object.keys(postsMap).length} unique profiles.`);

        // --- STEP E: Applying strict filters ---
        console.log('--- Step E: Applying Strict Filters ---');
        const finalLeads = leads.filter(lead => {
            const linkedinUrl = normalizeUrl(lead.linkedinUrl);
            const username = extractLinkedInUsername(lead.linkedinUrl);
            const hasPosts = (linkedinUrl && postsMap[linkedinUrl]) || (username && postsMap[username]);

            if (hasPosts) {
                console.log(`[PASS] ${lead.fullName}`);
                return true;
            } else {
                console.log(`[FAIL] ${lead.fullName} (No activity found)`);
                return false;
            }
        });

        console.log(`\nFINAL RESULTS: ${finalLeads.length} leads passed out of ${leads.length} candidates.`);
        if (finalLeads.length > 0) {
            console.log('Sample Pass:', finalLeads[0].fullName);
        }

    } catch (err) {
        console.error('Simulation Failed:', err);
    }
}

simulateSearch();
