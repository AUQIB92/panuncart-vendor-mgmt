# Email Confirmation Troubleshooting Guide

## Common Issues & Solutions

### 1. No Email Received After Registration

**Problem**: Users register but don't receive confirmation emails.

**Solutions**:
1. **Check Supabase Dashboard Settings**:
   - Go to: https://supabase.com/dashboard/project/lfxflgsollvkykpiijtl/auth/settings
   - Ensure "Enable email signup" is ON
   - Check "Email Templates" for confirmation email template

2. **Check Environment Variables**:
   ```bash
   # Run this to verify your config
   node check-email-config.js
   ```

3. **Check Spam Folder**:
   - Emails might be filtered as spam
   - Add your domain to email whitelist

4. **Verify Redirect URLs**:
   - Ensure `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` is set correctly
   - Should point to `/auth/confirm` endpoint

### 2. Invalid Confirmation Link

**Problem**: Clicking confirmation link shows "Invalid or expired" error.

**Solutions**:
1. **Check Token Expiry**:
   - Default token expiry is 24 hours
   - Request new confirmation if expired

2. **Verify Redirect URL Configuration**:
   - Must match exactly what's configured in Supabase
   - Include full URL with protocol (http:// or https://)

3. **Check Network Issues**:
   - Ensure no proxy or firewall blocking
   - Test with different network if possible

### 3. Email Configuration in Supabase

**For Development (Local Testing)**:
- Supabase uses default email service
- Check Supabase Auth Settings → Email Templates
- Default template should work for testing

**For Production**:
1. **Set up Custom SMTP**:
   - Go to Supabase Dashboard → Auth → SMTP Settings
   - Configure with your email provider (SendGrid, AWS SES, etc.)
   - Example providers:
     - SendGrid: https://sendgrid.com/
     - AWS SES: https://aws.amazon.com/ses/
     - Mailgun: https://www.mailgun.com/

2. **Domain Verification**:
   - Add SPF and DKIM records to your DNS
   - This improves email deliverability

### 4. Testing Email Flow

**Manual Test Steps**:
1. Register a new vendor account
2. Check email inbox (and spam folder)
3. Click the confirmation link
4. Should redirect to `/auth/confirm`
5. After confirmation, try signing in

**Debug Commands**:
```bash
# Check environment configuration
node check-email-config.js

# Check if required routes exist
ls app/auth/confirm/page.tsx  # Should exist
ls app/auth/register/page.tsx # Should exist
```

### 5. Common Configuration Issues

**Missing Environment Variables**:
```env
# Required for email confirmation
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/confirm
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Incorrect Redirect URL**:
- ❌ `localhost:3000/auth/confirm` (missing protocol)
- ❌ `/auth/confirm` (missing domain)
- ✅ `http://localhost:3000/auth/confirm` (correct)

### 6. Production Deployment Checklist

Before deploying to production:

- [ ] Set up custom SMTP provider
- [ ] Configure domain DNS records (SPF, DKIM)
- [ ] Update environment variables for production URLs
- [ ] Test email flow with production domain
- [ ] Monitor email deliverability
- [ ] Set up email analytics (if supported by provider)

### 7. Supabase Auth Settings Reference

In your Supabase Dashboard:
- **Site URL**: `https://yourdomain.com`
- **Additional Redirect URLs**: 
  - `http://localhost:3000/auth/confirm`
  - `https://yourdomain.com/auth/confirm`
- **Email Templates**: Customize confirmation email content
- **SMTP Settings**: Configure for production use

### 8. Debugging Tips

**Check Browser Console**:
- Look for any JavaScript errors
- Check network requests to Supabase

**Check Server Logs**:
- If using Vercel, check deployment logs
- Look for authentication-related errors

**Test with Different Email Providers**:
- Try registering with Gmail, Outlook, etc.
- Some providers have stricter spam filters

If issues persist after trying these solutions, please check:
1. Supabase project logs
2. Email provider documentation
3. Network/firewall settings
