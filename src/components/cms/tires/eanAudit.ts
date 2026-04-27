export type TireAuditStatus =
  | 'match'
  | 'mismatch'
  | 'missing_current'
  | 'missing_audited'
  | 'unknown';

export type TireAuditConfidence = 'low' | 'medium' | 'high';

export interface TireAuditCheck {
  field: string;
  label: string;
  current_value: string | null;
  audited_value: string | null;
  status: TireAuditStatus;
  review_status?: 'pending' | 'accepted' | 'rejected' | 'kept_current' | null;
}

export interface TireAuditExtracted {
  brand: string | null;
  model: string | null;
  size_string: string | null;
  season: 'summer' | 'winter' | 'all_season' | null;
  metadata: {
    ean: string | null;
    tyre_type_identifier: string | null;
    tyre_class: string | null;
    load_version: string | null;
    eprel_registration_number: string | null;
    eprel_qr_url: string | null;
    eprel_sheet_url: string | null;
    production_start: string | null;
    production_end: string | null;
    market_start: string | null;
    supplier_website: string | null;
    supplier_contact_name: string | null;
    supplier_contact_email: string | null;
    supplier_contact_phone: string | null;
    data_source: string | null;
    data_source_url: string | null;
    last_verified_at: string | null;
  };
  badges: {
    runflat: boolean | null;
    xl: boolean | null;
    studded: boolean | null;
    threepmsf: boolean | null;
    winter_approved: boolean | null;
    ice_approved: boolean | null;
  };
  eu_label: {
    fuel_class: string | null;
    wet_grip_class: string | null;
    noise_db: number | null;
    noise_class: string | null;
  };
}

export interface TireEprelCandidate {
  registration_number: string;
  brand: string | null;
  model: string | null;
  size_string: string | null;
  tyre_class: string | null;
  score: number;
  match_reasons: string[];
}

export interface TireEprelIdSuggestion {
  status: 'matched' | 'multiple_candidates' | 'no_match';
  summary: string;
  confidence: 'low' | 'medium' | 'high';
  suggested_registration_number: string | null;
  candidates: Array<{
    registration_number: string;
    reason: string;
    source_hint: string;
  }>;
}

export interface TireEanAuditResult {
  ean: string | null;
  eprel_match_id?: string | null;
  match_status?: 'matched' | 'no_match' | 'multiple_matches' | 'wrong_product_group' | 'blocked' | 'unverified' | 'error';
  eprel_registration_number?: string | null;
  eprel_fiche_url?: string | null;
  fallback_mode?: 'gtin' | 'search' | 'eprel_id';
  candidates?: TireEprelCandidate[];
  summary: string;
  confidence: TireAuditConfidence;
  source_urls: string[];
  extracted: TireAuditExtracted;
  checks: TireAuditCheck[];
}
