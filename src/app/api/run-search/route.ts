import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import OpenAI from 'openai';
import { getSystemInstructions } from '@/lib/knowledge-base';

// Initialize Clients
const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

export const maxDuration = 300; // Allow 5 minutes for execution

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            industry,           // companyIndustryIncludes (now string[])
            location,           // companyLocationCityIncludes
            jobTitles,          // personTitleIncludes (string[])
            keywords,           // companyKeywordIncludes (string[])
            companySize,        // companyEmployeeSizeIncludes
            emailStatus,        // contactEmailStatus
            hasEmail,           // hasEmail
            hasPhone,           // hasPhone
            maxResults = 1,    // totalResults
            scrapePosts = true, // Default to true if not provided
            scrapeWebsite = false, // DISABLED: No longer intended to be used heavily
            deepAnalysis = false, // New flag
            specificLead = null  // Specific lead to enrich
        } = body;

        let leadsToProcess = [];

        // Helper to normalize LinkedIn URLs for matching
        const normalizeUrl = (url: string) => {
            if (!url) return '';
            // Standardize: remove protocol, www, trailing slash, queries, and handle 'in/username' specifically
            let clean = url.toLowerCase()
                .split('?')[0]
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .replace(/\/$/, '')
                .trim();

            // To ensure matches between 'linkedin.com/in/user' and 'linkedin.com/in/user/'
            // we already did replace(/\/$/, '') but let's be extra careful with specific segments
            return clean;
        };

        // Extract LinkedIn username from any LinkedIn URL format
        const extractLinkedInUsername = (url: string): string => {
            if (!url) return '';
            // Match standard /in/username, or /posts/username-activity... or company/name
            const inMatch = url.match(/linkedin\.com\/in\/([^\/?#]+)/i);
            if (inMatch) return inMatch[1].toLowerCase();

            const postMatch = url.match(/linkedin\.com\/posts\/([^\/?#_-]+)/i);
            if (postMatch) return postMatch[1].toLowerCase();

            return '';
        };

        if (specificLead) {
            console.log('--- Specific Lead Enrichment Requested ---');

            // If the specific lead only has a URL, or we want to refresh/get info
            if (specificLead.linkedinUrl && (!specificLead.fullName || specificLead.fullName === "Target Profile" || !specificLead.position || specificLead.position === "N/A")) {
                console.log(`--- Fetching profile info for: ${specificLead.linkedinUrl} ---`);
                const leadScraperInput = {
                    queries: [specificLead.linkedinUrl],
                    totalResults: 1,
                    includeSimilarTitles: false
                };

                try {
                    const leadRun = await apifyClient.actor("kVYdvNOefemtiDXO5").call(leadScraperInput);
                    const { items: rawLeads } = await apifyClient.dataset(leadRun.defaultDatasetId).listItems();

                    if (rawLeads && rawLeads.length > 0) {
                        const item = rawLeads[0] as any;
                        const targetUsername = extractLinkedInUsername(specificLead.linkedinUrl);
                        const scrapedUsername = extractLinkedInUsername(item.linkedinUrl || item.profileUrl || '');

                        console.log(`--- Identity Verification: Scraped User=${scrapedUsername}, Target User=${targetUsername} ---`);

                        // Ultra-Strict Verification: Must be the exact same username
                        const isMatch = targetUsername && scrapedUsername && targetUsername === scrapedUsername;

                        if (!isMatch && targetUsername) {
                            console.warn(`--- Identity Mismatch! Scraper returned "${scrapedUsername}" instead of "${targetUsername}". Bypassing profile info update. ---`);
                            leadsToProcess = [specificLead];
                        } else {
                            // Defensive Name Mapping: Prioritize the name the user typed if it's not a generic placeholder
                            const userTypedName = (specificLead.fullName && specificLead.fullName !== "Target Profile") ? specificLead.fullName : '';
                            const scrapedName = (item.fullName || item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown');

                            const finalName = userTypedName || scrapedName;

                            leadsToProcess = [{
                                id: item.id || crypto.randomUUID(),
                                fullName: finalName,
                                position: item.position || item.title || item.jobTitle || specificLead.position || 'N/A',
                                orgName: item.orgName || item.companyName || item.currentCompany?.name || specificLead.orgName || 'N/A',
                                orgIndustry: item.orgIndustry || item.industry || specificLead.orgIndustry || 'N/A',
                                email: item.email || item.workEmail || specificLead.email || 'N/A',
                                emailStatus: item.emailStatus || 'Unknown',
                                phone: item.phone || item.mobilePhone || specificLead.phone || '—',
                                linkedinUrl: specificLead.linkedinUrl,
                                keywords: item.keywords || '',
                                city: item.city || item.location || '',
                                orgWebsite: item.orgWebsite || item.companyWebsite || item.currentCompany?.website || item.website || ''
                            }];
                            console.log(`--- Final Lead Name: ${leadsToProcess[0].fullName} (User Typed: ${userTypedName || 'No'}, Scraped: ${scrapedName}) ---`);
                        }
                    } else {
                        leadsToProcess = [specificLead];
                    }
                } catch (err) {
                    console.error('Failed to fetch profile info for specific lead:', err);
                    leadsToProcess = [specificLead];
                }
            } else {
                leadsToProcess = [specificLead];
            }
        } else {
            // --- STEP A: LinkedIn Scraper (kVYdvNOefemtiDXO5) ---
            console.log('--- Step A: Starting LinkedIn Scraper ---');

            // Validate that at least one search parameter is provided
            const hasJobTitles = jobTitles && Array.isArray(jobTitles) && jobTitles.length > 0;
            const hasIndustry = industry && Array.isArray(industry) && industry.length > 0;
            const hasKeywords = keywords && keywords.trim().length > 0;

            if (!hasJobTitles && !hasIndustry && !hasKeywords) {
                return NextResponse.json(
                    { error: 'Please select at least one filter: Job Title, Industry, or Keywords' },
                    { status: 400 }
                );
            }

            // Construct search queries based on job titles and industry
            const searchQueries: string[] = [];
            if (hasJobTitles) {
                jobTitles.forEach((title: string) => {
                    searchQueries.push(title);
                    if (hasIndustry) {
                        industry.forEach((ind: string) => {
                            searchQueries.push(`${title} in ${ind}`);
                        });
                    }
                });
            } else if (hasIndustry && !hasKeywords) {
                industry.forEach((ind: string) => {
                    searchQueries.push(ind);
                });
            } else if (hasKeywords) {
                searchQueries.push(keywords);
            }

            // Construct input using the correct Apify actor parameters
            const leadScraperInput = {
                // Main search query
                queries: searchQueries.length > 0 ? searchQueries : undefined,

                // Person filters
                personTitleIncludes: hasJobTitles ? jobTitles : undefined,

                // Company filters
                companyIndustry: hasIndustry ? industry : undefined,
                companyIndustryIncludes: hasIndustry ? industry : undefined, // Cover both possible param names
                companyKeyword: hasKeywords ? [keywords] : undefined,
                companyEmployeeSize: companySize ? [companySize] : undefined,

                // Location filters
                ...(location && {
                    companyCity: [location],
                    personCity: [location]
                }),

                // Quality filters
                contactEmailStatus: emailStatus === 'Verified' ? ['Verified'] : undefined,
                hasEmail: hasEmail,
                hasPhone: hasPhone,

                // Output
                // Pull 6x results if scraping is enabled to ensure strict filters pass enough leads (e.g. 60 leads)
                // We set this to 60 to maximize yield while staying within safe Apify memory limits.
                totalResults: (scrapePosts || scrapeWebsite) ? (maxResults || 10) * 6 : (maxResults || 10),
                includeSimilarTitles: false
            };

            const cleanInput = Object.fromEntries(Object.entries(leadScraperInput).filter(([_, v]) => v !== undefined));

            const leadRun = await apifyClient.actor("kVYdvNOefemtiDXO5").call(cleanInput);
            const { items: rawLeads } = await apifyClient.dataset(leadRun.defaultDatasetId).listItems();

            if (!rawLeads || rawLeads.length === 0) {
                return NextResponse.json([], { status: 200 });
            }

            // Map rawLinkedIn items to our Lead interface
            const leads = rawLeads.map((item: any) => ({
                id: item.id || crypto.randomUUID(),
                fullName: item.fullName || item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
                position: item.position || item.title || item.jobTitle || 'N/A',
                orgName: item.orgName || item.companyName || item.currentCompany?.name || 'N/A',
                orgIndustry: item.orgIndustry || item.industry || 'N/A',
                email: item.email || item.workEmail || 'N/A',
                emailStatus: item.emailStatus || 'Unknown',
                phone: item.phone || item.mobilePhone || '—',
                linkedinUrl: item.linkedinUrl || item.profileUrl || `https://www.linkedin.com/in/${item.username}`,
                keywords: item.keywords || '',
                city: item.city || item.location || '',
                state: item.state || '',
                country: item.country || '',
                orgWebsite: item.orgWebsite || item.companyWebsite || item.currentCompany?.website || item.website || ''
            }));

            console.log(`--- Step A: Found ${leads.length} total leads from search. ---`);
            console.log(`--- Sample leads: ${leads.slice(0, 3).map((l: any) => l.fullName).join(', ')} ---`);

            // --- STEP B: Filter and Normalize Leads ---
            let filteredLeads = leads.filter((lead: any) =>
                lead.linkedinUrl && (
                    lead.linkedinUrl.includes('linkedin.com/in/') ||
                    lead.linkedinUrl.includes('linkedin.com/profile/') ||
                    lead.linkedinUrl.includes('linkedin.com/pub/')
                )
            );

            // Optional: Re-apply job title filtering if specific titles were requested but actor was too broad
            if (hasJobTitles) {
                console.log(`--- Step B2: Filtering ${filteredLeads.length} leads for job titles: ${jobTitles.join(', ')} ---`);
                const normalizedTargetTitles = jobTitles.map((t: string) => t.toLowerCase().trim());
                filteredLeads = filteredLeads.filter((lead: any) => {
                    if (!lead.position) return false;
                    const leadTitle = lead.position.toLowerCase();
                    // Better matching: check for exact words or clear substrings
                    return normalizedTargetTitles.some(target => {
                        const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp(`(^|\\P{L})${escapedTarget}($|\\P{L})`, 'u');
                        return regex.test(leadTitle) || leadTitle.includes(target);
                    });
                });
                console.log(`--- Filtered down to ${filteredLeads.length} matches ---`);
            }

            // --- Website Enrichment Note ---
            if (scrapeWebsite) {
                const withWebsite = filteredLeads.filter((lead: any) => lead.orgWebsite && lead.orgWebsite.length > 5);
                console.log(`--- Step B3: ${withWebsite.length}/${filteredLeads.length} leads have websites for scraping ---`);
            }

            leadsToProcess = filteredLeads;
        }

        // --- STEP C & D: Concurrent Scraping ---
        const linkedinUrls = leadsToProcess.map((lead: any) => lead.linkedinUrl);
        let postsMap: Record<string, string> = {};
        let websiteMap: Record<string, string> = {};

        const scrapingPromises = [];

        // Scrape LinkedIn Posts
        if (scrapePosts && linkedinUrls.length > 0) {
            scrapingPromises.push((async () => {
                const MAX_URLS_PER_RUN = 15; // Stay well within memory limits
                const urlsToScrape = linkedinUrls.slice(0, MAX_URLS_PER_RUN);

                console.log(`--- Step C: Scraping posts for ${urlsToScrape.length} leads (Batch 1) ---`);
                try {
                    const postRun = await apifyClient.actor("supreme_coder/linkedin-post").call({
                        urls: urlsToScrape,
                        limitPerSource: 5,
                        deepScrape: false,
                        rawData: false
                    });

                    const { items: posts } = await apifyClient.dataset(postRun.defaultDatasetId).listItems();
                    posts.forEach((post: any) => {
                        // Priority 1: inputUrl (Matches exactly what we sent)
                        const inputUrl = post.inputUrl ? normalizeUrl(post.inputUrl) : '';

                        // Priority 2: authorProfileUrl
                        const authorUrl = post.authorProfileUrl || post.authorUrl || post.url || '';
                        const normalizedAuthorUrl = normalizeUrl(authorUrl);

                        // Priority 3: Username extraction
                        const username = post.authorProfileId || extractLinkedInUsername(authorUrl) || extractLinkedInUsername(post.inputUrl);

                        const content = (post.text || post.content || '').trim();
                        if (content) {
                            if (inputUrl) postsMap[inputUrl] = (postsMap[inputUrl] || '') + '\n\n' + content;
                            if (normalizedAuthorUrl && normalizedAuthorUrl !== inputUrl) {
                                postsMap[normalizedAuthorUrl] = (postsMap[normalizedAuthorUrl] || '') + '\n\n' + content;
                            }
                            if (username) postsMap[username] = (postsMap[username] || '') + '\n\n' + content;
                        }
                    });
                    console.log(`--- Post scraper returned ${posts.length} items. Map has ${Object.keys(postsMap).length} keys ---`);
                } catch (error) {
                    console.error('LinkedIn Post Scraper Failed:', error);
                }
            })());
        }

        // WEBSITE SCRAPER - DISABLED as per user request to avoid heavy usage
        /* 
        if (scrapeWebsite) {
            ...
        }
        */

        // Wait for all selected scrapers to finish (or fail)
        let scraperError: string | null = null;
        if (scrapingPromises.length > 0) {
            console.log(`--- Step D.2: Waiting for ${scrapingPromises.length} scrapers to finish ---`);
            const results = await Promise.allSettled(scrapingPromises);
            results.forEach((res, i) => {
                if (res.status === 'rejected') {
                    const errorMsg = res.reason?.message || String(res.reason);
                    console.error(`Scraper ${i} failed:`, errorMsg);
                    if (errorMsg.includes('memory limit') || errorMsg.includes('402')) {
                        scraperError = "Apify Memory Limit Exceeded. Please check your Apify account.";
                    }
                }
            });
        }

        // --- STEP E: Filter Leads (STRICT) ---
        // NON-NEGOTIABLE: If the user turned on a scraper, they ONLY want leads that have that data.
        console.log(`--- Step E: Applying strict filters to ${leadsToProcess.length} candidate leads ---`);
        console.log(`--- scrapePosts: ${scrapePosts}, scrapeWebsite: ${scrapeWebsite} ---`);
        console.log(`--- postsMap size: ${Object.keys(postsMap).length}, websiteMap size: ${Object.keys(websiteMap).length} ---`);

        const finalLeadsToProcess = (leadsToProcess as any[]).filter(lead => {
            // LinkedIn Post Check
            if (scrapePosts) {
                const linkedinUrl = normalizeUrl(lead.linkedinUrl as string);
                const username = extractLinkedInUsername(lead.linkedinUrl as string);
                const hasPosts = (linkedinUrl && postsMap[linkedinUrl] && postsMap[linkedinUrl].trim().length > 0) ||
                    (username && postsMap[username] && postsMap[username].trim().length > 0);

                if (!hasPosts) {
                    console.log(`--- Filtering out ${lead.fullName}: No LinkedIn activity found in map. ---`);
                    return false;
                }
            }

            // Website Content Check - BYPASSED / DISABLED
            if (scrapeWebsite) {
                // If the user explicitly wants this later, we can re-enable, 
                // but for now we follow the instruction to avoid heavy usage.
                return true;
            }

            return true;
        });

        console.log(`--- Step E: ${finalLeadsToProcess.length}/${leadsToProcess.length} leads passed strict filters ---`);

        if (finalLeadsToProcess.length === 0) {
            // If the filtered list is empty, but we know a scraper failed, tell the user why.
            if (scraperError) {
                return NextResponse.json({ error: scraperError }, { status: 402 });
            }
            return NextResponse.json([], { status: 200 });
        }

        // --- STEP F: AI Personalization (Parallel) ---
        console.log(`--- Step F: AI Personalization for ${finalLeadsToProcess.length} leads ---`);

        const personalizationPromises = finalLeadsToProcess.map(async (lead) => {
            const linkedinUrl = normalizeUrl(lead.linkedinUrl as string);
            const username = extractLinkedInUsername(lead.linkedinUrl as string);
            const recentPosts = (linkedinUrl ? postsMap[linkedinUrl] : '') || (username ? postsMap[username] : '') || '';

            // Match website content
            let leadWebsiteContent = '';
            if (scrapeWebsite && lead.orgWebsite) {
                const websiteUrl = lead.orgWebsite.startsWith('http') ? lead.orgWebsite : `https://${lead.orgWebsite}`;
                leadWebsiteContent = websiteMap[lead.orgWebsite] || websiteMap[websiteUrl] || '';
                if (!leadWebsiteContent) {
                    const match = Object.keys(websiteMap).find(url => url.includes(lead.orgWebsite) || lead.orgWebsite.includes(url));
                    if (match) leadWebsiteContent = websiteMap[match];
                }
            }

            // Only call AI if we actually have data to analyze, or if it's a specific lead requested for deep analysis
            if (!recentPosts && !leadWebsiteContent && !specificLead) {
                return {
                    ...lead,
                    insights: scrapePosts ? ["No recent activity found on LinkedIn."] : [],
                    websiteContent: scrapeWebsite ? ["No website content found or scraped."] : []
                };
            }

            const prompt = `
                Analyze the following LinkedIn information for ${lead.fullName} (${lead.position} at ${lead.orgName}).
                
                LINKEDIN DATA:
                ${recentPosts ? `Recent Posts/Activity: "${recentPosts.substring(0, 3000)}"` : 'No recent LinkedIn activity found.'}
                
                STRICT IDENTITY GUARDIAN:
                1. Target Person: You are analyzing content for ${lead.fullName}. Use THIS name only.
                2. Identity Lock: If the scraped content contains a DIFFERENT name (e.g., Soorat Singh, Paola Rizzi, etc.), you MUST IGNORE those names. Do NOT let them change your belief about who ${lead.fullName} is.
                3. Gender Control: Use correct gender pronouns (He/She) ONLY if you are 100% certain they belong to ${lead.fullName}. If the content belongs to someone else or gender is unclear, use gender-neutral language (They/Them) or simply repeat the name ${lead.fullName}.
                4. Focus: Only attribute achievements or facts to ${lead.fullName} that seem directly relevant to their profile.

                LinkedIn Insights: Focus on their personal activity, interests, achievements, or professional focus. Mention ${lead.fullName} by name.
                Professional Focus: Identify what topics ${lead.fullName} talks about most or what their current priorities seem to be.

                Goal: Provide tactical talking points for a highly personalized professional outreach email.
                Tone: Professional and factual.
                Output: Return ONLY a JSON object with this structure:
                {
                  "linkedin_insights": ["Insight 1", "Insight 2", ...],
                  "professional_focus": ["Focus 1", "Focus 2", ...]
                }
            `;

            let insights = scrapePosts ? ["No recent activity found on LinkedIn."] : [];
            let websiteInsights = scrapeWebsite ? ["No website content found or scraped."] : [];

            const kbContent = getSystemInstructions();

            try {
                const response = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: `You are a lead enrichment assistant. Extract factual professional insights. 
                            Strictly follow the business strategy and focus rules provided in the KNOWLEDGE BASE below.
                            
                            ${kbContent}`
                        },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: deepAnalysis ? 1500 : 800,
                    temperature: 0.3,
                    response_format: { type: "json_object" }
                });

                const content = response.choices[0]?.message?.content || "{}";
                try {
                    const parsed = JSON.parse(content);
                    if (parsed.linkedin_insights && Array.isArray(parsed.linkedin_insights)) {
                        insights = parsed.linkedin_insights;
                    }
                    if (parsed.professional_focus && Array.isArray(parsed.professional_focus)) {
                        websiteInsights = parsed.professional_focus; // Re-using existing field name to avoid UI breaks
                    }
                } catch (pe) {
                    console.error('Failed to parse insights JSON:', pe);
                }
            } catch (err: any) {
                console.error(`Groq AI failed for ${lead.fullName}:`, err.message || err);
            }

            return {
                ...lead,
                insights: insights.length > 0 ? insights : (scrapePosts ? ["No recent activity found on LinkedIn."] : []),
                websiteContent: websiteInsights.length > 0 ? websiteInsights : (scrapeWebsite ? ["No website content found or scraped."] : [])
            };
        });

        const processedLeads = await Promise.all(personalizationPromises);

        // Final trim to ensure we return exactly what was requested
        const leadsToReturn = processedLeads.slice(0, maxResults || 10);

        return NextResponse.json(leadsToReturn);

    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
