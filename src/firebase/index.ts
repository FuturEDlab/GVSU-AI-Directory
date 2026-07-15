import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

/**
 * Core Firebase initialization logic. 
 * This file serves as the primary barrel for Firebase functionality.
 */

export function initializeFirebase() {
  if (!getApps().length) {
    let app: FirebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      app = initializeApp();
    } catch (e) {
      app = initializeApp(firebaseConfig);
    }
    return getSdks(app);
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

// Export SDK types and core initialization
export type { FirebaseApp, Auth, Firestore, FirebaseStorage };

// Export all hooks and providers for client-side use
export * from './hooks';
