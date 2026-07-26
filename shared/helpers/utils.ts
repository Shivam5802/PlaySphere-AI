import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getSportEmoji(sport: string): string {
  const emojis: Record<string, string> = {
    badminton: '🏸',
    football: '⚽',
    swimming: '🏊',
    kabaddi: '🤼',
    cricket: '🏏',
  };
  return emojis[sport] || '🏆';
}

export function getSportColor(sport: string): string {
  const colors: Record<string, string> = {
    badminton: 'bg-yellow-400 text-black border-2 border-black font-bold',
    football: 'bg-emerald-400 text-black border-2 border-black font-bold',
    swimming: 'bg-cyan-400 text-black border-2 border-black font-bold',
    kabaddi: 'bg-rose-500 text-black border-2 border-black font-bold',
    cricket: 'bg-green-500 text-black border-2 border-black font-bold',
  };
  return colors[sport] || 'bg-indigo-400 text-black border-2 border-black font-bold';
}

export function getSportImage(sport: string, seed?: string): string {
  const images: Record<string, string[]> = {
    badminton: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjW-Mq-ylpMsJU7nzhOnD4_SmunuSU7QwsfA&s',
      'https://turftown.s3.ap-south-1.amazonaws.com/super_admin/tt-1724321381033.webp',
      'https://sportsmark.net/wp-content/uploads/2023/03/How-To-Set-Up-A-Badminton-Court.jpg'
    ],
    football: [
      'https://content.jdmagicbox.com/v2/comp/malappuram/z6/9999px483.x483.190814130139.g1z6/catalogue/kottappadi-football-stadium-downhill-malappuram-stadiums-bTv6yUCSMI-250.jpg',
      'https://sportsmalappuram.com/wp-content/uploads/2019/10/infra4.jpg',
      'https://www.thesun.ie/wp-content/uploads/sites/3/2026/02/general-view-bloomfield-road-prior-1056723540_db249a.jpg?resize=1536,1000&quality=90&strip=all'
    ],
    swimming: [
      'https://5.imimg.com/data5/SELLER/Default/2024/2/383004835/KY/PO/DE/1938594/outdoor-swimming-pool.jpeg',
      'https://www.fluidra.com/wp-content/uploads/2022/07/1018_Fl.2012.jpg'
    ],
    kabaddi: [
      'https://shivrajenterprise.com/wp-content/uploads/2025/08/kabaddi-playing-in-the-ground-image.webp',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZ3DoT5EQiPMEWEvpcfvs4TuWsd_fT9lY6Vw&s',
      'https://5.imimg.com/data5/SELLER/Default/2023/3/294113665/AK/HI/HZ/157093178/synthetic-kabaddi-court-flooring-service.JPG'
    ],
    cricket: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Ekana_cricket_stadium_.jpg/500px-Ekana_cricket_stadium_.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/a1/KD_Singh_Babu_Stadium_Lucknow.jpg'
    ],
  };

  const sportImages = images[sport] || ['https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000'];
  
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return sportImages[Math.abs(hash) % sportImages.length];
  }

  return sportImages[0];
}

export function getSkillBadgeColor(skill: string): string {
  const colors: Record<string, string> = {
    beginner: 'bg-emerald-500 text-black border-2 border-black font-bold',
    intermediate: 'bg-yellow-400 text-black border-2 border-black font-bold',
    advanced: 'bg-rose-500 text-black border-2 border-black font-bold',
    all: 'bg-cyan-400 text-black border-2 border-black font-bold',
  };
  return colors[skill] || 'bg-slate-300 text-black border-2 border-black font-bold';
}

export function getRatingStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getMinBookingDate(): string {
  return getTodayDate();
}

export function getMaxBookingDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

/**
 * Generate a unique ticket number for a booking.
 * Format: PS-[SPORT3]-2026-[RANDOM4]
 * Examples: PS-BAD-2026-1042, PS-FOT-2026-5931
 */
export function generateTicketNumber(sport: string): string {
  const sportCodes: Record<string, string> = {
    badminton: 'BAD',
    football: 'FOT',
    swimming: 'SWM',
    kabaddi: 'KBD',
  };
  const code = sportCodes[sport] || 'SPT';
  const random = Math.floor(1000 + Math.random() * 9000); // always 4 digits
  return `PS-${code}-2026-${random}`;
}

/**
 * Recursively serializes Firestore data by converting complex types (such as Timestamps)
 * into plain serializable JSON values.
 */
export function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeFirestoreData(item));
  }

  // Handle Firestore Timestamp or custom objects with toDate()
  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  // Handle Date instances
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle nested objects
  if (typeof data === 'object') {
    // If it has a specific constructor type we want to serialize (like DocumentReference)
    if (data.constructor && data.constructor.name === 'DocumentReference') {
      return { id: data.id, path: data.path };
    }

    const serialized: any = {};
    for (const key of Object.keys(data)) {
      serialized[key] = serializeFirestoreData(data[key]);
    }
    return serialized;
  }

  return data;
}


