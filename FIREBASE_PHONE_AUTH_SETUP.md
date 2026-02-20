# Firebase Phone Authentication Setup Guide

## Step 1: Create Firebase Project (One-time setup)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Enter project name (e.g., "ayphen-care-hospital")
4. Disable Google Analytics (optional) and click "Create project"

## Step 2: Enable Phone Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Phone** and enable it
3. Add your domain to authorized domains:
   - `localhost` (for development)
   - Your production domain

## Step 3: Get Firebase Configuration

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to "Your apps" section
3. Click **Web** icon (</>) to add a web app
4. Register app with nickname (e.g., "hospital-web")
5. Copy the Firebase configuration object

## Step 4: Add Configuration to Environment

Add these to your `.env` files:

### Frontend (.env)
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Backend (.env)
```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
```

## Step 5: Get Service Account Key (for Backend)

1. Go to **Project Settings** → **Service accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. Extract `project_id`, `private_key`, and `client_email` for backend .env

## Step 6: Set Up Test Phone Numbers (Development)

1. Go to **Authentication** → **Sign-in method** → **Phone**
2. Scroll to "Phone numbers for testing"
3. Add test numbers like:
   - `+1 650-555-1234` with code `123456`
   - `+91 9999999999` with code `123456`

## Free Tier Limits

- **Spark Plan (Free):** 10,000 verifications/month
- **No credit card required** for Spark plan
- Test phone numbers don't count against quota

## Troubleshooting

### reCAPTCHA Issues
- Ensure domain is added to authorized domains
- Use invisible reCAPTCHA for better UX

### SMS Not Received
- Check if phone number format is correct (E.164 format: +1234567890)
- Verify phone authentication is enabled
- Check Firebase quota usage

### Rate Limiting
- Firebase limits SMS to same number: 5 per 4 hours
- Use test phone numbers during development
