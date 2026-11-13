'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  Mail,
  GraduationCap,
  Building2,
  Code2,
  Cpu,
  RotateCw,
  Trophy,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  badge: string;
  badgeColor: string;
  initials: string;
  avatarGradient: string;
  image?: string;
  degree: string;
  institution: string;
  location: string;
  bio: string;
  focus: string;
  skills: string[];
  github: string;
  linkedin: string;
  email: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'suryansh',
    name: 'SURYANSH SINGH',
    role: 'Team Leader · Full-Stack Architect',
    badge: 'TEAM LEAD & FULL-STACK',
    badgeColor: 'bg-yellow-400 text-slate-950 border-black',
    initials: 'SS',
    avatarGradient: 'from-amber-500 via-yellow-400 to-cyan-400',
    image: './suryansh.png',
    degree: 'B.Tech Computer Science & Engineering',
    institution: 'Shri Ramswaroop Memorial University (SRMU)',
    location: 'Lucknow, Uttar Pradesh',
    bio: 'Project vision, system design, AI agent pipeline, database architecture and integration lead. Orchestrated the full-stack architecture, Next.js 16 core and seamless Firebase sync.',
    focus: 'Project Vision, System Design, AI Agent Pipeline & Full-Stack Core',
    skills: ['Next.js 16', 'TypeScript', 'System Design', 'AI Agent Pipeline', 'Database Architecture', 'Integration Lead'],
    github: 'https://github.com/suryanshsingh07',
    linkedin: 'https://linkedin.com/in/suryansh-singh-thakur',
    email: 'suryanshsinghchauhanthakur@gmail.com',
  },
  {
    id: 'shivam',
    name: 'SHIVAM JAISWAL',
    role: 'Frontend Developer & UI/UX Specialist',
    badge: 'FRONTEND DEVELOPER',
    badgeColor: 'bg-cyan-400 text-slate-950 border-black',
    initials: 'SJ',
    avatarGradient: 'from-cyan-500 via-blue-500 to-indigo-600',
    image: './shivam.png',
    degree: 'B.Tech Computer Science & Engineering',
    institution: 'Shri Ramswaroop Memorial University (SRMU)',
    location: 'Lucknow, Uttar Pradesh',
    bio: 'React UI components, design system, interactive map integration and responsive layouts. Built the high-contrast Neo-Brutalist interface, venue exploration cards and responsive dashboards.',
    focus: 'React UI Components, Design System, Map Integration & Layouts',
    skills: ['React 19', 'Tailwind CSS', 'Map Integration', 'Responsive Design', 'Neo-Brutalism', 'Component Architecture'],
    github: 'https://github.com/shivam5802',
    linkedin: 'https://linkedin.com/in/shivam5802',
    email: 'sjais9827@gmail.com',
  },
  {
    id: 'vikas',
    name: 'VIKAS PATEL',
    role: 'AI/ML Engineer & Systems Specialist',
    badge: 'AI/ML ENGINEER',
    badgeColor: 'bg-emerald-400 text-slate-950 border-black',
    initials: 'VP',
    avatarGradient: 'from-emerald-500 via-teal-500 to-sky-600',
    image: './vikas.png',
    degree: 'B.Tech Computer Science & Engineering',
    institution: 'Shri Ramswaroop Memorial University (SRMU)',
    location: 'Lucknow, Uttar Pradesh',
    bio: 'NLP intent parser, recommendation agent, dynamic pricing engine and demand prediction algorithms. Engineered the conversational AI Concierge and automated sports infrastructure discovery.',
    focus: 'NLP Intent Parsing, Recommendation Agent, Dynamic Pricing & ML',
    skills: ['Groq / LLaMA-3.1', 'NLP Intent Parsing', 'Dynamic Pricing Engine', 'Recommendation Agent', 'Demand Prediction', 'Python / ML'],
    github: 'https://github.com/devvikax',
    linkedin: 'https://linkedin.com/in/devvikax',
    email: 'vikasp.tera@gmail.com',
  },
];

export default function AboutPage() {
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="min-h-screen bg-canvas pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-[0.03em] uppercase leading-none mb-6 text-primary"
          style={{ fontFamily: 'var(--font-bebas), var(--font-space), sans-serif' }}
        >
          MEET THE ARCHITECTS BEHIND{' '}
          <span className="gradient-text">PLAYSPHERE AI</span>
        </h1>

        <p className="max-w-3xl mx-auto text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed font-semibold">
          We are <strong className="text-yellow-500 dark:text-yellow-400 font-black">Team DeepStack</strong> from the{' '}
          <span className="text-primary font-bold">
            Department of Computer Science & Engineering, Shri Ramswaroop Memorial University (SRMU)
          </span>
          . We built PlaySphere AI to transform fragmented sports venue discovery into an autonomous,
          AI-driven copilot experience for players, owners and organizers.
        </p>
      </div>

      {/* ── 3D FLIP CARDS GRID ───────────────────────────────────── */}
      <div className="max-w-6xl mx-auto mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TEAM_MEMBERS.map((member) => {
            const isFlipped = !!flippedCards[member.id];

            return (
              <div
                key={member.id}
                onClick={() => toggleFlip(member.id)}
                className="perspective-1000 w-full min-h-[440px] group select-none cursor-pointer"
              >
                <div
                  className={cn(
                    'relative w-full h-full min-h-[440px] rounded-xl transition-transform duration-700 transform-style-3d border-2 border-black shadow-[4px_4px_0px_#000]',
                    isFlipped ? 'rotate-y-180' : 'group-hover:rotate-y-180'
                  )}
                >
                  <div className="absolute inset-0 w-full h-full rounded-xl overflow-hidden backface-hidden bg-card border-b-4 border-yellow-400 flex flex-col justify-between">
                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className={cn(
                            'w-full h-full bg-gradient-to-tr flex items-center justify-center',
                            member.avatarGradient
                          )}
                        >
                          <span className="text-white font-black text-6xl opacity-30 select-none">
                            {member.initials}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
                    </div>

                    <div className="relative z-10 p-5 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-sm border shadow-[2px_2px_0px_#000]',
                          member.badgeColor
                        )}
                      >
                        {member.badge}
                      </span>
                    </div>

                      <div className="relative z-10 p-5 bg-transparent">          
                      <h2
                        className="text-2xl sm:text-3xl font-black text-white uppercase tracking-[0.04em] mb-1 leading-none"
                        style={{ fontFamily: 'var(--font-bebas), sans-serif', textShadow: '2px 2px 0px #000' }}
                      >
                        {member.name}
                      </h2>
                      <p className="text-xs font-black text-yellow-400 tracking-wider uppercase mb-2.5">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  {/* ── BACK FACE (Rotated 180deg) ──────────────── */}
                  <div className="absolute inset-0 w-full h-full rounded-xl overflow-hidden backface-hidden rotate-y-180 bg-card border-2 border-yellow-400 p-6 flex flex-col justify-between text-primary shadow-2xl">
                    <div>
                      {/* Back Header */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/20">
                        <div>
                          <h3 className="text-base font-black text-primary uppercase tracking-wide">
                            {member.name}
                          </h3>
                          <p className="text-[11px] font-bold text-yellow-600 dark:text-yellow-400 uppercase">
                            {member.focus}
                          </p>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 font-medium">
                        &ldquo;{member.bio}&rdquo;
                      </p>

                      {/* Tech Stack Pills */}
                      <div className="mb-4">
                        <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-theme mb-2 font-bold flex items-center gap-1">
                          <Code2 className="w-3 h-3 text-yellow-500 dark:text-yellow-400" /> Core Technologies
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {member.skills.map((skill) => (
                            <span
                              key={skill}
                              className="text-[10px] font-mono bg-card-nested border border-black/20 text-primary px-2 py-0.5 rounded-sm font-semibold"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Social & Contact Buttons */}
                    <div className="pt-3 border-t border-black/20 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={member.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-black hover:bg-neutral-900 border-2 border-black rounded-sm text-xs font-bold text-white shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#facc15] transition-all cursor-pointer"
                        >
                          <GithubIcon className="w-4 h-4 text-white" />
                          <span>GitHub</span>
                        </a>
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 border-2 border-black rounded-sm text-xs font-bold text-white shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#38bdf8] transition-all cursor-pointer"
                        >
                          <LinkedinIcon className="w-3.5 h-3.5" />
                          <span>LinkedIn</span>
                        </a>
                      </div>

                      <a
                        href={`mailto:${member.email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 border-2 border-black rounded-sm text-xs font-black text-black shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{member.email}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PROJECT HIGHLIGHTS & INNOVATION ───────────────────────── */}
      <div className="max-w-6xl mx-auto bg-card border-3 border-black rounded-xl p-6 sm:p-10 shadow-[6px_6px_0px_#000] mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b-2 border-black">
          <div>
            <span className="text-xs font-mono uppercase text-yellow-600 dark:text-yellow-400 tracking-wider font-bold">
              Autonomous Sports Infrastructure Discovery
            </span>
            <h2
              className="text-3xl sm:text-4xl font-black uppercase text-primary tracking-wide mt-1"
              style={{ fontFamily: 'var(--font-bebas), var(--font-space), sans-serif' }}
            >
              WHAT MAKES PLAYSPHERE AI UNIQUE
            </h2>
          </div>
          <Link href="/venues" className="btn-primary text-xs px-6 py-3 shrink-0 cursor-pointer">
            Explore Venues Now
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-card-nested border-2 border-black p-4 rounded-md shadow-[3px_3px_0px_#000]">
            <div className="w-8 h-8 rounded bg-yellow-400 text-black flex items-center justify-center mb-3 font-bold">
              01
            </div>
            <h3 className="font-bold text-sm text-primary mb-1 uppercase tracking-wide">
              Agentic AI Copilot
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Understands natural language inputs like &ldquo;Book badminton turf 7 PM near Gomti Nagar&rdquo; and books in seconds.
            </p>
          </div>

          <div className="bg-card-nested border-2 border-black p-4 rounded-md shadow-[3px_3px_0px_#000]">
            <div className="w-8 h-8 rounded bg-cyan-400 text-black flex items-center justify-center mb-3 font-bold">
              02
            </div>
            <h3 className="font-bold text-sm text-primary mb-1 uppercase tracking-wide">
              Real-Time Dark Map
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Google Maps integration showing verified courts, unlisted play-zones, akharas and landmark overlays across Lucknow.
            </p>
          </div>

          <div className="bg-card-nested border-2 border-black p-4 rounded-md shadow-[3px_3px_0px_#000]">
            <div className="w-8 h-8 rounded bg-emerald-400 text-black flex items-center justify-center mb-3 font-bold">
              03
            </div>
            <h3 className="font-bold text-sm text-primary mb-1 uppercase tracking-wide">
              Dynamic Smart Pricing
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Automated heuristics for peak hours, student discounts and off-peak incentives to maximize turf utilization.
            </p>
          </div>

          <div className="bg-card-nested border-2 border-black p-4 rounded-md shadow-[3px_3px_0px_#000]">
            <div className="w-8 h-8 rounded bg-purple-500 text-white flex items-center justify-center mb-3 font-bold">
              04
            </div>
            <h3 className="font-bold text-sm text-primary mb-1 uppercase tracking-wide">
              Unified Role Portals
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Dedicated portals for Players, Turf Owners (live analytics & bookings) and Admins (instant verification).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

