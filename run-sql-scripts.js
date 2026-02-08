const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSqlScript(filePath) {
  try {
    console.log(`Running ${filePath}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the entire SQL file as one statement
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      // If rpc doesn't exist, try executing raw SQL
      console.log('RPC method not available, trying alternative approach...');
      // We'll need to use the REST API or psql for this
      console.log('Please run the following SQL manually in your Supabase SQL editor:');
      console.log('=== CONTENTS OF ' + filePath + ' ===');
      console.log(sql);
      console.log('====================================');
      return;
    }
    
    console.log(`✓ Completed ${filePath}\n`);
  } catch (error) {
    console.error(`✗ Error running ${filePath}:`, error.message);
    console.log('Please run the SQL manually in your Supabase SQL editor.');
  }
}

async function main() {
  console.log('Setting up database functions...\n');
  
  const scripts = [
    'scripts/003_admin_rpc_functions.sql',
    'scripts/004_vendor_rpc_functions.sql'
  ];
  
  for (const script of scripts) {
    await runSqlScript(script);
  }
  
  console.log('\n=== MANUAL SETUP REQUIRED ===');
  console.log('Please copy and paste the SQL from the files above into your Supabase SQL editor:');
  console.log('1. Go to https://supabase.com/dashboard/project/lfxflgsollvkykpiijtl/sql');
  console.log('2. Paste the contents of scripts/003_admin_rpc_functions.sql');
  console.log('3. Paste the contents of scripts/004_vendor_rpc_functions.sql');
  console.log('===============================\n');
}

main();
