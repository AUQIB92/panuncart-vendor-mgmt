const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRpc() {
  console.log('Debugging RPC functions...\n');
  
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT proname 
        FROM pg_proc 
        WHERE proname IN (
          'admin_get_vendors',
          'admin_get_products',
          'get_my_vendor',
          'get_my_products'
        )
        ORDER BY proname
      `
    });
    
    console.log('Query result:', { data, error });
    
    if (error) {
      console.log('Error details:', error);
    } else {
      console.log('Found functions:', data.map(d => d.proname));
      console.log('Count:', data.length);
    }
    
  } catch (error) {
    console.log('Exception:', error);
  }
}

debugRpc();
