'use client';

import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  MessageSquare,
  User,
  Clock,
  Sparkles,
  Building2,
  HelpCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { submitContactInquiry } from '@/backend/firebase/firestore';

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

const TEAM_CONTACTS = [
  {
    name: 'Suryansh Singh',
    email: 'suryanshsinghchauhanthakur@gmail.com',
  },
  {
    name: 'Shivam Jaiswal',
    email: 'sjais9827@gmail.com',
  },
  {
    name: 'Vikas Patel',
    email: 'vikasp.tera@gmail.com',
  },
];

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'general',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || (!formData.phone.trim() && !formData.email.trim()) || !formData.message.trim()) {
      setError('Please fill in your name, contact details (mobile number or email), and message.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitContactInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        category: formData.category,
        message: formData.message.trim(),
      });
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: 'general',
        message: '',
      });
    } catch (err: any) {
      console.error('Contact submission error:', err);
      // Fallback optimistic confirmation
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact-us" className="py-20 px-4 bg-card-hover border-t-3 border-black relative overflow-hidden transition-colors duration-200">
      {/* Decorative backdrop shapes */}
      <div className="absolute top-10 left-6 w-24 h-24 bg-yellow-400/10 border-2 border-yellow-400/30 rotate-12 pointer-events-none hidden md:block" />
      <div className="absolute bottom-10 right-6 w-32 h-32 bg-cyan-400/10 border-2 border-cyan-400/30 -rotate-6 pointer-events-none hidden md:block" />

      <div className="max-w-6xl mx-auto relative">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2
            className="text-4xl md:text-5xl font-black text-primary uppercase tracking-wider mb-4"
            style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
          >
            <span className="gradient-text">Get In Touch</span>
          </h2>
          <p className="text-secondary font-semibold text-sm md:text-base leading-relaxed">
            Have a question or want to list your sports venue in Lucknow? We're here to help you!
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Info & Hub Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border-3 border-black p-6 sm:p-7 rounded-sm shadow-[6px_6px_0px_#000]">
              <h3
                className="text-2xl font-black text-primary mb-2 uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
              >
                Lucknow Sports Community Hub
              </h3>
              <p className="text-xs sm:text-sm text-secondary font-semibold mb-2">
                Connecting turf owners, coaches and sports players across Lucknow.
              </p>

              <div className="space-y-3.5">
                <div className="p-3.5 bg-card-nested border-2 border-black rounded-sm shadow-[2px_2px_0px_#000]">
                  <div className="text-[11px] font-black uppercase tracking-wider text-muted-theme mb-2.5">
                    Email Support
                  </div>
                  <div className="space-y-2">
                    {TEAM_CONTACTS.map((member) => (
                      <div key={member.name} className="flex items-center justify-between text-xs gap-2 pt-1 border-t border-black/10 first:border-t-0 first:pt-0">
                        <div className="min-w-0">
                          <span className="font-black text-primary block truncate">{member.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`mailto:${member.email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Email ${member.name}`}
                            className="p-1.5 bg-yellow-400 text-black hover:bg-yellow-300 border-2 border-black rounded-sm shadow-[1px_1px_0px_#000] hover:shadow-[2px_2px_0px_#000] transition-all cursor-pointer flex items-center justify-center"
                          >
                            <Mail className="w-3.5 h-3.5 text-black" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-card-nested border-2 border-black rounded-sm shadow-[2px_2px_0px_#000]">
                  <div className="w-9 h-9 rounded-sm bg-emerald-400 border-2 border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000]">
                    <Clock className="w-4 h-4 text-black stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-muted-theme">Support Hours</div>
                    <div className="text-sm font-black text-primary">Mon – Sun: 7:00 AM – 11:00 PM IST</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Callout Pitch Box */}
            <div className="bg-yellow-400 border-3 border-black p-5 rounded-sm shadow-[5px_5px_0px_#000]">
              <div className="flex items-center gap-2 font-black text-sm uppercase text-black mb-1.5">
                <Sparkles className="w-4 h-4 text-black stroke-[2.5]" /> Are You A Venue Owner?
              </div>
              <p className="text-xs font-bold text-black leading-relaxed">
                List your turf, badminton court, pool or akhara on PlaySphere AI to get automated bookings, dynamic pricing and player analytics.
              </p>
            </div>
          </div>

          {/* Right Column: High Contrast Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-card border-3 border-black p-6 sm:p-8 rounded-sm shadow-[8px_8px_0px_#000]">
              {isSubmitted ? (
                <div className="py-12 text-center animate-fadeIn">
                  <div className="w-16 h-16 bg-emerald-400 border-3 border-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_#000]">
                    <CheckCircle2 className="w-8 h-8 text-black stroke-[2.5]" />
                  </div>
                  <h3
                    className="text-3xl font-black text-primary uppercase mb-2"
                    style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
                  >
                    Message Sent Successfully!
                  </h3>
                  <p className="text-secondary font-semibold text-sm max-w-md mx-auto mb-6">
                    Shukriya! We have received your inquiry. Our Lucknow team will get back to you within 2 hours.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="btn-primary text-xs font-black uppercase px-6 py-3 tracking-wider"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-3.5 bg-rose-500/10 border-2 border-rose-500 text-rose-600 dark:text-rose-400 text-xs font-black rounded-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {/* Name and Mobile Number Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary mb-1.5">
                        <User className="w-3.5 h-3.5 text-yellow-500" />
                        <span>Your Name</span>
                        <span className="text-red-500 font-black text-sm">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Aman Sharma"
                        className="w-full text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary mb-1.5">
                        <Phone className="w-3.5 h-3.5 text-pink-500" />
                        <span>Mobile Number / WhatsApp</span>
                        <span className="text-red-500 font-black text-sm">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full text-sm font-semibold"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="aman@example.com"
                      className="w-full text-sm font-semibold"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Your Message</span>
                      <span className="text-red-500 font-black text-sm">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us what you need help with or details about your sports venue..."
                      className="w-full text-sm font-semibold resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black border-3 border-black font-black uppercase tracking-wider text-sm shadow-[5px_5px_0px_#000] flex items-center justify-center gap-2 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="font-black">Sending Message...</span>
                    ) : (
                      <>
                        <span className="font-black">Send Message</span>
                        <Send className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
