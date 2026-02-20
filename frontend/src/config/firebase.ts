import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase only if config is available
let app: any = null;
let auth: any = null;

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

// Setup invisible reCAPTCHA verifier
export const setupRecaptcha = (containerId: string): RecaptchaVerifier | null => {
  if (!auth) {
    console.warn('Firebase not configured. Phone auth will not work.');
    return null;
  }
  
  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA verified');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    }
  });
  
  return verifier;
};

// Send OTP to phone number
export const sendOTP = async (
  phoneNumber: string, 
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult | null> => {
  if (!auth) {
    console.warn('Firebase not configured');
    return null;
  }
  
  try {
    // Ensure phone number is in E.164 format
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    return confirmationResult;
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

// Verify OTP code
export const verifyOTP = async (
  confirmationResult: ConfirmationResult, 
  otpCode: string
): Promise<any> => {
  try {
    const result = await confirmationResult.confirm(otpCode);
    return result.user;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// Get Firebase ID token for backend verification
export const getFirebaseIdToken = async (): Promise<string | null> => {
  if (!auth || !auth.currentUser) {
    return null;
  }
  
  try {
    const token = await auth.currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting Firebase ID token:', error);
    return null;
  }
};

// Sign out from Firebase
export const firebaseSignOut = async (): Promise<void> => {
  if (auth) {
    await auth.signOut();
  }
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return !!firebaseConfig.apiKey && !!auth;
};

export { auth, app };
export type { ConfirmationResult };
