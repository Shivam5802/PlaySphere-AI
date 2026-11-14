import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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
    try {
      await ensureUserProfile(result.user, undefined, 'player');
    } catch (profileErr) {
      console.warn('User profile sync skipped/failed during Google sign-in:', profileErr);
    }
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

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(result.user);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('playsphere_session_user');
    }
    return result.user;
  } catch (err: unknown) {
    const normalizedEmail = email.trim().toLowerCase();

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
      ...(defaultRole === 'owner' ? { approvalStatus: 'pending' as const } : {}),
      ...(user.photoURL ? { photoURL: user.photoURL } : {}),
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, profile);
  } else {
    const data = snap.data();
    const updates: Partial<UserProfile> = {};

    if (isAdmin && data.role !== 'admin') {
      updates.role = 'admin';
    } else if (!data.role && isAdmin) {
      updates.role = defaultRole;
    }

    if (!data.displayName) {
      updates.displayName = displayName || user.displayName || 'Player';
    }

    if (!data.email) {
      updates.email = user.email || '';
    }

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

export async function changeUserPassword(currentPassword?: string, newPassword?: string) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  if (!isFirebaseEnabled) {
    return true;
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to change your password.');
  }

  const hasPasswordProvider = user.providerData.some((p: any) => p?.providerId === 'password');

  if (hasPasswordProvider && currentPassword && user.email) {
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
    } catch (reauthErr: any) {
      if (reauthErr.code === 'auth/wrong-password' || reauthErr.code === 'auth/invalid-credential') {
        throw new Error('Current password does not match.');
      }
      throw reauthErr;
    }
  }

  try {
    await updatePassword(user, newPassword);
    return true;
  } catch (err: any) {
    if (err.code === 'auth/requires-recent-login') {
      throw new Error('This action is sensitive. Please log out and sign back in before changing your password.');
    }
    throw err;
  }
}
