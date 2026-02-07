export interface SearchFilters {
  companyIndustryIncludes: string[];
  companyLocationCityIncludes: string[];
  personTitleIncludes: string[];
  companyKeywordIncludes: string[];
  companyEmployeeSizeIncludes: string[];
  contactEmailStatus?: string;
  hasEmail: boolean;
  hasPhone: boolean;
  totalResults: number;
}

export interface LeadResult {
  id: string;
  search_id: string;
  full_name: string;
  email: string;
  email_status: string;
  position: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  linkedin_url: string;
  seniority: string;
  functional: string;
  org_name: string;
  org_website: string;
  org_size: string;
  org_industry: string;
  org_city: string;
  org_state: string;
  org_country: string;
  has_linkedin: boolean;
  created_at: string;
  product_id: string | null;
  linkedin_posts?: LinkedInPost[];
  generated_email?: GeneratedEmail;
}

export interface LinkedInPost {
  id: string;
  lead_id: string;
  post_content: string;
  post_date: string;
  post_url: string;
  created_at: string;
}

export interface GeneratedEmail {
  id: string;
  lead_id: string;
  email_body: string;
  created_at: string;
}

export interface SearchRecord {
  id: string;
  filters: SearchFilters;
  status: "pending" | "running" | "completed" | "failed";
  total_leads: number;
  leads_with_linkedin: number;
  leads_with_email: number;
  leads_with_phone: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  product_id: string | null;
}

export interface PipelineResponse {
  searchId: string;
  status: "completed" | "failed";
  summary: {
    totalLeads: number;
    leadsWithLinkedIn: number;
    leadsWithEmail: number;
    leadsWithPhone: number;
  };
  leads: LeadResult[];
  error?: string;
}

export type PipelineStep = "scraping" | "filtering" | "posts" | "emails" | "done";

export interface FormValues {
  industries: string[];
  location: string;
  jobTitles: string[];
  companyKeywords: string;
  companySizes: string[];
  emailStatus: string;
  hasEmail: boolean;
  hasPhone: boolean;
  maxResults: number;
}

export type ContactStage = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

export interface Contact {
  id: string;
  full_name: string;
  email: string;
  email_status: string;
  phone: string;
  position: string;
  company: string;
  industry: string;
  linkedin_url: string;
  city: string;
  state: string;
  country: string;
  stage: ContactStage;
  source: string;
  score: number;
  tags: string[];
  notes: string;
  lead_id: string | null;
  search_id: string | null;
  product_id: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  website_url: string;
  description: string;
  ceo_name: string;
  ceo_email: string;
  industry: string;
  company_size: string;
  sales_funnel_type: string;
  timezone: string;
  target_customers: string;
  customer_pain_points: string;
  value_proposition: string;
  pipeline_stages: string[];
  email_config: Record<string, unknown>;
  integrations_config: Record<string, unknown>;
  data_sources_config: Record<string, unknown>;
  wizard_completed: boolean;
  wizard_data: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductSettingsTab = "general" | "pipeline" | "email" | "integrations" | "data-sources";
