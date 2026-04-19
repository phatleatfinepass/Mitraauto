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
}

export interface TireAuditExtracted {
  brand: string | null;
  model: string | null;
  size_string: string | null;
  season: 'summer' | 'winter' | 'all_season' | null;
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

export interface TireEanAuditResult {
  ean: string;
  summary: string;
  confidence: TireAuditConfidence;
  source_urls: string[];
  extracted: TireAuditExtracted;
  checks: TireAuditCheck[];
}
