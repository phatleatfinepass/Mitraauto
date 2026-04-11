import type { BriefingItem } from './CmsPwaBriefingCard';
import type { CmsPwaTab } from './CmsPwaTabBar';

export type AuthState = 'loading' | 'unauthenticated' | 'authenticated' | 'not-admin';

export type LoginState = {
  email: string;
  password: string;
};

export type TabSection = {
  title: string;
  caption: string;
  items: BriefingItem[];
};

export type BookingRow = {
  id: string;
  created_at: string | null;
  updated_at?: string | null;
  status: string | null;
  booking_language?: 'fi' | 'en' | null;
  booking_date: string;
  booking_time: string;
  license_plate: string | null;
  service_name: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  notes: string | null;
};

export type OrderRow = {
  id: string;
  created_at: string | null;
  status: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
  grand_total_cents: number | null;
  cart_snapshot: unknown;
};

export type LiveSectionsState = {
  booking: TabSection[];
  order: TabSection[];
};

export type CmsPwaRoute = { kind: 'cms'; tab: CmsPwaTab } | { kind: 'not-found' };
