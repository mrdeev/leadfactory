import { NextRequest, NextResponse } from 'next/server';
import { getSystemInstructions } from '@/lib/knowledge-base';
import { db } from '@/lib/db';
import { calcWaitUntil } from '@/lib/sequence-graph';
import { ApifyClient } from 'apify-client';
import { sendEmail } from '@/lib/email';
import { generatePersonalizedEmail, normalizeUrl } from '@/lib/email-generation';

const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        const { productId } = await req.json();
        if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

        const product = await db.getProduct(productId);
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const allContacts = await db.getContacts(productId);

        // Only launch step 1 for contacts that haven't been emailed yet
        const productContacts = allContacts.filter(
            (c: any) => (!c.campaignStep || c.campaignStep === 0)
        );

        if (productContacts.length === 0) {
            return NextResponse.json({
                error: 'No new contacts to launch. All contacts have already received email step 1.'
            }, { status: 400 });
        }

        console.log(`--- Launching Campaign Step 1 for ${product.name} — ${productContacts.length} contacts ---`);

        const systemInstructions = getSystemInstructions();
        const sequenceStep1 = product.campaignSequence?.emails?.find((e: any) => e.step === 1);

        // Only scrape LinkedIn for contacts without a pre-generated draft
        const contactsNeedingScrape = productContacts.filter((c: any) => !c.generatedEmails && !c.generatedEmail);
        const linkedinUrls = contactsNeedingScrape
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

                const matchedCount = productContacts.filter((c: any) => postsMap[normalizeUrl(c.linkedinUrl)]).length;
                console.log(`Matched LinkedIn posts to ${matchedCount}/${productContacts.length} contacts`);
            } catch (err) {
                console.error('LinkedIn scraper error, continuing without posts:', err);
            }
        }

        // Generate and send email step 1 for each contact
        const updatedContacts: any[] = [];
        const senderEmail = product.senderEmail || 'support@topsalesagent.ai';

        for (const contact of productContacts) {
            const cleanUrl = normalizeUrl(contact.linkedinUrl as string);
            const recentPosts = cleanUrl ? (postsMap[cleanUrl] || '') : '';

            let subject: string;
            let body: string;

            if (contact.generatedEmails?.email1 || contact.generatedEmail) {
                subject = contact.generatedEmails?.email1?.subject || contact.generatedSubject || `${product.name} — quick question`;
                body = contact.generatedEmails?.email1?.body || contact.generatedEmail;
                console.log(`Reusing draft email for ${contact.fullName}`);
            } else {
                subject = 'AI Generation Failed';
                body = 'AI Generation Failed';
                if (recentPosts) {
                    console.log(`Found LinkedIn posts for ${contact.fullName}`);
                }
                try {
                    const result = await generatePersonalizedEmail(
                        product, contact, recentPosts, systemInstructions, sequenceStep1
                    );
                    subject = result.subject;
                    body = result.body;
                } catch (err: any) {
                    console.error(`AI generation failed for ${contact.fullName}:`, err.message);
                }
            }

            // Calculate next email send date from sequence
            const step2 = product.campaignSequence?.emails?.find((e: any) => e.step === 2);
            const step2DelayDays = step2?.delayDays ?? 3;
            const nextEmailAt = new Date(Date.now() + step2DelayDays * 24 * 60 * 60 * 1000).toISOString();

            await db.updateContact(contact.id, {
                generatedEmail: body,
                generatedSubject: subject,
                status: 'active',
                campaignStep: 1,
                campaignStepAt: new Date().toISOString(),
                nextEmailAt: (product.campaignSequence?.emails?.length ?? 0) > 1 ? nextEmailAt : undefined,
                launchedAt: new Date().toISOString(),
            });
            updatedContacts.push({ ...contact, id: contact.id });

            if (body !== 'AI Generation Failed') {
                try {
                    await sendEmail({
                        to: contact.email,
                        from: `${product.senderName || product.name} <${senderEmail}>`,
                        subject,
                        text: body,
                        provider: product.sendingMethod || 'platform',
                        sesConfig: product.sesConfig,
                        sendgridConfig: product.sendgridConfig,
                        mailgunConfig: product.mailgunConfig,
                        smtpConfig: product.smtpConfig ? {
                            host: product.smtpConfig.host,
                            port: product.smtpConfig.port,
                            user: product.smtpConfig.username,
                            pass: product.smtpConfig.password || '',
                        } : undefined,
                        replyTo: product.replyToEmail,
                    });

                    await db.logMessage(productId, contact, senderEmail, subject, body, 'email1');
                } catch (sendErr) {
                    console.error(`Failed to send to ${contact.email}:`, sendErr);
                }
            }

            if (productContacts.length > 5) await new Promise(r => setTimeout(r, 300));
        }

        // Automatically set campaign status to active
        if (product.campaignStatus !== 'active') {
            await db.updateProduct(productId, { campaignStatus: 'active' });
        }

        // Initialize sequence states — each launched contact enters the graph at 'visit'
        let hasImmediate = false;
        const customNodes = product.campaignSequence?.nodes || [];

        for (const contact of updatedContacts) {
            const existingState = await db.getSequenceState(contact.id);
            if (existingState) continue;

            const nextNodeId = 'visit';
            const waitUntil = calcWaitUntil(nextNodeId, customNodes);
            const nextNode = customNodes.find(n => n.id === nextNodeId) ||
                (await import('@/lib/sequence-graph')).getNode(nextNodeId);

            await db.saveSequenceState({
                id: crypto.randomUUID(),
                leadId: contact.id,
                productId,
                sequenceNodeId: nextNodeId,
                sequenceEnteredAt: new Date().toISOString(),
                sequenceWaitUntil: waitUntil,
                status: 'active',
                updatedAt: new Date().toISOString(),
            });

            if (nextNode && nextNode.waitBeforeDays === 0) {
                await db.saveSequenceJob({
                    id: crypto.randomUUID(),
                    leadId: contact.id,
                    productId,
                    nodeId: nextNodeId,
                    scheduledAt: waitUntil,
                    status: 'pending',
                    attempts: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
                hasImmediate = true;
            }
        }

        // Kick the worker if we enqueued immediate tasks
        if (hasImmediate) {
            const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
            const host = process.env.VERCEL_URL || 'localhost:3000';
            const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
            fetch(`${baseUrl}/api/sequence/worker`, { method: 'POST' }).catch(() => { });
        }

        // Activity log
        await db.logActivity(
            productId,
            'launch',
            'batch',
            'launched',
            `Campaign step 1 sent for ${product.name}. ${updatedContacts.length} personalized emails delivered.`,
        );

        return NextResponse.json({
            success: true,
            count: updatedContacts.length,
            campaignStep: 1,
            hasFollowUps: (product.campaignSequence?.emails?.length ?? 0) > 1,
        });
    } catch (error: any) {
        console.error('Launch API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
