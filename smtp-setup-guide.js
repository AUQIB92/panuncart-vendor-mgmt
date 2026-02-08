/**
 * SMTP Setup Guide for Supabase
 * Helps configure custom email providers
 */

console.log('📧 SMTP SETUP GUIDE FOR SUPABASE');
console.log('==================================\n');

console.log('Choose your email provider:\n');

console.log('1. GMAIL (Free, Easy Setup)');
console.log('   Pros: Free, reliable, easy to set up');
console.log('   Cons: Daily sending limits, may go to spam');
console.log('   Setup:');
console.log('     - Enable 2-Factor Authentication');
console.log('     - Generate App Password: https://myaccount.google.com/apppasswords');
console.log('     - Use App Password as SMTP password (not your regular password)');
console.log('   Settings:');
console.log('     Host: smtp.gmail.com');
console.log('     Port: 587');
console.log('     Username: your-email@gmail.com');
console.log('     Password: [16-character App Password]');
console.log('     Encryption: STARTTLS\n');

console.log('2. SENDGRID (Recommended for Production)');
console.log('   Pros: High deliverability, analytics, scalable');
console.log('   Cons: Paid after free tier (100 emails/day free)');
console.log('   Setup:');
console.log('     - Sign up at https://sendgrid.com');
console.log('     - Create API Key in Settings > API Keys');
console.log('     - Verify sender identity');
console.log('   Settings:');
console.log('     Host: smtp.sendgrid.net');
console.log('     Port: 587');
console.log('     Username:apikey');
console.log('     Password: [Your SendGrid API Key]');
console.log('     Encryption: STARTTLS\n');

console.log('3. AMAZON SES (Cost-effective for high volume)');
console.log('   Pros: Very cheap, high deliverability, AWS integration');
console.log('   Cons: Requires AWS account, slight learning curve');
console.log('   Setup:');
console.log('     - Sign up for AWS SES');
console.log('     - Verify your domain or email');
console.log('     - Create SMTP credentials');
console.log('   Settings:');
console.log('     Host: email-smtp.[region].amazonaws.com');
console.log('     Port: 587');
console.log('     Username: [SES SMTP Username]');
console.log('     Password: [SES SMTP Password]');
console.log('     Encryption: STARTTLS\n');

console.log('4. MAILGUN (Developer-friendly)');
console.log('   Pros: Good API, analytics, sandbox for testing');
console.log('   Cons: Paid service, domain verification required');
console.log('   Setup:');
console.log('     - Sign up at https://www.mailgun.com');
console.log('     - Add and verify your domain');
console.log('     - Get SMTP credentials');
console.log('   Settings:');
console.log('     Host: smtp.mailgun.org');
console.log('     Port: 587');
console.log('     Username: [Your Mailgun SMTP Username]');
console.log('     Password: [Your Mailgun SMTP Password]');
console.log('     Encryption: STARTTLS\n');

console.log('🔧 SUPABASE CONFIGURATION STEPS:');
console.log('1. Go to Supabase Dashboard');
console.log('2. Navigate to: Authentication > Settings');
console.log('3. Scroll to "SMTP Settings"');
console.log('4. Toggle "Enable Custom SMTP" to ON');
console.log('5. Enter your provider settings above');
console.log('6. Click "Save"');
console.log('7. Test by registering a new account\n');

console.log('✅ BEST PRACTICES:');
console.log('- Use a dedicated "noreply@yourdomain.com" email');
console.log('- Set up proper DNS records (SPF, DKIM) for better deliverability');
console.log('- Monitor email analytics if your provider offers them');
console.log('- Start with SendGrid free tier for testing');
console.log('- Consider email templates with your brand styling\n');

console.log('🛡️ SECURITY NOTES:');
console.log('- Never commit SMTP passwords to version control');
console.log('- Use environment variables for credentials');
console.log('- Rotate API keys periodically');
console.log('- Monitor sending quotas and limits\n');

console.log('For immediate testing, Gmail with App Passwords is easiest.');
console.log('For production, SendGrid or Amazon SES are recommended.');
