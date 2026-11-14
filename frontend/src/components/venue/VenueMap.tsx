'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { MapPin, ArrowRight, Eye, Shield, Sparkles, Bookmark, BookmarkCheck, Loader2, X } from 'lucide-react';
import { formatCurrency, getSportEmoji, getSportImage, cn } from '@/shared/helpers/utils';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useTheme } from '@/contexts/ThemeProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/contexts/ToastContext';
import { toggleSavedVenue } from '@/backend/firebase/firestore';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface MapItem {
  id: string;
  name: string;
  area: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  mapType: 'marketplace' | 'infrastructure' | 'landmark';
  sport?: string;
  imageUrl?: string;
  rating?: number;
  price?: number;
  available?: boolean;
  venueCode?: string;
  ownershipStatus?: 'pending' | 'approved' | 'rejected' | null;
  sportsRelevance?: string[];
  markerColor?: string; 
}

interface VenueMapProps {
  items: MapItem[];
}

function MapSkeleton({ message = 'Loading realtime venue mapping and infrastructure layers...' }: { message?: string }) {
  return (
    <div className="w-full h-full bg-card relative overflow-hidden flex flex-col items-center justify-center p-6 min-h-[400px]">
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .neo-grid-bg {
          background-image: radial-gradient(circle, #ffffff 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
        .animated-shimmer {
          animation: shimmer 2.5s infinite linear;
        }
      `}</style>
      
      <div className="absolute inset-0 opacity-5 pointer-events-none neo-grid-bg" />
      
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent pointer-events-none animated-shimmer" />

      <div className="text-center z-10">
        <div className="relative mb-5 flex justify-center">
          <div className="w-14 h-14 bg-cyan-950/40 border-2 border-cyan-400 rounded-full flex items-center justify-center animate-bounce">
            <MapPin className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="absolute -inset-1 border-2 border-cyan-400/30 rounded-full animate-ping opacity-45" />
        </div>
        
        <h3 className="text-white font-extrabold text-base mb-2 font-mono uppercase tracking-wider">
          Preparing Map Viewport
        </h3>
        <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      <div className="absolute top-3 left-3 bg-slate-900/90 border-2 border-black rounded-md px-3 py-1.5 text-xs font-bold text-slate-400 shadow-[3px_3px_0px_0px_#000] flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
        Syncing infrastructure telemetry...
      </div>
    </div>
  );
}

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'poi.sports_complex', elementType: 'geometry', stylers: [{ color: '#064e3b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
];

const lightMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#1e293b' }] },
  { featureType: 'poi.sports_complex', elementType: 'geometry', stylers: [{ color: '#bbf7d0' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dcfce7' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fed7aa' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bae6fd' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#94a3b8' }] },
];

function ActiveVenueMap({ items }: VenueMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  const { theme } = useTheme();
  const isLight = theme === 'light';
  const mapStyles = isLight ? lightMapStyles : darkMapStyles;

  const center = useMemo(() => ({ lat: 26.8467, lng: 80.9462 }), []);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const { coordinates: userLocation } = useGeolocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const hasPannedToUser = useRef(false);

  const { user, profile } = useAuth();
  const toast = useToast();
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleSaveToggle = async (e: React.MouseEvent, itemId: string, itemName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Please log in to save and bookmark venues!');
      return;
    }
    const isSaved = profile?.savedVenues?.includes(itemId) ?? false;
    setSavingId(itemId);
    try {
      await toggleSavedVenue(user.uid, itemId, isSaved);
      if (isSaved) {
        toast.info(`Removed "${itemName}" from saved venues`);
      } else {
        toast.success(`Saved "${itemName}" to your favorites! ❤️`);
      }
    } catch (err: any) {
      toast.error('Failed to update saved venue');
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setOptions({ styles: isLight ? lightMapStyles : darkMapStyles });
    }
  }, [isLight]);

  useEffect(() => {
    if (userLocation && mapRef.current && !hasPannedToUser.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(13);
      hasPannedToUser.current = true;
    }
  }, [userLocation]);

  const adjustedItems = useMemo(() => {
    const coordsMap = new Map<string, number>();
    
    const validItems = items.filter(
      (item) =>
        item?.coordinates &&
        typeof item.coordinates.lat === 'number' &&
        typeof item.coordinates.lng === 'number' &&
        !isNaN(item.coordinates.lat) &&
        !isNaN(item.coordinates.lng)
    );

    return validItems.map((item) => {
      const { lat, lng } = item.coordinates;
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      const count = coordsMap.get(key) || 0;
      coordsMap.set(key, count + 1);

      const markerColor =
        item.mapType === 'marketplace'
          ? '#22d3ee'
          : item.mapType === 'infrastructure'
          ? '#94a3b8'
          : '#fbbf24';

      let finalCoords = { lat, lng };

      if (count > 0) {
        const angle = count * ((2 * Math.PI) / 8);
        const radius = 0.00008 * (1 + Math.floor(count / 8) * 0.5);
        finalCoords = {
          lat: lat + radius * Math.sin(angle),
          lng: lng + radius * Math.cos(angle),
        };
      }

      return {
        ...item,
        coordinates: finalCoords,
        markerColor,
      };
    });
  }, [items]);

  const nearbySportsCount = useMemo(() => {
    if (!selectedItem || selectedItem.mapType !== 'landmark' || !selectedItem.coordinates) return 0;
    const { lat, lng } = selectedItem.coordinates;

    const nearby = adjustedItems.filter((item) => {
      if (item.mapType === 'landmark') return false;
      const dist = getDistance(lat, lng, item.coordinates.lat, item.coordinates.lng);
      return dist <= 3.0;
    });

    return nearby.length;
  }, [selectedItem, adjustedItems]);

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#080a10] border-2 border-black rounded-xl p-6 min-h-[400px]">
        <div className="text-center bg-[#0d111d] border-2 border-red-500/50 p-6 rounded-lg max-w-sm">
          <div className="w-12 h-12 bg-red-950/40 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-red-400 text-lg">⚠️</span>
          </div>
          <h3 className="text-white font-extrabold text-sm mb-2">Google Maps failed to load</h3>
          <p className="text-slate-400 text-xs mb-4">
            Could not initialize the maps client. Please check your internet connection or API key.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-400 text-black font-black text-xs py-2 px-4 rounded border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <MapSkeleton message="Connecting to Google Maps services..." />;
  }

  const activeMarketplaceCount = items.filter(
    (item) => item.mapType === 'marketplace' && item.available
  ).length;

  const mappedInfraCount = items.filter(
    (item) => item.mapType === 'infrastructure'
  ).length;

  return (
    <div className="w-full h-full relative min-h-[400px]">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={12}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: typeof google !== 'undefined' ? google.maps.ControlPosition.RIGHT_BOTTOM : undefined,
          },
          gestureHandling: 'cooperative',
        }}
        onLoad={(map) => { mapRef.current = map; }}
      >
        {adjustedItems.map((item) => (
          <MarkerF
            key={`${item.mapType}-${item.id}`}
            position={{ lat: item.coordinates.lat, lng: item.coordinates.lng }}
            onClick={() => setSelectedItem(item)}
            icon={{
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: item.markerColor || '#22d3ee',
              fillOpacity: 1,
              strokeWeight: 1.5,
              strokeColor: '#000000',
              scale: 1.8,
              anchor: typeof google !== 'undefined' ? new google.maps.Point(12, 24) : undefined,
            }}
          />
        ))}

        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#3b82f6', 
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 8,
            }}
            zIndex={1000} 
            onClick={() => {
            }}
          />
        )}

        {selectedItem && selectedItem.coordinates && (
          <InfoWindowF
            position={{ lat: selectedItem.coordinates.lat, lng: selectedItem.coordinates.lng }}
            onCloseClick={() => setSelectedItem(null)}
            options={{
              pixelOffset: typeof google !== 'undefined' ? new google.maps.Size(0, -36) : undefined,
              disableAutoPan: false,
            }}
          >
            <div className="rounded-lg overflow-hidden bg-card border-3 border-black shadow-[6px_6px_0px_#000] min-w-[240px] max-w-[290px] text-primary relative">
              {selectedItem.mapType !== 'landmark' && (
                <div className="relative h-28 overflow-hidden bg-slate-900">
                  <img
                    src={selectedItem.imageUrl || getSportImage(selectedItem.sport || 'football', selectedItem.id)}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {selectedItem.sport && (
                    <div className="absolute bottom-2 left-2 text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded border border-black bg-cyan-400 text-black shadow-[1px_1px_0px_#000]">
                      {getSportEmoji(selectedItem.sport)} {selectedItem.sport}
                    </div>
                  )}

                  {selectedItem.mapType === 'infrastructure' ? (
                    <div className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-black bg-slate-800 text-slate-200 shadow-[1px_1px_0px_#000]">
                      Mapped
                    </div>
                  ) : !selectedItem.available ? (
                    <div className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-black bg-rose-500 text-black shadow-[1px_1px_0px_#000]">
                      Unavailable
                    </div>
                  ) : null}

                  <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                    <button
                      type="button"
                      onClick={(e) => handleSaveToggle(e, selectedItem.id, selectedItem.name)}
                      disabled={savingId === selectedItem.id}
                      title={profile?.savedVenues?.includes(selectedItem.id) ? 'Remove from saved' : 'Save venue to favorites'}
                      className={cn(
                        'w-8 h-8 rounded border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5',
                        profile?.savedVenues?.includes(selectedItem.id)
                          ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                          : isLight
                          ? 'bg-white text-black hover:bg-yellow-100'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      )}
                    >
                      {savingId === selectedItem.id ? (
                        <Loader2 className={cn("w-4 h-4 animate-spin", profile?.savedVenues?.includes(selectedItem.id) ? "text-black" : isLight ? "text-black" : "text-white")} />
                      ) : profile?.savedVenues?.includes(selectedItem.id) ? (
                        <BookmarkCheck className="w-4 h-4 stroke-[2.5] text-black fill-black/20" />
                      ) : (
                        <Bookmark className={cn("w-4 h-4 stroke-[2.5]", isLight ? "text-black" : "text-white")} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(null);
                      }}
                      title="Close popup"
                      className={cn(
                        'w-8 h-8 rounded border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] transition-colors cursor-pointer active:translate-x-0.5 active:translate-y-0.5',
                        isLight
                          ? 'bg-white text-black hover:bg-rose-500 hover:text-white'
                          : 'bg-slate-900 text-white hover:bg-rose-500 hover:text-white'
                      )}
                    >
                      <X className={cn("w-4 h-4 stroke-[3]", isLight ? "text-black" : "text-white")} />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-extrabold text-sm font-sans text-primary leading-tight">
                    {selectedItem.name}
                  </h4>
                  {selectedItem.mapType === 'landmark' && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleSaveToggle(e, selectedItem.id, selectedItem.name)}
                        disabled={savingId === selectedItem.id}
                        title={profile?.savedVenues?.includes(selectedItem.id) ? 'Remove from saved' : 'Save to favorites'}
                        className={cn(
                          'w-8 h-8 shrink-0 rounded border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5',
                          profile?.savedVenues?.includes(selectedItem.id)
                            ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                            : isLight
                            ? 'bg-white text-black hover:bg-yellow-100'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        )}
                      >
                        {savingId === selectedItem.id ? (
                          <Loader2 className={cn("w-4 h-4 animate-spin", profile?.savedVenues?.includes(selectedItem.id) ? "text-black" : isLight ? "text-black" : "text-white")} />
                        ) : profile?.savedVenues?.includes(selectedItem.id) ? (
                          <BookmarkCheck className="w-4 h-4 stroke-[2.5] text-black fill-black/20" />
                        ) : (
                          <Bookmark className={cn("w-4 h-4 stroke-[2.5]", isLight ? "text-black" : "text-white")} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(null);
                        }}
                        title="Close popup"
                        className={cn(
                          'w-8 h-8 rounded border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] cursor-pointer transition-colors active:translate-x-0.5 active:translate-y-0.5',
                          isLight
                            ? 'bg-white text-black hover:bg-rose-500 hover:text-white'
                            : 'bg-slate-900 text-white hover:bg-rose-500 hover:text-white'
                        )}
                      >
                        <X className={cn("w-4 h-4 stroke-[3]", isLight ? "text-black" : "text-white")} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-muted-theme text-xs mb-2.5 flex items-center gap-1 font-medium">
                  <span>📍</span> {selectedItem.area}
                </div>

                {selectedItem.mapType === 'marketplace' && (
                  <>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[#22d3ee] font-bold text-sm">
                        {formatCurrency(selectedItem.price || 0)}/hr
                      </span>
                      <span className="text-[#fbbf24] text-xs font-semibold">
                        ★ {selectedItem.rating || 0}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t-2 border-black">
                      <Link
                        href={`/venues/${selectedItem.id}`}
                        className="btn-primary w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-black font-black text-xs uppercase tracking-wider rounded-sm shadow-[3px_3px_0px_#000] no-underline cursor-pointer"
                      >
                        <span>View & Book</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                      </Link>
                    </div>
                  </>
                )}

                {selectedItem.mapType === 'infrastructure' && (
                  <>
                    <div className="bg-card-nested border-2 border-black p-2 rounded-sm text-[11px] mb-2 text-primary font-mono shadow-[2px_2px_0px_#000]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-secondary font-bold">CODE:</span>
                        <span className="font-bold">{selectedItem.venueCode || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-secondary font-bold">STATUS:</span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 text-[9px] font-black uppercase rounded border border-black shadow-[1px_1px_0px_#000]',
                            selectedItem.ownershipStatus === 'approved'
                              ? 'bg-emerald-400 text-black'
                              : selectedItem.ownershipStatus === 'pending'
                              ? 'bg-amber-400 text-black'
                              : 'bg-rose-500 text-white'
                          )}
                        >
                          {selectedItem.ownershipStatus === 'approved'
                            ? 'Verified'
                            : selectedItem.ownershipStatus === 'pending'
                            ? 'Pending'
                            : 'Unverified'}
                        </span>
                      </div>
                    </div>

                    <div className="text-rose-500 font-black text-[10px] uppercase tracking-wider bg-rose-950/20 border border-rose-500/30 px-2 py-1 rounded text-center">
                      Booking Unavailable
                    </div>

                    <div className="mt-3 pt-3 border-t-2 border-black">
                      {selectedItem.ownershipStatus !== 'approved' && selectedItem.ownershipStatus !== 'pending' ? (
                        <Link
                          href={`/owner?tab=verify&code=${selectedItem.venueCode}`}
                          className="btn-primary w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-black font-black text-xs uppercase tracking-wider rounded-sm shadow-[3px_3px_0px_#000] no-underline cursor-pointer"
                        >
                          <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Verify Ownership</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                        </Link>
                      ) : (
                        <Link
                          href={`/venues/${selectedItem.id}?infra=true`}
                          className="btn-secondary w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-black font-black text-xs uppercase tracking-wider rounded-sm shadow-[3px_3px_0px_#000] no-underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                        </Link>
                      )}
                    </div>
                  </>
                )}

                {selectedItem.mapType === 'landmark' && (
                  <>
                    <div className="bg-amber-950/40 border-2 border-amber-500/40 p-2.5 rounded-sm text-xs mb-2">
                      <span className="text-[#fbbf24] font-black uppercase text-[11px] flex items-center gap-1">
                        ★ Sports Hub Area
                      </span>
                      <div className="text-slate-300 mt-1 font-semibold text-[11px]">
                        Nearby sports facilities: <strong className="text-yellow-400">{nearbySportsCount} found</strong> within 3km.
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal mb-2 font-medium">
                      Discovery Helper: Try searching &quot;near {selectedItem.name}&quot; in the AI Concierge to discover and book available slots!
                    </p>
                    <div className="mt-3 pt-3 border-t-2 border-black">
                      <Link
                        href={`/concierge?q=near+${encodeURIComponent(selectedItem.name)}`}
                        className="btn-primary w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-black font-black text-[11px] uppercase tracking-wider rounded-sm shadow-[3px_3px_0px_#000] no-underline cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Find Venues Near Here</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      <div className="absolute top-3 left-3 bg-card border-2 border-black rounded-md px-3 py-1.5 text-xs font-bold text-primary shadow-[3px_3px_0px_0px_#000] pointer-events-none">
        <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-cyan-400" />
        {activeMarketplaceCount} active venues ({mappedInfraCount} mapped)
      </div>
    </div>
  );
}

export function VenueMap(props: VenueMapProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="h-[400px] sm:h-[500px] md:h-[600px] w-full rounded-xl overflow-hidden relative border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-card"
    >
      {shouldLoad ? (
        <ActiveVenueMap {...props} />
      ) : (
        <MapSkeleton />
      )}
    </div>
  );
}

