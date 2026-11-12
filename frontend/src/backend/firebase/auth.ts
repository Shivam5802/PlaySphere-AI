import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db, isFirebaseEnabled } from './config';
import { UserProfile, UserRole } from '@/shared/types';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function getAdminEmails(): string[] {
  const rawEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const rawEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
  const combined = `${rawEmails},${rawEmail}`;
  return combined
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function signInWithGoogle() {
  if (!isFirebaseEnabled) {
    const mockUser = {
      uid: 'mock-google-user-id',
      email: 'google-user@example.com',
      displayName: 'Mock Google User',
    } as any;
    const mockProfile = {
      uid: 'mock-google-user-id',
      email: 'google-user@example.com',
      displayName: 'Mock Google User',
      role: 'player',
      savedVenues: [],
    } as any;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem('mock_profile', JSON.stringify(mockProfile));
      document.cookie = `auth-token=mock-token; path=/; max-age=${3600 * 24 * 7}; SameSite=Lax`;
      window.location.reload();
    }
    return mockUser;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Google sign-in always defaults to 'player' role (unless email is whitelisted admin)
    await ensureUserProfile(result.user, undefined, 'player');
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      console.warn('Popup blocked, falling back to sign-in with redirect...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn('Google sign-in popup closed by user.');
      return null;
    }
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  if (!isFirebaseEnabled) {
    const adminEmails = getAdminEmails();
    const userEmail = email.toLowerCase();
    const isAdmin = adminEmails.length > 0 && adminEmails.includes(userEmail);
    
    let role: UserRole = 'player';
    let name = 'Demo User';
    
    if (isAdmin || email === 'admin@playsphere.in') {
      role = 'admin';
      name = 'System Admin';
    } else if (email === 'rahul@playsphere.in') {
      role = 'owner';
      name = 'Rahul Verma (Owner)';
    } else if (email === 'arjun@playsphere.in') {
      role = 'player';
      name = 'Arjun Sharma';
    } else {
      role = 'player';
      name = email.split('@')[0];
    }

    const mockUser = {
      uid: `mock-uid-${role}`,
      email: email,
      displayName: name,
    } as any;
    const mockProfile = {
      uid: `mock-uid-${role}`,
      email: email,
      displayName: name,
      role: role,
      savedVenues: [],
      approvalStatus: role === 'owner' ? 'approved' : undefined,
    } as any;

    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem('mock_profile', JSON.stringify(mockProfile));
      document.cookie = `auth-token=mock-token; path=/; max-age=${3600 * 24 * 7}; SameSite=Lax`;
      window.location.reload();
    }
    return mockUser;
  }

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  if (
    adminEmail &&
    adminPassword &&
    email.trim().toLowerCase() === adminEmail &&
    password === adminPassword
  ) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserProfile(result.user, 'Super Admin', 'player');
      return result.user;
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (
        firebaseError?.code === 'auth/invalid-credential' ||
        firebaseError?.code === 'auth/user-not-found'
      ) {
        const newAdmin = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(newAdmin.user, { displayName: 'Super Admin' });
        await ensureUserProfile(newAdmin.user, 'Super Admin', 'player');
        return newAdmin.user;
      }
      throw err;
    }
  }

  // 2. Standard Firebase Auth sign-in attempt
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(result.user);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('playsphere_session_user');
    }
    return result.user;
  } catch (err: unknown) {
    const normalizedEmail = email.trim().toLowerCase();

    // 2b. Check typo in domain (e.g. gamil.com <-> gmail.com)
    let alternateEmail: string | null = null;
    if (normalizedEmail.includes('@gmail.com')) {
      alternateEmail = normalizedEmail.replace('@gmail.com', '@gamil.com');
    } else if (normalizedEmail.includes('@gamil.com')) {
      alternateEmail = normalizedEmail.replace('@gamil.com', '@gmail.com');
    }

    if (alternateEmail) {
      try {
        const altResult = await signInWithEmailAndPassword(auth, alternateEmail, password);
        await ensureUserProfile(altResult.user);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('playsphere_session_user');
        }
        return altResult.user;
      } catch {}
    }

    // 3. Fallback: check if the Super Admin directly set a password override in Firestore
    try {
      const usersSnap = await getDocs(
        query(collection(db, 'users'), where('email', '==', normalizedEmail))
      );

      let matchedDoc = !usersSnap.empty ? usersSnap.docs[0] : null;
      if (!matchedDoc && alternateEmail) {
        const altSnap = await getDocs(
          query(collection(db, 'users'), where('email', '==', alternateEmail))
        );
        if (!altSnap.empty) {
          matchedDoc = altSnap.docs[0];
        }
      }

      if (matchedDoc) {
        const userData = matchedDoc.data() as UserProfile & { adminPasswordOverride?: string };

        if (userData.adminPasswordOverride && userData.adminPasswordOverride === password) {
          const sessionUser = {
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName || 'User',
            photoURL: userData.photoURL || null,
            getIdToken: async () => 'admin-override-token',
          } as unknown as User;

          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'playsphere_session_user',
              JSON.stringify({
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName || 'User',
                photoURL: userData.photoURL || null,
              })
            );
            document.cookie = `auth-token=override-token; path=/; max-age=${3600 * 24 * 7}; SameSite=Lax`;
          }

          return sessionUser;
        }
      }
    } catch (checkErr) {
      console.warn('Admin password override check failed:', checkErr);
    }

    throw err;
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: 'player' | 'owner' = 'player'
) {
  if (!isFirebaseEnabled) {
    const mockUser = {
      uid: `mock-uid-${role}-${Date.now()}`,
      email: email,
      displayName: displayName,
    } as any;
    const mockProfile = {
      uid: mockUser.uid,
      email: email,
      displayName: displayName,
      role: role,
      savedVenues: [],
      approvalStatus: role === 'owner' ? 'approved' : undefined,
    } as any;

    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem('mock_profile', JSON.stringify(mockProfile));
      document.cookie = `auth-token=mock-token; path=/; max-age=${3600 * 24 * 7}; SameSite=Lax`;
      window.location.reload();
    }
    return mockUser;
  }

  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await ensureUserProfile(result.user, displayName, role);
  return result.user;
}

export async function logOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('playsphere_session_user');
    localStorage.removeItem('mock_user');
    localStorage.removeItem('mock_profile');
    document.cookie = `auth-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
  if (!isFirebaseEnabled) {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return;
  }
  await signOut(auth);
}

export async function ensureUserProfile(user: User, displayName?: string, role?: UserRole) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const adminEmails = getAdminEmails();
  const userEmail = user.email?.toLowerCase() || '';
  const isAdmin = adminEmails.length > 0 && adminEmails.includes(userEmail);
  const defaultRole: UserRole = isAdmin ? 'admin' : (role || 'player');

  if (!snap.exists()) {
    const profile: Omit<UserProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
      uid: user.uid,
      displayName: displayName || user.displayName || 'Player',
      email: user.email || '',
      savedVenues: [],
      role: defaultRole,
      // Owners start as pending approval; players and admins have no approvalStatus needed
      ...(defaultRole === 'owner' ? { approvalStatus: 'pending' as const } : {}),
      ...(user.photoURL ? { photoURL: user.photoURL } : {}),
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, profile);
  } else {
    // If it exists, let's verify if there are legacy fields or missing fields
    const data = snap.data();
    const updates: Partial<UserProfile> = {};

    // 1. If role is missing, or is 'user', map it to 'player' (or defaultRole/admin)
    if (!data.role || data.role === 'user') {
      updates.role = defaultRole;
    } else if (isAdmin && data.role !== 'admin') {
      // If user is whitelisted admin but role in database is different, update to admin
      updates.role = 'admin';
    }

    // 2. If displayName is missing, fill it
    if (!data.displayName) {
      updates.displayName = displayName || user.displayName || 'Player';
    }

    // 3. If email is missing, fill it
    if (!data.email) {
      updates.email = user.email || '';
    }

    // 4. If savedVenues is missing, fill it
    if (!data.savedVenues) {
      updates.savedVenues = [];
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
    }
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
