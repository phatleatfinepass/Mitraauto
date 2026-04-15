export const CMS_PWA_COPY = {
  fi: {
    mobileOps: 'Mitra Auto mobile ops',
    rescueTitle: 'Pelastus',
    bookingTitle: 'Varaus',
    orderTitle: 'Tilaus',
    toolsTitle: 'Future Tools',
    openDiagnostics: 'Avaa diagnostiikka',
    signOut: 'Kirjaudu ulos',
    operationalSummary: 'Operatiivinen yhteenveto',
    versionLabel: 'Versio',
    updateLabel: 'Päivitys',
    refreshedLabel: 'Virkistetty',
    forceRefresh: 'Pakota päivitys',
    rescue: 'Pelastus',
    booking: 'Varaus',
    order: 'Tilaus',
    handoffWaitingOne: 'varaus odottaa, että desktop-CMS viimeistelee siirron.',
    handoffWaitingMany: 'varausta odottaa, että desktop-CMS viimeistelee siirron.',
    handingOff: 'Siirretään...',
    handoffNewBookings: 'Siirrä uudet varaukset',
    noNewBookingsToHandoff: 'Ei uusia varauksia siirrettäväksi',
    rescueQueue: 'Pelastusjono',
    bookingQueue: 'Varausjono',
    orderQueue: 'Tilausjono',
    plannedTools: 'Suunnitellut työkalut',
    refreshingQueue: 'Päivitetään jonoa...',
    noItems: 'Tässä jonossa ei ole kohteita juuri nyt.',
    pushDiagnostics: 'Push-diagnostiikka',
    pushDiagnosticsBody: 'Laitteen ilmoitus- ja tilaustilan nykyinen kunto.',
    close: 'Sulje',
    permission: 'Lupa',
    serviceWorker: 'Service worker',
    pushSupported: 'Push-tuki',
    localSubscription: 'Paikallinen tilaus',
    savedToBackend: 'Tallennettu taustaan',
    ready: 'valmis',
    notReady: 'ei valmis',
    yes: 'kyllä',
    no: 'ei',
    enabling: 'Otetaan käyttöön...',
    enableNotifications: 'Ota ilmoitukset käyttöön',
    rerunDiagnostics: 'Suorita diagnostiikka uudelleen',
  },
  en: {
    mobileOps: 'Mitra Auto mobile ops',
    rescueTitle: 'Rescue',
    bookingTitle: 'Booking',
    orderTitle: 'Order',
    toolsTitle: 'Future Tools',
    openDiagnostics: 'Open diagnostics',
    signOut: 'Sign out',
    operationalSummary: 'Operational summary',
    versionLabel: 'Version',
    updateLabel: 'Update',
    refreshedLabel: 'Refreshed',
    forceRefresh: 'Force refresh',
    rescue: 'Rescue',
    booking: 'Booking',
    order: 'Order',
    handoffWaitingOne: 'booking waiting for desktop CMS to finish handoff.',
    handoffWaitingMany: 'bookings waiting for desktop CMS to finish handoff.',
    handingOff: 'Handing off...',
    handoffNewBookings: 'Handoff new bookings',
    noNewBookingsToHandoff: 'No new bookings to hand off',
    rescueQueue: 'Rescue queue',
    bookingQueue: 'Booking queue',
    orderQueue: 'Order queue',
    plannedTools: 'Planned tools',
    refreshingQueue: 'Refreshing queue...',
    noItems: 'No items in this queue right now.',
    pushDiagnostics: 'Push diagnostics',
    pushDiagnosticsBody: 'Current notification and subscription health on this device.',
    close: 'Close',
    permission: 'Permission',
    serviceWorker: 'Service worker',
    pushSupported: 'Push supported',
    localSubscription: 'Local subscription',
    savedToBackend: 'Saved to backend',
    ready: 'ready',
    notReady: 'not ready',
    yes: 'yes',
    no: 'no',
    enabling: 'Enabling...',
    enableNotifications: 'Enable notifications',
    rerunDiagnostics: 'Re-run diagnostics',
  },
} as const;

export type CmsPwaCopy = typeof CMS_PWA_COPY.fi;

export function formatBuildStampLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const parts = new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const byType = new Map(parts.map((part) => [part.type, part.value]));
  const day = byType.get('day');
  const month = byType.get('month');
  const year = byType.get('year');
  const hour = byType.get('hour');
  const minute = byType.get('minute');

  if (!day || !month || !year || !hour || !minute) {
    return value;
  }

  return `${day}.${month}.${year} @${hour}.${minute}`;
}
