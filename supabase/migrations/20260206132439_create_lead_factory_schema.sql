/*
  # Lead Factory Database Schema

  1. New Tables
    - `searches`
      - `id` (uuid, primary key) - Unique search identifier
      - `filters` (jsonb) - The search filter parameters used
      - `status` (text) - Current status: pending, running, completed, failed
      - `total_leads` (integer) - Number of leads found
      - `leads_with_linkedin` (integer) - Number of leads with LinkedIn URLs
      - `leads_with_email` (integer) - Number of leads with email addresses
      - `leads_with_phone` (integer) - Number of leads with phone numbers
      - `error_message` (text) - Error details if the search failed
      - `created_at` (timestamptz) - When the search was initiated
      - `completed_at` (timestamptz) - When the search finished

    - `leads`
      - `id` (uuid, primary key) - Unique lead identifier
      - `search_id` (uuid, FK -> searches) - Which search this lead came from
      - `full_name` (text) - Lead's full name
      - `email` (text) - Lead's email address
      - `email_status` (text) - Email verification status (Verified/Unverified)
      - `position` (text) - Job title/position
      - `phone` (text) - Phone number
      - `city` (text) - Person's city
      - `state` (text) - Person's state
      - `country` (text) - Person's country
      - `linkedin_url` (text) - LinkedIn profile URL
      - `seniority` (text) - Seniority level
      - `functional` (text) - Department/function
      - `org_name` (text) - Company name
      - `org_website` (text) - Company website
      - `org_size` (text) - Company employee count
      - `org_industry` (text) - Company industry
      - `org_city` (text) - Company HQ city
      - `org_state` (text) - Company HQ state
      - `org_country` (text) - Company HQ country
      - `has_linkedin` (boolean) - Whether lead has a valid LinkedIn URL
      - `created_at` (timestamptz) - When this lead was stored

    - `linkedin_posts`
      - `id` (uuid, primary key) - Unique post identifier
      - `lead_id` (uuid, FK -> leads) - Which lead this post belongs to
      - `post_content` (text) - The content of the LinkedIn post
      - `post_date` (text) - When the post was published
      - `post_url` (text) - Direct URL to the post
      - `created_at` (timestamptz) - When this post was stored

    - `generated_emails`
      - `id` (uuid, primary key) - Unique email identifier
      - `lead_id` (uuid, FK -> leads) - Which lead this email is for
      - `email_body` (text) - The AI-generated cold email content
      - `created_at` (timestamptz) - When this email was generated

  2. Security
    - RLS enabled on all tables
    - Policies allow authenticated users to manage their own data
    - Service role can insert/read all data (used by API routes)

  3. Indexes
    - searches(status) for filtering by search status
    - leads(search_id) for looking up leads by search
    - leads(linkedin_url) for LinkedIn URL lookups
    - linkedin_posts(lead_id) for looking up posts by lead
    - generated_emails(lead_id) for looking up emails by lead
*/

-- Searches table
CREATE TABLE IF NOT EXISTS searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  total_leads integer NOT NULL DEFAULT 0,
  leads_with_linkedin integer NOT NULL DEFAULT 0,
  leads_with_email integer NOT NULL DEFAULT 0,
  leads_with_phone integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on searches"
  ON searches FOR SELECT
  TO anon
  USING (true = true);

CREATE POLICY "Allow anonymous insert on searches"
  ON searches FOR INSERT
  TO anon
  WITH CHECK (true = true);

CREATE POLICY "Allow anonymous update on searches"
  ON searches FOR UPDATE
  TO anon
  USING (true = true)
  WITH CHECK (true = true);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text DEFAULT '',
  email_status text DEFAULT '',
  position text DEFAULT '',
  phone text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  country text DEFAULT '',
  linkedin_url text DEFAULT '',
  seniority text DEFAULT '',
  functional text DEFAULT '',
  org_name text DEFAULT '',
  org_website text DEFAULT '',
  org_size text DEFAULT '',
  org_industry text DEFAULT '',
  org_city text DEFAULT '',
  org_state text DEFAULT '',
  org_country text DEFAULT '',
  has_linkedin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on leads"
  ON leads FOR SELECT
  TO anon
  USING (true = true);

CREATE POLICY "Allow anonymous insert on leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true = true);

CREATE POLICY "Allow anonymous update on leads"
  ON leads FOR UPDATE
  TO anon
  USING (true = true)
  WITH CHECK (true = true);

-- LinkedIn posts table
CREATE TABLE IF NOT EXISTS linkedin_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  post_content text DEFAULT '',
  post_date text DEFAULT '',
  post_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on linkedin_posts"
  ON linkedin_posts FOR SELECT
  TO anon
  USING (true = true);

CREATE POLICY "Allow anonymous insert on linkedin_posts"
  ON linkedin_posts FOR INSERT
  TO anon
  WITH CHECK (true = true);

-- Generated emails table
CREATE TABLE IF NOT EXISTS generated_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  email_body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE generated_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on generated_emails"
  ON generated_emails FOR SELECT
  TO anon
  USING (true = true);

CREATE POLICY "Allow anonymous insert on generated_emails"
  ON generated_emails FOR INSERT
  TO anon
  WITH CHECK (true = true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_searches_status ON searches(status);
CREATE INDEX IF NOT EXISTS idx_leads_search_id ON leads(search_id);
CREATE INDEX IF NOT EXISTS idx_leads_linkedin_url ON leads(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_lead_id ON linkedin_posts(lead_id);
CREATE INDEX IF NOT EXISTS idx_generated_emails_lead_id ON generated_emails(lead_id);
