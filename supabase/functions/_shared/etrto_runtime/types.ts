export interface RuntimeTyreSize {
  sizeKey: string;
  widthMm: number;
  aspectRatio: number;
  construction: string;
  rimDiameterIn: number;
  standardLoadIndex?: number | null;
  reinforcedLoadIndex?: number | null;
  measuringRimWidthIn?: number | null;
  designOverallDiameterMm?: number | null;
  standardLoadCapacityKg?: number | null;
  reinforcedLoadCapacityKg?: number | null;
  series: number;
  sourcePage: string;
  loadVersion?: 'standard' | 'reinforced' | 'highLoad';
  approvedRimWidthsIn: number[];
}
