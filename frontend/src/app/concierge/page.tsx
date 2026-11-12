'use client';

import Link from 'next/link';
import {
  Bot,
  Sparkles,
  Lock,
  LogIn,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  Compass,
  MessageSquareText,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { AIConciergePreview } from '@/components/ai/AIConciergePreview';

export default function ConciergePage() {
  const { user, profile, loading } = useAuth();

  return (
    <div className="min-h-screen bg-canvas py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* ── Top Header ────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <h1
            className="text-4xl sm:text-6xl font-black uppercase tracking-[0.04em] text-primary mb-3"
            style={{ fontFamily: 'var(--font-bebas), sans-serif', textShadow: '3px 3px 0px #000' }}
          >
            PlaySphere <span className="gradient-text">AI Concierge</span>
          </h1>

          <p className="text-slate-500 max-w-2xl mx-auto font-semibold text-sm sm:text-base">
            Your conversational sports copilot for Lucknow. Find courts, compare pricing, check rules and book instantly using natural language.
          </p>
        </div>

        {/* ── Loading State ───────────────────────────────────────── */}
        {loading ? (
          <div className="bg-card border-3 border-black p-12 text-center rounded-sm shadow-[6px_6px_0px_#000] max-w-xl mx-auto">
            <div className="inline-block animate-spin text-yellow-400 mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black uppercase text-primary mb-2 font-display">
              Verifying Player Credentials...
            </h2>
            <p className="text-slate-400 text-sm font-semibold">
              Connecting to PlaySphere AI & Firebase session
            </p>
          </div>
        ) : !user ? (
          /* ── NOT LOGGED IN: Authentication Gate ─────────────────── */
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border-3 border-black rounded-sm shadow-[8px_8px_0px_#000] overflow-hidden">
              {/* Banner */}
              <div className="bg-yellow-400 text-black px-6 py-4 border-b-3 border-black flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-black uppercase text-sm tracking-wider">
                  <Lock className="w-5 h-5 stroke-[2.5px]" />
                  <span>Member Authentication Required</span>
                </div>
                <span className="text-[11px] font-mono font-bold bg-black text-white px-2.5 py-0.5 rounded-sm">
                  LOCKED
                </span>
              </div>

              <div className="p-8 sm:p-10">
                <div className="text-center max-w-xl mx-auto mb-8">
                  <div className="w-16 h-16 rounded-full bg-yellow-400/20 border-3 border-black mx-auto mb-5 flex items-center justify-center shadow-[3px_3px_0px_#000]">
                    <Bot className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h2
                    className="text-3xl sm:text-4xl font-black uppercase text-primary mb-3"
                    style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
                  >
                    Unlock Full AI Concierge Access
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base font-semibold leading-relaxed">
                    To use the interactive AI Concierge for direct slot reservations, personalized history, and autonomous booking suggestions, please sign in to your PlaySphere account.
                  </p>
                </div>

                {/* Two Action Buttons: Login vs Try Free Demo */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                  <Link
                    href="/auth/login?redirect=/concierge"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-yellow-400 text-black font-black uppercase tracking-wider text-sm border-2 border-black rounded-sm shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] active:translate-x-0 active:translate-y-0 transition-all duration-150 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 stroke-[2.5px]" />
                    <span>Login to Continue</span>
                  </Link>

                  <Link
                    href="/#ai-concierge"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-card hover:bg-card-hover text-primary font-black uppercase tracking-wider text-sm border-2 border-black rounded-sm shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#22d3ee] active:translate-x-0 active:translate-y-0 transition-all duration-150 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                    <span>Try Free Demo (No Login)</span>
                    <ArrowRight className="w-4 h-4 stroke-[2px]" />
                  </Link>
                </div>

                {/* Don't have an account */}
                <div className="text-center text-xs text-slate-500 font-semibold mb-8">
                  Don&apos;t have an account yet?{' '}
                  <Link
                    href="/auth/signup?redirect=/concierge"
                    className="text-yellow-400 hover:underline font-bold"
                  >
                    Sign up for free
                  </Link>
                </div>

                {/* Feature breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t-2 border-black/30">
                  <div className="bg-card-nested border-2 border-black p-4 rounded-sm shadow-[2px_2px_0px_#000]">
                    <div className="w-8 h-8 rounded bg-cyan-400 text-black border border-black flex items-center justify-center mb-2.5 font-bold">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="font-display font-black text-xs uppercase text-primary mb-1">
                      Natural Language Intent
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Ask in plain English: budget, location, sports, or group size.
                    </div>
                  </div>

                  <div className="bg-card-nested border-2 border-black p-4 rounded-sm shadow-[2px_2px_0px_#000]">
                    <div className="w-8 h-8 rounded bg-yellow-400 text-black border border-black flex items-center justify-center mb-2.5 font-bold">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="font-display font-black text-xs uppercase text-primary mb-1">
                      Instant Slot Booking
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Receive pre-filled booking tickets right inside the chat stream.
                    </div>
                  </div>

                  <div className="bg-card-nested border-2 border-black p-4 rounded-sm shadow-[2px_2px_0px_#000]">
                    <div className="w-8 h-8 rounded bg-pink-400 text-black border border-black flex items-center justify-center mb-2.5 font-bold">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="font-display font-black text-xs uppercase text-primary mb-1">
                      Discovery & Guidance
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Switch modes for sports coaching, court etiquette, and advice.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── LOGGED IN: Full AI Concierge Experience ────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left sidebar / Helper panel */}
            <div className="lg:col-span-4 space-y-6">
              {/* User Session Card */}
              <div className="bg-card border-3 border-black p-5 rounded-sm shadow-[4px_4px_0px_#000]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-400 border-2 border-black flex items-center justify-center font-black text-black">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      Authenticated Member
                    </div>
                    <div className="font-black text-sm text-primary truncate">
                      {profile?.displayName || user.displayName || user.email || 'Player'}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-medium leading-relaxed">
                  Your AI concierge session is active. All recommendations are personalized according to your preferences.
                </div>
              </div>

              {/* Quick Prompts to Try */}
              <div className="bg-card border-3 border-black p-5 rounded-sm shadow-[4px_4px_0px_#000]">
                <div className="flex items-center gap-2 mb-4 font-black uppercase text-xs tracking-wider text-yellow-400">
                  <MessageSquareText className="w-4 h-4" />
                  <span>Popular Lucknow Prompts</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    'Badminton court near Gomti Nagar under ₹400',
                    'Football turf for 10 friends this Saturday',
                    'Cheapest swimming pool near Hazratganj',
                    'Traditional Akhara for wrestling practice',
                    'Indoor cricket net with floodlights',
                  ].map((promptText) => (
                    <div
                      key={promptText}
                      className="text-xs font-semibold text-slate-300 bg-card-nested border border-black p-2.5 rounded-sm shadow-[1px_1px_0px_#000]"
                    >
                      &ldquo;{promptText}&rdquo;
                    </div>
                  ))}
                </div>
              </div>

              {/* Try Free Demo on Landing Page link */}
              <div className="bg-card-nested border-2 border-black p-4 rounded-sm text-center">
                <p className="text-xs text-slate-400 font-semibold mb-3">
                  Want to compare with the landing page preview widget?
                </p>
                <Link
                  href="/#ai-concierge"
                  className="inline-flex items-center gap-2 text-xs font-black text-yellow-400 hover:text-yellow-300 uppercase tracking-wider transition-colors"
                >
                  <span>Go to Landing Page Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right column: Full interactive AI Concierge */}
            <div className="lg:col-span-8">
              <AIConciergePreview fullPage={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

