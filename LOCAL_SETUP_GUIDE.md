# Local Development Setup Guide - Ayphen Care HMS

## Overview
This guide documents the local development setup for the Ayphen Care Hospital Management System, migrated from Docker to full local development.

---

## Migration Completed: February 19, 2026

---

## Prerequisites

### Required Software
- **Node.js:** 18+ (check with `node -v`)
- **PostgreSQL:** 14+ (installed via Homebrew)
- **npm:** Comes with Node.js

### Verified Versions
```bash
node -v    # v18.x or higher
psql --version  # PostgreSQL 14.19 (Homebrew)
```

---

## Current Configuration

### Database
- **Host:** localhost
- **Port:** 5432 (standard PostgreSQL port)
- **Database:** hospital_db
- **User:** postgres
- **Password:** Ishaan@1622

### Backend
- **Port:** 5001
- **API URL:** http://localhost:5001/api
- **API Docs:** http://localhost:5001/api-docs

### Frontend
- **Port:** 3000
- **URL:** http://localhost:3000

---

## Quick Start

### Start PostgreSQL (if not running)
```bash
brew services start postgresql@14
```

### Start Backend
```bash
cd /Users/dhilipelango/Documents/Jan\ 12\ Care\ health\ -Arun/hospital-website/backend
npm run dev
```

### Start Frontend (in new terminal)
```bash
cd /Users/dhilipelango/Documents/Jan\ 12\ Care\ health\ -Arun/hospital-website/frontend
npm start
```

### Access Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001/api
- **API Documentation:** http://localhost:5001/api-docs

---

## Environment Files

### Backend `.env`
```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Ishaan@1622
DB_NAME=hospital_db

# Other configs remain unchanged (JWT, SMTP, Firebase)
```

### Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:5001/api
WDS_SOCKET_PORT=0

# Firebase configs remain unchanged
```

---

## Database Management

### Connect to Database
```bash
PGPASSWORD=Ishaan@1622 psql -U postgres -d hospital_db
```

### Backup Database
```bash
PGPASSWORD=Ishaan@1622 pg_dump -U postgres hospital_db > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
PGPASSWORD=Ishaan@1622 psql -U postgres -d hospital_db < backup_file.sql
```

### Reset Database (if needed)
```bash
PGPASSWORD=Ishaan@1622 psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS hospital_db;"
PGPASSWORD=Ishaan@1622 psql -U postgres -d postgres -c "CREATE DATABASE hospital_db;"
PGPASSWORD=Ishaan@1622 psql -U postgres -d hospital_db < hospital_backup.sql
```

---

## Switching Back to Docker

If you need to switch back to Docker:

### 1. Stop Local Services
```bash
# Stop frontend (Ctrl+C in terminal)
# Stop backend (Ctrl+C in terminal)
```

### 2. Update Backend `.env` for Docker
```env
DB_HOST=postgres
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
```

### 3. Start Docker
```bash
cd /Users/dhilipelango/Documents/Jan\ 12\ Care\ health\ -Arun/hospital-website
docker-compose up -d
```

---

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql@14

# Check connection
PGPASSWORD=Ishaan@1622 psql -U postgres -d hospital_db -c "SELECT 1;"
```

### Port Already in Use
```bash
# Find process using port
lsof -i :5001  # Backend
lsof -i :3000  # Frontend

# Kill process
kill -9 <PID>
```

### Database Not Found
```bash
# List databases
PGPASSWORD=Ishaan@1622 psql -U postgres -c "\l"

# Create if missing
PGPASSWORD=Ishaan@1622 psql -U postgres -c "CREATE DATABASE hospital_db;"
```

---

## Files Modified During Migration

| File | Change |
|------|--------|
| `backend/.env` | Updated DB_PORT to 5432, DB_PASSWORD to local password |
| `hospital_backup.sql` | Database backup created from Docker |

---

## Benefits of Local Development

1. **Faster hot-reload** - No Docker layer
2. **Easier debugging** - Direct access to processes
3. **Lower resource usage** - No Docker overhead
4. **Simpler setup** - No Docker knowledge required

---

## Docker Files (Preserved)

The following Docker files are preserved for future use:
- `docker-compose.yml`
- `Dockerfile` (backend)
- `frontend/Dockerfile`

You can switch back to Docker anytime using the instructions above.

---

## Support

For issues with local setup:
1. Check PostgreSQL is running
2. Verify environment variables
3. Check port availability
4. Review console logs for errors
