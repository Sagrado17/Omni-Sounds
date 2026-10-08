import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCW7qF7W6JWvSBFJEK3v0XXq5e8V-b7-pI",
  authDomain: "atomic-setup-6xqhd.firebaseapp.com",
  projectId: "atomic-setup-6xqhd",
  storageBucket: "atomic-setup-6xqhd.firebasestorage.app",
  messagingSenderId: "96153855277",
  appId: "1:96153855277:web:34fd97fd44b0d21aa75fa4"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore connecting to our custom database ID
export const db = getFirestore(app, "ai-studio-aegissoundlab-9f8e4aba-34a2-472f-af9c-85811b162fe7");

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
