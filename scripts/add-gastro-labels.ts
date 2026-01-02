/**
 * Add new gastronomy labeling columns to services table
 *
 * Run with: npx tsx scripts/add-gastro-labels.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const envVars: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addGastroLabels() {
  console.log('🍽️  Adding new gastronomy labeling columns to services table...\n')

  // Add new columns using raw SQL
  const { error } = await supabase.rpc('exec_sql', {
    query: `
      -- Add diet_labels column (array of diet/nutrition labels)
      ALTER TABLE services ADD COLUMN IF NOT EXISTS diet_labels TEXT[] DEFAULT NULL;

      -- Add other_labels column (array of other labels like alcohol, caffeine, additives)
      ALTER TABLE services ADD COLUMN IF NOT EXISTS other_labels TEXT[] DEFAULT NULL;

      -- Add cross_contamination column (array of cross-contamination warnings)
      ALTER TABLE services ADD COLUMN IF NOT EXISTS cross_contamination TEXT[] DEFAULT NULL;

      -- Add comments for documentation
      COMMENT ON COLUMN services.diet_labels IS 'Diet/nutrition labels: vegetarian, vegan, pescatarian, flexitarian, halal, kosher, lactose_free, gluten_free, sugar_free, low_carb, keto, paleo';
      COMMENT ON COLUMN services.other_labels IS 'Other labels: spicy, alcohol, caffeine, additives, colorants, preservatives, flavor_enhancers, blackened, waxed, phosphate, sweeteners';
      COMMENT ON COLUMN services.cross_contamination IS 'Cross-contamination warnings: traces_possible, no_separate_prep';
    `
  })

  if (error) {
    // Try alternative approach - direct SQL via REST API
    console.log('ℹ️  exec_sql not available, columns may already exist or need manual creation')
    console.log('   Run the following SQL in Supabase Dashboard:\n')
    console.log(`
-- Add new gastronomy labeling columns
ALTER TABLE services ADD COLUMN IF NOT EXISTS diet_labels TEXT[] DEFAULT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS other_labels TEXT[] DEFAULT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cross_contamination TEXT[] DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN services.diet_labels IS 'Diet/nutrition labels: vegetarian, vegan, pescatarian, flexitarian, halal, kosher, lactose_free, gluten_free, sugar_free, low_carb, keto, paleo';
COMMENT ON COLUMN services.other_labels IS 'Other labels: spicy, alcohol, caffeine, additives, colorants, preservatives, flavor_enhancers, blackened, waxed, phosphate, sweeteners';
COMMENT ON COLUMN services.cross_contamination IS 'Cross-contamination warnings: traces_possible, no_separate_prep';
    `)
  } else {
    console.log('✅ Columns added successfully!')
  }

  console.log('\n✨ Done!')
}

addGastroLabels().catch(console.error)
