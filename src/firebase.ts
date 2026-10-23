import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, User, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appletConfig from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: appletConfig.apiKey || "AIzaSyDSpGOD43I4JdogJzVlSPaWjKVjxDClbm4",
  authDomain: appletConfig.authDomain || "gen-lang-client-0514895490.firebaseapp.com",
  projectId: appletConfig.projectId || "gen-lang-client-0514895490",
  storageBucket: appletConfig.storageBucket || "gen-lang-client-0514895490.firebasestorage.app",
  messagingSenderId: appletConfig.messagingSenderId || "912237203324",
  appId: appletConfig.appId || "1:912237203324:web:62aedb454ed33d964fdef9"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore connecting to custom database ID
export const db = getFirestore(app, appletConfig.firestoreDatabaseId || "ai-studio-aegissoundlab-9f8e4aba-34a2-472f-af9c-85811b162fe7");

// Google Auth Provider configured with Google Drive scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Cache the access token in memory (never localStorage per security constitution)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const setCachedGoogleToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCachedGoogleToken = (): string | null => {
  return cachedAccessToken;
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  // If user is logged in, try silent or popup sign-in to refresh Google credentials
  if (auth.currentUser && !isSigningIn) {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        return cachedAccessToken;
      }
    } catch (e) {
      console.warn("Could not get Google access token silently:", e);
    } finally {
      isSigningIn = false;
    }
  }
  return cachedAccessToken;
};

// Clear token on sign out
onAuthStateChanged(auth, (user: User | null) => {
  if (!user) {
    cachedAccessToken = null;
  }
});
