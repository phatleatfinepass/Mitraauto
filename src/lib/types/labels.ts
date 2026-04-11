export interface TyreExtraLabels {
  xl?: boolean;
  runflat?: boolean;
  studded?: boolean;
  ev_ready?: boolean;

  eu_fuel_class?: string;       // "A"–"E"
  eu_wet_class?: string;        // "A"–"E"
  eu_noise_class?: string;      // "A"–"C"
  eu_noise_value_db?: number;   // e.g. 69

  all_season_badge?: boolean;
  winter_badge?: boolean;
  summer_badge?: boolean;

  material_special?: string;    // e.g. "SilentSidewall"
}

// Extra labels for RIMS
export interface RimExtraLabels {
  rim_material?: string;        // "aluminium alloy", "steel", etc.
  rim_finish?: string;          // "matte black"
  rim_design?: string;          // "mesh", "multi-spoke"
  rim_certification?: string;   // "ECE 124", "TÜV", etc.

  rim_load_rating?: number;     // kg
  rim_speed_rating?: string;    // "V"

  rim_ev_ready?: boolean;
  rim_winter_ready?: boolean;
  rim_approved_for_studded?: boolean;

  rim_color_badge?: string;     // "Gloss silver"
}