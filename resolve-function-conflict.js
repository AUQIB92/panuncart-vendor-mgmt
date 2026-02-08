/**
 * Resolve Function Ambiguity
 * Fixes duplicate function definitions causing conflicts
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resolveFunctionConflict() {
  console.log('🔧 RESOLVING FUNCTION AMBIGUITY');
  console.log('===============================\n');
  
  // First, let's see what vendor status functions exist
  console.log('Checking existing vendor status functions...\n');
  
  // Test the API endpoint that's failing
  try {
    console.log('Testing vendor approval with sample data...');
    
    // Try to approve a vendor (this will trigger the conflicting function)
    const { data, error } = await supabase.rpc('admin_update_vendor_status', {
      vendor_id: '00000000-0000-0000-0000-000000000000', // dummy ID
      new_status: 'approved'
    });
    
    if (error) {
      console.log('❌ Function call failed:', error.message);
      console.log('   Error code:', error.code);
      
      if (error.message.includes('best candidate function')) {
        console.log('\n🔍 FUNCTION AMBIGUITY DETECTED');
        console.log('Two functions with same name but different parameters exist');
        await showResolutionSteps();
      }
    } else {
      console.log('✅ Function call succeeded');
    }
    
  } catch (error) {
    console.log('💥 Exception:', error.message);
  }
  
  // Check what functions exist by querying the database
  try {
    console.log('\nChecking pg_proc for function definitions...');
    
    const { data, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT proname, oidvectortypes(proargtypes) as arg_types
          FROM pg_proc 
          WHERE proname = 'admin_update_vendor_status'
        `
      });
    
    if (error) {
      console.log('Could not query function definitions directly');
    } else {
      console.log('Found function definitions:', data);
    }
  } catch (error) {
    console.log('Direct query failed:', error.message);
  }
}

async function showResolutionSteps() {
  console.log('\n🛠️  RESOLUTION STEPS');
  console.log('====================');
  
  console.log('\n1. DROP ALL VERSIONS OF THE FUNCTION:');
  console.log('   Run this in Supabase SQL Editor:');
  console.log('   DROP FUNCTION IF EXISTS public.admin_update_vendor_status(uuid, text);');
  console.log('   DROP FUNCTION IF EXISTS public.admin_update_vendor_status(uuid, text, text);');
  
  console.log('\n2. CREATE THE SINGLE CORRECT VERSION:');
  console.log('   CREATE OR REPLACE FUNCTION public.admin_update_vendor_status(');
  console.log('     vendor_id uuid,');
  console.log('     new_status text,');
  console.log('     notes text DEFAULT NULL');
  console.log('   )');
  console.log('   RETURNS void AS $$');
  console.log('   BEGIN');
  console.log('     UPDATE public.vendors');
  console.log('     SET status = new_status,');
  console.log('         updated_at = NOW()');
  console.log('     WHERE id = vendor_id;');
  console.log('   END;');
  console.log('   $$ LANGUAGE plpgsql SECURITY DEFINER;');
  
  console.log('\n3. ALTERNATIVELY, RUN THE COMPLETE FIX SCRIPT:');
  console.log('   File: scripts/009_resolve_function_conflict.sql');
  
  console.log('\nThis will eliminate the ambiguity and allow the API to work properly.');
}

resolveFunctionConflict();
