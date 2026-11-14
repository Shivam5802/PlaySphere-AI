'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Lock, Eye, EyeOff, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { changeUserPassword } from '@/backend/firebase/auth';
import { useToast } from '@/contexts/ToastContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export function ChangePasswordModal({ isOpen, onClose, userEmail }: ChangePasswordModalProps) {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      toast.success('Password updated successfully! Keep your credentials secure.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password. Please verify current credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="w-full max-w-md bg-card border-3 border-black rounded-lg p-6 sm:p-7 shadow-[8px_8px_0px_#000] relative animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded border-2 border-black bg-card hover:bg-rose-500 hover:text-white flex items-center justify-center shadow-[2px_2px_0px_#000] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-md bg-yellow-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <KeyRound className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-display font-black text-xl text-primary uppercase tracking-wide">
              Change Password
            </h3>
            <p className="text-xs text-secondary font-medium">
              Update password for <span className="font-mono text-cyan-400 font-bold">{userEmail || 'account'}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border-2 border-rose-500/40 rounded-md flex items-start gap-2 text-xs font-semibold text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-secondary mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-9 pr-10 py-2.5 bg-input-theme border-2 border-black rounded-md text-sm text-primary font-semibold focus:outline-none focus:border-yellow-400 shadow-[2px_2px_0px_#000]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-secondary mb-1.5">
              New Password <span className="text-slate-400 lowercase font-normal">(min 6 chars)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-10 py-2.5 bg-input-theme border-2 border-black rounded-md text-sm text-primary font-semibold focus:outline-none focus:border-yellow-400 shadow-[2px_2px_0px_#000]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-secondary mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-10 py-2.5 bg-input-theme border-2 border-black rounded-md text-sm text-primary font-semibold focus:outline-none focus:border-yellow-400 shadow-[2px_2px_0px_#000]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold uppercase rounded border-2 border-black bg-card hover:bg-card-hover text-secondary shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs rounded border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-black/20 text-center">
          <p className="text-xs text-secondary">
            Forgot your current password?{' '}
            <Link
              href="/#contact-us"
              onClick={onClose}
              className="text-cyan-500 hover:text-cyan-400 font-bold underline underline-offset-2"
            >
              Contact Support Form
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

