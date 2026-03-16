require("dotenv").config({ path: ".env" })
const { createClient } = require("@supabase/supabase-js")

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testForgotPassword() {
  console.log("=== Testing Forgot Password Flow ===")
  const testEmail = "testvendor@example.com" // Update with a known user email if this fails due to no-user policy
  const redirectTo = "http://localhost:3000/auth/reset-password"

  console.log(`Sending reset password email to: ${testEmail}`)
  console.log(`Redirecting to: ${redirectTo}`)
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo,
    })

    if (error) {
      console.error("❌ Failed to send reset password email:", error.message)
      if (error.status === 429) {
         console.warn("Rate limit exceeded. Try again later.")
      }
      return
    }

    console.log("✅ Successfully sent reset password email request to Supabase.")
    console.log("Check the inbox of the provided email to verify the link works.")
    
  } catch (err) {
    console.error("❌ Unexpected error:", err)
  }
}

testForgotPassword()
