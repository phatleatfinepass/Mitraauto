# VT/RD Supplier Metadata Mapping Baseline

Generated: 2026-04-25

Purpose: compare VT and RD item metadata side by side before building one fast supplier catalog table. VT fields are verified from the live XML feeds on 2026-04-25. RD raw field names are partly inferred from existing import code and current database samples; fields marked "confirm" must be verified against a live RD API payload before final implementation.

## Source Status

| Supplier | Product type | Source currently available | Status |
|---|---:|---|---|
| VT | tire | `https://www.vannetukku.fi/wholesale_tyres.php?id=...` XML | Verified live: 1,721 items, latest `Date_modified` 2026-04-23 |
| VT | rim | `https://www.vannetukku.fi/wholesale_wheels.php?id=...` XML | Verified live: 382 items, latest `Date_modified` 2026-04-24 |
| RD | tire | `/api/Articles?...IncludeCarTyres=true...` JSON | Endpoint shape exists in code, live payload not accessible with anon key |
| RD | rim | `/api/Articles?...IncludeAlloyRims=true&IncludeSteelRims=true...` JSON | Endpoint shape exists in code, live payload not accessible with anon key |

## Recommended Ownership Rule

| Data category | Owner | Reason |
|---|---|---|
| Supplier id, SKU, EAN, stock, supplier prices, supplier image fallback, raw supplier specs | New supplier feed table | Changes on every supplier sync |
| Curated display brand/model, SEO, CMS descriptions, CMS images, hidden status, manual corrections, EPREL/manual label overrides | Existing final DB/CMS metadata | Already reviewed and should not be overwritten by feed text |
| Link between supplier item and final variant | Mapping/link table | Lets supplier stock/price update without damaging curated metadata |

## Common Item Fields

| Normalized column | VT field | RD field | Existing DB/sample field | Notes |
|---|---|---|---|---|
| `supplier_code` | constant `VT` | constant `RD` | `supplier_code_best`, `catalog_supplier_offers.supplier_code` | Required |
| `product_type` | feed endpoint: tyres/wheels | API include flags: tyres/rims | `product_type` | Required |
| `external_id` | `Product_id` | `ArticleId` | `supplier_external_id_best`, `catalog_supplier_offers.supplier_external_id` | Primary supplier identity |
| `sku` | `Code` | confirm: likely article number/code field | not in current public sample | Needed for debugging and fallback matching |
| `ean` | `EAN` | confirm: likely EAN/GTIN field | variant `ean`, sample has matched rows | Missing in some VT rows |
| `brand_raw` | `Brand` | confirm: manufacturer/brand field | `brand`, `brand_display_name` | Feed value should not overwrite curated display brand automatically |
| `model_raw` | `Model` | `ArticleName` or `ArticleText` inferred | `model` | Confirm RD split between model/name/text |
| `description_raw` | `Description` | `ArticleText` inferred | CMS descriptions separate/private | Supplier text fallback only |
| `size_text_raw` | `Size` | confirm: article size/name/spec fields | `size_string` | Also parse into typed size columns |
| `wholesale_price_eur` | `Wholesale_price_eur` | confirm: wholesale/net price field | `catalog_supplier_offers.wholesale_price` | Store raw supplier wholesale |
| `consumer_price_eur` | `Consumer_price_eur` | confirm: consumer/list price field | `catalog_supplier_offers.consumer_price`, sample `price` | Decide later which is storefront base |
| `currency` | `Consumer_price/@currency`, default EUR | confirm/default EUR | `currency` | Use `EUR` if missing |
| `stock_qty` | `Available_pcs` or `Availability.Warehouse.Quantity` | confirm: stock/quantity field | `available_pcs`, `stock_qty` | VT caps high stock at 20 |
| `supplier_modified_at` | `Date_modified` | confirm if RD has modified timestamp | not exposed in sample | Useful for sync diagnostics |
| `image_url` | `Image_Url` or `https://images.vannetukku.fi/images/{Image}` | confirm: image URL/id; sample uses `https://api.rengasduo.fi/api/images/{id}` | `best_image_url` | Supplier image fallback only |
| `gallery` | `ExtraImages.ExtraImage[]` for rims, primary image for tires | confirm: image list/id list | CMS gallery private | Store URLs/ids, do not override CMS images |
| `category_raw` | `Category` | `MainGroupName` inferred | not exposed | Useful for filtering/debug |
| `freight_class_raw` | `FreightClass` | confirm | not exposed | Keep raw |
| `raw_payload` | full XML item converted to JSON | full JSON article | `supplier_products_raw.payload` private | Required for future debugging |
| `checksum` | hash of normalized/raw item | hash of normalized/raw item | `supplier_products_raw.checksum` private | Skip unchanged rows |
| `active` | true when seen in latest successful run | true when seen in latest successful run | old rows implied by `last_seen_at` | Mark missing items inactive, do not delete |

## Tire-Specific Fields

| Normalized column | VT tire field | RD tire field | Existing DB/sample field | Notes |
|---|---|---|---|---|
| `tire_width_mm` | `Tyre_width` | confirm | `width_mm` | Parse fallback from size text |
| `tire_aspect_ratio` | `Tyre_profile` | confirm | `aspect_ratio` | Parse fallback from size text |
| `tire_diameter_in` | `Tyre_rimsize` | confirm | `diameter_in` | Parse fallback from size text |
| `load_index` | `LI` | confirm | `load_index` | Text to preserve compound values |
| `speed_rating` | `SI` | confirm | `speed_rating` / `speed_index` | Normalize to text |
| `season` | `Season` (`winter`, `summer`) | confirm | `season` | Existing UI expects normalized values |
| `studded` | `Studded` (`yes`, blank/no) | confirm | `studded` | Convert to boolean/null |
| `runflat` | `Runflat` (`yes`, `no`) | confirm | `runflat` | Convert to boolean/null |
| `ms_tyre` | `MS_tyre` | confirm | maybe `extra_spec`/badges | Store in raw/spec; do not imply winter alone |
| `tyre_type` | `Tyre_type` | RD API include category / group fields confirm | not in lightweight sample | Passenger/Van/Truck etc |
| `eu_label.label_type` | `EU_Label.LabelType` | confirm | `eu_label_json`, `eu_tyre_class` | Store raw EU label object |
| `eu_label.rrc` | `EU_Label.RRC` or top-level `RRC` | confirm | `eu_fuel_class` | Fuel/rolling resistance |
| `eu_label.wet_grip` | `EU_Label.WetGrip` or top-level `WetGrip` | confirm | `eu_wet_class` |  |
| `eu_label.noise_db` | `EU_Label.NoiseValuedB` or `NoiseDb` | confirm | `eu_noise_db` |  |
| `eu_label.noise_class` | `EU_Label.NoiseClass` | confirm | `eu_noise_class` |  |
| `eu_label.eprel_code` | `EU_Label.EprelCode` | confirm | EPREL CMS tables/private |  |
| `eu_label.register_code` | `EU_Label.RegisterCode` | confirm | `eu_label_json` | Often EPREL URL |
| `eu_label.snow_class` | `EU_Label.SnowClass` | confirm | `threepmsf`/label data | Keep raw; derived badges separate |
| `eu_label.ice_class` | `EU_Label.IceClass` | confirm | `ice_approved`/label data | Keep raw; derived badges separate |
| `weight_net_kg` | `Measurements.WeightNet` | confirm | not exposed | Optional |

## Rim-Specific Fields

| Normalized column | VT rim field | RD rim field | Existing DB/sample field | Notes |
|---|---|---|---|---|
| `rim_width_in` | `Rim_width` | confirm | `width_in` | Numeric |
| `rim_diameter_in` | `Rim_diameter` | confirm | `rim_diameter_in` / `diameter_in` | Numeric |
| `bolt_pattern` | `PCD` | `BoltCircle` + `NumberOfBolts` inferred | `bolt_pattern` | Normalize to `5x112` style |
| `center_bore_mm` | `CB` | `CenterBore` inferred | `center_bore_mm` | Numeric |
| `et_offset_mm` | `ET` | `Offset` inferred | `et_offset_mm` | Numeric |
| `bolts_included` | `Bolts_included` (`yes`, `no`) | confirm | not in lightweight sample | Boolean/null |
| `winter_approved_raw` | `Winter` (`true`, `false`) | confirm | labels/private | Keep raw or boolean |
| `wheel_load_kg` | `Wheel_load` | confirm | not in lightweight sample | Numeric |
| `color_raw` | often embedded in `Model`/description, no stable field in sample | confirm | `color`, `finish` | Existing metadata may be better |
| `finish_raw` | often embedded in `Model`/description, no stable field in sample | confirm | `finish` | Existing metadata may be better |
| `extra_images` | `ExtraImages.ExtraImage[]` | confirm | CMS gallery/private | Supplier fallback only |
| `weight_net_kg` | `Measurements.WeightNet` | confirm | not exposed | Optional |
| `weight_gross_kg` | `Measurements.WeightGross` | confirm | not exposed | Optional |

## Sample Rows

### VT Tire Raw Sample

| Field | Value |
|---|---|
| Product_id | `18844` |
| Code | `T2057015NANKANGSW7` |
| EAN | `4712487544392` |
| Brand / Model | `Nankang` / `SW-7` |
| Size | `205/70-15` |
| Tire specs | width `205`, profile `70`, rim `15`, LI `100`, SI `T` |
| Season / Studded / Runflat | `winter` / `yes` / `no` |
| Consumer / Wholesale | `67.69` / `54.47` |
| Stock | `20` |
| Image | `https://images.vannetukku.fi/images/SW-7.jpg` |

### VT Rim Raw Sample

| Field | Value |
|---|---|
| Product_id | `3730` |
| Code | `BARY22` |
| EAN | `6438431005242` |
| Brand / Model | `Barzetta` / `Variante` |
| Size | `8x18` |
| Fitment | width `8`, diameter `18`, PCD `5x112`, CB `66.6`, ET `35` |
| Bolts included / winter | `yes` / `false` |
| Consumer / Wholesale | `143.39` / `114.70` |
| Stock | `18` |
| Image | `https://images.vannetukku.fi/images/Barzetta_Variante_1.jpg` |

### Existing DB RD Tire Sample

| Field | Value |
|---|---|
| supplier_external_id_best | `314685` |
| variant_id | `00021dfd-f7fd-586a-c75e-5c75bd8e7c98` |
| Brand / Model | `Dynamo` / `MAR26` |
| Size | `245/70 R19.5` |
| Price | `282` |
| Stock | `9` |
| Image | CMS/storage image URL |
| Note | Raw RD article fields need live payload confirmation |

### Existing DB RD Rim Sample

| Field | Value |
|---|---|
| supplier_external_id_best | `326293` |
| variant_id | `0003a52b-d97b-db2d-3f16-106554cf1c8b` |
| Brand / Model | `Statusfälgar` / `D778 RUNNER UTV GLOSS BLACK MILLED CANDY BLUE` |
| Size | `7x18 4x156 ET13` |
| Price | `651` |
| Stock | `0` |
| Image | `https://api.rengasduo.fi/api/images/163648` |
| Note | Existing code references RD rim raw fields `BoltCircle`, `NumberOfBolts`, `Offset`, `CenterBore`, `MainGroupName`, `ArticleText`, `ArticleName` |

## First-Pass Table Shape

The table can hold both suppliers and product types without losing supplier-specific metadata:

```sql
supplier_catalog_items (
  supplier_code,
  product_type,
  external_id,
  sku,
  ean,
  brand_raw,
  model_raw,
  description_raw,
  size_text_raw,
  wholesale_price_eur,
  consumer_price_eur,
  currency,
  stock_qty,
  image_url,
  gallery,
  tire_width_mm,
  tire_aspect_ratio,
  tire_diameter_in,
  load_index,
  speed_rating,
  season,
  studded,
  runflat,
  tyre_type,
  eu_label,
  rim_width_in,
  rim_diameter_in,
  bolt_pattern,
  center_bore_mm,
  et_offset_mm,
  bolts_included,
  wheel_load_kg,
  supplier_modified_at,
  fetched_at,
  last_seen_run_id,
  active,
  checksum,
  raw_payload
)
```

## Open RD Confirmation Items

Before coding final RD normalization, confirm these from a live RD payload:

1. Exact field names for SKU/article code and EAN/GTIN.
2. Exact field names for wholesale price, consumer/list price, VAT handling, and currency.
3. Exact field names for stock quantity and local/remote stock.
4. Exact tire spec field names: width, profile, rim size, load index, speed rating, season, studded, runflat.
5. Exact image representation: URL vs image id(s).
6. Whether RD article response includes modified timestamp.

