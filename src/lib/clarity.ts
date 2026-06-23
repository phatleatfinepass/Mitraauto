import { deployTarget } from '../config/runtime';

type ConsentState = 'granted' | 'denied';
type TagValue = string | number | boolean | Array<string | number | boolean>;
type ClarityCommand = ((command: string, ...args: unknown[]) => void) & { q?: IArguments[] };

declare global {
  interface Window {
    clarity?: ClarityCommand;
  }
}

const CLARITY_CONSENT_STORAGE_KEY = 'mitra-auto-clarity-consent-v1';
const DEFAULT_CLARITY_PROJECT_ID = 'xaxi6o0t5o';
const ANALYTICS_EVENT_VERSION = '2026-06-23.d4';
const MAX_TAG_VALUE_LENGTH = 120;

let clarityInitialized = false;
let lastPageViewKey = '';

function getProjectId() {
  return String(import.meta.env.VITE_CLARITY_PROJECT_ID || DEFAULT_CLARITY_PROJECT_ID).trim();
}

function canUseBrowserApis() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getClarityQueue() {
  window.clarity = window.clarity || function clarityQueue() {
    (window.clarity!.q = window.clarity!.q || []).push(arguments);
  };

  return window.clarity;
}

function injectClarityScript(projectId: string) {
  getClarityQueue();

  if (document.getElementById('clarity-script')) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${projectId}`;
  script.id = 'clarity-script';

  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
}

function isCmsLikePath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return (
    normalizedPath === '/cms' ||
    normalizedPath.startsWith('/cms/') ||
    normalizedPath === '/pwa' ||
    normalizedPath.startsWith('/pwa/')
  );
}

function isClarityRuntimeEnabled() {
  return import.meta.env.PROD || import.meta.env.VITE_CLARITY_ENABLE_IN_DEV === 'true';
}

function shouldRunClarity() {
  if (!canUseBrowserApis() || deployTarget !== 'site' || !getProjectId()) {
    return false;
  }

  if (!isClarityRuntimeEnabled()) {
    return false;
  }

  return !isCmsLikePath(window.location.pathname);
}

function safeClarityCall(callback: () => void) {
  if (!clarityInitialized) {
    return;
  }

  try {
    callback();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Microsoft Clarity call failed:', error);
    }
  }
}

function normalizeTagValue(value: TagValue): string | string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).slice(0, MAX_TAG_VALUE_LENGTH));
  }

  return String(value).slice(0, MAX_TAG_VALUE_LENGTH);
}

function createEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getCommonEventTags(): Record<string, TagValue> {
  const route = canUseBrowserApis()
    ? window.location.pathname.split('?')[0]?.split('#')[0] || '/'
    : 'unknown';

  return {
    event_id: createEventId(),
    event_version: ANALYTICS_EVENT_VERSION,
    occurred_at: new Date().toISOString(),
    consent_state: readClarityConsent() ?? 'unknown',
    route,
  };
}

export function isClarityConfigured() {
  return Boolean(getProjectId());
}

export function canShowClarityConsent() {
  return (
    canUseBrowserApis() &&
    deployTarget === 'site' &&
    isClarityConfigured() &&
    !isCmsLikePath(window.location.pathname)
  );
}

export function readClarityConsent(): ConsentState | null {
  if (!canUseBrowserApis()) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(CLARITY_CONSENT_STORAGE_KEY);
    return stored === 'granted' || stored === 'denied' ? stored : null;
  } catch {
    return null;
  }
}

function applyClarityConsent(consent: ConsentState) {
  safeClarityCall(() => {
    window.clarity?.('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: consent,
    });
  });
}

export function setClarityConsent(consent: ConsentState) {
  if (!canUseBrowserApis()) {
    return;
  }

  try {
    window.localStorage.setItem(CLARITY_CONSENT_STORAGE_KEY, consent);
  } catch {
    // Storage can fail in restricted browsers; the runtime consent signal still applies.
  }

  applyClarityConsent(consent);

  if (consent === 'granted') {
    trackClarityEvent('analytics_consent_granted');
  }
}

export function initClarityForCurrentRuntime() {
  if (clarityInitialized || !shouldRunClarity()) {
    return clarityInitialized;
  }

  try {
    injectClarityScript(getProjectId());
    clarityInitialized = true;
    applyClarityConsent(readClarityConsent() ?? 'denied');
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Microsoft Clarity initialization failed:', error);
    }
    return false;
  }
}

export function trackClarityEvent(eventName: string, tags?: Record<string, TagValue>) {
  if (!shouldRunClarity()) {
    return;
  }

  if (!clarityInitialized) {
    initClarityForCurrentRuntime();
  }

  safeClarityCall(() => {
    const eventTags = {
      ...(tags || {}),
      ...getCommonEventTags(),
    };

    for (const [key, value] of Object.entries(eventTags)) {
      window.clarity?.('set', key, normalizeTagValue(value));
    }

    window.clarity?.('event', eventName);
  });
}

export function trackClarityPageView({
  page,
  path,
  language,
}: {
  page: string;
  path: string;
  language: string;
}) {
  if (!shouldRunClarity()) {
    return;
  }

  const safePath = path.split('?')[0]?.split('#')[0] || '/';
  const pageViewKey = `${page}:${safePath}:${language}`;
  if (pageViewKey === lastPageViewKey) {
    return;
  }

  lastPageViewKey = pageViewKey;
  trackClarityEvent('spa_page_view', {
    page,
    path: safePath,
    language,
  });
}

export function upgradeClaritySession(reason: string) {
  if (!shouldRunClarity()) {
    return;
  }

  if (!clarityInitialized) {
    initClarityForCurrentRuntime();
  }

  safeClarityCall(() => {
    window.clarity?.('upgrade', reason);
  });
}
