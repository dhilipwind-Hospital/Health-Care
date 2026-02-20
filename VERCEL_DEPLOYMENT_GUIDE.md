# Vercel Deployment Guide
## Ayphen Care HMS - Frontend Deployment (Step-by-Step)

---

## What is Vercel?

Vercel is a cloud platform optimized for frontend frameworks:
- **Free tier:** Unlimited static sites, 100GB bandwidth
- **Automatic deployments** from GitHub
- **Free SSL certificates**
- **Global CDN** (Edge Network)
- **Preview deployments** for every PR
- **Serverless functions** support

**Perfect for:** React, Next.js, Vue, Angular frontends

---

## Your Application Details

| Item | Value |
|------|-------|
| **GitHub Repo** | `dhilipwind-Hospital/Health-Care` |
| **Frontend Folder** | `frontend` |
| **Framework** | Create React App |
| **Build Command** | `npm run build` |
| **Output Folder** | `build` |

---

## STEP 1: Go to Vercel Website

1. Open browser
2. Go to: **https://vercel.com**
3. Click **"Start Deploying"** or **"Sign Up"**

---

## STEP 2: Sign Up with GitHub

1. Click **"Continue with GitHub"**
2. Authorize Vercel to access your GitHub account
3. You'll be redirected to Vercel Dashboard

---

## STEP 3: Import Project

### 3.1 Click "Add New..."
1. In the dashboard, click **"Add New..."** button
2. Select **"Project"**

### 3.2 Import Git Repository
1. You'll see "Import Git Repository" page
2. Find your repository: **Health-Care**
3. Click **"Import"** next to it

If you don't see your repo:
- Click **"Adjust GitHub App Permissions"**
- Select the repository to give Vercel access
- Come back and refresh

---

## STEP 4: Configure Project

### 4.1 Project Name
```
ayphen-care-frontend
```

### 4.2 Framework Preset
Select: **Create React App**

### 4.3 Root Directory
Click **"Edit"** next to Root Directory and enter:
```
frontend
```

### 4.4 Build and Output Settings
These should auto-detect, but verify:

| Setting | Value |
|---------|-------|
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |
| **Install Command** | `npm install` |

---

## STEP 5: Add Environment Variables

Click **"Environment Variables"** to expand the section.

Add each variable:

### Variable 1:
```
Name: REACT_APP_API_URL
Value: https://your-backend.onrender.com/api
```
⚠️ Update this with your actual Render backend URL after deploying backend

### Variable 2:
```
Name: REACT_APP_FIREBASE_API_KEY
Value: AIzaSyCT5Q8DBhc_8WBVSHl40NDwR3QHM8Y_Frk
```

### Variable 3:
```
Name: REACT_APP_FIREBASE_AUTH_DOMAIN
Value: hospital-management-792f5.firebaseapp.com
```

### Variable 4:
```
Name: REACT_APP_FIREBASE_PROJECT_ID
Value: hospital-management-792f5
```

### Variable 5:
```
Name: REACT_APP_FIREBASE_STORAGE_BUCKET
Value: hospital-management-792f5.firebasestorage.app
```

### Variable 6:
```
Name: REACT_APP_FIREBASE_MESSAGING_SENDER_ID
Value: 686102875439
```

### Variable 7:
```
Name: REACT_APP_FIREBASE_APP_ID
Value: 1:686102875439:web:dbe383ddfbd0402c6b65da
```

---

## STEP 6: Deploy

1. Review all settings
2. Click **"Deploy"** button
3. Wait for deployment (2-4 minutes)

---

## STEP 7: Monitor Build

After clicking "Deploy":

1. You'll see the build logs in real-time
2. Watch for these stages:
   - ✅ Cloning repository
   - ✅ Installing dependencies
   - ✅ Building application
   - ✅ Deploying to Edge Network

3. Wait for **"Congratulations!"** message

---

## STEP 8: Get Your URL

After successful deployment:

1. You'll see your production URL:
   ```
   https://ayphen-care-frontend.vercel.app
   ```
2. Click to open and test

### Your URLs:
- **Production:** `https://ayphen-care-frontend.vercel.app`
- **Preview (for PRs):** `https://ayphen-care-frontend-git-branch-name.vercel.app`

---

## STEP 9: Configure Rewrites for React Router

Create a `vercel.json` file in your frontend folder for React Router support.

### 9.1 Create vercel.json
In your local project, create file: `frontend/vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 9.2 Push to GitHub
```bash
cd /Users/dhilipelango/Documents/Jan\ 12\ Care\ health\ -Arun/hospital-website
git add frontend/vercel.json
git commit -m "Add Vercel rewrites for React Router"
git push
```

Vercel will auto-redeploy.

---

## STEP 10: Update Backend CORS

After deploying frontend to Vercel:

1. Go to Render dashboard (your backend)
2. Go to **Environment** tab
3. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://ayphen-care-frontend.vercel.app
   ```
4. Save and redeploy backend

---

## STEP 11: Update API URL (After Backend Deployment)

Once your backend is deployed to Render:

1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Update `REACT_APP_API_URL`:
   ```
   Old: https://your-backend.onrender.com/api
   New: https://health-care-backend.onrender.com/api
   ```
5. Click **"Save"**
6. Go to **Deployments** → Click **"Redeploy"** on latest

---

## Quick Checklist

Before clicking "Deploy", verify:

- [ ] Framework: **Create React App**
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `build`
- [ ] All 7 environment variables added
- [ ] `REACT_APP_API_URL` points to your backend

---

## Troubleshooting

### Build Failed

**Error: "Command failed: npm run build"**
- Check build logs for specific error
- Test locally: `cd frontend && npm run build`
- Fix errors, commit, and push

**Error: "Module not found"**
- Missing dependency in `package.json`
- Run `npm install --save [package-name]` locally
- Commit and push

### Blank Page After Deployment

- Check browser console for errors
- Verify environment variables are set
- Add `vercel.json` with rewrites (see Step 9)

### 404 on Page Refresh

- Add `vercel.json` with rewrites:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

### API Calls Failing

**Error: "CORS policy blocked"**
- Update `FRONTEND_URL` in Render backend
- Ensure backend CORS allows your Vercel URL

**Error: "Network Error"**
- Check `REACT_APP_API_URL` is correct
- Verify backend is running
- Test backend URL directly in browser

### Environment Variables Not Working

- Verify all `REACT_APP_*` variables are set
- Redeploy after changing variables
- Environment variables are baked into build

---

## Custom Domain (Optional)

### Add Custom Domain
1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Domains**
3. Click **"Add"**
4. Enter your domain: `app.ayphencare.com`

### Configure DNS
Add these records at your domain registrar:

**For subdomain (app.ayphencare.com):**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: 3600
```

**For root domain (ayphencare.com):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

### Wait for DNS Propagation
- Usually 5 minutes to 2 hours
- Vercel auto-provisions SSL certificate

---

## Vercel vs Render (for Frontend)

| Feature | Vercel | Render |
|---------|--------|--------|
| **Free Tier** | 100GB bandwidth | 100GB bandwidth |
| **Build Speed** | Faster | Good |
| **Preview Deploys** | ✅ Automatic | ❌ Manual |
| **Edge Network** | ✅ Global | ✅ CDN |
| **Serverless Functions** | ✅ Yes | ❌ No |
| **React Router Support** | vercel.json | _redirects |

---

## Cost & Limits

### Free Tier (Hobby)
- ✅ Unlimited projects
- ✅ 100GB bandwidth/month
- ✅ Free SSL certificates
- ✅ Automatic deployments
- ✅ Preview deployments
- ✅ Custom domains

### Pro Plan ($20/month)
- 1TB bandwidth
- Team collaboration
- Password protection
- Advanced analytics

---

## Quick Reference

### Your Vercel Details (Fill in after setup)

```
Project Name: ayphen-care-frontend
URL: https://ayphen-care-frontend.vercel.app
Custom Domain: ____________________

Repository: https://github.com/dhilipwind-Hospital/Health-Care
Branch: main
Root Directory: frontend

Framework: Create React App
Build Command: npm run build
Output Directory: build

Environment Variables:
- REACT_APP_API_URL: https://your-backend.onrender.com/api
- REACT_APP_FIREBASE_API_KEY: AIzaSyCT5Q8DBhc_8WBVSHl40NDwR3QHM8Y_Frk
- (+ 5 more Firebase variables)
```

---

## Next Steps

After Vercel deployment:
1. ✅ Test frontend thoroughly
2. ✅ Update Firebase authorized domains
3. ✅ Update backend CORS with Vercel URL
4. ✅ Configure custom domain (optional)
5. ✅ Set up monitoring/alerts

---

## Support Links

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Status Page:** https://www.vercel-status.com
- **Community:** https://github.com/vercel/vercel/discussions
