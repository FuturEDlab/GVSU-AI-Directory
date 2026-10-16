import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin if it hasn't been initialized already
if (!getApps().length) {
  try {
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gvsu-ai-directory',
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const FIRESTORE_DATABASE_ID =
  process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID ||
  'ai-studio-gvsulakeraidirec-b9840b1c-2365-40d8-a6ec-8d6b200bdbfb';

export const adminDb = getFirestore(FIRESTORE_DATABASE_ID);
export const adminAuth = getAuth();
