export interface OpeningHours {
  day: number; // 0 = Sunday, 1 = Monday, etc.
  open: string;
  close: string;
}

export const OPENING_HOURS: OpeningHours[] = [
  { day: 0, open: '', close: '' }, // Sunday - Closed
  { day: 1, open: '09:00', close: '18:00' }, // Monday
  { day: 2, open: '09:00', close: '18:00' }, // Tuesday
  { day: 3, open: '09:00', close: '18:00' }, // Wednesday
  { day: 4, open: '09:00', close: '18:00' }, // Thursday
  { day: 5, open: '09:00', close: '18:00' }, // Friday
  { day: 6, open: '10:00', close: '17:00' }, // Saturday
];

export interface ShopStatus {
  isOpen: boolean;
  message: {
    fi: string;
    en: string;
  };
}

export function getShopStatus(): ShopStatus {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
  
  const todayHours = OPENING_HOURS.find(h => h.day === currentDay);
  
  // If closed today (Sunday or no hours)
  if (!todayHours || !todayHours.open) {
    // Find next opening day
    const nextOpening = findNextOpening(currentDay);
    return {
      isOpen: false,
      message: nextOpening
    };
  }
  
  // Parse opening and closing times
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  // Check if currently open
  if (currentTime >= openTime && currentTime < closeTime) {
    return {
      isOpen: true,
      message: {
        fi: `Avoinna • Suljetaan klo ${todayHours.close}`,
        en: `Open • Closes at ${todayHours.close}`
      }
    };
  }
  
  // If before opening time today
  if (currentTime < openTime) {
    return {
      isOpen: false,
      message: {
        fi: `Suljettu • Avataan tänään klo ${todayHours.open}`,
        en: `Closed • Opens today at ${todayHours.open}`
      }
    };
  }
  
  // If after closing time, find next opening
  const nextOpening = findNextOpening(currentDay);
  return {
    isOpen: false,
    message: nextOpening
  };
}

function findNextOpening(currentDay: number): { fi: string; en: string } {
  const dayNames = {
    fi: ['sunnuntaina', 'maanantaina', 'tiistaina', 'keskiviikkona', 'torstaina', 'perjantaina', 'lauantaina'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };
  
  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const nextDay = (currentDay + i) % 7;
    const nextDayHours = OPENING_HOURS.find(h => h.day === nextDay);
    
    if (nextDayHours && nextDayHours.open) {
      const dayName = {
        fi: dayNames.fi[nextDay],
        en: dayNames.en[nextDay]
      };
      
      if (i === 1) {
        return {
          fi: `Suljettu • Avataan huomenna klo ${nextDayHours.open}`,
          en: `Closed • Opens tomorrow at ${nextDayHours.open}`
        };
      } else {
        return {
          fi: `Suljettu • Avataan ${dayName.fi} klo ${nextDayHours.open}`,
          en: `Closed • Opens ${dayName.en} at ${nextDayHours.open}`
        };
      }
    }
  }
  
  // Fallback (should never happen)
  return {
    fi: 'Suljettu',
    en: 'Closed'
  };
}

export function getFormattedHours(language: 'fi' | 'en'): string {
  if (language === 'fi') {
    return 'Ma–Pe: 9:00–18:00\nLa: 10:00–17:00\nSu: Suljettu';
  } else {
    return 'Mon–Fri: 9:00–18:00\nSat: 10:00–17:00\nSun: Closed';
  }
}
