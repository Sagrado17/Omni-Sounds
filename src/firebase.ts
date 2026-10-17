import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore connecting to our provisioned database
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || "ai-studio-aegissoundlab-9f8e4aba-34a2-472f-af9c-85811b162fe7");

// Google Auth Provider with Google Drive scopes (drive.file for uploading from device, drive.readonly for browsing)
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// In-memory token cache (NEVER localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Clear cached token when auth state changes to null
onAuthStateChanged(auth, (user: User | null) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const requestGoogleDriveAccess = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter o token de acesso do Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Erro ao conectar ao Google Drive:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

