'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, Clock, MapPin, Bookmark, BookmarkCheck, User, Bot, ArrowRight, X, Loader2,
  Ticket, Users, Sparkles, Share2, Plus, Trash2, Save, Phone, Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/contexts/ToastContext';
import { cancelBooking, getVenuesByIds, subscribeMatchLobbies, toggleSavedVenue, updateUserProfile } from '@/backend/firebase/firestore';
import { onSnapshot, query, collection, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/backend/firebase/config';
import { Booking, Venue, MatchLobby } from '@/shared/types';
import { formatCurrency, formatDate, getSportEmoji, cn, getSportImage } from '@/shared/helpers/utils';
import { AIConciergePreview } from '@/components/ai/AIConciergePreview';
import { getBookingLifecycle } from '@/shared/helpers/pricing';

type DashboardTab = 'bookings' | 'squads' | 'saved' | 'profile';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<DashboardTab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [savedVenues, setSavedVenues] = useState<Venue[]>([]);
  const [savedVenuesLoading, setSavedVenuesLoading] = useState(false);

  // Community Match Lobbies (Squads)
  const [userSquads, setUserSquads] = useState<MatchLobby[]>([]);
  const [allSquadsCount, setAllSquadsCount] = useState<number>(0);
  const [squadsLoading, setSquadsLoading] = useState(true);

  // Profile Editor State
  const toast = useToast();
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    phoneNumber: '',
    gender: 'prefer_not_to_say' as 'male' | 'female' | 'other' | 'prefer_not_to_say',
    primarySport: 'football',
    skillLevel: 'intermediate',
    locality: '',
    bio: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        displayName: profile.displayName || user?.displayName || '',
        phoneNumber: profile.phoneNumber || profile.phone || '',
        gender: profile.gender || 'prefer_not_to_say',
        primarySport: profile.primarySport || 'football',
        skillLevel: profile.skillLevel || 'intermediate',
        locality: profile.locality || '',
        bio: profile.bio || '',
      });
    } else if (user) {
      setProfileForm((prev) => ({
        ...prev,
        displayName: user.displayName || '',
      }));
    }
  }, [profile, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: profileForm.displayName.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        phone: profileForm.phoneNumber.trim(),
        gender: profileForm.gender,
        primarySport: profileForm.primarySport as any,
        skillLevel: profileForm.skillLevel as any,
        locality: profileForm.locality.trim(),
        bio: profileForm.bio.trim(),
      });
      toast.success('Sports profile updated! Match lobbies will now prioritize your preferences.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  // Real-time bookings listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'bookings'),
      where('playerId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      data.sort((a, b) => {
        const timeA = (a.createdAt as any)?.seconds || 0;
        const timeB = (b.createdAt as any)?.seconds || 0;
        return timeB - timeA;
      });
      setBookings(data);
      setBookingsLoading(false);
    }, (error) => {
      console.error('Bookings listener error:', error);
      setBookingsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Real-time listener for saved venues
  useEffect(() => {
    if (!user) {
      setSavedVenues([]);
      setSavedVenuesLoading(false);
      return;
    }
    setSavedVenuesLoading(true);

    const unsub = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const ids: string[] = data.savedVenues || [];
        if (ids.length === 0) {
          setSavedVenues([]);
          setSavedVenuesLoading(false);
          return;
        }
        try {
          const loaded = await getVenuesByIds(ids);
          setSavedVenues(loaded);
        } catch (err) {
          console.error('Error loading saved venues:', err);
          setSavedVenues([]);
        } finally {
          setSavedVenuesLoading(false);
        }
      } else {
        setSavedVenues([]);
        setSavedVenuesLoading(false);
      }
    }, (err) => {
      console.error('Error listening to user savedVenues:', err);
      setSavedVenuesLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Real-time squads listener
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMatchLobbies((items) => {
      setAllSquadsCount(items.length);
      const mine = items.filter(
        (l) => l.hostId === user.uid || l.players?.some((p) => p.userId === user.uid)
      );
      setUserSquads(mine);
      setSquadsLoading(false);
    });
    return () => unsub();
  }, [user]);

  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId);
    try {
      await cancelBooking(bookingId);
    } finally {
      setCancelling(null);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to remove this cancelled booking from your history?')) return;
    setDeleting(bookingId);
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
    } catch (e: any) {
      console.error('Delete error:', e);
      alert('Failed to delete booking: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  const upcoming = bookings.filter((b) => getBookingLifecycle(b) === 'upcoming');
  const history = bookings.filter((b) => {
    const lifecycle = getBookingLifecycle(b);
    return lifecycle === 'completed' || lifecycle === 'expired' || lifecycle === 'cancelled';
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const TABS: { id: DashboardTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'bookings', label: 'My Bookings', icon: <Calendar className="w-4 h-4" /> },
    {
      id: 'squads',
      label: 'My Squads',
      icon: <Users className="w-4 h-4 text-yellow-400" />,
      badge: userSquads.length,
    },
    {
      id: 'saved',
      label: 'Saved Venues',
      icon: <Bookmark className="w-4 h-4" />,
      badge: savedVenues.length,
    },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">
              Welcome back, <span className="gradient-text">{profile?.displayName?.split(' ')[0] || 'Player'}</span>
            </h1>
            <p className="text-slate-400">{upcoming.length} upcoming booking{upcoming.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/squads"
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black rounded-md font-black text-xs uppercase shadow-[3px_3px_0px_#000] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>⚽</span>
              <span>Find A Squad</span>
            </Link>
            <Link href="/venues" className="btn-primary">
              Book a Venue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'Upcoming', value: bookings.filter((b) => getBookingLifecycle(b) === 'upcoming').length, color: 'text-cyan-400' },
            { label: 'My Squads', value: userSquads.length, color: 'text-yellow-400' },
            { label: 'Completed', value: bookings.filter((b) => getBookingLifecycle(b) === 'completed').length, color: 'text-emerald-400' },
            { label: 'Saved Venues', value: savedVenues.length, color: 'text-pink-400' },
            { label: 'Total Spent', value: `₹${bookings.filter(b => getBookingLifecycle(b) !== 'cancelled').reduce((s, b) => s + (b.amount !== undefined ? b.amount : (b.price || 0)), 0)}`, color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-lg p-4 text-center border-2 border-black shadow-[3px_3px_0px_0px_#000]">
              <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
        {/* Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold whitespace-nowrap transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer',
                tab === t.id
                  ? 'bg-cyan-400 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] translate-x-0.5 translate-y-0.5'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              )}
            >
              {t.icon}
              <span>{t.label}</span>
              {typeof t.badge === 'number' && t.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-yellow-400 text-black text-[10px] font-black rounded-full border border-black">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: BOOKINGS ─────────────────────────────────────────── */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
            ) : bookings.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="font-display text-xl font-bold text-slate-200 mb-2">No bookings yet</h3>
                <p className="text-slate-400 mb-6">Start exploring venues and book your first session!</p>
                <Link href="/venues" className="btn-primary">Explore Venues</Link>
              </div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <div>
                    <h2 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-cyan-400 border border-black shadow-[1px_1px_0px_#000]" /> Upcoming ({upcoming.length})
                    </h2>
                    {upcoming.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} cancelling={cancelling} onDelete={handleDelete} deleting={deleting} />
                    ))}
                  </div>
                )}
                {history.length > 0 && (
                  <div className="mt-6">
                    <h2 className="font-display font-bold text-slate-400 mb-3">History</h2>
                    {history.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} cancelling={cancelling} onDelete={handleDelete} deleting={deleting} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB: SQUADS ───────────────────────────────────────────── */}
        {tab === 'squads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <h2 className="font-display font-bold text-lg text-primary flex items-center gap-2">
                <span>My Active Match Squads</span>
                <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 border border-black rounded-full font-black">
                  {userSquads.length}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <Link
                  href="/squads?action=host"
                  className="btn-primary px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_#000] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Host A Game</span>
                </Link>
              </div>
            </div>

            {squadsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
              </div>
            ) : userSquads.length === 0 ? (
              <div className="glass rounded-lg p-10 text-center border-2 border-black shadow-[4px_4px_0px_#000]">
                <div className="text-5xl mb-4">⚽</div>
                <h3 className="font-display text-xl font-bold text-slate-200 mb-2">No Active Squad Matches</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-6 text-sm">
                  You haven&apos;t joined any match lobbies yet. Join an open game across Lucknow turfs or host your own match and invite teammates!
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/squads" className="btn-primary text-xs font-black uppercase px-5 py-2.5 shadow-[3px_3px_0px_#000]">
                    Browse Match Lobbies ⚽
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userSquads.map((lobby) => {
                  const isHost = lobby.hostId === user?.uid;
                  const currentPlayersCount = lobby.players?.length || 0;
                  const openSpots = Math.max(0, lobby.totalSpots - currentPlayersCount);
                  return (
                    <div
                      key={lobby.id}
                      className="bg-card border-3 border-black rounded-sm p-5 shadow-[4px_4px_0px_#000] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2.5 py-0.5 bg-yellow-400 text-black border border-black text-[11px] font-black uppercase rounded shadow-[1px_1px_0px_#000]">
                            {lobby.sport.toUpperCase()}
                          </span>
                          <span className={cn(
                            'text-xs font-black uppercase px-2 py-0.5 border border-black rounded shadow-[1px_1px_0px_#000]',
                            isHost ? 'bg-cyan-400 text-black' : 'bg-emerald-400 text-black'
                          )}>
                            {isHost ? '👑 Host' : 'Joined Player'}
                          </span>
                        </div>
                        <h4 className="font-bold text-lg text-primary mb-1">{lobby.title}</h4>
                        <div className="text-xs text-secondary space-y-1 mb-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                            <span className="truncate"><strong>{lobby.venueName}</strong> — {lobby.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                            <span>{lobby.date}</span>
                            <Clock className="w-3.5 h-3.5 text-pink-500 ml-2 shrink-0" />
                            <span>{lobby.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t-2 border-black/20 pt-3 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-primary">
                          <span className="text-emerald-500 font-black">{currentPlayersCount}</span> / {lobby.totalSpots} Players
                          {openSpots > 0 && <span className="text-muted-theme ml-1">({openSpots} needed)</span>}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const text = encodeURIComponent(
                                `🏆 Join our squad: ${lobby.title} at ${lobby.venueName} on ${lobby.date}! ${window.location.origin}/squads`
                              );
                              window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded border border-black shadow-[2px_2px_0px_#000] flex items-center gap-1 cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Invite</span>
                          </button>
                          <Link
                            href="/squads"
                            className="px-3 py-1.5 bg-card hover:bg-card-hover text-primary text-xs font-bold rounded border border-black shadow-[2px_2px_0px_#000]"
                          >
                            View Squad
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: SAVED VENUES ───────────────────────────────────── */}
        {tab === 'saved' && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <h2 className="font-display font-bold text-lg text-primary flex items-center gap-2">
                <span>My Saved Venues</span>
                <span className="text-xs bg-pink-400 text-black px-2 py-0.5 border border-black rounded-full font-black">
                  {savedVenues.length}
                </span>
              </h2>
              <Link
                href="/venues"
                className="px-3 py-1.5 bg-card hover:bg-card-hover text-primary border-2 border-black rounded text-xs font-black uppercase shadow-[2px_2px_0px_#000]"
              >
                Browse All Venues 🏟️
              </Link>
            </div>

            {savedVenuesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
            ) : savedVenues.length === 0 ? (
              <div className="glass rounded-lg p-12 text-center border-2 border-black">
                <div className="text-5xl mb-4">🔖</div>
                <h3 className="font-display text-xl font-bold text-slate-200 mb-2">No saved venues</h3>
                <p className="text-slate-400 mb-6">Bookmark venues while browsing to save them here</p>
                <Link href="/venues" className="btn-primary">Browse Venues</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {savedVenues.map((v) => (
                  <Link key={v.id} href={`/venues/${v.id}`} className="glass rounded-lg p-4 card-hover border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_#facc15] block relative group">
                    <div className="relative mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getSportImage(v.sport, v.id)} alt={v.name} className="w-full h-36 object-cover rounded-md border-2 border-black" />
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!user) return;
                          try {
                            await toggleSavedVenue(user.uid, v.id, true);
                          } catch (err) {
                            console.error('Error removing saved venue:', err);
                          }
                        }}
                        title="Remove from saved"
                        className="absolute top-2 right-2 w-8 h-8 bg-card border-2 border-black flex items-center justify-center text-cyan-400 hover:text-rose-500 shadow-[2px_2px_0px_#000] cursor-pointer transition-colors"
                      >
                        <BookmarkCheck className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                    <h3 className="font-display font-bold text-slate-200 mb-1">{v.name}</h3>
                    <p className="text-slate-400 text-sm mb-2">{v.area}</p>
                    <div className="flex items-center justify-between border-t border-black/30 pt-2 mt-2">
                      <span className="text-cyan-400 font-bold">{formatCurrency(v.price)}/hr</span>
                      <span className="text-amber-400 text-sm font-semibold">★ {v.rating}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Sports Profile Form */}
            <div className="lg:col-span-8 glass rounded-lg p-6 sm:p-8 border-2 border-black shadow-[4px_4px_0px_#000]">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-yellow-400" />
                <h2 className="font-display text-2xl font-bold text-slate-200">
                  Player Sports Profile & Match Preferences
                </h2>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mb-6">
                Tell us about your game. PlaySphere uses your sport, skill level, and Lucknow locality to prioritize open squad lobbies and match recommendations for you.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-300 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border-2 border-black rounded-md text-sm text-slate-100 font-semibold focus:outline-none focus:border-yellow-400 shadow-[2px_2px_0px_#000]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>WhatsApp / Mobile Number <span className="text-red-500">*</span></span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border-2 border-black rounded-md text-sm text-slate-100 font-semibold focus:outline-none focus:border-yellow-400 shadow-[2px_2px_0px_#000]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-300 mb-1.5">
                      Gender
                    </label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-slate-900 border-2 border-black rounded-md text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-yellow-400 shadow-[2px_2px_0px_#000] cursor-pointer"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-300 mb-1.5">
                      Primary Sport
                    </label>
                    <select
                      value={profileForm.primarySport}
                      onChange={(e) => setProfileForm({ ...profileForm, primarySport: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-900 border-2 border-black rounded-md text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-yellow-400 shadow-[2px_2px_0px_#000] cursor-pointer"
                    >
                      <option value="football">Football ⚽</option>
                      <option value="badminton">Badminton 🏸</option>
                      <option value="cricket">Box Cricket 🏏</option>
                      <option value="swimming">Swimming 🏊</option>
                      <option value="tennis">Tennis / Pickleball 🎾</option>
                      <option value="kabaddi">Kabaddi 🤼</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-300 mb-1.5">
                      Skill Level
                    </label>
                    <select
                      value={profileForm.skillLevel}
                      onChange={(e) => setProfileForm({ ...profileForm, skillLevel: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-900 border-2 border-black rounded-md text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-yellow-400 shadow-[2px_2px_0px_#000] cursor-pointer"
                    >
                      <option value="beginner">Beginner Friendly</option>
                      <option value="intermediate">Intermediate Level</option>
                      <option value="advanced">Competitive / Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Your Locality in Lucknow</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-yellow-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={profileForm.locality}
                      onChange={(e) => setProfileForm({ ...profileForm, locality: e.target.value })}
                      placeholder="e.g. Gomti Nagar, Aliganj, Hazratganj, Indira Nagar..."
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border-2 border-black rounded-md text-sm text-slate-100 font-semibold focus:outline-none focus:border-yellow-400 shadow-[2px_2px_0px_#000]"
                    />
                  </div>
                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Gomti Nagar', 'Aliganj', 'Hazratganj', 'Indira Nagar', 'Mahanagar', 'Ashiyana'].map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => setProfileForm({ ...profileForm, locality: loc })}
                        className={cn(
                          'px-2 py-0.5 text-[10px] font-bold rounded border border-black transition-colors',
                          profileForm.locality.toLowerCase().includes(loc.toLowerCase())
                            ? 'bg-yellow-400 text-black'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        )}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-300 mb-1.5">
                    Player Bio & Availability
                  </label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="e.g. Football striker/winger. Free on weekday nights after 7 PM and weekend mornings. Prefer turfs with floodlights."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border-2 border-black rounded-md text-sm text-slate-100 font-medium focus:outline-none focus:border-yellow-400 shadow-[2px_2px_0px_#000]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-400 font-medium">
                    Changes take effect across Match Lobbies immediately.
                  </div>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn-primary text-xs font-black uppercase px-6 py-2.5 shadow-[3px_3px_0px_#000] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {profileSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{profileSaving ? 'Saving...' : 'Save Sports Profile'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="glass rounded-lg p-6 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-md bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-black text-2xl font-black border-2 border-black shadow-[3px_3px_0px_0px_#000]">
                    {profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-200">{profile?.displayName || 'Player'}</h2>
                    <p className="text-slate-400 text-xs truncate max-w-[180px]">{user?.email}</p>
                    {profile?.phoneNumber && (
                      <p className="text-emerald-400 text-xs font-mono font-bold mt-0.5">{profile.phoneNumber}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2.5 border-b border-black/30">
                    <span className="text-slate-400 text-xs font-bold uppercase">Account Role</span>
                    <span className="text-slate-200 font-bold capitalize bg-slate-900 border border-black px-2.5 py-1 rounded-md text-xs shadow-[1px_1px_0px_#000]">
                      {profile?.role === 'player' ? '🏃 Sports Player' : profile?.role === 'owner' ? '🏢 Venue Owner' : profile?.role || 'player'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-black/30">
                    <span className="text-slate-400 text-xs font-bold uppercase">Primary Sport</span>
                    <span className="text-yellow-400 font-black capitalize text-xs">
                      {profile?.primarySport || 'Not Set'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-black/30">
                    <span className="text-slate-400 text-xs font-bold uppercase">Locality</span>
                    <span className="text-cyan-400 font-black text-xs">
                      {profile?.locality || 'Lucknow'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-black/30">
                    <span className="text-slate-400 text-xs font-bold uppercase">Total Bookings</span>
                    <span className="text-slate-200 font-bold text-sm">{bookings.length}</span>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-black/30">
                    <span className="text-slate-400 text-xs font-bold uppercase">My Squads</span>
                    <span className="text-yellow-400 font-bold text-sm">{userSquads.length}</span>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-black/30">
                    <span className="text-slate-400 text-xs font-bold uppercase">Saved Venues</span>
                    <span className="text-slate-200 font-bold text-sm">{savedVenues.length}</span>
                  </div>

                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-slate-400 text-xs font-bold uppercase">Total Spent</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {formatCurrency(bookings.filter(b => (b.bookingStatus || b.status) !== 'cancelled').reduce((s, b) => s + (b.amount !== undefined ? b.amount : (b.price || 0)), 0))}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-400/10 border-2 border-yellow-400/40 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-bold text-slate-200 text-sm">Find A Squad Active</h4>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Join active match lobbies in Lucknow or host your own match with customized rules and player spots.
                </p>
                <Link
                  href="/squads"
                  className="btn-primary text-xs font-black uppercase px-4 py-2 shadow-[2px_2px_0px_#000] inline-flex items-center gap-1.5"
                >
                  <span>Explore Match Lobbies</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  onCancel,
  cancelling,
  onDelete,
  deleting,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  cancelling: string | null;
  onDelete?: (id: string) => void;
  deleting?: string | null;
}) {
  const lifecycle = getBookingLifecycle(booking);
  const pStatus = booking.paymentStatus;
  
  let statusText = 'Upcoming';
  let statusClass = 'text-black bg-cyan-400 border-black shadow-[2px_2px_0px_#000]';
  let showPayButton = false;
  let showRetryButton = false;
  let showCancelButton = false;
  let showPlayedDate = false;

  const bStatus = (booking.bookingStatus || booking.status) as string;

  if (lifecycle === 'cancelled') {
    if (pStatus === 'refund_pending') {
      statusText = 'Refund Pending';
      statusClass = 'text-black bg-pink-400 border-black shadow-[2px_2px_0px_#000]';
    } else {
      statusText = 'Cancelled';
      statusClass = 'text-black bg-rose-400 border-black shadow-[2px_2px_0px_#000]';
    }
  } else if (lifecycle === 'completed') {
    statusText = 'Completed';
    statusClass = 'text-white bg-slate-700 border-black shadow-[2px_2px_0px_#000]';
    showPlayedDate = true;
  } else if (lifecycle === 'expired') {
    statusText = 'Expired';
    statusClass = 'text-slate-400 bg-slate-900 border-slate-700 shadow-none border-dashed';
  } else {
    // lifecycle === 'upcoming'
    if (pStatus === 'payment_pending') {
      statusText = 'Payment Pending';
      statusClass = 'text-black bg-amber-400 border-black shadow-[2px_2px_0px_#000]';
      showPayButton = true;
      showCancelButton = true;
    } else if (pStatus === 'verification_pending') {
      statusText = 'Verification Pending';
      statusClass = 'text-black bg-cyan-300 border-black shadow-[2px_2px_0px_#000]';
      showCancelButton = true;
    } else if (pStatus === 'paid' || bStatus === 'confirmed' || bStatus === 'upcoming') {
      statusText = 'Upcoming';
      statusClass = 'text-black bg-cyan-400 border-black shadow-[2px_2px_0px_#000]';
      showCancelButton = true;
    } else if (pStatus === 'rejected') {
      statusText = 'Payment Rejected';
      statusClass = 'text-white bg-red-600 border-black shadow-[2px_2px_0px_#000]';
      showRetryButton = true;
      showCancelButton = true;
    } else {
      statusText = 'Upcoming';
      statusClass = 'text-black bg-cyan-400 border-black shadow-[2px_2px_0px_#000]';
      showCancelButton = true;
    }
  }

  const amount = booking.amount !== undefined ? booking.amount : (booking.price || 0);
  const ticketId = booking.ticketId || booking.ticketNumber;

  return (
    <div className="glass rounded-lg p-5 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000] transition-all">
      <div className="flex items-center gap-4 flex-1">
        <div className="text-3xl bg-slate-900 w-12 h-12 flex items-center justify-center rounded-md border border-black shadow-[2px_2px_0px_#000]">{getSportEmoji(booking.sport)}</div>
        <div>
          <h3 className="font-display font-bold text-slate-200 text-base">{booking.venueName}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{booking.venueArea}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(booking.date)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{booking.slot}</span>
          </div>
          {ticketId && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Ticket className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-xs text-cyan-400 font-bold tracking-wider">{ticketId}</span>
            </div>
          )}
          {showPlayedDate && (
            <div className="text-[10px] text-emerald-400 font-extrabold mt-1.5 tracking-wider uppercase">
              Played on {formatDate(booking.date)}
            </div>
          )}
          {booking.utrNumber && (
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              UTR: {booking.utrNumber}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-black/30 pt-3 md:pt-0 mt-2 md:mt-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold px-3 py-1.5 rounded-md border-2', statusClass)}>
            {statusText}
          </span>
          {showPayButton && (
            <Link 
              href={`/bookings/${booking.bookingId}/payment`}
              className="text-xs font-bold px-3 py-1.5 rounded-md bg-cyan-400 text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-cyan-300 transition-colors"
            >
              Pay Now
            </Link>
          )}
          {showRetryButton && (
            <Link 
              href={`/bookings/${booking.bookingId}/payment`}
              className="text-xs font-bold px-3 py-1.5 rounded-md bg-yellow-400 text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-yellow-300 transition-colors"
            >
              Retry Payment
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-200 text-lg">{formatCurrency(amount)}</span>
          {showCancelButton && (
            <button
              onClick={() => onCancel(booking.id)}
              disabled={cancelling === booking.id}
              className="w-8 h-8 rounded-md bg-rose-500 hover:bg-rose-400 border-2 border-black text-black flex items-center justify-center font-bold shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
              title="Cancel Booking"
            >
              {cancelling === booking.id ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <X className="w-4 h-4 stroke-[3px]" />}
            </button>
          )}
          {lifecycle === 'cancelled' && onDelete && (
            <button
              onClick={() => onDelete(booking.id)}
              disabled={deleting === booking.id}
              className="px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-400 border-2 border-black text-black text-xs font-bold shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
              title="Remove from History"
            >
              {deleting === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : 'Remove History'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
