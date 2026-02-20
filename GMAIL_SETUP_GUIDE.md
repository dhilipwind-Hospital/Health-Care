# 📧 Gmail SMTP Setup Guide - Hospital Management System

## ⚠️ Current Issue: Authentication Failed

The Gmail app password is not authenticating. Here's how to fix it:

---

## 🔧 Step-by-Step Fix

### Step 1: Verify 2-Step Verification is Enabled

1. Go to: https://myaccount.google.com/security
2. Look for "2-Step Verification"
3. **If it says "Off"** - Click to turn it ON
4. Follow the setup process (you'll need your phone)

**Important:** App passwords ONLY work if 2-Step Verification is enabled!

---

### Step 2: Generate a NEW App Password

1. Go to: https://myaccount.google.com/apppasswords
2. If you see "App passwords aren't available for your account":
   - This means 2-Step Verification is not enabled
   - Go back to Step 1
3. Click "Select app" → Choose "Mail"
4. Click "Select device" → Choose "Other (Custom name)"
5. Enter name: `Hospital Management System`
6. Click "Generate"
7. **Copy the 16-character password** (it will have spaces like: `abcd efgh ijkl mnop`)

---

### Step 3: Update the .env File

1. Open: `/backend/.env`
2. Find the line: `SMTP_PASS=uogbfdejhwtxkgqt`
3. Replace with your NEW app password (remove spaces):
   ```
   SMTP_PASS=abcdefghijklmnop
   ```
4. Save the file

---

### Step 4: Test the Configuration

```bash
cd backend
node test-email-config.js
```

If successful, you'll see:
```
✅ SMTP connection verified successfully!
✅ Test email sent successfully!
```

---

## 🔍 Troubleshooting

### Error: "Username and Password not accepted"

**Possible Causes:**
1. ❌ 2-Step Verification is not enabled
2. ❌ App password is incorrect or expired
3. ❌ App password is for a different Google account
4. ❌ Spaces in the password (should be removed)

**Solution:**
- Generate a FRESH app password following Step 2 above
- Make sure you're logged into the correct Google account (`dhilipwing@gmail.com`)

---

### Error: "Less secure app access"

**Note:** Google removed "Less secure app access" in May 2022. You MUST use app passwords now.

---

### Still Not Working?

**Alternative Solution: Use SendGrid (Recommended for Production)**

SendGrid is more reliable and has better deliverability:

1. Sign up at: https://sendgrid.com (Free tier: 100 emails/day)
2. Get your API key from dashboard
3. Update `.env`:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your_sendgrid_api_key_here
   ```
4. Restart backend: `docker restart hospital-website-backend-1`
5. Test: `cd backend && node test-email-config.js`

---

## ✅ Verification Checklist

Before testing, verify:

- [ ] 2-Step Verification is ENABLED on Google account
- [ ] App password was generated AFTER enabling 2-Step Verification
- [ ] App password has NO SPACES in `.env` file
- [ ] Correct Google account (`dhilipwing@gmail.com`)
- [ ] Backend has been restarted after changing `.env`

---

## 📝 Current Configuration

**Email:** `dhilipwing@gmail.com`
**SMTP Host:** `smtp.gmail.com`
**SMTP Port:** `587`
**Current Status:** ❌ Authentication Failed

**Next Steps:**
1. Enable 2-Step Verification (if not already)
2. Generate NEW app password
3. Update `.env` with new password
4. Test again

---

## 🆘 Need Help?

If you continue to have issues:
1. Double-check you're logged into the correct Google account
2. Try generating the app password again
3. Consider using SendGrid as an alternative
4. Verify the email account has not been locked or restricted

---

**Last Updated:** Feb 3, 2026
**Status:** Awaiting valid Gmail app password
