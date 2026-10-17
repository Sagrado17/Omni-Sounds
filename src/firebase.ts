import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase project: Omni Sounds (omni-sounds)
// This app is intentionally connected to the new, empty default Firestore database.
const firebaseConfig = {
  apiKey: "AIzaSyCK-Fe3lNWDvMc5WO4em5MIRDwBeKRHHs8",
  authDomain: "omni-sounds.firebaseapp.com",
  projectId: "omni-sounds",
  storageBucket: "omni-sounds.firebasestorage.app",
  messagingSenderId: "211969082773",
  appId: "1:211969082773:web:ade5bafcc5a1ea148ea29c",
  measurementId: "G-C3GD0NE8YE"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Use the new project's default Firestore database, not the old custom database.
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
