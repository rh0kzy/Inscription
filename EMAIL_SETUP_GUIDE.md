# Email Configuration Guide for Inscription System 📧

## Current Status ❌
The email account `inscriptiondecision@gmail.com` is configured but authentication is failing.

## Issue
Gmail is rejecting the login credentials. This happens because:
1. **2-Factor Authentication (2FA) is enabled** - Regular password won't work
2. **Less secure app access is disabled** - Google's default security setting

## Solutions 🔧

### Option 1: Use App Password (RECOMMENDED) ✅

1. **Enable 2-Factor Authentication:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password:**
   - Visit: https://myaccount.google.com/apppasswords
   - Sign in to your account
   - Select "Mail" as the app
   - Select "Other (custom name)" and enter "Inscription System"
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Update .env file:**
   ```env
   EMAIL_PASS=your_16_digit_app_password_here
   ```

### Option 2: Enable Less Secure App Access (NOT RECOMMENDED) ⚠️

1. Go to [Less secure app access](https://myaccount.google.com/lesssecureapps)
2. Turn on "Allow less secure apps"
3. Keep current password in .env

**Note:** This option is less secure and may not work if 2FA is enabled.

### Option 3: Use a Different Email Provider 📨

Consider using other email services that are more SMTP-friendly:
- **Outlook/Hotmail**: Often easier to configure
- **Custom domain email**: Usually supports SMTP without restrictions
- **Dedicated email service**: Like SendGrid, Mailgun (for production)

## Current Configuration 📋

Your current `.env` settings:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=inscriptiondecision@gmail.com
EMAIL_PASS=Covid-19
EMAIL_FROM=inscriptiondecision@gmail.com
```

## Testing 🧪

After fixing the authentication:
1. Run: `node scripts/test-email-config.js`
2. Check if test email is received
3. System will be ready to send approval/rejection emails

## System Features 🎯

Once configured, your system will automatically:
1. ✅ Send confirmation emails when someone submits an inscription
2. ✅ Send approval notifications with congratulations
3. ✅ Send rejection notifications with optional admin notes
4. ✅ Professional HTML email templates
5. ✅ Automatic email logging and error handling

## Next Steps 📝

1. Fix Gmail authentication using Option 1 (App Password)
2. Test the email configuration
3. Your inscription system will be ready to send decisions!

---
**Important:** Keep your email credentials secure and never share them publicly.