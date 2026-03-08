import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { db } from '@/lib/db';
import { getSystemInstructions } from '@/lib/knowledge-base';
import { generatePersonalizedEmail, normalizeUrl } from '@/lib/email-generation';

export const maxDuration = 300;

const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

// All email nodes in the sequence with their step metadata for prompt rules
const EMAIL_NODES = [
    { nodeId: 'email1', sequenceStep: { step: 1, purpose: 'initial' } },
    { nodeId: 'email_yes', sequenceStep: { step: 2, purpose: 'follow_up' } },
    { nodeId: 'email_no1', sequenceStep: { step: 2, purpose: 'follow_up' } },
    { nodeId: 'email_no2', sequenceStep: { step: 3, purpose: 'value_add' } },
    { nodeId: 'email_no3', sequenceStep: { step: 4, purpose: 'breakup' } },
] as const;

// POST /api/campaign/draft
// Pre-generates personalized emails for ALL sequence email nodes per contact.
// Saves to contact.generatedEmails[nodeId] without sending or setting campaignStep.
export async function POST(req: NextRequest) {
    try {
        const { productId } = await req.json();
        if (!productId) {
            return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
        }

        const product = await db.getProduct(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const allContacts = await db.getContacts(productId);

        // Only process contacts that haven't been launched and don't have drafts yet
        const contactsToProcess = allContacts.filter(
            (c: any) =>
                !c.generatedEmails &&
                (!c.campaignStep || c.campaignStep === 0)
        );

        if (contactsToProcess.length === 0) {
            return NextResponse.json({ success: true, count: 0, contacts: allContacts });
        }

        console.log(`--- Drafting all email nodes for ${contactsToProcess.length} contacts (${product.name}) ---`);

        const systemInstructions = getSystemInstructions();

        // Batch-scrape LinkedIn posts once for all contacts
        const linkedinUrls = contactsToProcess
            .map((c: any) => c.linkedinUrl)
            .filter((url: string) => url && url.includes('linkedin.com/in/'));

        let postsMap: Record<string, string> = {};

        if (linkedinUrls.length > 0) {
            console.log(`Scraping LinkedIn posts for ${linkedinUrls.length} contacts...`);
            try {
                const uniqueUrls = [...new Set(linkedinUrls)];
                const postRun = await apifyClient.actor('supreme_coder/linkedin-post').call({
                    urls: uniqueUrls,
                    limitPerSource: 5,
                    deepScrape: true,
                    rawData: false,
                });
                const { items: posts } = await apifyClient.dataset(postRun.defaultDatasetId).listItems();
                console.log(`Apify returned ${posts.length} posts`);

                posts.forEach((post: any) => {
                    const authorUrl = normalizeUrl(post.authorUrl || post.url || post.inputUrl || post.profileUrl);
                    if (authorUrl) {
                        const content = post.text || post.content || '';
                        if (content) {
                            postsMap[authorUrl] = (postsMap[authorUrl] || '') + '\n\n-- POST --\n' + content;
                        }
                    }
                });
            } catch (err) {
                console.error('LinkedIn scraper error during draft, continuing without posts:', err);
            }
        }

        // Generate all email nodes per contact
        let draftedCount = 0;

        for (const contact of contactsToProcess) {
            const cleanUrl = normalizeUrl(contact.linkedinUrl as string);
            const recentPosts = cleanUrl ? (postsMap[cleanUrl] || '') : '';

            const generatedEmails: Record<string, { subject: string; body: string }> = {};
            let allFailed = true;

            for (const { nodeId, sequenceStep } of EMAIL_NODES) {
                try {
                    const result = await generatePersonalizedEmail(
                        product, contact, recentPosts, systemInstructions, sequenceStep
                    );
                    generatedEmails[nodeId] = { subject: result.subject, body: result.body };
                    allFailed = false;
                    console.log(`Generated ${nodeId} for ${contact.fullName}`);
                } catch (err: any) {
                    console.error(`Draft generation failed for ${contact.fullName} / ${nodeId}:`, err.message);
                }
            }

            if (!allFailed) {
                await db.updateContact(contact.id, {
                    generatedEmails,
                    generatedEmail: generatedEmails.email1?.body,
                    generatedSubject: generatedEmails.email1?.subject,
                    draftGeneratedAt: new Date().toISOString(),
                });
                draftedCount++;
            }

            // Throttle for large batches
            if (contactsToProcess.length > 3) {
                await new Promise(r => setTimeout(r, 300));
            }
        }

        const updatedContacts = await db.getContacts(productId);

        return NextResponse.json({
            success: true,
            count: draftedCount,
            contacts: updatedContacts,
        });
    } catch (error: any) {
        console.error('Draft API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
