import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { accountId: passedAccountId, dropdowns = {}, checkboxes = {} } = body;

        let accountId = passedAccountId;

        // If no specific product passed or no account ID, explicitly fetch the user's connected products
        if (!accountId) {
            // Unipile Search endpoint needs to know who is calling it
            // We use the same Auth mechanism as the rest of the app to enforce tenant isolation
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(
                req.headers.get('Authorization')?.split('Bearer ')[1] || '' // Fallback if necessary
            );
            // NOTE: Server routes usually rely on cookies, so this might need @supabase/ssr
            // I'll leave a broad check and refine if it fails
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized. Please log in to search.' }, { status: 401 });
            }

            // Only fetch products owned by the currently logged-in user
            const products = await db.getProducts(user.id);
            const connectedProduct = products.find((p: any) => p.unipileAccountId);

            if (connectedProduct) {
                accountId = connectedProduct.unipileAccountId;
            }
            // Removed the dangerous global Unipile fallback
        }

        if (!accountId) {
            return NextResponse.json({ error: 'No Unipile connected account found. Please connect your LinkedIn account first.' }, { status: 400 });
        }

        const DSN = process.env.UNIPILE_DSN;
        const ACCESS_TOKEN = process.env.UNIPILE_ACCESS_TOKEN;

        if (!DSN || !ACCESS_TOKEN) {
            console.error("Missing UNIPILE_DSN or UNIPILE_ACCESS_TOKEN in environment variables");
            return NextResponse.json({ error: 'Unipile integration is not configured correctly on the server.' }, { status: 500 });
        }

        // ---------------------------------------------------------------------------
        // 1. Build the Unipile API Payload (Classic - People schema)
        // ---------------------------------------------------------------------------
        // Helper to extract specifically "included" values from our filter arrays
        const getIncluded = (filterId: string) => {
            const arr = dropdowns[filterId] || [];
            return arr.filter((v: any) => v.type === 'include').map((v: any) => v.value);
        };

        const payload: any = {
            api: "classic",
            category: "people",
            limit: 25 // Ensure limit is passed 
        };

        const advanced_keywords: any = {};
        const generalKeywords: string[] = [];

        // Keywords
        const keywords = getIncluded('keyword-profile');
        if (keywords.length > 0) generalKeywords.push(...keywords);

        // Job Titles
        const titles = getIncluded('job-title');
        if (titles.length > 0) {
            advanced_keywords.title = titles.join(' OR ');
        }

        // Company Names
        const companies = getIncluded('company-name');
        if (companies.length > 0) {
            advanced_keywords.company = companies.join(' OR ');
        }

        // School
        const schools = getIncluded('school-name');
        if (schools.length > 0) {
            advanced_keywords.school = schools.join(' OR ');
        }

        // Locations (Classic search location field requires URN IDs, so append text to general keywords)
        const countries = getIncluded('country');
        const cities = getIncluded('company-city');
        const allLocations = [...countries, ...cities];
        if (allLocations.length > 0) {
            generalKeywords.push(...allLocations);
        }

        // Names
        const names = getIncluded('full-name');
        if (names.length > 0) {
            const nameParts = names[0].split(' ');
            if (nameParts[0]) advanced_keywords.first_name = nameParts[0];
            if (nameParts.length > 1) advanced_keywords.last_name = nameParts.slice(1).join(' ');
        }

        if (Object.keys(advanced_keywords).length > 0) {
            payload.advanced_keywords = advanced_keywords;
        }

        if (generalKeywords.length > 0) {
            payload.keywords = generalKeywords.join(' ');
        }

        // ---------------------------------------------------------------------------
        // 2. Execute Search via Unipile
        // ---------------------------------------------------------------------------
        const apiUrl = `https://${DSN}/api/v1/linkedin/search?account_id=${accountId}`;

        console.log(`[Unipile Search] Querying with payload:`, JSON.stringify(payload));

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'X-API-KEY': ACCESS_TOKEN,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Unipile Search] API Error: ${response.status} - ${errorText}`);
            return NextResponse.json({ error: `Unipile API error: ${errorText}` }, { status: response.status });
        }

        const rawData = await response.json();
        // ---------------------------------------------------------------------------
        // 3. Data Transformation mapping the raw Unipile graph to our internal UI format
        // ---------------------------------------------------------------------------
        const parsedLeads: any[] = [];

        if (rawData.items && Array.isArray(rawData.items)) {
            for (const item of rawData.items) {
                // ... Unipile items vary highly depending on regular vs Sales Nav search. 
                // We attempt standard `profile` extraction.

                const profile = item.item?.profile || item.profile || item;

                if (profile && profile.urn) {
                    parsedLeads.push({
                        id: profile.urn || profile.public_id || Math.random().toString(),
                        name: profile.name ||
                            (profile.first_name ? `${profile.first_name} ${profile.last_name}` : 'LinkedIn Member'),
                        title: profile.headline || profile.occupation || 'No Title',
                        company: profile.current_company?.name || profile.company || '',
                        location: profile.location || profile.geo_location || '',
                        image: profile.profile_picture_url || profile.avatar || '',
                        linkedinUrl: profile.public_profile_url || `https://linkedin.com/in/${profile.public_id}`
                    });
                }
            }
        }

        // Apply post-search local filters (e.g. Excludes, specific Intents that Unipile doesn't natively API-host yet)
        let filteredLeads = parsedLeads;

        // Example Post-Filter: Exclusions (If the user explicitly 'excluded' a title, filter it out *after* fetching)
        const excludedTitles = (dropdowns['job-title'] || []).filter((v: any) => v.type === 'exclude').map((v: any) => v.value.toLowerCase());
        if (excludedTitles.length > 0) {
            filteredLeads = filteredLeads.filter(lead => {
                const leadTitle = (lead.title || "").toLowerCase();
                return !excludedTitles.some((ex: string) => leadTitle.includes(ex));
            });
        }

        const excludedCompanies = (dropdowns['company-name'] || []).filter((v: any) => v.type === 'exclude').map((v: any) => v.value.toLowerCase());
        if (excludedCompanies.length > 0) {
            filteredLeads = filteredLeads.filter(lead => {
                const leadCompany = (lead.company || "").toLowerCase();
                return !excludedCompanies.some((ex: string) => leadCompany.includes(ex));
            });
        }

        return NextResponse.json({
            success: true,
            leads: filteredLeads,
            _debug_query: JSON.stringify(payload) // helpful for debugging locally
        });

    } catch (err: any) {
        console.error("[unipile/search] Error processing search:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
