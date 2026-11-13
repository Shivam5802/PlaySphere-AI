'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Share2,
  CheckCircle2,
  X,
  Sparkles,
  Phone,
  User,
  Shield,
  ArrowRight,
  Trophy,
  Filter,
  DollarSign,
  AlertCircle,
  MessageCircle,
  Trash2,
  Loader2,
  UserCheck,
  UserX,
  Crown,
  Check,
  ExternalLink,
  Target,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/contexts/ToastContext';
import { MatchLobby, LobbyPlayer, Sport, SkillLevel, Venue } from '@/shared/types';
import {
  subscribeMatchLobbies,
  createMatchLobby,
  joinMatchLobby,
  leaveMatchLobby,
  deleteMatchLobby,
  confirmPlayerInLobby,
  declinePlayerInLobby,
  removePlayerFromLobby,
  getApprovedVenues,
} from '@/backend/firebase/firestore';
import { cn, formatCurrency } from '@/shared/helpers/utils';

const SPORT_FILTERS: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'All Sports', icon: '🏆' },
  { id: 'football', label: 'Football', icon: '⚽' },
  { id: 'badminton', label: 'Badminton', icon: '🏸' },
  { id: 'cricket', label: 'Cricket', icon: '🏏' },
  { id: 'swimming', label: 'Swimming', icon: '🏊' },
];

export default function SquadsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  const toast = useToast();

  const [lobbies, setLobbies] = useState<MatchLobby[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<'all' | 'my-squads'>('all');

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [joinModalLobby, setJoinModalLobby] = useState<MatchLobby | null>(null);
  const [manageRosterLobby, setManageRosterLobby] = useState<MatchLobby | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Join Squad Request Form State
  const [joinForm, setJoinForm] = useState({
    name: '',
    phone: '',
    skillLevel: 'intermediate' as string,
    note: '',
  });

  // New Lobby Form
  const [newMatch, setNewMatch] = useState({
    title: '',
    sport: 'football' as Sport | 'cricket' | 'tennis',
    venueId: '',
    venueName: '',
    location: '',
    date: '',
    time: '',
    totalSpots: 10,
    pricePerPlayer: 100,
    skillLevel: 'all' as SkillLevel,
    hostName: '',
    hostPhone: '',
    notes: '',
  });

  useEffect(() => {
    getApprovedVenues().then((v) => setVenues(v)).catch(() => {});

    const unsub = subscribeMatchLobbies((items) => {
      setLobbies(items);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Keep manageRosterLobby in sync with real-time updates
  useEffect(() => {
    if (manageRosterLobby) {
      const updated = lobbies.find((l) => l.id === manageRosterLobby.id);
      if (updated) {
        setManageRosterLobby(updated);
      } else {
        setManageRosterLobby(null); // Lobby was deleted
      }
    }
  }, [lobbies]);

  // Check URL query parameters (e.g. ?action=host)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'host') {
        if (user) {
          setIsCreateOpen(true);
        } else {
          toast.info('Please log in first to host a match lobby.');
          router.push('/auth/login?redirect=/squads?action=host');
        }
      }
    }
  }, [user, router, toast]);

  // Pre-fill user data when available
  useEffect(() => {
    if (user) {
      const defaultName = profile?.displayName || user.displayName || user.email?.split('@')[0] || '';
      const defaultPhone = profile?.phoneNumber || profile?.phone || '';
      setNewMatch((prev) => ({
        ...prev,
        hostName: prev.hostName || defaultName,
        hostPhone: prev.hostPhone || defaultPhone,
        location: prev.location || profile?.locality || '',
      }));
    }
  }, [user, profile]);

  // Handle Delete Lobby (Admin only)
  const handleDeleteLobby = async (lobbyId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the match lobby "${title}"?`)) return;
    try {
      await deleteMatchLobby(lobbyId);
      toast.success('Match lobby deleted.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete lobby');
    }
  };

  const handleOpenCreateModal = () => {
    if (!user) {
      toast.error('Please log in first to host a match lobby!');
      router.push('/auth/login?redirect=/squads?action=host');
      return;
    }
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in first to host a match lobby!');
      router.push('/auth/login?redirect=/squads?action=host');
      return;
    }

    if (!newMatch.title.trim() || !newMatch.venueName.trim() || !newMatch.date.trim() || !newMatch.time.trim()) {
      toast.error('Please fill in all match details.');
      return;
    }

    const hostName = newMatch.hostName.trim() || profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Sports Host';
    const hostPhone = newMatch.hostPhone.trim() || profile?.phoneNumber || profile?.phone || '';
    const hostId = user.uid;

    setIsSubmitting(true);
    try {
      await createMatchLobby({
        title: newMatch.title.trim(),
        sport: newMatch.sport,
        venueName: newMatch.venueName.trim(),
        location: newMatch.location.trim() || profile?.locality || 'Lucknow',
        date: newMatch.date.trim(),
        time: newMatch.time.trim(),
        totalSpots: Number(newMatch.totalSpots) || 10,
        pricePerPlayer: Number(newMatch.pricePerPlayer) || 0,
        skillLevel: newMatch.skillLevel,
        hostId,
        hostName,
        hostPhone,
        hostEmail: user.email || '',
        notes: newMatch.notes.trim() || '',
        initialPlayer: {
          userId: hostId,
          name: hostName,
          phone: hostPhone,
          joinedAt: new Date().toISOString(),
          status: 'confirmed',
          role: 'host',
          skillLevel: profile?.skillLevel || 'intermediate',
        },
      });

      toast.success('Match lobby launched! You are confirmed as the host.');
      setIsCreateOpen(false);
      setNewMatch({
        title: '',
        sport: (profile?.primarySport as any) || 'football',
        venueId: '',
        venueName: '',
        location: profile?.locality || '',
        date: '',
        time: '',
        totalSpots: 10,
        pricePerPlayer: 100,
        skillLevel: 'all',
        hostName: profile?.displayName || user.displayName || '',
        hostPhone: profile?.phoneNumber || profile?.phone || '',
        notes: '',
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create match lobby');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Click Request to Join Squad
  const handleJoinClick = (lobby: MatchLobby) => {
    if (!user) {
      toast.error('Please log in first to join a squad match!');
      router.push('/auth/login?redirect=/squads');
      return;
    }

    const currentUserId = user.uid;
    const existingPlayer = lobby.players?.find((p) => p.userId === currentUserId);

    if (existingPlayer) {
      if (existingPlayer.status === 'confirmed') {
        toast.info('You are already confirmed in this squad!');
      } else {
        toast.info('Your join request is already pending host approval.');
      }
      return;
    }

    // Open request dialog with prefilled details
    setJoinForm({
      name: profile?.displayName || user.displayName || user.email?.split('@')[0] || '',
      phone: profile?.phoneNumber || profile?.phone || '',
      skillLevel: profile?.skillLevel || 'intermediate',
      note: '',
    });
    setJoinModalLobby(lobby);
  };

  const handleExecuteJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinModalLobby) return;

    if (!joinForm.name.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    if (!joinForm.phone.trim()) {
      toast.error('Please enter your WhatsApp or phone number so the host can contact you.');
      return;
    }

    setIsSubmitting(true);
    try {
      await joinMatchLobby(joinModalLobby.id, {
        userId: user.uid,
        name: joinForm.name.trim(),
        phone: joinForm.phone.trim(),
        joinedAt: new Date().toISOString(),
        status: 'pending',
        role: 'player',
        skillLevel: joinForm.skillLevel,
        note: joinForm.note.trim(),
      });
      toast.success(`Join request sent to host ${joinModalLobby.hostName}! Host will review and confirm.`);
      setJoinModalLobby(null);
    } catch (err: any) {
      toast.error(err.message || 'Could not send join request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Leave squad or cancel lobby if host
  const handleLeaveClick = async (lobby: MatchLobby) => {
    const currentUserId = user?.uid;
    if (!currentUserId) return;

    const isHost = lobby.hostId === currentUserId;

    if (isHost) {
      if (
        !window.confirm(
          `⚠️ You are the HOST of "${lobby.title}"!\n\nLeaving this lobby will CANCEL and DELETE it completely for all players.\n\nAre you sure you want to cancel the match?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to leave / withdraw from "${lobby.title}"?`)) return;
    }

    try {
      const res = await leaveMatchLobby(lobby.id, currentUserId);
      if (res?.cancelled) {
        toast.info('Match lobby cancelled and removed.');
      } else {
        toast.info('You have left the squad lobby.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to leave squad');
    }
  };

  // Host confirms a player
  const handleConfirmPlayer = async (lobbyId: string, playerId: string) => {
    setActionLoadingId(playerId);
    try {
      await confirmPlayerInLobby(lobbyId, playerId);
      toast.success('Player confirmed in your squad!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm player');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Host declines a player
  const handleDeclinePlayer = async (lobbyId: string, playerId: string) => {
    setActionLoadingId(playerId);
    try {
      await declinePlayerInLobby(lobbyId, playerId);
      toast.info('Player join request declined.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to decline player');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Host removes a confirmed player
  const handleRemovePlayer = async (lobbyId: string, playerId: string, playerName: string) => {
    if (!window.confirm(`Remove ${playerName} from the squad?`)) return;
    setActionLoadingId(playerId);
    try {
      await removePlayerFromLobby(lobbyId, playerId);
      toast.info(`${playerName} was removed from the squad.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove player');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleShareWhatsApp = (lobby: MatchLobby) => {
    const confirmedCount = lobby.players?.filter((p) => p.status === 'confirmed').length || 0;
    const openSpots = Math.max(0, lobby.totalSpots - confirmedCount);
    const text = encodeURIComponent(
      `🏆 *Squad Match: ${lobby.title}*\n` +
      `⚽ Sport: ${lobby.sport.toUpperCase()}\n` +
      `📍 Venue: ${lobby.venueName}, ${lobby.location}\n` +
      `⏰ Time: ${lobby.date} (${lobby.time})\n` +
      `💰 Per Player: ₹${lobby.pricePerPlayer}\n` +
      `⚡ ${openSpots > 0 ? `${openSpots} spots left!` : 'Squad full!'}\n\n` +
      `Join squad here on PlaySphere AI: ${window.location.origin}/squads`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  // Filtering & Profile-Based Prioritization
  const userPrimarySport = (profile?.primarySport || '').toLowerCase();
  const userLocality = (profile?.locality || '').toLowerCase().trim();

  const filteredLobbies = lobbies.filter((lobby) => {
    const matchesSport = selectedSport === 'all' || lobby.sport === selectedSport;
    const matchesSkill = selectedSkill === 'all' || lobby.skillLevel === selectedSkill;
    const matchesSearch =
      (lobby.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lobby.venueName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lobby.location || '').toLowerCase().includes(searchQuery.toLowerCase());

    const isUserInLobby = user?.uid && lobby.players?.some((p) => p.userId === user.uid);
    const matchesView = viewFilter === 'all' || isUserInLobby;

    return matchesSport && matchesSkill && matchesSearch && matchesView;
  });

  // Sort: prioritize user's primarySport and user's locality
  const sortedLobbies = [...filteredLobbies].sort((a, b) => {
    const aSportMatch = userPrimarySport && a.sport?.toLowerCase() === userPrimarySport;
    const bSportMatch = userPrimarySport && b.sport?.toLowerCase() === userPrimarySport;

    const aLocMatch =
      userLocality &&
      ((a.location || '').toLowerCase().includes(userLocality) ||
        (a.venueName || '').toLowerCase().includes(userLocality));
    const bLocMatch =
      userLocality &&
      ((b.location || '').toLowerCase().includes(userLocality) ||
        (b.venueName || '').toLowerCase().includes(userLocality));

    const aScore = (aSportMatch ? 3 : 0) + (aLocMatch ? 2 : 0);
    const bScore = (bSportMatch ? 3 : 0) + (bLocMatch ? 2 : 0);

    return bScore - aScore;
  });

  const totalOpenSpots = lobbies.reduce((acc, curr) => {
    const confirmed = curr.players?.filter((p) => p.status === 'confirmed').length || 0;
    return acc + Math.max(0, curr.totalSpots - confirmed);
  }, 0);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-canvas pt-32 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-canvas pt-32 pb-24 px-4 flex items-center justify-center">
        <div className="relative bg-card border-3 border-black p-8 sm:p-12 rounded-sm shadow-[8px_8px_0px_#000] max-w-lg w-full text-center overflow-hidden animate-in fade-in duration-200">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400/20 border-2 border-black rotate-12 pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-cyan-400/20 border-2 border-black -rotate-12 pointer-events-none" />

          <div className="relative z-10">
            <h1
              className="text-4xl sm:text-5xl font-black uppercase text-primary mb-3 tracking-wide leading-none"
              style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
            >
              Login Required To View Squads
            </h1>

            <p className="text-secondary text-sm font-semibold mb-6 leading-relaxed">
              Find A Squad & Player Matchmaking is strictly available for logged-in sports players in Lucknow. Please sign in to explore active lobbies, join squads or host your own match.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/login?redirect=/squads"
                className="btn-primary text-xs font-black uppercase px-6 py-3.5 tracking-wider shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In Now</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
              <Link
                href="/auth/signup?redirect=/squads"
                className="px-6 py-3.5 bg-card hover:bg-card-hover text-primary border-2 border-black rounded-sm font-black text-xs uppercase shadow-[3px_3px_0px_#000] flex items-center justify-center cursor-pointer"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      {/* ── HERO BANNER ────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="relative bg-card border-3 border-black p-6 sm:p-10 rounded-sm shadow-[8px_8px_0px_#000] overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-yellow-400/20 border-3 border-black rotate-12 pointer-events-none" />
          <div className="absolute -bottom-6 left-1/3 w-24 h-24 bg-cyan-400/20 border-3 border-black -rotate-6 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-black uppercase text-primary tracking-wide leading-none mb-3"
                style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
              >
                Find A <span className="gradient-text">Squad</span> & Play
              </h1>
              <p className="text-secondary font-semibold text-sm sm:text-base leading-relaxed">
                Missing players for 6v6 turf football or badminton doubles? Join active match lobbies across Lucknow or host your own game.
              </p>

              {/* Personalized Profile Hint */}
              {(profile?.primarySport || profile?.locality) && (
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Target className="w-4 h-4 text-yellow-400" />
                  <span>
                    Prioritizing matches for:{' '}
                    <strong className="text-yellow-400 capitalize">{profile.primarySport || 'All Sports'}</strong>
                    {profile.locality && (
                      <span> in <strong className="text-cyan-400">{profile.locality}</strong></span>
                    )}
                  </span>
                  <Link href="/dashboard?tab=profile" className="text-primary underline hover:text-yellow-400 text-[11px] ml-1">
                    Edit Profile
                  </Link>
                </div>
              )}
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={handleOpenCreateModal}
                className="btn-primary text-xs sm:text-sm font-black uppercase tracking-wider px-6 py-4 flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Host A Match Lobby
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS & FILTER BAR */}
      <div className="max-w-6xl mx-auto mb-8 space-y-4">
        {/* Sport Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          {SPORT_FILTERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSport(s.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 border-2 border-black rounded-sm text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shadow-[2px_2px_0px_#000]',
                selectedSport === s.id
                  ? 'bg-yellow-400 text-black -translate-y-0.5 shadow-[3px_3px_0px_#000]'
                  : 'bg-card text-primary hover:bg-card-hover'
              )}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Search, Skill & View Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by turf name, area (e.g. Gomti Nagar, Aliganj)..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border-2 border-black rounded-sm text-xs sm:text-sm font-semibold text-primary focus:outline-none focus:border-yellow-400 shadow-[2px_2px_0px_#000]"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full py-2.5 px-3 bg-card border-2 border-black rounded-sm text-xs sm:text-sm font-black uppercase text-primary shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              <option value="all">Any Skill Level</option>
              <option value="beginner">Beginner Friendly</option>
              <option value="intermediate">Intermediate Level</option>
              <option value="advanced">Competitive / Advanced</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <button
              onClick={() => setViewFilter('all')}
              className={cn(
                'flex-1 py-2.5 text-xs font-black uppercase border-2 border-black rounded-sm transition-all shadow-[2px_2px_0px_#000]',
                viewFilter === 'all'
                  ? 'bg-yellow-400 text-black -translate-y-0.5'
                  : 'bg-card text-primary hover:bg-card-hover'
              )}
            >
              All Matches
            </button>
            <button
              onClick={() => setViewFilter('my-squads')}
              className={cn(
                'flex-1 py-2.5 text-xs font-black uppercase border-2 border-black rounded-sm transition-all shadow-[2px_2px_0px_#000]',
                viewFilter === 'my-squads'
                  ? 'bg-cyan-400 text-black -translate-y-0.5'
                  : 'bg-card text-primary hover:bg-card-hover'
              )}
            >
              My Squads
            </button>
          </div>
        </div>
      </div>

      {/* LOBBIES GRID */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-3 border-black border-t-yellow-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-secondary font-semibold text-sm">Loading active match lobbies in Lucknow...</p>
          </div>
        ) : sortedLobbies.length === 0 ? (
          <div className="bg-card border-3 border-black rounded-sm p-12 text-center shadow-[6px_6px_0px_#000]">
            <h3
              className="text-2xl font-black uppercase text-primary mb-2"
              style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
            >
              No Match Lobbies Found
            </h3>
            <p className="text-secondary text-sm font-semibold max-w-md mx-auto mb-6">
              {viewFilter === 'my-squads'
                ? "You haven't joined or hosted any match lobbies yet. Join an open game below!"
                : 'No games match your current filter. Be the leader and host one now!'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="btn-primary text-xs font-black uppercase px-6 py-3 tracking-wider inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Host A Game
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedLobbies.map((lobby) => {
              const confirmedPlayers = lobby.players?.filter((p) => p.status === 'confirmed') || [];
              const pendingPlayers = lobby.players?.filter((p) => p.status === 'pending') || [];
              const confirmedCount = confirmedPlayers.length;
              const openSpots = Math.max(0, lobby.totalSpots - confirmedCount);
              const isFull = openSpots === 0;

              const isHost = user?.uid === lobby.hostId;
              const userPlayer = lobby.players?.find((p) => p.userId === user?.uid);
              const isPending = userPlayer?.status === 'pending';
              const isConfirmed = userPlayer?.status === 'confirmed';

              const fillPercentage = Math.min(100, Math.round((confirmedCount / lobby.totalSpots) * 100));

              // Profile match check
              const isRecommended =
                userPrimarySport &&
                lobby.sport?.toLowerCase() === userPrimarySport &&
                (!userLocality ||
                  (lobby.location || '').toLowerCase().includes(userLocality) ||
                  (lobby.venueName || '').toLowerCase().includes(userLocality));

              return (
                <div
                  key={lobby.id}
                  className={cn(
                    'bg-card border-3 border-black rounded-sm p-5 shadow-[5px_5px_0px_#000] hover:shadow-[7px_7px_0px_#000] hover:-translate-y-0.5 transition-all flex flex-col justify-between relative',
                    isRecommended && 'ring-2 ring-yellow-400'
                  )}
                >
                  <div>
                    {/* Top Row: Sport Tag & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-400 text-black border-2 border-black text-[11px] font-black uppercase tracking-wider rounded-sm shadow-[2px_2px_0px_#000]">
                          <span>
                            {lobby.sport === 'football'
                              ? '⚽'
                              : lobby.sport === 'badminton'
                              ? '🏸'
                              : lobby.sport === 'cricket'
                              ? '🏏'
                              : lobby.sport === 'swimming'
                              ? '🏊'
                              : '🏆'}
                          </span>
                          <span>{lobby.sport}</span>
                        </span>

                        {isRecommended && (
                          <span className="px-2 py-0.5 bg-yellow-300 text-black border border-black text-[10px] font-black uppercase rounded shadow-[1px_1px_0px_#000]">
                            🎯 For You
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-card-nested border border-black text-[10px] font-bold uppercase text-secondary rounded">
                          {lobby.skillLevel}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 border border-black text-[10px] font-black uppercase rounded shadow-[1px_1px_0px_#000]',
                            isFull ? 'bg-red-400 text-black' : 'bg-emerald-400 text-black'
                          )}
                        >
                          {isFull ? 'Squad Full' : `${openSpots} Need`}
                        </span>
                      </div>
                    </div>

                    {/* Match Title */}
                    <h3 className="text-lg font-black text-primary leading-snug uppercase tracking-wide mb-2 line-clamp-2">
                      {lobby.title}
                    </h3>

                    {/* Venue & Location */}
                    <div className="space-y-1.5 text-xs text-secondary font-semibold mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                        <span className="truncate">
                          <strong className="text-primary">{lobby.venueName}</strong> — {lobby.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        <span>{lobby.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                        <span>{lobby.time}</span>
                      </div>
                    </div>

                    {/* Progress Bar & Spots */}
                    <div className="bg-card-nested border-2 border-black p-3 rounded-sm mb-4">
                      <div className="flex items-center justify-between text-xs font-black uppercase mb-1.5">
                        <span className="text-primary">Squad Roster</span>
                        <span className={openSpots <= 2 && openSpots > 0 ? 'text-amber-500' : 'text-primary'}>
                          {confirmedCount} / {lobby.totalSpots} Confirmed
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 border border-black rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 border-r border-black transition-all duration-300"
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>

                      {/* Joined Players Avatars */}
                      <div className="flex items-center gap-1 mt-2.5 overflow-hidden">
                        {confirmedPlayers.slice(0, 5).map((p, idx) => (
                          <div
                            key={idx}
                            title={`${p.name} (${p.role === 'host' ? 'Host' : 'Player'})`}
                            className="w-6 h-6 rounded-full bg-cyan-400 border border-black text-[10px] font-black text-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000]"
                          >
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {confirmedCount > 5 && (
                          <span className="text-[10px] font-bold text-muted-theme ml-1">
                            +{confirmedCount - 5} more
                          </span>
                        )}
                        <span className="text-[11px] text-muted-theme ml-auto font-bold truncate max-w-[140px]">
                          Host: <span className="text-primary font-black">{isHost ? 'You 👑' : lobby.hostName}</span>
                        </span>
                      </div>

                      {/* Host Pending Alert */}
                      {isHost && pendingPlayers.length > 0 && (
                        <div className="mt-2.5 px-2 py-1 bg-amber-400/20 border border-amber-500 rounded text-[11px] font-bold text-amber-500 flex items-center justify-between">
                          <span>🔔 {pendingPlayers.length} join request{pendingPlayers.length > 1 ? 's' : ''} waiting!</span>
                          <button
                            onClick={() => setManageRosterLobby(lobby)}
                            className="text-black bg-yellow-400 px-2 py-0.5 rounded text-[10px] font-black uppercase hover:bg-yellow-300"
                          >
                            Review
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notes if present */}
                    {lobby.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic line-clamp-2 mb-4 bg-slate-100 dark:bg-slate-900/60 p-2 rounded border border-black/20">
                        &ldquo;{lobby.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Pricing and Action Footer */}
                  <div className="pt-3 border-t-2 border-black/20">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-[10px] font-black uppercase text-muted-theme">Cost / Player</div>
                        <div className="text-base font-black text-emerald-500 dark:text-emerald-400">
                          {lobby.pricePerPlayer > 0 ? `₹${lobby.pricePerPlayer}` : 'FREE'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdmin && !isHost && (
                          <button
                            onClick={() => handleDeleteLobby(lobby.id, lobby.title)}
                            title="Admin Delete lobby"
                            className="px-2 py-1.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-black border-2 border-black rounded-sm shadow-[2px_2px_0px_#000] flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleShareWhatsApp(lobby)}
                          title="Share on WhatsApp"
                          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black border-2 border-black rounded-sm shadow-[2px_2px_0px_#000] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Invite</span>
                        </button>
                      </div>
                    </div>

                    {/* Primary Button State Machine */}
                    {isHost ? (
                      /* HOST CONTROLS */
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setManageRosterLobby(lobby)}
                          className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black rounded-sm font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] cursor-pointer"
                        >
                          <Users className="w-4 h-4" />
                          <span>Manage Roster</span>
                          {pendingPlayers.length > 0 && (
                            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] animate-pulse">
                              {pendingPlayers.length}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleLeaveClick(lobby)}
                          title="Cancelling deletes the lobby for all players"
                          className="px-3 py-2.5 bg-rose-500 hover:bg-rose-400 text-white border-2 border-black rounded-sm font-black text-xs uppercase shadow-[2px_2px_0px_#000] cursor-pointer"
                        >
                          Cancel Lobby
                        </button>
                      </div>
                    ) : isPending ? (
                      /* USER JOIN REQUEST IS PENDING */
                      <div className="flex items-center gap-2">
                        <div className="flex-1 py-2.5 bg-amber-400 text-black border-2 border-black rounded-sm font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000]">
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Approval Pending</span>
                        </div>
                        <button
                          onClick={() => handleLeaveClick(lobby)}
                          title="Withdraw your request to join"
                          className="px-3 py-2.5 bg-card hover:bg-card-hover text-secondary border-2 border-black rounded-sm font-black text-xs uppercase shadow-[2px_2px_0px_#000] cursor-pointer"
                        >
                          Withdraw
                        </button>
                      </div>
                    ) : isConfirmed ? (
                      /* USER IS CONFIRMED IN SQUAD */
                      <div className="flex items-center gap-2">
                        <div className="flex-1 py-2.5 bg-emerald-400 text-black border-2 border-black rounded-sm font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000]">
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>In Squad</span>
                        </div>
                        <button
                          onClick={() => handleLeaveClick(lobby)}
                          className="px-3 py-2.5 bg-rose-500 hover:bg-rose-400 text-white border-2 border-black rounded-sm font-black text-xs uppercase shadow-[2px_2px_0px_#000] cursor-pointer"
                        >
                          Leave
                        </button>
                      </div>
                    ) : isFull ? (
                      <button
                        disabled
                        className="w-full py-2.5 bg-slate-300 dark:bg-slate-800 text-slate-500 border-2 border-black rounded-sm font-black text-xs uppercase cursor-not-allowed opacity-75"
                      >
                        Squad Full
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinClick(lobby)}
                        className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black rounded-sm font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Users className="w-4 h-4 stroke-[2.5]" />
                        Request To Join ({openSpots} Spots Left)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CREATE LOBBY MODAL ─────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-card border-3 border-black rounded-sm shadow-[8px_8px_0px_#000] max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Sticky Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-black shrink-0 bg-card">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-yellow-400 border-2 border-black flex items-center justify-center text-base font-black shadow-[1px_1px_0px_#000]">
                  ⚽
                </div>
                <h2
                  className="text-2xl font-black uppercase text-primary tracking-wide leading-none"
                  style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
                >
                  Host A Match Lobby
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 hover:bg-card-hover border-2 border-black rounded cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-primary" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="host-lobby-form" onSubmit={handleCreateSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {venues.length > 0 && (
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-yellow-500" />
                    <span>Select From Lucknow Venues (Auto-fills details)</span>
                  </label>
                  <select
                    value={newMatch.venueId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      if (!selId || selId === 'custom') {
                        setNewMatch({ ...newMatch, venueId: '' });
                      } else {
                        const found = venues.find((v) => v.id === selId);
                        if (found) {
                          setNewMatch({
                            ...newMatch,
                            venueId: found.id,
                            venueName: found.name,
                            location: found.area || found.address || 'Lucknow',
                            sport: (found.sport as any) || newMatch.sport,
                          });
                        }
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-card-nested border-2 border-black rounded text-xs font-bold text-primary cursor-pointer"
                  >
                    <option value="">-- Select an approved Lucknow venue or type custom below --</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.sport.toUpperCase()}) — {v.area || v.address}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-primary mb-1">
                  Sport <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={newMatch.sport}
                  onChange={(e) => setNewMatch({ ...newMatch, sport: e.target.value as any })}
                  className="w-full py-2.5 px-3 bg-card-nested border-2 border-black rounded text-xs font-black uppercase text-primary"
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
                <label className="block text-xs font-black uppercase text-primary mb-1">
                  Match Title / Heading <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMatch.title}
                  onChange={(e) => setNewMatch({ ...newMatch, title: e.target.value })}
                  placeholder="e.g. Saturday Evening 6v6 Football Match"
                  className="w-full py-2 px-3 bg-card-nested border-2 border-black rounded text-sm text-primary font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">
                    Turf / Venue Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatch.venueName}
                    onChange={(e) => setNewMatch({ ...newMatch, venueName: e.target.value })}
                    placeholder="e.g. Ekana Football Turf"
                    className="w-full py-2 px-3 bg-card-nested border-2 border-black rounded text-sm text-primary font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">
                    Locality / Area
                  </label>
                  <input
                    type="text"
                    value={newMatch.location}
                    onChange={(e) => setNewMatch({ ...newMatch, location: e.target.value })}
                    placeholder="e.g. Gomti Nagar, Lucknow"
                    className="w-full py-2 px-3 bg-card-nested border-2 border-black rounded text-sm text-primary font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">
                    Match Date <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatch.date}
                    onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
                    placeholder="e.g. This Saturday, 15 Nov"
                    className="w-full py-2 px-3 bg-card-nested border-2 border-black rounded text-sm text-primary font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">
                    Timing / Slot <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatch.time}
                    onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
                    placeholder="e.g. 07:00 PM - 08:30 PM"
                    className="w-full py-2 px-3 bg-card-nested border-2 border-black rounded text-sm text-primary font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">
                    Total Spots
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={newMatch.totalSpots}
                    onChange={(e) => setNewMatch({ ...newMatch, totalSpots: Number(e.target.value) })}
                    className="w-full py-2 px-3 bg-card-nested border-2 border-black rounded text-sm text-primary font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">
                    ₹ / Player
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newMatch.pricePerPlayer}
                    onChange={(e) => setNewMatch({ ...newMatch, pricePerPlayer: Number(e.target.value) })}
                    className="w-full py-2 px-3 bg-card-nested border-2 border-black rounded text-sm text-primary font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">
                    Skill Level
                  </label>
                  <select
                    value={newMatch.skillLevel}
                    onChange={(e) => setNewMatch({ ...newMatch, skillLevel: e.target.value as any })}
                    className="w-full py-2 px-2 bg-card-nested border-2 border-black rounded text-xs font-bold text-primary"
                  >
                    <option value="all">Any</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">
                    Your Name (Host) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatch.hostName}
                    onChange={(e) => setNewMatch({ ...newMatch, hostName: e.target.value })}
                    placeholder="Your Name"
                    className="w-full py-2 px-3 bg-card-nested border-2 border-black rounded text-sm text-primary font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">
                    Your WhatsApp Phone
                  </label>
                  <input
                    type="tel"
                    value={newMatch.hostPhone}
                    onChange={(e) => setNewMatch({ ...newMatch, hostPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full py-2 px-3 bg-card-nested border-2 border-black rounded text-sm text-primary font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-primary mb-1">
                  Special Notes / Rules (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newMatch.notes}
                  onChange={(e) => setNewMatch({ ...newMatch, notes: e.target.value })}
                  placeholder="e.g. Bring turf studs. Bibs and water available. Be on time!"
                  className="w-full py-2 px-3 bg-card-nested border-2 border-black rounded text-xs text-primary font-medium"
                />
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="p-4 border-t-2 border-black bg-card-nested shrink-0 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border-2 border-black rounded text-xs font-black uppercase hover:bg-card-hover text-primary shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="host-lobby-form"
                disabled={isSubmitting}
                className="btn-primary text-xs font-black uppercase px-6 py-2.5 shadow-[3px_3px_0px_#000] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Launching...' : 'Launch Lobby 🚀'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── JOIN SQUAD REQUEST MODAL ───────────────────────────────── */}
      {joinModalLobby && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-card border-3 border-black p-6 rounded-sm shadow-[8px_8px_0px_#000] max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-yellow-400 border border-black flex items-center justify-center text-sm font-black">
                  🙋
                </div>
                <h3 className="text-lg font-black uppercase text-primary">
                  Request To Join Squad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setJoinModalLobby(null)}
                className="p-1 hover:bg-card-hover border border-black rounded cursor-pointer"
              >
                <X className="w-4 h-4 text-primary" />
              </button>
            </div>

            <div className="bg-card-nested border-2 border-black p-3.5 rounded mb-4 text-xs space-y-1">
              <div className="font-black text-primary uppercase text-sm">{joinModalLobby.title}</div>
              <div className="text-secondary flex items-center gap-1">
                <MapPin className="w-3 h-3 text-yellow-500" />
                <span>{joinModalLobby.venueName} · {joinModalLobby.location}</span>
              </div>
              <div className="text-secondary flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-500" />
                <span>{joinModalLobby.date} ({joinModalLobby.time})</span>
              </div>
              <div className="text-emerald-500 font-bold pt-1 border-t border-black/20 mt-1 flex justify-between">
                <span>Cost / Player:</span>
                <span>{joinModalLobby.pricePerPlayer > 0 ? `₹${joinModalLobby.pricePerPlayer}` : 'FREE'}</span>
              </div>
            </div>

            <div className="p-3 bg-yellow-400/10 border-2 border-yellow-400/40 rounded text-xs text-yellow-600 dark:text-yellow-400 font-semibold mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                The host will review your request and contact details before confirming your spot in the squad.
              </span>
            </div>

            <form onSubmit={handleExecuteJoin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase text-primary mb-1">
                  Your Full Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={joinForm.name}
                  onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                  placeholder="e.g. Aman Sharma"
                  className="w-full py-2 px-3 bg-card-nested border-2 border-black rounded text-sm text-primary font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-primary mb-1 flex items-center justify-between">
                  <span>WhatsApp / Mobile Number <span className="text-red-500 font-bold">*</span></span>
                  <span className="text-[10px] text-muted-theme font-bold">Host will contact you</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={joinForm.phone}
                    onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-card-nested border-2 border-black rounded text-sm text-primary font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">
                    Your Skill Level
                  </label>
                  <select
                    value={joinForm.skillLevel}
                    onChange={(e) => setJoinForm({ ...joinForm, skillLevel: e.target.value })}
                    className="w-full py-2 px-2.5 bg-card-nested border-2 border-black rounded text-xs font-bold text-primary"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-primary mb-1">
                  Message / Role Note for Host (Optional)
                </label>
                <textarea
                  rows={2}
                  value={joinForm.note}
                  onChange={(e) => setJoinForm({ ...joinForm, note: e.target.value })}
                  placeholder="e.g. Can play defense/goalkeeper. Will be there 10 mins early!"
                  className="w-full py-2 px-3 bg-card-nested border-2 border-black rounded text-xs text-primary font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-black/20">
                <button
                  type="button"
                  onClick={() => setJoinModalLobby(null)}
                  className="px-4 py-2 border-2 border-black rounded text-xs font-bold text-primary hover:bg-card-hover cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs font-black uppercase px-5 py-2.5 shadow-[2px_2px_0px_#000] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Join Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {manageRosterLobby && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-card border-3 border-black rounded-sm shadow-[8px_8px_0px_#000] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-black shrink-0 bg-card">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-yellow-400 border-2 border-black flex items-center justify-center text-lg font-black shadow-[1px_1px_0px_#000]">
                  👥
                </div>
                <div>
                  <h2
                    className="text-xl sm:text-2xl font-black uppercase text-primary tracking-wide leading-none"
                    style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
                  >
                    Manage Squad Roster
                  </h2>
                  <p className="text-secondary text-xs font-semibold mt-0.5 truncate max-w-md">
                    {manageRosterLobby.title} ({manageRosterLobby.venueName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManageRosterLobby(null)}
                className="p-1 hover:bg-card-hover border-2 border-black rounded cursor-pointer transition-colors"
              >
                <X className="w-5 h-5 text-primary" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black uppercase text-primary flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Pending Join Requests</span>
                    <span className="px-2 py-0.5 bg-amber-400 text-black border border-black rounded-full text-xs font-black">
                      {manageRosterLobby.players?.filter((p) => p.status === 'pending').length || 0}
                    </span>
                  </h3>
                  <span className="text-[11px] text-muted-theme font-bold">Review player details & confirm</span>
                </div>

                {(!manageRosterLobby.players ||
                  manageRosterLobby.players.filter((p) => p.status === 'pending').length === 0) ? (
                  <div className="p-4 bg-card-nested border-2 border-dashed border-black/30 rounded text-center text-xs font-semibold text-secondary">
                    No pending join requests. When other players request to join your squad, they will appear here with their contact info.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {manageRosterLobby.players
                      .filter((p) => p.status === 'pending')
                      .map((p) => {
                        const cleanPhone = (p.phone || '').replace(/[^0-9+]/g, '');
                        const waLink = cleanPhone
                          ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
                              `Hi ${p.name}, I am the host of "${manageRosterLobby.title}" on PlaySphere AI regarding your squad join request!`
                            )}`
                          : null;

                        return (
                          <div
                            key={p.userId}
                            className="bg-card-nested border-2 border-black p-3.5 rounded shadow-[3px_3px_0px_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-primary uppercase">{p.name}</span>
                                {p.skillLevel && (
                                  <span className="px-1.5 py-0.5 bg-card border border-black text-[10px] font-black uppercase text-secondary rounded">
                                    {p.skillLevel}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                {cleanPhone ? (
                                  <>
                                    <a
                                      href={`tel:${cleanPhone}`}
                                      className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline bg-slate-900 px-2 py-0.5 rounded border border-black"
                                    >
                                      <Phone className="w-3 h-3 text-cyan-400" />
                                      <span>{p.phone}</span>
                                    </a>
                                    {waLink && (
                                      <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline bg-slate-900 px-2 py-0.5 rounded border border-black"
                                      >
                                        <MessageCircle className="w-3 h-3 text-emerald-400" />
                                        <span>WhatsApp Chat</span>
                                      </a>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-theme italic">No phone number provided</span>
                                )}
                              </div>

                              {p.note && (
                                <p className="text-xs text-slate-400 italic mt-1">
                                  &ldquo;{p.note}&rdquo;
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-black/20 pt-2 sm:pt-0">
                              <button
                                onClick={() => handleDeclinePlayer(manageRosterLobby.id, p.userId)}
                                disabled={actionLoadingId === p.userId}
                                className="px-3 py-1.5 bg-card hover:bg-card-hover border-2 border-black rounded text-xs font-black uppercase text-secondary shadow-[2px_2px_0px_#000] cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              >
                                <UserX className="w-3.5 h-3.5 text-rose-500" />
                                <span>Decline</span>
                              </button>
                              <button
                                onClick={() => handleConfirmPlayer(manageRosterLobby.id, p.userId)}
                                disabled={actionLoadingId === p.userId}
                                className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black border-2 border-black rounded text-xs font-black uppercase shadow-[2px_2px_0px_#000] cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              >
                                {actionLoadingId === p.userId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                )}
                                <span>Confirm Spot</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* SECTION 2: CONFIRMED SQUAD MEMBERS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black uppercase text-primary flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Confirmed Squad Members</span>
                    <span className="px-2 py-0.5 bg-emerald-400 text-black border border-black rounded-full text-xs font-black">
                      {manageRosterLobby.players?.filter((p) => p.status === 'confirmed').length || 0} / {manageRosterLobby.totalSpots}
                    </span>
                  </h3>
                  <span className="text-[11px] text-muted-theme font-bold">Official Match Lineup</span>
                </div>

                <div className="space-y-2">
                  {manageRosterLobby.players
                    ?.filter((p) => p.status === 'confirmed')
                    .map((p) => {
                      const isHostPlayer = p.role === 'host' || p.userId === manageRosterLobby.hostId;
                      const cleanPhone = (p.phone || '').replace(/[^0-9+]/g, '');
                      const waLink = cleanPhone
                        ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
                            `Hi ${p.name}, match update for "${manageRosterLobby.title}" on PlaySphere AI!`
                          )}`
                        : null;

                      return (
                        <div
                          key={p.userId}
                          className="bg-card border-2 border-black p-3 rounded shadow-[2px_2px_0px_#000] flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-400 border border-black text-xs font-black text-black flex items-center justify-center shrink-0">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-primary uppercase">{p.name}</span>
                                {isHostPlayer ? (
                                  <span className="px-2 py-0.5 bg-yellow-400 text-black border border-black text-[10px] font-black uppercase rounded">
                                    Host 👑
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 bg-emerald-400/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase rounded">
                                    Confirmed
                                  </span>
                                )}
                              </div>
                              {p.phone && (
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-secondary font-medium">
                                  <span>{p.phone}</span>
                                  {waLink && (
                                    <a
                                      href={waLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-400 hover:underline flex items-center gap-0.5 text-[11px]"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {!isHostPlayer && (
                            <button
                              onClick={() => handleRemovePlayer(manageRosterLobby.id, p.userId, p.name)}
                              disabled={actionLoadingId === p.userId}
                              className="px-2.5 py-1 text-xs font-bold text-rose-500 hover:text-white hover:bg-rose-500 border border-black rounded cursor-pointer transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-black bg-card-nested shrink-0 flex items-center justify-between">
              <span className="text-xs font-bold text-secondary">
                Spot capacity: {manageRosterLobby.totalSpots} Players max
              </span>
              <button
                type="button"
                onClick={() => setManageRosterLobby(null)}
                className="btn-primary text-xs font-black uppercase px-6 py-2 shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
