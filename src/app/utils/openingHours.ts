import { businessProfile } from '../config/businessProfile';

type LocalizedMessage = {
  fi: string;
  en: string;
};

export interface ShopStatus {
  isOpen: boolean;
  message: LocalizedMessage;
}

function hourFromTime(value: string): number {
  return Number.parseInt(value.split(':')[0] ?? '0', 10);
}

const WEEKDAY_HOURS = {
  open: hourFromTime(businessProfile.openingHours[0].opens),
  close: hourFromTime(businessProfile.openingHours[0].closes),
};
const SATURDAY_HOURS = {
  open: hourFromTime(businessProfile.openingHours[1].opens),
  close: hourFromTime(businessProfile.openingHours[1].closes),
};

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function getShopStatus(now: Date = new Date()): ShopStatus {
  const day = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (day === 0) {
    return {
      isOpen: false,
      message: {
        fi: 'Suljettu. Avaamme maanantaina klo 09:00.',
        en: 'Closed. We open on Monday at 09:00.',
      },
    };
  }

  const hours = day === 6 ? SATURDAY_HOURS : WEEKDAY_HOURS;
  const opensAt = hours.open * 60;
  const closesAt = hours.close * 60;

  if (currentMinutes < opensAt) {
    return {
      isOpen: false,
      message: {
        fi: `Suljettu. Avaamme tänään klo ${formatHour(hours.open)}.`,
        en: `Closed. We open today at ${formatHour(hours.open)}.`,
      },
    };
  }

  if (currentMinutes >= closesAt) {
    const nextDay = day === 6 ? 'maanantaina' : 'huomenna';
    const nextDayEn = day === 6 ? 'on Monday' : 'tomorrow';
    return {
      isOpen: false,
      message: {
        fi: `Suljettu. Avaamme ${nextDay} klo ${formatHour(day === 6 ? WEEKDAY_HOURS.open : hours.open)}.`,
        en: `Closed. We open ${nextDayEn} at ${formatHour(day === 6 ? WEEKDAY_HOURS.open : hours.open)}.`,
      },
    };
  }

  return {
    isOpen: true,
    message: {
      fi: `Avoinna nyt, suljemme klo ${formatHour(hours.close)}.`,
      en: `Open now, closing at ${formatHour(hours.close)}.`,
    },
  };
}
