import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

const initializeFirebaseAdmin = (): admin.app.App | null => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.warn('Firebase Admin SDK not configured. Phone verification will not work.');
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });
    console.log('✅ Firebase Admin SDK initialized');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
};

// Verify Firebase ID token from client
export const verifyFirebaseToken = async (idToken: string): Promise<admin.auth.DecodedIdToken | null> => {
  const app = initializeFirebaseAdmin();
  if (!app) {
    return null;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
};

// Get user by phone number
export const getFirebaseUserByPhone = async (phoneNumber: string): Promise<admin.auth.UserRecord | null> => {
  const app = initializeFirebaseAdmin();
  if (!app) {
    return null;
  }

  try {
    const user = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    console.error('Error getting Firebase user by phone:', error);
    return null;
  }
};

// Check if Firebase Admin is configured
export const isFirebaseAdminConfigured = (): boolean => {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  );
};

export { initializeFirebaseAdmin };
