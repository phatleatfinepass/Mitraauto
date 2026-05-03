#!/usr/bin/env python3
"""Generate compact ETRTO runtime shards for Supabase Edge Functions."""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "supabase/functions/_shared/etrto_source"
RUNTIME_DIR = ROOT / "supabase/functions/_shared/etrto_runtime"


def main() -> None:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)

    tyre_rows = json.loads((SOURCE_DIR / "passengerTyreSizes.json").read_text())
    approved_rims = read_approved_rims(SOURCE_DIR / "passengerApprovedRims.csv")
    load_index = read_number_map(SOURCE_DIR / "loadIndex.csv", "load_index", "kg")
    speed_rating = read_number_map(SOURCE_DIR / "speedRating.csv", "speed_symbol", "kmh")

    write_text(
        RUNTIME_DIR / "types.ts",
        """export interface RuntimeTyreSize {
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
""",
    )
    write_ts_const(RUNTIME_DIR / "load_index.ts", "LOAD_KG_BY_INDEX", load_index)
    write_ts_const(RUNTIME_DIR / "speed_rating.ts", "SPEED_KMH_BY_SYMBOL", speed_rating)

    shards: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for row in tyre_rows:
        runtime_row = compact_tyre_row(row, approved_rims.get(row["sizeKey"], []))
        shards[int(runtime_row["rimDiameterIn"])].append(runtime_row)

    for old_shard in [*RUNTIME_DIR.glob("rim_*.ts"), *RUNTIME_DIR.glob("tyres_r*.ts")]:
        old_shard.unlink()

    for rim_diameter, rows in sorted(shards.items()):
        rows.sort(key=lambda row: (row["widthMm"], row["aspectRatio"], row["sizeKey"]))
        text = "import type { RuntimeTyreSize } from './types.ts';\n\n"
        text += "export const TYRES: RuntimeTyreSize[] = "
        text += json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
        text += ";\n"
        write_text(RUNTIME_DIR / f"tyres_r{rim_diameter}.ts", text)

    print("Generated ETRTO runtime shards:")
    print(f"  source tyres: {len(tyre_rows)}")
    print(f"  tyre shards: {len(shards)}")
    for rim_diameter, rows in sorted(shards.items()):
        print(f"  R{rim_diameter}: {len(rows)} tyres")


def read_approved_rims(path: Path) -> dict[str, list[float]]:
    rims: dict[str, set[float]] = defaultdict(set)
    with path.open(newline="") as file:
        for row in csv.DictReader(file):
            rims[row["size_key"]].add(float(row["approved_rim_width_in"]))
    return {size_key: sorted(widths) for size_key, widths in rims.items()}


def read_number_map(path: Path, key_column: str, value_column: str) -> dict[str, int]:
    values: dict[str, int] = {}
    with path.open(newline="") as file:
        for row in csv.DictReader(file):
            values[str(row[key_column])] = int(float(row[value_column]))
    return values


def compact_tyre_row(row: dict[str, Any], approved_rim_widths: list[float]) -> dict[str, Any]:
    compact = {
        "sizeKey": row["sizeKey"],
        "widthMm": row["widthMm"],
        "aspectRatio": row["aspectRatio"],
        "construction": row.get("construction", "R"),
        "rimDiameterIn": row["rimDiameterIn"],
        "standardLoadIndex": row.get("standardLoadIndex"),
        "reinforcedLoadIndex": row.get("reinforcedLoadIndex"),
        "measuringRimWidthIn": row.get("measuringRimWidthIn"),
        "designOverallDiameterMm": row.get("designOverallDiameterMm"),
        "standardLoadCapacityKg": row.get("standardLoadCapacityKg"),
        "reinforcedLoadCapacityKg": row.get("reinforcedLoadCapacityKg"),
        "series": row["series"],
        "sourcePage": row.get("sourcePage", ""),
        "loadVersion": row.get("loadVersion"),
        "approvedRimWidthsIn": approved_rim_widths,
    }
    return {key: value for key, value in compact.items() if value is not None}


def write_ts_const(path: Path, name: str, value: dict[str, int]) -> None:
    write_text(path, f"export const {name}: Record<string, number> = {json.dumps(value, separators=(',', ':'))};\n")


def write_text(path: Path, text: str) -> None:
    path.write_text(text)


if __name__ == "__main__":
    main()
