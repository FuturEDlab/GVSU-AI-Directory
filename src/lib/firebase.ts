/**
 * @file lib/firebase.ts
 * @description The main bridge for Firebase services.
 * This file consolidates Auth and Firestore initialization for easy use across the app.
 */

import { initializeFirebase } from "@/firebase";
import { GoogleAuthProvider } from "firebase/auth";

// Initialize the core Firebase SDKs (App, Auth, Firestore)
const { firebaseApp, auth, firestore: db } = initializeFirebase();

// Configure the Google Auth Provider for Laker logins
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // Always ask user to select which Google account to use
});

export { auth, db, googleProvider, firebaseApp };
