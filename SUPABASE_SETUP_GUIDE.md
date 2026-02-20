# Supabase Database Setup Guide
## Ayphen Care HMS - Detailed Step-by-Step

---

## What is Supabase?

Supabase is a managed PostgreSQL database service that provides:
- **Free tier:** 500MB storage, 2 projects
- **Automatic backups**
- **SSL encryption**
- **Easy dashboard**
- **No server management needed**

---

## STEP 1: Create Supabase Account

### 1.1 Go to Supabase Website
1. Open browser and go to: **https://supabase.com**
2. Click **"Start your project"** (green button)

### 1.2 Sign Up
Choose one of these methods:
- **GitHub** (Recommended - fastest)
- **Google**
- **Email/Password**

### 1.3 Verify Email (if using email signup)
- Check your inbox
- Click verification link

---

## STEP 2: Create New Project

### 2.1 Create Organization (First Time Only)
1. After login, you'll see "Create a new organization"
2. Enter organization name: `Ayphen Care` or your company name
3. Select plan: **Free** (for now)
4. Click **"Create organization"**

### 2.2 Create New Project
1. Click **"New Project"** button
2. Fill in the form:

| Field | Value |
|-------|-------|
| **Organization** | Select your organization |
| **Project name** | `ayphen-care-hms` |
| **Database Password** | Click "Generate a password" or create strong password |
| **Region** | Select closest to your users |

### 2.3 Choose Region
For India, select one of:
- `ap-south-1` (Mumbai) - **Best for India**
- `ap-southeast-1` (Singapore) - Good alternative

### 2.4 Save Your Password!
⚠️ **IMPORTANT:** Copy and save the database password somewhere safe!
You will need this for:
- Backend connection
- Database migrations
- Future access

### 2.5 Create Project
1. Click **"Create new project"**
2. Wait 2-3 minutes for project to initialize
3. You'll see a loading screen with progress

---

## STEP 3: Get Connection Details

### 3.1 Navigate to Database Settings
1. In the left sidebar, click **Settings** (gear icon at bottom)
2. Click **Database** in the settings menu

### 3.2 Find Connection String
1. Scroll down to **"Connection string"** section
2. You'll see different formats:
   - **URI** (what we need)
   - **JDBC**
   - **ODBC**
   - etc.

### 3.3 Copy Connection Details
Click on **URI** tab and copy the string. It looks like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijkl.supabase.co:5432/postgres
```

### 3.4 Note Individual Values
Also note these separately:

| Setting | Value | Example |
|---------|-------|---------|
| **Host** | `db.[PROJECT-REF].supabase.co` | `db.abcdefghijkl.supabase.co` |
| **Port** | `5432` | `5432` |
| **Database** | `postgres` | `postgres` |
| **User** | `postgres` | `postgres` |
| **Password** | Your password | `YourSecurePassword123!` |

### 3.5 Find Project Reference
Your project reference is in the URL:
```
https://supabase.com/dashboard/project/abcdefghijkl
                                       ^^^^^^^^^^^^
                                       This is your PROJECT-REF
```

---

## STEP 4: Configure Connection Pooling (Important!)

### 4.1 Why Connection Pooling?
- Supabase has connection limits
- Pooling allows more concurrent connections
- Required for production apps

### 4.2 Enable Pooling
1. In **Database** settings, scroll to **"Connection Pooling"**
2. Note the **Pooler connection string**:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

### 4.3 Pooler vs Direct Connection
| Type | Port | Use Case |
|------|------|----------|
| **Direct** | 5432 | Migrations, admin tasks |
| **Pooler (Transaction)** | 6543 | Application connections |
| **Pooler (Session)** | 5432 | Long-running connections |

**For our app, use the Transaction pooler (port 6543)**

---

## STEP 5: Migrate Your Database

### Option A: Using SQL Editor (Easiest)

#### 5A.1 Open SQL Editor
1. In Supabase dashboard, click **SQL Editor** in left sidebar
2. Click **"New query"**

#### 5A.2 Export Local Database
Run this command in your local terminal:
```bash
cd /Users/dhilipelango/Documents/Jan\ 12\ Care\ health\ -Arun/hospital-website

# Export database (already done - file exists)
# If you need to re-export:
PGPASSWORD=Ishaan@1622 pg_dump -U postgres hospital_db > hospital_backup_fresh.sql
```

#### 5A.3 Import to Supabase
1. Open `hospital_backup.sql` file in a text editor
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"** (or press Cmd+Enter)
5. Wait for execution to complete

⚠️ **Note:** If the file is too large, split it into smaller parts:
- First run: CREATE TABLE statements
- Second run: INSERT statements
- Third run: ALTER TABLE / constraints

### Option B: Using Command Line

#### 5B.1 Install psql (if not installed)
```bash
# macOS
brew install postgresql
```

#### 5B.2 Import Database
```bash
# Replace with your actual values
PGPASSWORD=YOUR_SUPABASE_PASSWORD psql \
  -h db.YOUR_PROJECT_REF.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  < hospital_backup.sql
```

Example with real values:
```bash
PGPASSWORD=MySecurePassword123 psql \
  -h db.abcdefghijkl.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  < hospital_backup.sql
```

---

## STEP 6: Verify Migration

### 6.1 Check Tables
1. In Supabase dashboard, click **Table Editor** in left sidebar
2. You should see all your tables:
   - `users`
   - `patients`
   - `appointments`
   - `visits`
   - `prescriptions`
   - `organizations`
   - etc.

### 6.2 Verify Data
1. Click on `users` table
2. Verify your user records exist
3. Check `organizations` table for your organization data

### 6.3 Test Connection
Run a simple query in SQL Editor:
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM organizations;
```

---

## STEP 7: Update Backend Environment

### 7.1 Update `.env.production`
Edit `/backend/.env.production` with your Supabase details:

```env
# Database Configuration (Supabase)
DB_HOST=db.YOUR_PROJECT_REF.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_SUPABASE_PASSWORD
DB_NAME=postgres
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

### 7.2 For Railway Deployment
When deploying to Railway, add these environment variables:

| Variable | Value |
|----------|-------|
| `DB_HOST` | `db.YOUR_PROJECT_REF.supabase.co` |
| `DB_PORT` | `5432` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | Your Supabase password |
| `DB_NAME` | `postgres` |
| `DATABASE_URL` | Full connection string |

---

## STEP 8: Security Settings

### 8.1 Enable SSL (Already enabled by default)
Supabase uses SSL by default. Your connection is encrypted.

### 8.2 IP Restrictions (Optional)
1. Go to **Settings** → **Database**
2. Scroll to **"Network Restrictions"**
3. Add allowed IP addresses (for extra security)

### 8.3 Row Level Security (RLS)
Supabase has RLS enabled by default. For our app using backend API:
- RLS policies are not needed (backend handles auth)
- If you see permission errors, you may need to disable RLS on tables

To disable RLS on a table:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
-- Repeat for other tables
```

---

## Quick Reference

### Your Supabase Details (Fill in after setup)

```
Project Name: ayphen-care-hms
Project Reference: ____________________
Region: ____________________

Database Host: db.____________________.supabase.co
Database Port: 5432
Database Name: postgres
Database User: postgres
Database Password: ____________________

Connection String (Direct):
postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres

Connection String (Pooler):
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

---

## Troubleshooting

### Error: Connection refused
- Check if your IP is allowed
- Verify host/port are correct
- Ensure project is active (not paused)

### Error: Password authentication failed
- Double-check password (no extra spaces)
- Reset password in Supabase dashboard if needed

### Error: Database does not exist
- Use `postgres` as database name (not `hospital_db`)
- Supabase uses `postgres` as default database

### Error: Permission denied
- Disable RLS on affected tables
- Check user permissions

### Tables not showing
- Refresh the Table Editor
- Check if migration completed successfully
- Look for errors in SQL Editor output

---

## Next Steps

After Supabase is set up:
1. **Deploy Backend to Railway** - See PRODUCTION_DEPLOYMENT_GUIDE.md
2. **Deploy Frontend to Render** - See PRODUCTION_DEPLOYMENT_GUIDE.md
3. **Test Production** - Verify all features work

---

## Support Links

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Connection Guide:** https://supabase.com/docs/guides/database/connecting-to-postgres
