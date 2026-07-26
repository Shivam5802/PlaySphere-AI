const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  // 1. Authenticate as Admin (created by test-verification suite)
  console.log("Signing in as Admin (testadmin3@gmail.com)...");
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, 'testadmin3@gmail.com', 'password123');
    console.log("✅ Authenticated successfully! Admin UID:", userCredential.user.uid);
  } catch (err) {
    console.error("❌ Authentication failed. Make sure your database has been seeded at http://localhost:3000/api/test-verification first.");
    console.error(err.message);
    process.exit(1);
  }

  // 2. Perform updates with authenticated Admin context
  const targets = [
    {
      uid: "7IA09Lq0kXSFv2bhaRUnLi0gmz52",
      role: "admin",
      displayName: "Admin User"
    },
    {
      uid: "4ssoybaMBKMcfkrZI33e0NdthYi1",
      role: "owner",
      approvalStatus: "approved",
      displayName: "Venue Owner"
    },
    {
      uid: "0JDPIViq9YQS83vAIaahgugunIl1",
      role: "admin",
      displayName: "S Jaiswal (Google Admin)"
    }
  ];

  for (const target of targets) {
    const userRef = doc(db, 'users', target.uid);
    console.log(`Setting role to '${target.role}' for UID: ${target.uid}...`);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const updates = { role: target.role };
        if (target.approvalStatus) updates.approvalStatus = target.approvalStatus;
        await updateDoc(userRef, updates);
        console.log(`  ✅ Successfully updated user doc!`);
      } else {
        const profile = {
          uid: target.uid,
          role: target.role,
          displayName: target.displayName,
          email: "",
          savedVenues: [],
          createdAt: new Date()
        };
        if (target.approvalStatus) profile.approvalStatus = target.approvalStatus;
        await setDoc(userRef, profile);
        console.log(`  ✅ Successfully created new user doc!`);
      }
    } catch (err) {
      console.error(`  ❌ Error updating UID ${target.uid}:`, err.message);
    }
  }

  console.log("\n🎉 All roles configured successfully!");
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
