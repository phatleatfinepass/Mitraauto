export type CmsPwaCopy = {
  mobileOps: string;
  loginEyebrow: string;
  loginTitle: string;
  loginDescription: string;
  email: string;
  password: string;
  signingIn: string;
  signInMobileOps: string;
  rescueTitle: string;
  bookingTitle: string;
  orderTitle: string;
  toolsTitle: string;
  openDiagnostics: string;
  signOut: string;
  operationalSummary: string;
  versionLabel: string;
  updateLabel: string;
  refreshedLabel: string;
  forceRefresh: string;
  rescue: string;
  booking: string;
  order: string;
  handoffWaitingOne: string;
  handoffWaitingMany: string;
  handingOff: string;
  handoffNewBookings: string;
  noNewBookingsToHandoff: string;
  rescueQueue: string;
  bookingQueue: string;
  orderQueue: string;
  plannedTools: string;
  refreshingQueue: string;
  noItems: string;
  pushDiagnostics: string;
  pushDiagnosticsBody: string;
  close: string;
  permission: string;
  serviceWorker: string;
  pushSupported: string;
  localSubscription: string;
  savedToBackend: string;
  ready: string;
  notReady: string;
  yes: string;
  no: string;
  enabling: string;
  enableNotifications: string;
  rerunDiagnostics: string;
};

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
