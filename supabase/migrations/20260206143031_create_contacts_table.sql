/*
  # Create contacts table

  1. New Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `full_name` (text, required) - Contact's full name
      - `email` (text) - Email address
      - `email_status` (text) - verified, unverified, etc.
      - `phone` (text) - Phone number
      - `position` (text) - Job title
      - `company` (text) - Company name
      - `industry` (text) - Company industry
      - `linkedin_url` (text) - LinkedIn profile URL
      - `city` (text) - Contact city
      - `state` (text) - Contact state
      - `country` (text) - Contact country
      - `stage` (text) - Pipeline stage: new, contacted, qualified, proposal, won, lost
      - `source` (text) - Where the contact came from: manual, search, import
      - `score` (integer) - Lead score 0-100
      - `tags` (text[]) - Array of tags
      - `notes` (text) - Free-form notes
      - `lead_id` (uuid) - Optional link to original lead record
      - `search_id` (uuid) - Optional link to source search
      - `created_at` (timestamptz) - When the contact was added

  2. Security
    - Enable RLS on `contacts` table
    - Add policies for anonymous read/write access (matching existing app pattern)

  3. Indexes
    - `stage` for filtering by pipeline stage
    - `source` for filtering by source
    - `created_at` for ordering
    - `full_name` for search
*/

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text DEFAULT '',
  email_status text DEFAULT '',
  phone text DEFAULT '',
  position text DEFAULT '',
  company text DEFAULT '',
  industry text DEFAULT '',
  linkedin_url text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  country text DEFAULT '',
  stage text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'manual',
  score integer NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  notes text DEFAULT '',
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  search_id uuid REFERENCES searches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read contacts"
  ON contacts
  FOR SELECT
  TO anon
  USING (created_at IS NOT NULL);

CREATE POLICY "Allow anonymous insert contacts"
  ON contacts
  FOR INSERT
  TO anon
  WITH CHECK (full_name IS NOT NULL AND full_name <> '');

CREATE POLICY "Allow anonymous update contacts"
  ON contacts
  FOR UPDATE
  TO anon
  USING (created_at IS NOT NULL)
  WITH CHECK (full_name IS NOT NULL AND full_name <> '');

CREATE POLICY "Allow anonymous delete contacts"
  ON contacts
  FOR DELETE
  TO anon
  USING (created_at IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_contacts_stage ON contacts(stage);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_full_name ON contacts(full_name);
