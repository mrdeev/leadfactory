/*
  # Add Setup Wizard Tracking to Products

  1. Changes
    - Add `wizard_completed` boolean column to products table to track if setup wizard is complete
    - Add `wizard_data` jsonb column to store wizard configuration data
    - Set default value for wizard_completed to false for new products
  
  2. Notes
    - Existing products will have wizard_completed set to true (assumed already configured)
    - wizard_data will store the complete wizard configuration for reference
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'wizard_completed'
  ) THEN
    ALTER TABLE products ADD COLUMN wizard_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'wizard_data'
  ) THEN
    ALTER TABLE products ADD COLUMN wizard_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Set existing products as wizard completed
UPDATE products SET wizard_completed = true WHERE wizard_completed IS NULL;