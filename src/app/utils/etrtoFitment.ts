export interface TyreFitmentCandidate {
  sizeKey: string;
  label: string;
  widthMm: number;
  aspectRatio: number;
  rimDiameterIn: number;
  diameterMm: number;
  diameterDifferencePercent: number;
  loadIndex: number | null;
  loadCapacityKg: number | null;
  speedRating: string | null;
  loadVersion: 'standard' | 'reinforced' | 'highLoad';
  approvedRimWidths: number[];
  confidence: 'factory' | 'recommended' | 'possible';
  reasons: string[];
  sourcePage: string;
}

export interface TyreFitmentRecommendation {
  factory: TyreFitmentCandidate;
  alternatives: TyreFitmentCandidate[];
  auditedSeriesOnly: boolean;
  warnings: string[];
}

