'use client';

import Link from 'next/link';
import { Zap, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* 404 Display */}
        <div className="relative mb-8 select-none">
          <div
            className="text-[9rem] md:text-[12rem] leading-none gradient-text font-black"
            style={{
              fontFamily: 'var(--font-bebas), sans-serif',
              letterSpacing: '0.04em',
              filter: 'drop-shadow(5px 5px 0px #000000)',
            }}
          >
            404
          </div>
        </div>

        <h1
          className="text-3xl md:text-4xl font-black text-slate-100 uppercase tracking-[0.08em] mb-4"
          style={{
            fontFamily: 'var(--font-bebas), sans-serif',
            textShadow: '3px 3px 0px #000000',
          }}
        >
          Page Not Found
        </h1>
        <p className="text-slate-500 mb-10 leading-relaxed font-semibold">
          Looks like this venue doesn&apos;t exist in our playbook. The page you&apos;re looking for may have moved or been removed.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary justify-center py-3.5">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
          <Link href="/venues" className="btn-secondary justify-center py-3.5">
            <Search className="w-4 h-4" /> Browse Venues
          </Link>
        </div>

        {/* Decorative floating squares */}
        <div className="mt-16 flex justify-center gap-5">
          {[
            { emoji: '🏸', delay: 'animation-delay-150ms' },
            { emoji: '⚽', delay: 'animation-delay-300ms' },
            { emoji: '🏊', delay: 'animation-delay-500ms' },
            { emoji: '🤼', delay: '' },
          ].map(({ emoji, delay }) => (
            <span
              key={emoji}
              className={`text-3xl opacity-40 animate-float ${delay} inline-block`}
            >
              {emoji}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
