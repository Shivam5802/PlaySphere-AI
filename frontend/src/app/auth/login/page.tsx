'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Shield } from 'lucide-react';
import { signInWithEmail, signInWithGoogle } from '@/backend/firebase/auth';
import { db } from '@/backend/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/contexts/ToastContext';

function formatAuthError(err: any): string {
  if (!err) return 'Authentication failed. Please try again.';
  const code = err.code || '';
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
    return `Domain "${host}" is not authorized in Firebase Console. If using http://127.0.0.1:3000, please open http://localhost:3000 instead, or add "${host}" to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups or try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in window was closed before completing.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Another sign-in request is already in progress.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google Sign-In is not enabled in Firebase Console. Enable Google under Authentication -> Sign-in method.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password. Please try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network request failed. Please check your internet connection.';
  }
  return err.message ? `${err.message} (${code || 'error'})` : 'Authentication failed. Please try again.';
}

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { user, loading: authLoading, isAdmin, isOwner } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) router.push('/admin');
      else if (isOwner) router.push('/owner');
      else router.push('/dashboard');
    }
  }, [user, authLoading, router, isAdmin, isOwner]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser = await signInWithEmail(email, password);
      toast.success('Signed in successfully! Redirecting...');

      try {
        const userDocSnap = await getDoc(doc(db, 'users', loggedUser.uid));
        const role = userDocSnap.exists() ? userDocSnap.data()?.role : null;

        const adminEmails = (
          process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
          process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
          ''
        )
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean);

        const isUserAdmin = adminEmails.includes(loggedUser.email?.toLowerCase() || '');

        if (isUserAdmin) {
          router.push('/admin');
        } else if (role === 'owner') {
          router.push('/owner');
        } else {
          router.push('/dashboard');
        }
      } catch {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      const code = firebaseError?.code || '';

      let message = 'Invalid email or password. Please try again.';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        message = 'Invalid email or password. Please try again.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please wait a moment and try again.';
      } else if (code === 'auth/user-disabled') {
        message = 'This account has been disabled.';
      } else if (code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google! Redirecting...');
      // Redirect handled by useEffect
    } catch {
      toast.error('Google sign-in was cancelled or failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-black text-slate-200 mt-2 uppercase tracking-wide">Welcome back !!</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Sign in to continue your sports journey</p>
        </div>

        <div className="bg-slate-900 border-3 border-black rounded-lg p-8 shadow-[8px_8px_0px_0px_#000]">
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-display font-black border-3 border-black rounded-md py-3 mb-6 shadow-[4px_4px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[6px_6px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#000] transition-all disabled:opacity-50 cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-0.5 bg-black" />
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">or sign in with email</span>
            <div className="flex-1 h-0.5 bg-black" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-11 placeholder-slate-500"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-11 pr-11 placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors z-10"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-end -mt-2">
              <Link
                href="/contact"
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider underline decoration-black underline-offset-4 hover:-translate-y-0.5 active:translate-y-0 inline-block"
              >
                Forgot Password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-6 font-medium">
            New to PlaySphere?{' '}
            <Link href="/auth/signup" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors underline decoration-black underline-offset-4">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
