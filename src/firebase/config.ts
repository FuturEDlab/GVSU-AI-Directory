export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gvsu-ai-directory",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:848330673133:web:9ccb0c1a77ad4340f275e4",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAsGfF8zdXJVl3jwDq3fUDtUFlPBxlb9oU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gvsu-ai-directory.firebaseapp.com",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gvsu-ai-directory.firebasestorage.app",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "848330673133",
  firestoreDatabaseId: process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-gvsulakeraidirec-b9840b1c-2365-40d8-a6ec-8d6b200bdbfb"
};
