'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Menu, X, Zap, LogOut, LayoutDashboard, Building2, Shield, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { useTheme } from '@/contexts/ThemeProvider';
import { logOut } from '@/backend/firebase/auth';
import { cn } from '@/shared/helpers/utils';

const NAV_LINKS = [
  { href: '/venues', label: 'Discover' },
  { href: '/venues?tab=map', label: 'Map View' },
  { href: '/squads', label: 'Find Squad' },
  { href: '/concierge', label: 'AI Concierge' },
  { href: '/about', label: 'About Us' },
];

function NavLinksList({
  mobile = false,
  onClose,
}: {
  mobile?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isLinkActive = (href: string) => {
    if (href === '/venues?tab=map') {
      return pathname === '/venues' && searchParams.get('tab') === 'map';
    }
    if (href === '/venues') {
      return pathname === '/venues' && searchParams.get('tab') !== 'map';
    }
    if (href === '/squads') {
      return pathname === '/squads';
    }
    if (href === '/concierge') {
      return pathname === '/concierge';
    }
    if (href === '/about') {
      return pathname === '/about';
    }
    return pathname === href;
  };

  return (
    <>
      {NAV_LINKS.map((link) => {
        const isActive = isLinkActive(link.href);
        if (mobile) {
          return (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={onClose}
              className={cn(
                'flex items-center text-xs font-black uppercase tracking-[0.1em] py-2.5 px-3 border-2 transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-yellow-400 text-black border-black shadow-[2px_2px_0px_#000]'
                  : 'text-slate-400 border-transparent hover:text-yellow-400 hover:bg-card hover:border-yellow-400/30'
              )}
            >
              {link.label}
            </Link>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] transition-all duration-150 border-2 rounded-sm cursor-pointer',
              isActive
                ? 'bg-yellow-400 text-black border-black shadow-[2px_2px_0px_#000]'
                : 'text-slate-400 border-transparent hover:text-yellow-400 hover:border-yellow-400/40'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function NavLinksFallback({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map((link) => {
        const isActive = link.href === '/about' && pathname === '/about';
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              mobile
                ? 'flex items-center text-xs font-black uppercase tracking-[0.1em] py-2.5 px-3 border-2 transition-all duration-150 text-slate-400 border-transparent cursor-pointer'
                : 'px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] transition-all duration-150 border-2 rounded-sm cursor-pointer',
              isActive
                ? 'bg-yellow-400 text-black border-black shadow-[2px_2px_0px_#000]'
                : 'text-slate-400 border-transparent hover:text-yellow-400'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, isOwner } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const dashboardHref = isAdmin ? '/admin' : isOwner ? '/owner' : '/dashboard';
  const dashboardLabel = isAdmin ? 'Admin' : isOwner ? 'Owner Panel' : 'Dashboard';
  const DashboardIcon = isAdmin ? Shield : isOwner ? Building2 : LayoutDashboard;

  const dashboardAccent = isAdmin
    ? 'border-purple-500 bg-purple-950/60 text-purple-300 hover:text-purple-200 shadow-[2px_2px_0px_rgba(168,85,247,0.5)]'
    : isOwner
    ? 'border-amber-500 bg-amber-950/60 text-amber-300 hover:text-amber-200 shadow-[2px_2px_0px_rgba(245,158,11,0.5)]'
    : 'border-black bg-card text-slate-300 hover:text-black-500 shadow-[2px_2px_0px_#000]';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-chrome border-b-[3px] border-black"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link
            href="/"
            onClick={() => {
              if (typeof window !== 'undefined') {
                if (window.location.hash) {
                  window.history.replaceState(null, '', '/');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
            aria-label="PlaySphere AI Home"
          >
            <div className="w-9 h-9 rounded-md bg-yellow-400 border-2 border-black flex items-center justify-center p-1 shadow-[2px_2px_0px_#000] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[3px_3px_0px_#22d3ee] transition-all duration-150">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/favicon.ico" alt="PlaySphere AI Logo" className="w-full h-full object-contain" />
            </div>
            <span
              className="gradient-text text-lg hidden sm:block"
              style={{ fontFamily: 'var(--font-bebas), var(--font-space), sans-serif', letterSpacing: '0.04em' }}
            >
              PlaySphere AI
            </span>
            <span
              className="gradient-text text-lg sm:hidden"
              style={{ fontFamily: 'var(--font-bebas), var(--font-space), sans-serif', letterSpacing: '0.04em' }}
            >
              PS AI
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-1">
            <Suspense fallback={<NavLinksFallback />}>
              <NavLinksList />
            </Suspense>
          </div>

          {/* ── Desktop Auth Actions ── */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              id="navbar-theme-toggle"
              className="flex items-center justify-center w-9 h-9 text-slate-400 hover:text-yellow-400 bg-card border-2 border-black shadow-[2px_2px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#facc15] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_#000] cursor-pointer transition-all duration-150"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  id="navbar-dashboard-link"
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.06em] transition-all duration-150 border-2 px-3 py-1.5 cursor-pointer','hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#facc15] active:translate-x-0 active:translate-y-0',
                    dashboardAccent
                  )}
                >
                  <DashboardIcon className="w-3.5 h-3.5" />
                  {dashboardLabel}
                </Link>
                <button
                  onClick={() => logOut()}
                  id="navbar-signout-btn"
                  className="flex items-center justify-center w-9 h-9 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 bg-card border-2 border-black shadow-[2px_2px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#fb7185] active:translate-x-0 active:translate-y-0 cursor-pointer transition-all duration-150"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  id="navbar-signin-link"
                  className="btn-secondary text-xs py-2 px-4 h-9 flex items-center cursor-pointer"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  id="navbar-getstarted-link"
                  className="btn-primary text-xs py-2 px-4 h-9 flex items-center cursor-pointer"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile Toggle ── */}
          <button
            id="navbar-mobile-toggle"
            className="md:hidden text-slate-300 hover:text-yellow-400 bg-card border-2 border-black p-2 shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#facc15] hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer transition-all duration-150"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {isOpen && (
        <div
          className="md:hidden bg-chrome border-t-2 border-black"
          role="menu"
        >
          <div className="px-4 py-4 space-y-2">
            <Suspense fallback={<NavLinksFallback mobile />}>
              <NavLinksList mobile onClose={() => setIsOpen(false)} />
            </Suspense>

            <div className="pt-3 border-t-2 border-black flex flex-col gap-2">
              <button
                onClick={() => { toggleTheme(); setIsOpen(false); }}
                className="btn-secondary text-xs justify-center py-2.5 flex items-center gap-2 cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>

              {user ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary text-xs justify-center py-2.5 flex items-center gap-2 cursor-pointer"
                  >
                    <DashboardIcon className="w-4 h-4" /> {dashboardLabel}
                  </Link>
                  <button
                    onClick={() => { logOut(); setIsOpen(false); }}
                    className="btn-ghost text-xs justify-center text-rose-400 border-rose-500/60 py-2.5 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setIsOpen(false)} className="btn-secondary text-xs justify-center py-2.5 cursor-pointer">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" onClick={() => setIsOpen(false)} className="btn-primary text-xs justify-center py-2.5 cursor-pointer">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
