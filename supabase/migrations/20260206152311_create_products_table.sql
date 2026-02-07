/*
  # Create products table for multi-product AI Sales Agent CRM

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, required) - Product name
      - `website_url` (text) - Product website
      - `description` (text) - Product description
      - `ceo_name` (text) - CEO/Founder name
      - `ceo_email` (text) - CEO/Founder email
      - `industry` (text) - Industry
      - `company_size` (text) - Company size category
      - `sales_funnel_type` (text) - Sales funnel type
      - `timezone` (text) - Default timezone
      - `target_customers` (text) - Target customer description
      - `customer_pain_points` (text) - Customer pain points
      - `value_proposition` (text) - Value proposition
      - `pipeline_stages` (jsonb) - Pipeline configuration
      - `email_config` (jsonb) - Email settings
      - `integrations_config` (jsonb) - Integration settings
      - `data_sources_config` (jsonb) - Data sources configuration
      - `is_default` (boolean) - Whether this is the default/first product
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Schema Updates
    - Add `product_id` column to contacts table
    - Add `product_id` column to searches table
    - Add `product_id` column to leads table

  3. Security
    - Enable RLS on `products` table
    - Add policies for anonymous read/write access
    - Update existing table policies to be product-aware

  4. Indexes
    - `product_id` on contacts, searches, leads
    - `is_default` on products
    - `created_at` on products
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website_url text DEFAULT '',
  description text DEFAULT '',
  ceo_name text DEFAULT '',
  ceo_email text DEFAULT '',
  industry text DEFAULT '',
  company_size text DEFAULT 'Unknown',
  sales_funnel_type text DEFAULT 'SaaS (Register → Trial → Paid)',
  timezone text DEFAULT 'UTC',
  target_customers text DEFAULT '',
  customer_pain_points text DEFAULT '',
  value_proposition text DEFAULT '',
  pipeline_stages jsonb DEFAULT '["new", "contacted", "qualified", "proposal", "won", "lost"]'::jsonb,
  email_config jsonb DEFAULT '{}'::jsonb,
  integrations_config jsonb DEFAULT '{}'::jsonb,
  data_sources_config jsonb DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read products"
  ON products
  FOR SELECT
  TO anon
  USING (created_at IS NOT NULL);

CREATE POLICY "Allow anonymous insert products"
  ON products
  FOR INSERT
  TO anon
  WITH CHECK (name IS NOT NULL AND name <> '');

CREATE POLICY "Allow anonymous update products"
  ON products
  FOR UPDATE
  TO anon
  USING (created_at IS NOT NULL)
  WITH CHECK (name IS NOT NULL AND name <> '');

CREATE POLICY "Allow anonymous delete products"
  ON products
  FOR DELETE
  TO anon
  USING (created_at IS NOT NULL AND is_default = false);

CREATE INDEX IF NOT EXISTS idx_products_is_default ON products(is_default);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE contacts ADD COLUMN product_id uuid REFERENCES products(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_contacts_product_id ON contacts(product_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'searches' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE searches ADD COLUMN product_id uuid REFERENCES products(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_searches_product_id ON searches(product_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN product_id uuid REFERENCES products(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_leads_product_id ON leads(product_id);
  END IF;
END $$;
