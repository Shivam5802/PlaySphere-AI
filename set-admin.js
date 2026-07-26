const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, setDoc, getDoc } = require('firebase/firestore');

// Helper to manually parse .env.local variables
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1];
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your_firebase_api_key')) {
  console.error("❌ Error: Firebase credentials not configured in .env.local");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const uid = "0JDPIViq9YQS83vAIaahgugunIl1";

async function run() {
  console.log("Connecting to Firestore and setting user role to admin for UID:", uid);
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await updateDoc(userRef, { role: 'admin' });
    console.log("✅ Successfully updated user role to 'admin' in Firestore!");
  } else {
    console.log("ℹ️ User document not found in 'users' collection. Creating a placeholder user doc...");
    await setDoc(userRef, {
      uid: uid,
      role: 'admin',
      displayName: 'Admin User',
      email: '',
      savedVenues: [],
      createdAt: new Date()
    });
    console.log("✅ Successfully created placeholder user document with 'admin' role!");
  }
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Error setting admin role:", err);
  process.exit(1);
});
