const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)/);
  if (match) env[match[1]] = match[2].trim();
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function getLogs() {
  const { data, error } = await supabase.from('campaign_activity')
    .select('*')
    .eq('node_id', 'visit')
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log(error || JSON.stringify(data, null, 2));
}
getLogs();
