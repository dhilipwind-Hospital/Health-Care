# Production Deployment Guide
## Ayphen Care HMS - Render + Railway + Supabase

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐   │
│   │   RENDER    │         │   RAILWAY   │         │  SUPABASE   │   │
│   │  (Frontend) │  ──────▶│  (Backend)  │  ──────▶│ (Database)  │   │
│   │             │   API   │             │   SQL   │             │   │
│   │  React App  │ Requests│ Node.js API │ Queries │ PostgreSQL  │   │
│   │  Static     │         │ Express     │         │ Managed DB  │   │
│   └─────────────┘         └─────────────┘         └─────────────┘   │
│         │                       │                       │           │
│         │                       │                       │           │
│   https://your-app     https://api.your-app    Supabase Dashboard   │
│   .onrender.com        .railway.app                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cost Breakdown

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Render** (Frontend) | 750 hours/month | $7/month (Starter) |
| **Railway** (Backend) | $5 free credits | ~$5-20/month |
| **Supabase** (Database) | 500MB, 2 projects | $25/month (Pro) |
| **Total** | Free to start | ~$37-52/month |

---

## Prerequisites

### Accounts Needed
1. **GitHub Account** - https://github.com (for code deployment)
2. **Supabase Account** - https://supabase.com
3. **Railway Account** - https://railway.app
4. **Render Account** - https://render.com

### Local Requirements
- Git installed
- Node.js 18+
- Your application code

---

## PHASE 1: Prepare Code for Deployment

### Step 1.1: Create GitHub Repository

```bash
# Navigate to project
cd /Users/dhilipelango/Documents/Jan\ 12\ Care\ health\ -Arun/hospital-website

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit for production deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ayphen-care-hms.git
git branch -M main
git push -u origin main
```

### Step 1.2: Create Production Environment Files

**Backend `.env.production`:**
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration (Supabase)
DB_HOST=db.YOUR_PROJECT_REF.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_SUPABASE_DB_PASSWORD
DB_NAME=postgres
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres

# JWT Configuration (CHANGE THESE!)
JWT_SECRET=your-super-secure-production-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Keep same)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dhilipwind@gmail.com
SMTP_PASS=uogbfdejhwtxkgqt
SMTP_FROM_NAME=Ayphen Care
SMTP_FROM_EMAIL=dhilipwind@gmail.com

# Features
ENABLE_QUEUE=true
ENABLE_TRIAGE=true
ENABLE_TV_DISPLAY=true

# Firebase (Keep same)
FIREBASE_PROJECT_ID=hospital-management-792f5
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@hospital-management-792f5.iam.gserviceaccount.com

# CORS - Update with your Render frontend URL
FRONTEND_URL=https://your-app.onrender.com
```

**Frontend `.env.production`:**
```env
REACT_APP_API_URL=https://your-backend.railway.app/api

# Firebase (Keep same)
REACT_APP_FIREBASE_API_KEY=AIzaSyCT5Q8DBhc_8WBVSHl40NDwR3QHM8Y_Frk
REACT_APP_FIREBASE_AUTH_DOMAIN=hospital-management-792f5.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=hospital-management-792f5
REACT_APP_FIREBASE_STORAGE_BUCKET=hospital-management-792f5.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=686102875439
REACT_APP_FIREBASE_APP_ID=1:686102875439:web:dbe383ddfbd0402c6b65da
```

---

## PHASE 2: Set Up Supabase Database

### Step 2.1: Create Supabase Project

1. Go to https://supabase.com
2. Click **"Start your project"** or **"New Project"**
3. Fill in:
   - **Organization:** Create new or select existing
   - **Project name:** `ayphen-care-hms`
   - **Database Password:** Generate a strong password (SAVE THIS!)
   - **Region:** Select closest to your users
     - For India: `ap-south-1 (Mumbai)` or `ap-southeast-1 (Singapore)`
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to be ready

### Step 2.2: Get Database Connection Details

1. In Supabase Dashboard, go to **Settings** (gear icon)
2. Click **Database** in the left sidebar
3. Scroll to **Connection string**
4. Copy the **URI** format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Also note:
   - **Host:** `db.[PROJECT-REF].supabase.co`
   - **Port:** `5432`
   - **Database:** `postgres`
   - **User:** `postgres`
   - **Password:** Your database password

### Step 2.3: Migrate Data to Supabase

**Option A: Using SQL Editor (Recommended for first time)**

1. In Supabase Dashboard, go to **SQL Editor**
2. Open your local `hospital_backup.sql` file
3. Copy the contents
4. Paste into SQL Editor
5. Click **Run**

**Option B: Using Command Line**

```bash
# Export from local (already done)
# File: hospital_backup.sql

# Import to Supabase
PGPASSWORD=YOUR_SUPABASE_PASSWORD psql \
  -h db.YOUR_PROJECT_REF.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  < hospital_backup.sql
```

### Step 2.4: Verify Database Migration

1. In Supabase Dashboard, go to **Table Editor**
2. You should see all your tables:
   - users
   - patients
   - appointments
   - visits
   - prescriptions
   - etc.
3. Click on `users` table to verify data exists

---

## PHASE 3: Deploy Backend to Railway

### Step 3.1: Create Railway Project

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select your repository: `ayphen-care-hms`

### Step 3.2: Configure Backend Service

1. After repo is connected, click on the service
2. Go to **Settings** tab
3. Configure:
   - **Root Directory:** `/backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

### Step 3.3: Add Environment Variables

1. Go to **Variables** tab
2. Click **"Add Variable"** or **"Raw Editor"**
3. Add all these variables:

```env
NODE_ENV=production
PORT=5000

# Database (from Supabase)
DB_HOST=db.YOUR_PROJECT_REF.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_SUPABASE_PASSWORD
DB_NAME=postgres
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres

# JWT
JWT_SECRET=generate-a-secure-64-character-random-string-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dhilipwind@gmail.com
SMTP_PASS=uogbfdejhwtxkgqt
SMTP_FROM_NAME=Ayphen Care
SMTP_FROM_EMAIL=dhilipwind@gmail.com

# Features
ENABLE_QUEUE=true
ENABLE_TRIAGE=true
ENABLE_TV_DISPLAY=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_APPOINTMENT_REMINDERS=true
ENABLE_PASSWORD_RESET_EMAIL=true

# Firebase
FIREBASE_PROJECT_ID=hospital-management-792f5
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@hospital-management-792f5.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNc/0l3d9Hesio\nLPw8eYAA4wKsVwx6ZtkN4yVItT3PM6yf3lsiX2uWbzCAH7hpmPj4eiK+LnCquvWi\n0XiEOUuT+KF7yFoW0/coHdTZDZGpOMVhV+ItqLeoDB8rz9DWSp47wEiGV555tGli\n/4pXhMbBJVtyw66HQQ+jwDMd2qASU6dTaSnQT/pG3/AW4tZNdNCLMb3uOv0MhOBY\nqCpebbDD0GW5v02fxzBR9UUBmSz2vgp6xIIze2IErnDTYgmV2P7L5TVXyWS32a13\ntsWRqWetTcyV9pZ8OZ42W6WYE1a387YcXv0fwzpikF/dHVwlePTa97BLgtU6zofU\nC6cvSvYZAgMBAAECggEABI59f1D/6jhtadlxkK/LKHngbc0ScEaGqtmuUoH+iHFn\nczY9xDHkk3YM19KcRu9HGk+vJJOoGQlDeGR37UrOA86gWjvzz4zM7v1WYqf74opp\nSkLmN8gFprr6GAEoaxBFmSKnGR+pWp6nNbRgL5e4xsDa2d1AKizFuYaCO7fFFBLv\ntEuABYeG2ptbZPeVoBaVqq2tTIPuG4z9myG+xydwO7bXq+7a0AwpxkLqI8jBOI6X\n+xuI/7Nf7R+lZc9t4wF0DHoKAu4t67eLHzM2DibvmJC3SW8WLInnk1ny98Zyywof\nrIYK7K9iT8HwBUBzV8/sXa2rWzeuNwNLl+2JylxCwQKBgQDwuY4Zj9Oqj6Z9+aOU\n9KZBYhiJuCCxI+PFEleaC1M5ktKjAyB6X/LwaDxdo4MAPmxILVPlQtMRgQcAfdcw\nWFcpdAxi7LiWu5bxTqfTNDGBtBoh/pkQ1j1WACxN21rXKRRG7JWoJ15QXm672p6e\nt8m2aii/WlPq3sK7O4DC2WdziQKBgQDafXadlppcjKcVlzfuAjQjrU8aSW+yPdt3\nA9pmEm1D0taXsKChmU4/qX2nkx6KMDTHjQTOCbCR8hKbq0IpY6qvZnMy8ONj4ytA\nH9dVdd0KFEU3jeB0A36vBkYu1hkA7NnZRuixC1yMd819wcYN9ciTI78r9uagndPc\nO1kvjzV6EQKBgQCjgFSc1gydP16FF+bciGLX6+nguJgz2L2en/uyHFkVtLyujbQk\nikD2usWtkB6tLrjbOTZPdFjp/aok0lQzeP0Soci79C7X6mf2VEc2869gelR5nHSY\nc/tLC2kMJJ4Jn9Qu7AgmIz8y9UDfBPlRsmEmLeqpNY/j6hN3mk21inZyiQKBgFmm\nf2Q8JoxxHiHq0YU0nEZDV6DWnyFI5mNYTmXxi6n3uhu12sNUD1pp5mg7Ip3bF90F\njQIp0ayg4mfDhrtK7P9Zj01IsFUNInMGXanwWclH9frMmVuhD3srnOKc8NeDWAQi\nZ1o16jys78F5IBYcUrelREz62zjuab8FDxxHq86xAoGBANvwvssAvSRM/gH1v1PG\n/ats2/w0dTJPA+Vb3D69GmehWyJhdp/IWaSWdgM8EgUXeRbnF7uH278KdYViWKoM\nhFVZhSh4wWQgLpFtdV8uyBtapudYtZNDjqkgLyCSHLoBK9/JUh6Zy5evBkrXKbNY\nRUYwjfeztWuL/UWdcaw7diSj\n-----END PRIVATE KEY-----

# CORS (update after Render deployment)
FRONTEND_URL=https://your-frontend.onrender.com
```

### Step 3.4: Generate Domain

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. You'll get a URL like: `https://ayphen-care-backend.railway.app`
4. **Save this URL** - you'll need it for frontend

### Step 3.5: Deploy

1. Railway auto-deploys on push to GitHub
2. Check **Deployments** tab for build logs
3. Wait for "Deployed" status
4. Test API: `https://your-backend.railway.app/api/health`

---

## PHASE 4: Deploy Frontend to Render

### Step 4.1: Create Render Static Site

1. Go to https://render.com
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `ayphen-care-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`

### Step 4.2: Add Environment Variables

1. Go to **Environment** tab
2. Add these variables:

```env
REACT_APP_API_URL=https://your-backend.railway.app/api
REACT_APP_FIREBASE_API_KEY=AIzaSyCT5Q8DBhc_8WBVSHl40NDwR3QHM8Y_Frk
REACT_APP_FIREBASE_AUTH_DOMAIN=hospital-management-792f5.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=hospital-management-792f5
REACT_APP_FIREBASE_STORAGE_BUCKET=hospital-management-792f5.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=686102875439
REACT_APP_FIREBASE_APP_ID=1:686102875439:web:dbe383ddfbd0402c6b65da
```

### Step 4.3: Configure Redirects (Important for React Router)

Create a file `frontend/public/_redirects`:
```
/*    /index.html   200
```

Or in Render dashboard:
1. Go to **Redirects/Rewrites**
2. Add rule:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`

### Step 4.4: Deploy

1. Click **"Create Static Site"**
2. Wait for build to complete
3. You'll get a URL like: `https://ayphen-care-frontend.onrender.com`

---

## PHASE 5: Final Configuration

### Step 5.1: Update CORS on Railway

1. Go back to Railway dashboard
2. Update the `FRONTEND_URL` variable with your Render URL:
   ```
   FRONTEND_URL=https://ayphen-care-frontend.onrender.com
   ```
3. Redeploy

### Step 5.2: Update Firebase Authorized Domains

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your production domains:
   - `ayphen-care-frontend.onrender.com`
   - `your-custom-domain.com` (if you have one)

### Step 5.3: Test Production

1. Open your Render frontend URL
2. Try logging in with existing credentials
3. Test key features:
   - [ ] Login/Logout
   - [ ] Patient registration
   - [ ] Appointments
   - [ ] Queue management
   - [ ] Prescriptions

---

## PHASE 6: Custom Domain (Optional)

### For Render (Frontend)

1. Go to Render dashboard → Your static site
2. Click **Settings** → **Custom Domains**
3. Add your domain: `app.ayphencare.com`
4. Add DNS records at your domain registrar:
   ```
   Type: CNAME
   Name: app
   Value: ayphen-care-frontend.onrender.com
   ```

### For Railway (Backend API)

1. Go to Railway dashboard → Your service
2. Click **Settings** → **Networking** → **Custom Domain**
3. Add: `api.ayphencare.com`
4. Add DNS records:
   ```
   Type: CNAME
   Name: api
   Value: your-backend.railway.app
   ```

---

## Troubleshooting

### Backend Not Starting

**Check logs in Railway:**
1. Go to **Deployments** → Click on deployment
2. View logs for errors

**Common issues:**
- Missing environment variables
- Database connection failed
- Build errors

### Database Connection Issues

**Verify Supabase connection:**
```bash
# Test from local
PGPASSWORD=your_password psql -h db.xxx.supabase.co -p 5432 -U postgres -d postgres -c "SELECT 1;"
```

**Check Supabase:**
1. Go to Supabase Dashboard → **Database** → **Connection Pooling**
2. Ensure "Direct connection" is enabled

### Frontend API Errors

**Check:**
1. `REACT_APP_API_URL` is correct
2. CORS is configured on backend
3. Backend is running

### CORS Errors

**Update backend CORS:**
In `backend/src/server.ts` or `app.ts`:
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ayphen-care-frontend.onrender.com',
    process.env.FRONTEND_URL
  ],
  credentials: true
}));
```

---

## Monitoring & Maintenance

### Railway
- View logs: Dashboard → Deployments → Logs
- Metrics: Dashboard → Metrics
- Restart: Dashboard → Settings → Restart

### Render
- View logs: Dashboard → Logs
- Manual deploy: Dashboard → Manual Deploy

### Supabase
- Database metrics: Dashboard → Reports
- Logs: Dashboard → Logs
- Backups: Automatic daily backups (Pro plan)

---

## Security Checklist

- [ ] Strong JWT_SECRET (64+ characters)
- [ ] Strong database password
- [ ] HTTPS enabled (automatic on all platforms)
- [ ] Firebase domains configured
- [ ] Environment variables not in code
- [ ] `.env` files in `.gitignore`

---

## Quick Reference

| Service | Dashboard | Purpose |
|---------|-----------|---------|
| Supabase | https://app.supabase.com | Database |
| Railway | https://railway.app/dashboard | Backend API |
| Render | https://dashboard.render.com | Frontend |
| Firebase | https://console.firebase.google.com | Auth |

---

## Support

For deployment issues:
- **Supabase:** https://supabase.com/docs
- **Railway:** https://docs.railway.app
- **Render:** https://render.com/docs
