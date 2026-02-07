import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { FormValues, SearchFilters } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function buildApifyInput(values: FormValues): Record<string, unknown> {
  const input: Record<string, unknown> = {};

  if (values.industries.length > 0) {
    input.companyIndustryIncludes = values.industries;
  }

  if (values.location.trim()) {
    input.companyLocationCityIncludes = values.location
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (values.jobTitles.length > 0) {
    input.personTitleIncludes = values.jobTitles;
  }

  if (values.companyKeywords.trim()) {
    input.companyKeywordIncludes = values.companyKeywords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (values.companySizes.length > 0) {
    input.companyEmployeeSizeIncludes = values.companySizes;
  }

  if (values.emailStatus && values.emailStatus !== "all") {
    input.contactEmailStatus = values.emailStatus;
  }

  if (values.hasEmail) {
    input.hasEmail = true;
  }

  if (values.hasPhone) {
    input.hasPhone = true;
  }

  input.totalResults = values.maxResults || 10;

  return input;
}

interface ApifyLeadItem {
  fullName?: string;
  email?: string;
  emailStatus?: string;
  position?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  linkedinUrl?: string;
  seniority?: string;
  functional?: string;
  orgName?: string;
  orgWebsite?: string;
  orgSize?: string;
  orgIndustry?: string;
  orgCity?: string;
  orgState?: string;
  orgCountry?: string;
}

interface ApifyPostItem {
  text?: string;
  postText?: string;
  postContent?: string;
  postedDate?: string;
  postDate?: string;
  postUrl?: string;
  url?: string;
  authorProfileUrl?: string;
  profileUrl?: string;
  authorUrl?: string;
}

export async function POST(request: Request) {
  let searchId: string | null = null;

  try {
    const body = await request.json();
    const values: FormValues = body;

    const apifyToken = process.env.APIFY_API_TOKEN;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!apifyToken) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN is not configured" },
        { status: 500 }
      );
    }

    if (!anthropicKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const filters: SearchFilters = {
      companyIndustryIncludes: values.industries,
      companyLocationCityIncludes: values.location
        ? values.location.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      personTitleIncludes: values.jobTitles,
      companyKeywordIncludes: values.companyKeywords
        ? values.companyKeywords.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      companyEmployeeSizeIncludes: values.companySizes,
      contactEmailStatus:
        values.emailStatus !== "all" ? values.emailStatus : undefined,
      hasEmail: values.hasEmail,
      hasPhone: values.hasPhone,
      totalResults: values.maxResults,
    };

    const { data: searchRecord, error: searchInsertError } = await supabase
      .from("searches")
      .insert({ filters, status: "running" })
      .select("id")
      .maybeSingle();

    if (searchInsertError || !searchRecord) {
      return NextResponse.json(
        { error: "Failed to create search record" },
        { status: 500 }
      );
    }

    searchId = searchRecord.id;

    // --- STEP A: Lead Scraper ---
    const apifyClient = new ApifyClient({ token: apifyToken });
    const apifyInput = buildApifyInput(values);

    const run = await apifyClient
      .actor("pipelinelabs/lead-scraper-apollo-zoominfo-lusha-ppe")
      .call(apifyInput, { waitSecs: 300 });

    const { items: rawLeads } = await apifyClient
      .dataset(run.defaultDatasetId)
      .listItems();

    if (!rawLeads || rawLeads.length === 0) {
      await supabase
        .from("searches")
        .update({
          status: "completed",
          total_leads: 0,
          completed_at: new Date().toISOString(),
        })
        .eq("id", searchId);

      return NextResponse.json({
        searchId,
        status: "completed",
        summary: {
          totalLeads: 0,
          leadsWithLinkedIn: 0,
          leadsWithEmail: 0,
          leadsWithPhone: 0,
        },
        leads: [],
      });
    }

    // --- STEP B: Filter for LinkedIn ---
    const leadsToInsert = (rawLeads as ApifyLeadItem[]).map((item) => {
      const linkedinUrl = item.linkedinUrl?.trim() || "";
      const hasLinkedin =
        linkedinUrl.length > 0 && linkedinUrl.includes("linkedin.com");

      return {
        search_id: searchId!,
        full_name: item.fullName || "",
        email: item.email || "",
        email_status: item.emailStatus || "",
        position: item.position || "",
        phone: item.phone || "",
        city: item.city || "",
        state: item.state || "",
        country: item.country || "",
        linkedin_url: linkedinUrl,
        seniority: item.seniority || "",
        functional: item.functional || "",
        org_name: item.orgName || "",
        org_website: item.orgWebsite || "",
        org_size: item.orgSize || "",
        org_industry: item.orgIndustry || "",
        org_city: item.orgCity || "",
        org_state: item.orgState || "",
        org_country: item.orgCountry || "",
        has_linkedin: hasLinkedin,
      };
    });

    const { data: insertedLeads, error: leadsError } = await supabase
      .from("leads")
      .insert(leadsToInsert)
      .select("id, linkedin_url, has_linkedin, full_name, position, org_name");

    if (leadsError || !insertedLeads) {
      await supabase
        .from("searches")
        .update({ status: "failed", error_message: "Failed to save leads" })
        .eq("id", searchId);

      return NextResponse.json(
        { error: "Failed to save leads to database" },
        { status: 500 }
      );
    }

    const linkedinLeads = insertedLeads.filter((l) => l.has_linkedin);
    const leadsWithEmail = leadsToInsert.filter((l) => l.email).length;
    const leadsWithPhone = leadsToInsert.filter((l) => l.phone).length;

    // --- STEP C: LinkedIn Post Scraper ---
    const postsByLinkedinUrl: Record<string, { content: string; date: string; url: string }[]> = {};

    if (linkedinLeads.length > 0) {
      try {
        const linkedinUrls = linkedinLeads.map((l) => l.linkedin_url);

        const postRun = await apifyClient
          .actor("supreme_coder/linkedin-post")
          .call(
            {
              urls: linkedinUrls,
              limitPerSource: 3,
              deepScrape: true,
              rawData: false,
            },
            { waitSecs: 300 }
          );

        const { items: postItems } = await apifyClient
          .dataset(postRun.defaultDatasetId)
          .listItems();

        if (postItems && postItems.length > 0) {
          const postsToInsert: {
            lead_id: string;
            post_content: string;
            post_date: string;
            post_url: string;
          }[] = [];

          for (const post of postItems as ApifyPostItem[]) {
            const postContent = post.text || post.postText || post.postContent || "";
            const postDate = post.postedDate || post.postDate || "";
            const postUrl = post.postUrl || post.url || "";
            const profileUrl = post.authorProfileUrl || post.profileUrl || post.authorUrl || "";

            const matchedLead = linkedinLeads.find((l) => {
              const leadUrl = l.linkedin_url.toLowerCase().replace(/\/+$/, "");
              const authorUrl = profileUrl.toLowerCase().replace(/\/+$/, "");
              return authorUrl.includes(leadUrl.split("/").pop() || "___nomatch___");
            });

            if (matchedLead && postContent) {
              postsToInsert.push({
                lead_id: matchedLead.id,
                post_content: postContent,
                post_date: postDate,
                post_url: postUrl,
              });

              if (!postsByLinkedinUrl[matchedLead.id]) {
                postsByLinkedinUrl[matchedLead.id] = [];
              }
              postsByLinkedinUrl[matchedLead.id].push({
                content: postContent,
                date: postDate,
                url: postUrl,
              });
            }
          }

          if (postsToInsert.length > 0) {
            await supabase.from("linkedin_posts").insert(postsToInsert);
          }
        }
      } catch {
        // Graceful failure: LinkedIn post scraping failed, continue without posts
      }
    }

    // --- STEP D: AI Email Personalization ---
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const emailsToInsert: { lead_id: string; email_body: string }[] = [];

    const allLeads = insertedLeads;
    const batchSize = 5;

    for (let i = 0; i < allLeads.length; i += batchSize) {
      const batch = allLeads.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (lead) => {
          const posts = postsByLinkedinUrl[lead.id] || [];
          const postContext =
            posts.length > 0
              ? `\n\nRecent LinkedIn Posts:\n${posts
                  .map((p, idx) => `Post ${idx + 1}: "${p.content.slice(0, 500)}"`)
                  .join("\n")}`
              : "";

          const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 500,
            system:
              "You are a sales expert who writes short, personalized, conversational cold emails. Write a brief email (3-5 sentences max) that feels genuine and references specifics about the person. Do not include subject lines, greetings like 'Dear', or sign-offs. Just write the email body.",
            messages: [
              {
                role: "user",
                content: `Write a personalized cold email for:\n- Name: ${lead.full_name}\n- Company: ${lead.org_name}\n- Title: ${lead.position}${postContext}\n\nMake it feel natural and reference their specific role or recent activity.`,
              },
            ],
          });

          const emailBody =
            msg.content[0].type === "text" ? msg.content[0].text : "";

          return { lead_id: lead.id, email_body: emailBody };
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value.email_body) {
          emailsToInsert.push(result.value);
        }
      }
    }

    if (emailsToInsert.length > 0) {
      await supabase.from("generated_emails").insert(emailsToInsert);
    }

    // --- Update search record ---
    await supabase
      .from("searches")
      .update({
        status: "completed",
        total_leads: leadsToInsert.length,
        leads_with_linkedin: linkedinLeads.length,
        leads_with_email: leadsWithEmail,
        leads_with_phone: leadsWithPhone,
        completed_at: new Date().toISOString(),
      })
      .eq("id", searchId);

    // --- Fetch complete data ---
    const { data: finalLeads } = await supabase
      .from("leads")
      .select(
        `*, linkedin_posts(*), generated_emails(*)`
      )
      .eq("search_id", searchId);

    const formattedLeads = (finalLeads || []).map((lead) => ({
      ...lead,
      linkedin_posts: lead.linkedin_posts || [],
      generated_email: lead.generated_emails?.[0] || null,
    }));

    return NextResponse.json({
      searchId,
      status: "completed",
      summary: {
        totalLeads: leadsToInsert.length,
        leadsWithLinkedIn: linkedinLeads.length,
        leadsWithEmail,
        leadsWithPhone,
      },
      leads: formattedLeads,
    });
  } catch (error) {
    if (searchId) {
      await supabase
        .from("searches")
        .update({
          status: "failed",
          error_message:
            error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", searchId);
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Pipeline failed",
        searchId,
      },
      { status: 500 }
    );
  }
}
