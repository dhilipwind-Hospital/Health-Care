# Railway Deployment Guide
## Ayphen Care HMS - Backend Deployment (Detailed)

---

## What is Railway?

Railway is a modern deployment platform that provides:
- **$5 free credits** per month (enough for small apps)
- **Automatic deployments** from GitHub
- **Built-in PostgreSQL** (if needed)
- **Environment variables** management
- **Automatic SSL**
- **Easy scaling**

**Perfect for:** Node.js, Python, Go, Ruby backends

---

## Prerequisites

Before starting, ensure you have:
- ✅ GitHub repository with your code
- ✅ Supabase database set up and imported
- ✅ Railway account (free)
- ✅ Database connection details from Supabase

---

## STEP 1: Create Railway Account

### 1.1 Sign Up
1. Go to: **https://railway.app**
2. Click **"Start a New Project"** or **"Login"**
3. Choose sign-up method:
   - **GitHub** (Recommended - required for deployments)
   - **Email** (will need to connect GitHub later)

### 1.2 Authorize GitHub
1. Click **"Login with GitHub"**
2. Authorize Railway to access your repositories
3. Select which repositories Railway can access:
   - **All repositories** (easier), or
   - **Only select repositories** (more secure)
4. Click **"Install & Authorize"**

### 1.3 Complete Profile
1. You'll be redirected to Railway dashboard
2. Verify your email if prompted
3. Add payment method (required even for free tier - won't be charged unless you exceed free credits)

---

## STEP 2: Create New Project

### 2.1 Start New Project
1. In Railway dashboard, click **"New Project"**
2. You'll see several options:
   - Deploy from GitHub repo
   - Provision PostgreSQL
   - Deploy a template
   - Empty project

### 2.2 Select Deployment Method
1. Click **"Deploy from GitHub repo"**
2. You'll see a list of your repositories

### 2.3 Select Repository
1. Find your repository: `Health-Care` or `ayphen-care-hms`
2. Click on it to select

---

## STEP 3: Configure Service

### 3.1 Initial Configuration
After selecting the repository:
1. Railway will detect it's a Node.js project
2. It will show "Service created"
3. Click on the service card to configure

### 3.2 Set Root Directory
1. Click on **Settings** tab
2. Scroll to **"Source"** section
3. Set **Root Directory:** `backend`
4. Click **"Save"**

### 3.3 Configure Build Settings
1. In **Settings** tab, scroll to **"Build"** section
2. Set:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. Click **"Save"**

### 3.4 Detailed Settings Explanation

**Root Directory:**
- `backend` - because your Node.js app is in the backend folder
- Railway will run all commands from this directory

**Build Command:**
- `npm install` - installs all dependencies from package.json
- `npm run build` - compiles TypeScript to JavaScript
- Combined with `&&` to run sequentially

**Start Command:**
- `npm start` - runs the production server
- Defined in your `package.json` scripts

---

## STEP 4: Add Environment Variables

### 4.1 Navigate to Variables
1. Click on **Variables** tab
2. You'll see an empty list or some auto-detected variables

### 4.2 Add Variables One by One
Click **"New Variable"** for each:

### 4.3 Server Configuration

```
Variable: NODE_ENV
Value: production

Variable: PORT
Value: 5000
```

### 4.4 Database Configuration (Supabase)

⚠️ **Important:** Replace with your actual Supabase details

```
Variable: DB_HOST
Value: db.vbpnznobomgjcoqyqopr.supabase.co

Variable: DB_PORT
Value: 5432

Variable: DB_USER
Value: postgres

Variable: DB_PASSWORD
Value: Dhilipelango@1990

Variable: DB_NAME
Value: postgres

Variable: DATABASE_URL
Value: postgresql://postgres:Dhilipelango@1990@db.vbpnznobomgjcoqyqopr.supabase.co:5432/postgres
```

### 4.5 JWT Configuration

⚠️ **CRITICAL:** Generate a secure random string for JWT_SECRET

```
Variable: JWT_SECRET
Value: [Generate a 64-character random string]

Variable: JWT_EXPIRES_IN
Value: 24h

Variable: JWT_REFRESH_EXPIRES_IN
Value: 7d
```

**How to generate JWT_SECRET:**
Run this in your terminal:
```bash
openssl rand -base64 64 | tr -d '\n'
```
Copy the output and use as JWT_SECRET value.

### 4.6 Email Configuration (SMTP)

```
Variable: SMTP_HOST
Value: smtp.gmail.com

Variable: SMTP_PORT
Value: 587

Variable: SMTP_SECURE
Value: false

Variable: SMTP_USER
Value: dhilipwind@gmail.com

Variable: SMTP_PASS
Value: uogbfdejhwtxkgqt

Variable: SMTP_FROM_NAME
Value: Ayphen Care

Variable: SMTP_FROM_EMAIL
Value: dhilipwind@gmail.com
```

### 4.7 Email Features

```
Variable: ENABLE_EMAIL_NOTIFICATIONS
Value: true

Variable: ENABLE_APPOINTMENT_REMINDERS
Value: true

Variable: ENABLE_PASSWORD_RESET_EMAIL
Value: true
```

### 4.8 Application Features

```
Variable: ENABLE_QUEUE
Value: true

Variable: ENABLE_TRIAGE
Value: true

Variable: ENABLE_TV_DISPLAY
Value: true
```

### 4.9 Firebase Admin SDK

```
Variable: FIREBASE_PROJECT_ID
Value: hospital-management-792f5

Variable: FIREBASE_CLIENT_EMAIL
Value: firebase-adminsdk-fbsvc@hospital-management-792f5.iam.gserviceaccount.com

Variable: FIREBASE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNc/0l3d9Hesio
LPw8eYAA4wKsVwx6ZtkN4yVItT3PM6yf3lsiX2uWbzCAH7hpmPj4eiK+LnCquvWi
0XiEOUuT+KF7yFoW0/coHdTZDZGpOMVhV+ItqLeoDB8rz9DWSp47wEiGV555tGli
/4pXhMbBJVtyw66HQQ+jwDMd2qASU6dTaSnQT/pG3/AW4tZNdNCLMb3uOv0MhOBY
qCpebbDD0GW5v02fxzBR9UUBmSz2vgp6xIIze2IErnDTYgmV2P7L5TVXyWS32a13
tsWRqWetTcyV9pZ8OZ42W6WYE1a387YcXv0fwzpikF/dHVwlePTa97BLgtU6zofU
C6cvSvYZAgMBAAECggEABI59f1D/6jhtadlxkK/LKHngbc0ScEaGqtmuUoH+iHFn
czY9xDHkk3YM19KcRu9HGk+vJJOoGQlDeGR37UrOA86gWjvzz4zM7v1WYqf74opp
SkLmN8gFprr6GAEoaxBFmSKnGR+pWp6nNbRgL5e4xsDa2d1AKizFuYaCO7fFFBLv
tEuABYeG2ptbZPeVoBaVqq2tTIPuG4z9myG+xydwO7bXq+7a0AwpxkLqI8jBOI6X
+xuI/7Nf7R+lZc9t4wF0DHoKAu4t67eLHzM2DibvmJC3SW8WLInnk1ny98Zyywof
rIYK7K9iT8HwBUBzV8/sXa2rWzeuNwNLl+2JylxCwQKBgQDwuY4Zj9Oqj6Z9+aOU
9KZBYhiJuCCxI+PFEleaC1M5ktKjAyB6X/LwaDxdo4MAPmxILVPlQtMRgQcAfdcw
WFcpdAxi7LiWu5bxTqfTNDGBtBoh/pkQ1j1WACxN21rXKRRG7JWoJ15QXm672p6e
t8m2aii/WlPq3sK7O4DC2WdziQKBgQDafXadlppcjKcVlzfuAjQjrU8aSW+yPdt3
A9pmEm1D0taXsKChmU4/qX2nkx6KMDTHjQTOCbCR8hKbq0IpY6qvZnMy8ONj4ytA
H9dVdd0KFEU3jeB0A36vBkYu1hkA7NnZRuixC1yMd819wcYN9ciTI78r9uagndPc
O1kvjzV6EQKBgQCjgFSc1gydP16FF+bciGLX6+nguJgz2L2en/uyHFkVtLyujbQk
ikD2usWtkB6tLrjbOTZPdFjp/aok0lQzeP0Soci79C7X6mf2VEc2869gelR5nHSY
c/tLC2kMJJ4Jn9Qu7AgmIz8y9UDfBPlRsmEmLeqpNY/j6hN3mk21inZyiQKBgFmm
f2Q8JoxxHiHq0YU0nEZDV6DWnyFI5mNYTmXxi6n3uhu12sNUD1pp5mg7Ip3bF90F
jQIp0ayg4mfDhrtK7P9Zj01IsFUNInMGXanwWclH9frMmVuhD3srnOKc8NeDWAQi
Z1o16jys78F5IBYcUrelREz62zjuab8FDxxHq86xAoGBANvwvssAvSRM/gH1v1PG
/ats2/w0dTJPA+Vb3D69GmehWyJhdp/IWaSWdgM8EgUXeRbnF7uH278KdYViWKoM
hFVZhSh4wWQgLpFtdV8uyBtapudYtZNDjqkgLyCSHLoBK9/JUh6Zy5evBkrXKbNY
RUYwjfeztWuL/UWdcaw7diSj
-----END PRIVATE KEY-----
```

⚠️ **Note:** Keep the line breaks in FIREBASE_PRIVATE_KEY exactly as shown

### 4.10 CORS Configuration

```
Variable: FRONTEND_URL
Value: https://your-frontend.onrender.com
```

⚠️ **Important:** Update this after deploying frontend to Render

### 4.11 Using Raw Editor (Faster Method)

Instead of adding variables one by one:
1. Click **"RAW Editor"** button
2. Paste all variables in this format:
```
NODE_ENV=production
PORT=5000
DB_HOST=db.vbpnznobomgjcoqyqopr.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Dhilipelango@1990
DB_NAME=postgres
DATABASE_URL=postgresql://postgres:Dhilipelango@1990@db.vbpnznobomgjcoqyqopr.supabase.co:5432/postgres
JWT_SECRET=YOUR_GENERATED_SECRET_HERE
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dhilipwind@gmail.com
SMTP_PASS=uogbfdejhwtxkgqt
SMTP_FROM_NAME=Ayphen Care
SMTP_FROM_EMAIL=dhilipwind@gmail.com
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_APPOINTMENT_REMINDERS=true
ENABLE_PASSWORD_RESET_EMAIL=true
ENABLE_QUEUE=true
ENABLE_TRIAGE=true
ENABLE_TV_DISPLAY=true
FIREBASE_PROJECT_ID=hospital-management-792f5
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@hospital-management-792f5.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNc/0l3d9Hesio\nLPw8eYAA4wKsVwx6ZtkN4yVItT3PM6yf3lsiX2uWbzCAH7hpmPj4eiK+LnCquvWi\n0XiEOUuT+KF7yFoW0/coHdTZDZGpOMVhV+ItqLeoDB8rz9DWSp47wEiGV555tGli\n/4pXhMbBJVtyw66HQQ+jwDMd2qASU6dTaSnQT/pG3/AW4tZNdNCLMb3uOv0MhOBY\nqCpebbDD0GW5v02fxzBR9UUBmSz2vgp6xIIze2IErnDTYgmV2P7L5TVXyWS32a13\ntsWRqWetTcyV9pZ8OZ42W6WYE1a387YcXv0fwzpikF/dHVwlePTa97BLgtU6zofU\nC6cvSvYZAgMBAAECggEABI59f1D/6jhtadlxkK/LKHngbc0ScEaGqtmuUoH+iHFn\nczY9xDHkk3YM19KcRu9HGk+vJJOoGQlDeGR37UrOA86gWjvzz4zM7v1WYqf74opp\nSkLmN8gFprr6GAEoaxBFmSKnGR+pWp6nNbRgL5e4xsDa2d1AKizFuYaCO7fFFBLv\ntEuABYeG2ptbZPeVoBaVqq2tTIPuG4z9myG+xydwO7bXq+7a0AwpxkLqI8jBOI6X\n+xuI/7Nf7R+lZc9t4wF0DHoKAu4t67eLHzM2DibvmJC3SW8WLInnk1ny98Zyywof\nrIYK7K9iT8HwBUBzV8/sXa2rWzeuNwNLl+2JylxCwQKBgQDwuY4Zj9Oqj6Z9+aOU\n9KZBYhiJuCCxI+PFEleaC1M5ktKjAyB6X/LwaDxdo4MAPmxILVPlQtMRgQcAfdcw\nWFcpdAxi7LiWu5bxTqfTNDGBtBoh/pkQ1j1WACxN21rXKRRG7JWoJ15QXm672p6e\nt8m2aii/WlPq3sK7O4DC2WdziQKBgQDafXadlppcjKcVlzfuAjQjrU8aSW+yPdt3\nA9pmEm1D0taXsKChmU4/qX2nkx6KMDTHjQTOCbCR8hKbq0IpY6qvZnMy8ONj4ytA\nH9dVdd0KFEU3jeB0A36vBkYu1hkA7NnZRuixC1yMd819wcYN9ciTI78r9uagndPc\nO1kvjzV6EQKBgQCjgFSc1gydP16FF+bciGLX6+nguJgz2L2en/uyHFkVtLyujbQk\nikD2usWtkB6tLrjbOTZPdFjp/aok0lQzeP0Soci79C7X6mf2VEc2869gelR5nHSY\nc/tLC2kMJJ4Jn9Qu7AgmIz8y9UDfBPlRsmEmLeqpNY/j6hN3mk21inZyiQKBgFmm\nf2Q8JoxxHiHq0YU0nEZDV6DWnyFI5mNYTmXxi6n3uhu12sNUD1pp5mg7Ip3bF90F\njQIp0ayg4mfDhrtK7P9Zj01IsFUNInMGXanwWclH9frMmVuhD3srnOKc8NeDWAQi\nZ1o16jys78F5IBYcUrelREz62zjuab8FDxxHq86xAoGBANvwvssAvSRM/gH1v1PG\n/ats2/w0dTJPA+Vb3D69GmehWyJhdp/IWaSWdgM8EgUXeRbnF7uH278KdYViWKoM\nhFVZhSh4wWQgLpFtdV8uyBtapudYtZNDjqkgLyCSHLoBK9/JUh6Zy5evBkrXKbNY\nRUYwjfeztWuL/UWdcaw7diSj\n-----END PRIVATE KEY-----
FRONTEND_URL=https://your-frontend.onrender.com
```
3. Click **"Update Variables"**

---

## STEP 5: Generate Domain

### 5.1 Create Public URL
1. Go to **Settings** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**

### 5.2 Get Your URL
1. Railway will generate a URL like:
   ```
   https://ayphen-care-backend.railway.app
   ```
2. **Save this URL** - you'll need it for:
   - Frontend `REACT_APP_API_URL`
   - Testing the API

### 5.3 Custom Domain (Optional)
1. In **Networking** section, click **"Custom Domain"**
2. Enter your domain: `api.ayphencare.com`
3. Add DNS record at your registrar:
   ```
   Type: CNAME
   Name: api
   Value: your-service.railway.app
   ```

---

## STEP 6: Deploy

### 6.1 Trigger Deployment
1. Railway automatically deploys when you:
   - Push to GitHub
   - Change environment variables
   - Click "Deploy" manually

2. To manually deploy:
   - Go to **Deployments** tab
   - Click **"Deploy"** button

### 6.2 Monitor Build
1. Click on the active deployment
2. Watch build logs in real-time:
   - Cloning repository
   - Installing dependencies
   - Building TypeScript
   - Starting server

### 6.3 Build Process
```
Step 1: Clone repository
Step 2: cd backend
Step 3: npm install
Step 4: npm run build
Step 5: npm start
```

### 6.4 Check for Success
Look for these messages in logs:
```
Server is running on port 5000
Database connected successfully
API Documentation available at /api-docs
```

### 6.5 Build Time
- First deployment: 3-5 minutes
- Subsequent deployments: 2-3 minutes

---

## STEP 7: Test Your API

### 7.1 Health Check
Open in browser:
```
https://your-backend.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-20T10:30:00.000Z"
}
```

### 7.2 API Documentation
Open Swagger docs:
```
https://your-backend.railway.app/api-docs
```

### 7.3 Test Database Connection
Check if backend can connect to Supabase:
1. Look at deployment logs
2. Should see: "Database connected successfully"
3. No errors about database connection

### 7.4 Test API Endpoints
Using Postman or curl:

**Test 1: Get Organizations**
```bash
curl https://your-backend.railway.app/api/organizations
```

**Test 2: Login**
```bash
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

---

## STEP 8: Update Frontend

### 8.1 Update Render Environment Variables
1. Go to Render dashboard
2. Select your frontend static site
3. Go to **Environment** tab
4. Update `REACT_APP_API_URL`:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app/api
   ```
5. Click **"Save Changes"**

### 8.2 Trigger Frontend Rebuild
1. Go to **Manual Deploy** section
2. Click **"Deploy latest commit"**
3. Wait for rebuild to complete

### 8.3 Update Railway CORS
1. Go back to Railway
2. Update `FRONTEND_URL` variable with your Render URL
3. Redeploy backend

---

## Troubleshooting

### Build Fails

**Error: "npm install failed"**
- **Solution:** Check `package.json` is valid
- Ensure all dependencies are listed
- Test locally: `cd backend && npm install`

**Error: "TypeScript compilation failed"**
- **Solution:** Fix TypeScript errors locally first
- Run: `npm run build` locally
- Fix all errors, commit, and push

**Error: "Module not found"**
- **Solution:** Missing dependency in `package.json`
- Add it: `npm install --save [package-name]`
- Commit and push

### Deployment Fails

**Error: "Application failed to respond"**
- **Solution:** Check if app is listening on correct port
- Verify `PORT` environment variable is set to `5000`
- Check start command in logs

**Error: "Database connection failed"**
- **Solution:** Verify Supabase credentials
- Check `DATABASE_URL` format
- Test connection from local machine

### Runtime Errors

**Error: "CORS policy blocked"**
- **Solution:** Update `FRONTEND_URL` in Railway
- Ensure CORS middleware is configured in backend
- Check frontend URL is correct

**Error: "JWT malformed"**
- **Solution:** Verify `JWT_SECRET` is set
- Ensure it's the same secret used to sign tokens
- Generate new secret if needed

**Error: "Email sending failed"**
- **Solution:** Check SMTP credentials
- Verify Gmail app password is correct
- Test SMTP connection

### Database Issues

**Error: "relation does not exist"**
- **Solution:** Database not migrated to Supabase
- Follow Supabase import instructions
- Verify tables exist in Supabase Table Editor

**Error: "password authentication failed"**
- **Solution:** Check Supabase password
- Verify `DB_PASSWORD` variable
- Reset password in Supabase if needed

---

## Monitoring & Maintenance

### View Logs
1. Go to **Deployments** tab
2. Click on active deployment
3. View real-time logs
4. Filter by log level (info, error, warn)

### Metrics
1. Go to **Metrics** tab
2. View:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

### Restart Service
1. Go to **Settings** tab
2. Scroll to **"Danger Zone"**
3. Click **"Restart"**

### Rollback
1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **"Redeploy"** on that deployment

---

## Cost & Limits

### Free Tier ($5 credits/month)
- ✅ 500 hours execution time
- ✅ 512MB RAM
- ✅ 1GB disk
- ✅ Shared CPU

**Typical usage for this app:**
- ~$3-5/month (within free tier)
- Covers small to medium traffic

### Paid Plans (if needed)
- **Hobby:** $5/month
  - More execution time
  - Priority support
- **Pro:** $20/month
  - Dedicated resources
  - Higher limits

### Monitor Usage
1. Go to **Usage** tab
2. View current month's usage
3. Set up alerts for high usage

---

## Best Practices

### 1. Use Environment Variables
- Never hardcode secrets
- Use Railway's variable management
- Update without code changes

### 2. Monitor Logs
- Check logs regularly
- Set up error alerts
- Debug issues quickly

### 3. Keep Dependencies Updated
- Update packages regularly
- Fix security vulnerabilities
- Test before deploying

### 4. Use Health Checks
- Implement `/health` endpoint
- Monitor uptime
- Auto-restart on failures

### 5. Database Connection Pooling
- Use connection pooling
- Prevent connection exhaustion
- Better performance

---

## Quick Reference

### Your Railway Details (Fill in after setup)

```
Service Name: ayphen-care-backend
URL: https://ayphen-care-backend.railway.app
Custom Domain: ____________________

Repository: https://github.com/dhilipwind-Hospital/Health-Care
Branch: main
Root Directory: backend

Build Command: npm install && npm run build
Start Command: npm start

Key Environment Variables:
- DATABASE_URL: postgresql://postgres:PASSWORD@db.vbpnznobomgjcoqyqopr.supabase.co:5432/postgres
- JWT_SECRET: [Your generated secret]
- FRONTEND_URL: https://your-frontend.onrender.com
```

---

## Next Steps

After Railway deployment:
1. ✅ Test all API endpoints
2. ✅ Update frontend with backend URL
3. ✅ Test end-to-end functionality
4. ✅ Set up monitoring/alerts
5. ✅ Configure custom domain (optional)

---

## Support Links

- **Railway Docs:** https://docs.railway.app
- **Railway Dashboard:** https://railway.app/dashboard
- **Status Page:** https://status.railway.app
- **Discord Community:** https://discord.gg/railway
