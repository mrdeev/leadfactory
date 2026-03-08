import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('node_type', 'linkedin_visit')
    .order('timestamp', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching logs:', error);
  } else {
    console.log('Latest linkedin_visit activities:', JSON.stringify(data, null, 2));
  }
}

checkLogs();
