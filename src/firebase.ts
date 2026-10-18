import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, User, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appletConfig from '../firebase-applet-config.json';

// Omni Sounds Firebase project. This intentionally uses the new project's
// default Firestore database; no data is copied from the previous project.
// In production (Vercel) the auth helper pages (/__/auth/*) are proxied through
// the site's own domain (see vercel.json). Using the same origin as authDomain
// avoids the cross-site storage blocking that breaks signInWithRedirect in
// Safari, Chrome and in-app browsers. Locally we keep the Firebase default.
const isVercel =
  typeof window !== 'undefined' &&
  window.location.hostname.endsWith('.vercel.app');

const firebaseConfig = {
  apiKey: appletConfig.apiKey,
  authDomain: isVercel ? window.location.host : appletConfig.authDomain,
  projectId: appletConfig.projectId,
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  appId: appletConfig.appId,
  measurementId: appletConfig.measurementId || undefined,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Use the new Omni Sounds project's default Firestore database.
export const db = getFirestore(app);

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

// Keep Google Drive integration and its in-memory token cache.
export const googleProvider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => googleProvider.addScope(scope));
googleProvider.setCustomParameters({ prompt: 'select_account' });

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const setCachedGoogleToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCachedGoogleToken = (): string | null => cachedAccessToken;

export const getGoogleAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  if (auth.currentUser && !isSigningIn) {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        return cachedAccessToken;
      }
    } catch (error) {
      console.warn('Could not refresh Google access token:', error);
    } finally {
      isSigningIn = false;
    }
  }
  return cachedAccessToken;
};

onAuthStateChanged(auth, (user: User | null) => {
  if (!user) cachedAccessToken = null;
});
