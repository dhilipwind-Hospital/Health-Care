# Render Deployment Guide
## Ayphen Care HMS - Frontend Deployment (Step-by-Step)

---

## ⚠️ IMPORTANT: Use Static Site, NOT Web Service

For React frontend apps, you must use **"Static Site"** not "Web Service".
- **Static Site** = React, Vue, Angular (frontend)
- **Web Service** = Node.js, Python, Go (backend)

---

## Your Application Details

| Item | Value |
|------|-------|
| **GitHub Repo** | `dhilipwind-Hospital/Health-Care` |
| **Frontend Folder** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Output Folder** | `build` |

---

## STEP 1: Go to Render Website

1. Open browser
2. Go to: **https://render.com**
3. Click **"Get Started"** or **"Sign In"**

---

## STEP 2: Sign In with GitHub

1. Click **"Sign in with GitHub"**
2. If prompted, authorize Render to access your GitHub
3. You'll be redirected to Render Dashboard

---

## STEP 3: Create New Static Site

### 3.1 Click "New +"
1. In the top right corner, click **"+ New"** button
2. From the dropdown, select **"Static Site"**

⚠️ **DO NOT select "Web Service"** - that's for backend only!

### 3.2 Connect Repository
1. You'll see "Create a new Static Site" page
2. Find your repository: **Health-Care**
3. Click **"Connect"** next to it

If you don't see your repo:
- Click **"Configure account"**
- Select the repository to give Render access
- Come back and refresh

---

## STEP 4: Configure Build Settings

Fill in these EXACT values:

### 4.1 Basic Info
```
Name: ayphen-care-frontend
```
(This will be your URL: ayphen-care-frontend.onrender.com)

### 4.2 Build Settings
```
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: build
```

### 4.3 Visual Guide

| Field | What to Enter |
|-------|---------------|
| **Name** | `ayphen-care-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `build` |

---

## STEP 5: Add Environment Variables

Scroll down to **"Environment Variables"** section.

Click **"Add Environment Variable"** for each:

### Variable 1:
```
Key: REACT_APP_API_URL
Value: http://localhost:5001/api
```
⚠️ You'll update this later with your Railway backend URL

### Variable 2:
```
Key: REACT_APP_FIREBASE_API_KEY
Value: AIzaSyCT5Q8DBhc_8WBVSHl40NDwR3QHM8Y_Frk
```

### Variable 3:
```
Key: REACT_APP_FIREBASE_AUTH_DOMAIN
Value: hospital-management-792f5.firebaseapp.com
```

### Variable 4:
```
Key: REACT_APP_FIREBASE_PROJECT_ID
Value: hospital-management-792f5
```

### Variable 5:
```
Key: REACT_APP_FIREBASE_STORAGE_BUCKET
Value: hospital-management-792f5.firebasestorage.app
```

### Variable 6:
```
Key: REACT_APP_FIREBASE_MESSAGING_SENDER_ID
Value: 686102875439
```

### Variable 7:
```
Key: REACT_APP_FIREBASE_APP_ID
Value: 1:686102875439:web:dbe383ddfbd0402c6b65da
```

---

## STEP 6: Add Redirect Rule (Important!)

This is needed for React Router to work properly.

1. Scroll down to **"Redirects/Rewrites"** section
2. Click **"Add Rule"**
3. Fill in:
   ```
   Source: /*
   Destination: /index.html
   Action: Rewrite
   ```
4. Click **"Save"**

Without this, refreshing pages like `/patients` will show 404 error.

---

## STEP 7: Select Instance Type

1. Scroll to **"Instance Type"** section
2. Select **"Free"** ($0/month)
   - 100GB bandwidth/month
   - Automatic SSL
   - CDN included

---

## STEP 8: Deploy

1. Review all settings
2. Click **"Create Static Site"** button at the bottom
3. Wait for deployment (3-5 minutes)

---

## STEP 9: Monitor Build

After clicking "Create Static Site":

1. You'll see the build logs
2. Watch for these stages:
   - ✅ Cloning repository
   - ✅ Installing dependencies
   - ✅ Building application
   - ✅ Deploying to CDN

3. Wait for **"Your site is live"** message

---

## STEP 10: Get Your URL

After successful deployment:

1. At the top of the page, you'll see your URL:
   ```
   https://ayphen-care-frontend.onrender.com
   ```
2. Click to open and test

---

## STEP 11: Update API URL (After Railway Deployment)

Once you deploy backend to Railway:

1. Go to Render Dashboard
2. Click on your static site
3. Go to **"Environment"** tab
4. Update `REACT_APP_API_URL`:
   ```
   Old: http://localhost:5001/api
   New: https://your-backend.railway.app/api
   ```
5. Click **"Save Changes"**
6. Go to **"Manual Deploy"** → Click **"Deploy latest commit"**

---

## Quick Checklist

Before clicking "Create Static Site", verify:

- [ ] Service type is **Static Site** (not Web Service)
- [ ] Name: `ayphen-care-frontend`
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `build`
- [ ] All 7 environment variables added
- [ ] Redirect rule added: `/*` → `/index.html`
- [ ] Instance Type: Free

---

## Troubleshooting

### Build Failed
- Check build logs for errors
- Verify Root Directory is `frontend`
- Verify Build Command is correct

### Blank Page
- Check browser console for errors
- Verify environment variables are set
- Check redirect rule is added

### 404 on Page Refresh
- Add redirect rule: `/*` → `/index.html` → Rewrite

### API Not Working
- Update `REACT_APP_API_URL` with Railway URL
- Redeploy after changing environment variables

---

## Summary

You've successfully deployed your React frontend to Render!

**Your URLs:**
- Frontend: `https://ayphen-care-frontend.onrender.com`
- Backend (Railway): `https://your-backend.railway.app`

**Next Steps:**
1. Deploy backend to Railway
2. Update `REACT_APP_API_URL` in Render with Railway URL
3. Test the complete application
   - If not, click **"Configure account"** to add more repos

### 2.3 Select Repository
1. Find your repository: `Health-Care` or `ayphen-care-hms`
2. Click **"Connect"** next to it

---

## STEP 3: Configure Build Settings

### 3.1 Basic Settings

Fill in the form with these details:

| Field | Value |
|-------|-------|
| **Name** | `ayphen-care-frontend` (or your preferred name) |
| **Region** | Select closest to your users (e.g., Singapore for Asia) |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `build` |

### 3.2 Detailed Field Explanations

**Name:**
- This will be part of your URL: `ayphen-care-frontend.onrender.com`
- Use lowercase, hyphens only
- Must be unique across Render

**Region:**
- Singapore: Best for India/Asia
- Oregon (US West): Good for global
- Frankfurt: Good for Europe

**Root Directory:**
- `frontend` - because your React app is in the frontend folder
- Leave blank if React app is at repository root

**Build Command:**
- `npm install` - installs dependencies
- `npm run build` - creates production build
- Combined with `&&`

**Publish Directory:**
- `build` - where React creates production files
- For Create React App, it's always `build`
- For Vite, it would be `dist`

---

## STEP 4: Configure Environment Variables

### 4.1 Add Environment Variables
1. Scroll down to **"Environment Variables"** section
2. Click **"Add Environment Variable"**
3. Add these variables one by one:

### 4.2 Required Variables

**Variable 1: API URL**
```
Key: REACT_APP_API_URL
Value: https://your-backend.railway.app/api
```
⚠️ **Important:** Replace `your-backend.railway.app` with your actual Railway backend URL

**Variable 2-7: Firebase Configuration**
```
Key: REACT_APP_FIREBASE_API_KEY
Value: AIzaSyCT5Q8DBhc_8WBVSHl40NDwR3QHM8Y_Frk

Key: REACT_APP_FIREBASE_AUTH_DOMAIN
Value: hospital-management-792f5.firebaseapp.com

Key: REACT_APP_FIREBASE_PROJECT_ID
Value: hospital-management-792f5

Key: REACT_APP_FIREBASE_STORAGE_BUCKET
Value: hospital-management-792f5.firebasestorage.app

Key: REACT_APP_FIREBASE_MESSAGING_SENDER_ID
Value: 686102875439

Key: REACT_APP_FIREBASE_APP_ID
Value: 1:686102875439:web:dbe383ddfbd0402c6b65da
```

### 4.3 How to Add Variables
For each variable:
1. Click **"Add Environment Variable"**
2. Enter **Key** in first field
3. Enter **Value** in second field
4. Click outside or press Enter
5. Repeat for all variables

---

## STEP 5: Configure React Router Redirects

### 5.1 Why This is Needed
React Router uses client-side routing. When users visit `/patients` directly, the server needs to serve `index.html` for React to handle routing.

### 5.2 Add Redirect Rules
Scroll down to **"Redirects/Rewrites"** section:

1. Click **"Add Rule"**
2. Fill in:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
3. Click **"Save"**

### 5.3 Alternative: _redirects File
If the above doesn't work, the `_redirects` file in your repo will handle it:
```
/*    /index.html   200
```
This file is already created in: `frontend/public/_redirects`

---

## STEP 6: Advanced Settings (Optional)

### 6.1 Auto-Deploy
- **Enabled by default**
- Every push to `main` branch triggers a new deployment
- Can be disabled in Settings if needed

### 6.2 Pull Request Previews
1. Go to **Settings** → **Pull Request Previews**
2. Enable to get preview URLs for PRs
3. Useful for testing before merging

### 6.3 Custom Headers (Optional)
Add security headers:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

---

## STEP 7: Deploy

### 7.1 Create Static Site
1. Review all settings
2. Click **"Create Static Site"** button at bottom
3. Deployment will start automatically

### 7.2 Monitor Build
1. You'll be redirected to the deployment page
2. Watch the build logs in real-time
3. Build process:
   - Cloning repository
   - Installing dependencies (`npm install`)
   - Building app (`npm run build`)
   - Deploying to CDN

### 7.3 Build Time
- First build: 3-5 minutes
- Subsequent builds: 2-3 minutes

### 7.4 Check for Errors
Common build errors:
- **Missing dependencies:** Check `package.json`
- **Build command failed:** Verify build command
- **Environment variables:** Ensure all are set

---

## STEP 8: Get Your URL

### 8.1 Find Your URL
After successful deployment:
1. At the top of the page, you'll see your URL
2. Format: `https://ayphen-care-frontend.onrender.com`
3. Click to open in browser

### 8.2 Test Your Application
1. Open the URL
2. Test key features:
   - Login page loads
   - Can log in with credentials
   - Dashboard loads
   - Navigation works
   - API calls work (check Network tab)

---

## STEP 9: Update Backend CORS

### 9.1 Why This is Needed
Your backend needs to allow requests from your Render frontend URL.

### 9.2 Update Railway Environment Variables
1. Go to Railway dashboard
2. Select your backend service
3. Go to **Variables** tab
4. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://ayphen-care-frontend.onrender.com
   ```
5. Save and redeploy

### 9.3 Verify CORS
Test by:
1. Opening frontend URL
2. Trying to login
3. Check browser console for CORS errors
4. If errors, check backend CORS configuration

---

## STEP 10: Custom Domain (Optional)

### 10.1 Add Custom Domain
1. In Render dashboard, go to your static site
2. Click **Settings** tab
3. Scroll to **"Custom Domains"**
4. Click **"Add Custom Domain"**

### 10.2 Enter Domain
1. Enter your domain: `app.ayphencare.com`
2. Click **"Verify"**

### 10.3 Configure DNS
Add these records at your domain registrar:

**For subdomain (app.ayphencare.com):**
```
Type: CNAME
Name: app
Value: ayphen-care-frontend.onrender.com
TTL: 3600
```

**For root domain (ayphencare.com):**
```
Type: A
Name: @
Value: [IP provided by Render]
TTL: 3600
```

### 10.4 Wait for DNS Propagation
- Can take 5 minutes to 48 hours
- Usually completes in 1-2 hours
- Check status in Render dashboard

### 10.5 SSL Certificate
- Render automatically provisions SSL certificate
- Free via Let's Encrypt
- Auto-renews every 90 days

---

## Troubleshooting

### Build Fails

**Error: "Command failed: npm run build"**
- **Solution:** Test build locally first:
  ```bash
  cd frontend
  npm install
  npm run build
  ```
- Fix any errors locally, commit, and push

**Error: "Module not found"**
- **Solution:** Ensure all dependencies are in `package.json`
- Run `npm install --save [package-name]` locally
- Commit and push

### Blank Page After Deployment

**Symptom:** Site loads but shows blank page
- **Solution 1:** Check browser console for errors
- **Solution 2:** Verify `REACT_APP_API_URL` is correct
- **Solution 3:** Check if `_redirects` file exists in `public/`

### API Calls Failing

**Error: "CORS policy blocked"**
- **Solution:** Update `FRONTEND_URL` in Railway backend
- Ensure backend CORS allows your Render URL

**Error: "Network Error"**
- **Solution:** Check `REACT_APP_API_URL` is correct
- Verify Railway backend is running
- Test backend URL directly in browser

### Environment Variables Not Working

**Symptom:** App can't connect to backend/Firebase
- **Solution:** 
  1. Check all `REACT_APP_*` variables are set
  2. Rebuild the app (Render → Manual Deploy)
  3. Environment variables are baked into build, not runtime

### Routing Issues

**Error:** 404 on page refresh
- **Solution:** Ensure redirect rule is set:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: `Rewrite`

---

## Monitoring & Maintenance

### View Logs
1. Go to Render dashboard
2. Select your static site
3. Click **"Logs"** tab
4. View build and deployment logs

### Manual Deploy
1. Go to **"Manual Deploy"** section
2. Click **"Deploy latest commit"**
3. Or select specific commit to deploy

### Rollback
1. Go to **"Deploys"** tab
2. Find previous successful deployment
3. Click **"Rollback to this deploy"**

### Analytics
1. Go to **"Metrics"** tab
2. View:
   - Bandwidth usage
   - Request count
   - Build times

---

## Cost & Limits

### Free Tier
- ✅ Unlimited static sites
- ✅ 100GB bandwidth/month per site
- ✅ Free SSL certificates
- ✅ Automatic deployments
- ✅ Custom domains

### Paid Plans (if needed)
- **Starter:** $7/month
  - 100GB bandwidth
  - Priority builds
- **Pro:** $25/month
  - 500GB bandwidth
  - Faster builds

---

## Best Practices

### 1. Use Environment Variables
- Never hardcode API URLs
- Use `REACT_APP_*` prefix for Create React App
- Update variables without code changes

### 2. Enable Auto-Deploy
- Automatic deployments on git push
- Faster iteration
- Less manual work

### 3. Monitor Build Times
- Optimize dependencies
- Remove unused packages
- Use build caching

### 4. Test Locally First
- Always test `npm run build` locally
- Fix errors before pushing
- Saves deployment time

### 5. Use Custom Domain
- Professional appearance
- Better for SEO
- Easier to remember

---

## Quick Reference

### Your Render Details (Fill in after setup)

```
Site Name: ayphen-care-frontend
URL: https://ayphen-care-frontend.onrender.com
Custom Domain: ____________________

Repository: https://github.com/dhilipwind-Hospital/Health-Care
Branch: main
Root Directory: frontend

Build Command: npm install && npm run build
Publish Directory: build

Environment Variables:
- REACT_APP_API_URL: https://your-backend.railway.app/api
- REACT_APP_FIREBASE_API_KEY: AIzaSyCT5Q8DBhc_8WBVSHl40NDwR3QHM8Y_Frk
- (+ 5 more Firebase variables)
```

---

## Next Steps

After Render deployment:
1. ✅ Test frontend thoroughly
2. ✅ Update Firebase authorized domains
3. ✅ Configure custom domain (optional)
4. ✅ Set up monitoring/alerts
5. ✅ Document deployment process

---

## Support Links

- **Render Docs:** https://render.com/docs
- **Render Dashboard:** https://dashboard.render.com
- **Status Page:** https://status.render.com
- **Community:** https://community.render.com
