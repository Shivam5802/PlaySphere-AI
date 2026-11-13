// Firebase configuration and initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasValidKeys = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your_firebase_api_key' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id';

let app: any;
let auth: any;
let db: any;

if (hasValidKeys) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.error('Failed to set Firebase Auth persistence:', err);
    });
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch (error) {
    console.error('Failed to initialize Firebase with provided credentials:', error);
  }
} else {
  if (typeof window !== 'undefined') {
    console.warn('⚠️ PlaySphere Warning: Firebase environment variables are not configured in .env.local. App is running in mock UI mode.');
  }
  app = {} as any;
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
  } as any;
  db = {} as any;
}

export { app, auth, db, hasValidKeys as isFirebaseEnabled };
export default app;

