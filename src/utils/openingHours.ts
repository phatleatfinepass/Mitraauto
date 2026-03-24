export type ShopStatus = {
  isOpen: boolean;
  message: {
    fi: string;
    en: string;
  };
};

const OPEN_HOUR = 9;
const CLOSE_HOUR = 17;

export function getShopStatus(now = new Date()): ShopStatus {
  const day = now.getDay(); // 0 = Sunday
  const hour = now.getHours();
  const minute = now.getMinutes();

  const isWeekday = day >= 1 && day <= 5;
  const isOpenNow = isWeekday && (hour > OPEN_HOUR || (hour === OPEN_HOUR && minute >= 0)) && hour < CLOSE_HOUR;

  if (isOpenNow) {
    return {
      isOpen: true,
      message: {
        fi: 'Avoinna nyt',
        en: 'Open now',
      },
    };
  }

  return {
    isOpen: false,
    message: {
      fi: 'Suljettu',
      en: 'Closed',
    },
  };
}

