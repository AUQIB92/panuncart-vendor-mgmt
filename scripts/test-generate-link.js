require("dotenv").config({ path: ".env" })
const { createClient } = require("@supabase/supabase-js")
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function getUsers() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) {
    console.error(error)
    return
  }
  
  const user = data.users[0]
  if (!user) {
    console.log("No users found")
    return
  }
  
  let out = "Using user email: " + user.email + "\n";
  
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: user.email,
    options: {
      redirectTo: "http://localhost:3000/auth/reset-password"
    }
  })

  if (linkError) {
    out += "Failed to generate link: " + linkError + "\n";
  } else {
    out += "Generated Link: " + linkData.properties.action_link + "\n";
    const url = new URL(linkData.properties.action_link)
    out += "SearchParams: " + url.search + "\n";
    out += "Hash: " + url.hash + "\n";
  }
  fs.writeFileSync('output2.txt', out);
}

getUsers().catch(console.error)
