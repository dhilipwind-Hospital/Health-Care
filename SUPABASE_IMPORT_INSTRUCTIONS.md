# Supabase Database Import Instructions

## Manual Import via SQL Editor

Since command-line connection isn't working due to IPv4 compatibility, follow these steps to import your database through Supabase's web interface.

---

## Step 1: Open SQL Editor

1. In Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button

---

## Step 2: Open the Export File

On your computer:
1. Navigate to: `/Users/dhilipelango/Documents/Jan 12 Care health -Arun/hospital-website/`
2. Open the file: `hospital_supabase_export.sql` in a text editor (TextEdit, VS Code, etc.)

---

## Step 3: Import in Sections

The file is too large to paste all at once. Import it in these sections:

### Section 1: Schema (Lines 1-4900)
1. Copy lines 1 to 4900 from `hospital_supabase_export.sql`
2. Paste into Supabase SQL Editor
3. Click **"Run"** (or press Cmd+Enter)
4. Wait for completion (green checkmark)

### Section 2: Data Part 1 (Lines 4901-7000)
1. Copy lines 4901 to 7000
2. Paste into SQL Editor (clear previous query first)
3. Click **"Run"**
4. Wait for completion

### Section 3: Data Part 2 (Lines 7001-10349)
1. Copy lines 7001 to end of file
2. Paste into SQL Editor
3. Click **"Run"**
4. Wait for completion

---

## Step 4: Verify Import

1. Click **"Table Editor"** in left sidebar
2. Check that you see all tables:
   - users
   - patients
   - appointments
   - visits
   - prescriptions
   - organizations
   - departments
   - etc.

3. Click on `users` table
4. Verify you see your user data

---

## Alternative: Use Supabase CLI (If you want to try)

Install Supabase CLI:
```bash
brew install supabase/tap/supabase
```

Login:
```bash
supabase login
```

Link project:
```bash
supabase link --project-ref vbpnznobomgjcoqyqopr
```

Import:
```bash
supabase db push
```

---

## If You Get Errors

### "Extension already exists"
- Ignore these warnings, they're safe

### "Permission denied"
- Run this first in SQL Editor:
```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
```

### "Table already exists"
- The export file has `DROP TABLE IF EXISTS` commands
- If you see this error, run this first:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
```

---

## Next Steps After Import

Once database is imported:
1. Update backend `.env.production` with Supabase credentials
2. Deploy backend to Railway
3. Deploy frontend to Render

See `PRODUCTION_DEPLOYMENT_GUIDE.md` for details.
