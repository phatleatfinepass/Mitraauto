export interface VehicleRimMountingInput {
  pcd?: string | null;
  centerBoreMm?: number | null;
  offsetMinMm?: number | null;
  offsetMaxMm?: number | null;
  factoryOffsetMm?: number | null;
  factoryRimWidthIn?: number | null;
  boltThread?: string | null;
  boltSeat?: string | null;
}

export interface RimFitmentProfile {
  tyreSizeKey: string;
  tyreSizeLabel: string;
  rimDiameterIn: number;
  approvedRimWidthsIn: number[];
  preferredRimWidthIn: number | null;
  mounting: {
    pcd: string | null;
    centerBoreMm: number | null;
    offsetMinMm: number | null;
    offsetMaxMm: number | null;
    factoryOffsetMm: number | null;
    boltThread: string | null;
    boltSeat: string | null;
  };
  catalogFilters: {
    rimDiameterIn: number;
    approvedWidthsIn: number[];
    pcd: string | null;
    centerBoreMinMm: number | null;
    offsetMinMm: number | null;
    offsetMaxMm: number | null;
  };
  warnings: string[];
}

export interface RimFitmentCandidate {
  tyreSizeKey: string;
  tyreSizeLabel: string;
  rimDiameterIn: number;
  approvedRimWidthsIn: number[];
  preferredRimWidthIn: number | null;
  confidence: 'factory' | 'recommended' | 'possible';
  tyreDiameterDifferencePercent: number;
  reasons: string[];
}

export interface RimFitmentRecommendation {
  factory: RimFitmentCandidate;
  alternatives: RimFitmentCandidate[];
  mounting: RimFitmentProfile['mounting'];
  catalogFilters: {
    factoryRimDiameterIn: number;
    factoryApprovedWidthsIn: number[];
    alternativeRimDiametersIn: number[];
    pcd: string | null;
    centerBoreMinMm: number | null;
    offsetMinMm: number | null;
    offsetMaxMm: number | null;
  };
  warnings: string[];
}
