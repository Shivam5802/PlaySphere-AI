import { Venue } from '@/shared/types';

// Haversine formula to compute distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
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

export interface RankingCriteria {
  sport?: string;
  area?: string;
  maxPrice?: number;
  skillLevel?: string;
  preferredTime?: string;
  nearLandmark?: string;
  venueName?: string;
  nearMe?: boolean;
  userLocation?: { lat: number; lng: number };
}

export interface RankedVenue {
  venue: Venue;
  score: number;
  scoreBreakdown: {
    skillScore: number;
    priceScore: number;
    locationScore: number;
    ratingScore: number;
    availabilityScore: number;
  };
  explanation: string;
}

export function rankVenues(venues: Venue[], criteria: RankingCriteria): RankedVenue[] {
  return venues
    .map((v) => {
      // 1. Skill Compatibility Score (Weight: 30%)
      let skillScore = 1.0;
      if (criteria.skillLevel) {
        if (v.skillLevel === 'all') {
          skillScore = 0.8;
        } else if (v.skillLevel.toLowerCase() === criteria.skillLevel.toLowerCase()) {
          skillScore = 1.0;
        } else {
          // Mismatch
          skillScore = 0.2;
        }
      }

      // 2. Budget Score (Weight: 25%)
      let priceScore = 1.0;
      if (criteria.maxPrice) {
        if (v.price <= criteria.maxPrice) {
          priceScore = 1.0;
        } else if (v.price <= criteria.maxPrice * 1.2) {
          priceScore = 0.6; // Slightly over budget
        } else {
          priceScore = 0.1; // Way over budget
        }
      }

      // 3. Location / Area Match (Weight: 25%)
      let locationScore = 1.0;
      if (criteria.venueName || criteria.area || criteria.nearLandmark) {
        const queryVenueName = (criteria.venueName || '').toLowerCase();
        const queryArea = (criteria.area || '').toLowerCase();
        const queryLandmark = (criteria.nearLandmark || '').toLowerCase();
        const venueArea = v.area.toLowerCase();
        const venueName = v.name.toLowerCase();
        const venueDesc = v.description.toLowerCase();

        const queryWords = queryVenueName.split(/\s+/).filter(w => w.length >= 3 && w !== 'sports' && w !== 'complex' && w !== 'arena' && w !== 'center' && w !== 'park' && w !== 'turf' && w !== 'field');
        const hasWordMatch = queryWords.length > 0 && queryWords.some(word => venueName.includes(word));

        if (queryVenueName && (venueName.includes(queryVenueName) || queryVenueName.includes(venueName) || hasWordMatch)) {
          // Specific venue name matches get a massive priority boost
          locationScore = 3.0;
        } else if (
          venueArea === queryArea || 
          (queryLandmark && (
            venueName.includes(queryLandmark) || 
            venueDesc.includes(queryLandmark) || 
            venueArea.includes(queryLandmark)
          ))
        ) {
          locationScore = 1.0;
        } else if (queryArea && (venueArea.includes(queryArea) || queryArea.includes(venueArea))) {
          locationScore = 0.8;
        } else {
          locationScore = 0.1;
        }
      }

      // 4. Rating Score (Weight: 10%)
      const ratingScore = (v.rating || 4.0) / 5.0;

      // 5. Availability Score (Weight: 10%)
      const availabilityScore = v.available ? 1.0 : 0.0;

      // 6. Locality-Aware Proximity AI Boost
      let localityBoost = 0;
      const queryArea = (criteria.area || '').toLowerCase().trim();
      const queryLandmark = (criteria.nearLandmark || '').toLowerCase().trim();
      const venueArea = v.area.toLowerCase().trim();
      const venueName = v.name.toLowerCase().trim();
      const venueDesc = v.description.toLowerCase().trim();

      if (queryArea && venueArea === queryArea) {
        localityBoost = 25;
      } else if (queryLandmark && (venueName.includes(queryLandmark) || venueDesc.includes(queryLandmark) || venueArea.includes(queryLandmark))) {
        localityBoost = 20;
      } else if (queryArea && (venueArea.includes(queryArea) || queryArea.includes(venueArea))) {
        localityBoost = 15;
      }

      // 6.5 Live Location Proximity Boost
      let proximityBoost = 0;
      let distanceKm: number | null = null;
      if (criteria.nearMe && criteria.userLocation && v.coordinates) {
        distanceKm = getDistance(
          criteria.userLocation.lat,
          criteria.userLocation.lng,
          v.coordinates.lat,
          v.coordinates.lng
        );
        
        // Boost for nearby venues
        if (distanceKm <= 5) {
          proximityBoost = 40;
        } else if (distanceKm <= 10) {
          proximityBoost = 20;
        } else if (distanceKm <= 20) {
          proximityBoost = 10;
        }
      }

      // 7. Infrastructure vs Marketplace Priority Boost
      let priorityBoost = 0;
      const isInfra = v.category === 'infrastructure';
      const isVerifiedInfra = isInfra && (v.ownerLinked === true || v.ownershipStatus === 'approved');
      
      if (isInfra) {
        if (isVerifiedInfra) {
          priorityBoost = 10; // verified infrastructure
        } else {
          priorityBoost = 0;  // mapped infrastructure
        }
      } else {
        priorityBoost = 20; // verified marketplace venue
      }

      // Calculate Weighted Total Score
      const totalScore = Math.round(
        (skillScore * 0.3 +
          priceScore * 0.25 +
          locationScore * 0.25 +
          ratingScore * 0.1 +
          availabilityScore * 0.1) *
          100
      ) + priorityBoost + localityBoost + proximityBoost;

      // Construct programmatic grounded recommendation rationale
      const targetLocation = criteria.nearMe && distanceKm !== null 
        ? `your current location (${distanceKm.toFixed(1)} km away)`
        : (criteria.nearLandmark || criteria.area || v.area);
      const explanation = `Recommended because it is close to ${targetLocation}, is currently bookable, fits your budget, and supports ${v.sport || 'your needs'}.`;

      return {
        venue: v,
        score: totalScore,
        scoreBreakdown: {
          skillScore,
          priceScore,
          locationScore,
          ratingScore,
          availabilityScore,
        },
        explanation,
      };
    })
    .sort((a, b) => b.score - a.score);
}
