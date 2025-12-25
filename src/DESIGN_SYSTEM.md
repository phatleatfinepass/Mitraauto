# Mitra Auto — Information Architecture & Design System
**Version 1.0 — December 2024**

---

## 🎯 DESIGN PHILOSOPHY

**From:** Product catalog with services as support  
**To:** Service-first garage with products as support

**Core Identity:**
- Local Helsinki automotive service garage
- Professional, trustworthy, accessible
- Bilingual (Finnish canonical, English mirror)
- Service booking is primary conversion goal

---

## 🗺️ SITE MAP — COMPLETE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    FINNISH (CANONICAL)                       │
└─────────────────────────────────────────────────────────────┘

/                           Home (FI service-first)
│
├─ /palvelut                Services Hub (FI)
│  ├─ /autohuolto           → Car Maintenance
│  ├─ /renkaanvaihto        → Tire Change
│  ├─ /rengashotelli        → Tire Hotel
│  ├─ /vikadiagnostiikka    → Diagnostics
│  └─ /autopesu             → Car Wash
│
├─ /helsinki                Helsinki Local Hub
│  ├─ /renkaanvaihto        → Tire Change (Helsinki)
│  ├─ /autohuolto           → Car Service (Helsinki)
│  └─ /rengashotelli        → Tire Hotel (Helsinki)
│
├─ /meista                  About Us
├─ /yhteystiedot            Contact
└─ /ukk                     FAQ


┌─────────────────────────────────────────────────────────────┐
│              ENGLISH (EXISTING — KEEP AS IS)                 │
└─────────────────────────────────────────────────────────────┘

/services                   Services Hub (EN — existing)
/tire-hotel                 Tire Hotel (EN — existing)
/about                      About (EN — existing)


┌─────────────────────────────────────────────────────────────┐
│             ENGLISH (FUTURE MIRROR — DESIGN FOR)             │
└─────────────────────────────────────────────────────────────┘

/en                         Home (EN mirror)
│
├─ /en/services             Services Hub (EN)
│  ├─ /tire-change          → Tire Change
│  ├─ /tire-hotel           → Tire Hotel
│  ├─ /maintenance          → Car Maintenance
│  ├─ /diagnostics          → Diagnostics
│  └─ /car-wash             → Car Wash
│
├─ /en/helsinki             Helsinki Local Hub (EN)
│  ├─ /tire-change          → Tire Change
│  ├─ /maintenance          → Car Service
│  └─ /tire-hotel           → Tire Hotel
│
├─ /en/about                About Us
├─ /en/contact              Contact
└─ /en/faq                  FAQ


┌─────────────────────────────────────────────────────────────┐
│           SUPPORTING PAGES (LANGUAGE NEUTRAL)                │
└─────────────────────────────────────────────────────────────┘

/catalog                    Product Catalog
├─ /catalog/tires           → Tire Products
└─ /catalog/rims            → Wheel Products

/checkout                   Checkout Flow (existing)
/success                    Order Success
/cancel                     Order Cancelled

/cms                        Admin CMS (auth required)
/admin/schedule             Admin Schedule (auth required)

/legal/privacy              Privacy Policy
/legal/terms                Terms of Service
/legal/cookies              Cookie Policy
```

---

## 📐 PAGE TEMPLATES — CONTENT BLOCKS

### Template 1: HOME PAGE
**Used for:** `/` (FI), `/en` (EN future)

```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H1: "Autohuolto ja rengaspalvelut Helsingissä"      │  │
│  │  Tagline: "Ammattitaitoinen huoltoliike keskellä    │  │
│  │            Helsinkiä — varaa aika verkossa"          │  │
│  │                                                        │  │
│  │  [Primary CTA: Varaa huoltoaika]                     │  │
│  │  [Secondary CTA: Selaa palveluja]                    │  │
│  │                                                        │  │
│  │  Background: Workshop photo (hero image)             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TRUST BAR                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Icon] 15+ vuotta kokemusta                          │  │
│  │  [Icon] Helsinki & pääkaupunkiseutu                   │  │
│  │  [Icon] Varaa aika verkossa                           │  │
│  │  [Icon] Ammattitaitoinen tiimi                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SERVICES OVERVIEW (GRID — 4 columns desktop, 2 mobile)     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Palvelumme"                                     │  │
│  │                                                        │  │
│  │  [Card 1: Autohuolto]                                │  │
│  │  Icon + Title + 2-line desc + "Lue lisää →"         │  │
│  │                                                        │  │
│  │  [Card 2: Renkaanvaihto]                             │  │
│  │  [Card 3: Rengashotelli]                             │  │
│  │  [Card 4: Vikadiagnostiikka]                         │  │
│  │                                                        │  │
│  │  Link below: "Katso kaikki palvelut →"               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WHY CHOOSE MITRA (2-column layout)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Miksi valita Mitra Auto?"                       │  │
│  │                                                        │  │
│  │  Left Column:                                         │  │
│  │  • Paikallinen helsinkiläinen yritys                 │  │
│  │  • Kokenut ja ammattitaitoinen tiimi                 │  │
│  │  • Nopea ajanvaraus verkossa                         │  │
│  │  • Läpinäkyvä hinnoittelu                            │  │
│  │                                                        │  │
│  │  Right Column:                                        │  │
│  │  [Photo: Workshop or team]                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  HELSINKI FOCUS SECTION                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Palvelemme Helsingissä"                         │  │
│  │                                                        │  │
│  │  Text: Short paragraph about Helsinki location,      │  │
│  │        accessibility, local knowledge                 │  │
│  │                                                        │  │
│  │  [Mini map placeholder]                               │  │
│  │  Address: Käyntiosoite, Helsinki                      │  │
│  │  Hours: Ma–Pe 8–17, La 9–14                           │  │
│  │                                                        │  │
│  │  [CTA: Näytä reittiohjeet]                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MINI FAQ (Accordion, 3-4 questions)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Usein kysytyt kysymykset"                       │  │
│  │                                                        │  │
│  │  ▼ Kuinka varaan ajan?                                │  │
│  │  ▼ Mitä huolto sisältää?                              │  │
│  │  ▼ Paljonko renkaanvaihto maksaa?                     │  │
│  │                                                        │  │
│  │  Link: "Katso kaikki kysymykset →"                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FINAL CTA SECTION (Full-width, accent background)         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Varaa huoltoaika nyt"                           │  │
│  │  Text: "Helppoa, nopeaa ja turvallista"               │  │
│  │                                                        │  │
│  │  [Large CTA Button: Varaa aika]                       │  │
│  │  [Secondary: Soita meille: +358 ...]                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Content Hierarchy for SEO/AI:**
1. H1: Main service offering + location
2. Trust signals (experience, local, online booking)
3. Service categories (clear, scannable)
4. Why choose us (differentiation)
5. Location information (Helsinki focus)
6. FAQ (voice search optimization)
7. Clear CTAs throughout

---

### Template 2: SERVICES HUB
**Used for:** `/palvelut` (FI), `/services` (EN existing), `/en/services` (EN future)

```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H1: "Autohuolto- ja rengaspalvelut"                  │  │
│  │  Subtitle: "Ammattitaitoista palvelua Helsingissä"   │  │
│  │                                                        │  │
│  │  Breadcrumb: Etusivu > Palvelut                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  INTRO TEXT                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Paragraph: 2-3 sentences about our service          │  │
│  │  approach, quality commitment, and Helsinki focus.   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SERVICE CATEGORIES (Large cards, 2 columns)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [CARD 1: AUTOHUOLTO]                                 │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Icon: Wrench                                   │  │  │
│  │  │  H3: Autohuolto                                │  │  │
│  │  │  Description: Määräaikaishuollot, öljynvaih-   │  │  │
│  │  │  dot, jarruhuollot ja muut ylläpitotyöt        │  │  │
│  │  │                                                 │  │  │
│  │  │  • Määräaikaishuolto                           │  │  │
│  │  │  • Öljynvaihto                                 │  │  │
│  │  │  • Jarruhuolto                                 │  │  │
│  │  │                                                 │  │  │
│  │  │  [Button: Lue lisää →]                         │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  [CARD 2: RENKAANVAIHTO]                              │  │
│  │  [CARD 3: RENGASHOTELLI]                              │  │
│  │  [CARD 4: VIKADIAGNOSTIIKKA]                          │  │
│  │  [CARD 5: AUTOPESU]                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WHY CHOOSE OUR SERVICES (3 columns)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Miksi valita meidät?"                           │  │
│  │                                                        │  │
│  │  [Col 1: Kokemus]      [Col 2: Laatu]    [Col 3: Aika]│  │
│  │  Icon + Title          Icon + Title      Icon + Title │  │
│  │  2-3 lines             2-3 lines         2-3 lines    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  BOOKING CTA                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Varaa aika palveluun"                           │  │
│  │  [Primary CTA: Varaa huoltoaika]                      │  │
│  │  Text: "Tai soita meille: +358 ..."                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MINI FAQ (4-5 questions specific to services)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Palveluihin liittyvät kysymykset"               │  │
│  │  [Accordion items]                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**SEO/AI Optimization:**
- H1 includes "services" + "Helsinki"
- Each service card has structured H3 + list
- Clear service hierarchy for crawlers
- FAQ schema markup opportunity
- Local business schema integration

---

### Template 3: SERVICE DETAIL PAGE
**Used for:** `/palvelut/renkaanvaihto`, `/palvelut/rengashotelli`, etc.

```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Breadcrumb: Etusivu > Palvelut > Renkaanvaihto      │  │
│  │                                                        │  │
│  │  H1: "Renkaanvaihto Helsingissä"                      │  │
│  │  Subtitle: "Nopeaa ja ammattitaitoista palvelua"     │  │
│  │                                                        │  │
│  │  [Primary CTA: Varaa renkaanvaihto]                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WHAT IS THIS SERVICE (Intro section)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Mitä renkaanvaihto sisältää?"                   │  │
│  │                                                        │  │
│  │  Plain language explanation (3-4 sentences) about     │  │
│  │  what the service involves, written for clarity.      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WHEN YOU NEED THIS (Context section)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Milloin tarvitset renkaanvaihtoa?"              │  │
│  │                                                        │  │
│  │  • Kesä-/talvirenkaiden vaihto kausittain            │  │
│  │  • Renkaat kuluneet tai vaurioituneet                │  │
│  │  • Uudet renkaat ostettu                              │  │
│  │  • Helsinki-spesifiset sääolosuhteet                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  HOW IT WORKS (Process steps)                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Näin se toimii"                                 │  │
│  │                                                        │  │
│  │  [Step 1] → [Step 2] → [Step 3] → [Step 4]          │  │
│  │                                                        │  │
│  │  1. Varaa aika verkossa tai puhelimitse              │  │
│  │  2. Tuo auto huoltoliikkeeseemme                      │  │
│  │  3. Vaihdamme renkaat ammattitaitoisesti              │  │
│  │  4. Tarkastamme ja tasapainotamme renkaat             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WHAT'S INCLUDED (2-column layout)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Hintaan sisältyy"                               │  │
│  │                                                        │  │
│  │  Left Column (Included):         Right Column (Extra):│  │
│  │  ✓ Renkaiden vaihto              ○ Rengassäilytys    │  │
│  │  ✓ Tasapainotus                  ○ Renkaat (jos ei   │  │
│  │  ✓ Ilmanpaineen tarkistus           omia)            │  │
│  │  ✓ Visuaalinen tarkastus         ○ Erikoistyökalut   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PRICING INFO                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Hinnoittelu"                                    │  │
│  │                                                        │  │
│  │  Starting from: XX €                                  │  │
│  │  Note: "Lopullinen hinta riippuu auton koosta ja     │  │
│  │         renkaiden tyypistä. Pyydä tarjous."           │  │
│  │                                                        │  │
│  │  [CTA: Pyydä tarjous]                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CTA SECTION                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Varaa renkaanvaihto nyt"                        │  │
│  │  [Large Primary CTA: Varaa aika]                      │  │
│  │  Text: "Tai soita: +358 ..."                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SERVICE-SPECIFIC FAQ (5-7 questions)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Usein kysytyt kysymykset — Renkaanvaihto"      │  │
│  │                                                        │  │
│  │  ▼ Kuinka kauan renkaanvaihto kestää?                │  │
│  │  ▼ Voinko tuoda omat renkaat?                         │  │
│  │  ▼ Tarvitseeko varata aika etukäteen?                │  │
│  │  ▼ Mitä eroa on kesä- ja talvirenkailla?             │  │
│  │  ▼ Tarjoatteko rengassäilytystä?                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TRUST STRIP (Photos/icons)                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Workshop Photo] [Equipment Icon] [Team Icon]        │  │
│  │  Professional equipment • Experienced team • Quality  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  RELATED SERVICES (Cards)                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Muut palvelut"                                  │  │
│  │                                                        │  │
│  │  [Card: Rengashotelli] [Card: Autohuolto]            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**SEO/AI Structure:**
- H1: Service name + location (Helsinki)
- Clear "What/When/How" structure for featured snippets
- Structured FAQ for voice search
- Pricing transparency (even if range)
- Related services for internal linking

---

### Template 4: HELSINKI LOCAL HUB
**Used for:** `/helsinki` (FI), `/en/helsinki` (EN future)

```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H1: "Autohuolto Helsingissä"                         │  │
│  │  Subtitle: "Paikallinen asiantuntija – palvelemme    │  │
│  │             koko pääkaupunkiseudulla"                 │  │
│  │                                                        │  │
│  │  Background: Helsinki cityscape or workshop exterior │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  LOCAL RELEVANCE SECTION                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Tunnemme Helsingin olosuhteet"                  │  │
│  │                                                        │  │
│  │  Text: 2-3 paragraphs about:                          │  │
│  │  • Finnish winter conditions (tire requirements)     │  │
│  │  • Helsinki road salt/maintenance needs              │  │
│  │  • Seasonal service patterns                          │  │
│  │  • Local customer knowledge                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SERVICES IN HELSINKI (3-column grid)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Palvelumme Helsingissä"                         │  │
│  │                                                        │  │
│  │  [Card 1: Renkaanvaihto]                              │  │
│  │  Icon + Title + Description                           │  │
│  │  "Kesä/talvi renkaat - Helsingin sääolosuhteisiin"   │  │
│  │  [Button: Varaa → /helsinki/renkaanvaihto]           │  │
│  │                                                        │  │
│  │  [Card 2: Autohuolto]                                 │  │
│  │  [Card 3: Rengashotelli]                              │  │
│  │  [Card 4: Vikadiagnostiikka]                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  LOCATION & CONTACT (2-column layout)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Käyntiosoite ja yhteystiedot"                   │  │
│  │                                                        │  │
│  │  Left Column:                  Right Column:          │  │
│  │  [Map Placeholder]             Address Line 1         │  │
│  │  Google Maps embed             Postal Code, Helsinki │  │
│  │                                                        │  │
│  │                                Phone: +358 ...        │  │
│  │                                Email: info@...        │  │
│  │                                                        │  │
│  │                                Aukioloajat:           │  │
│  │                                Ma–Pe: 8:00–17:00      │  │
│  │                                La: 9:00–14:00         │  │
│  │                                Su: Suljettu           │  │
│  │                                                        │  │
│  │  [CTA: Aja reitti]             [CTA: Soita nyt]      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WHY LOCAL MATTERS (Feature section)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Miksi paikallinen valinta on parempi?"         │  │
│  │                                                        │  │
│  │  • Tunnemme Helsingin ilmasto-olosuhteet             │  │
│  │  • Nopea saavutettavuus keskustasta                  │  │
│  │  • Henkilökohtainen palvelu                          │  │
│  │  • Pitkäaikaiset asiakassuhteet                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  HELSINKI-SPECIFIC FAQ                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Helsinkiläisten kysymykset"                     │  │
│  │                                                        │  │
│  │  ▼ Missä päin Helsinkiä sijaitsette?                 │  │
│  │  ▼ Onko pysäköinti helppoa?                          │  │
│  │  ▼ Palveletteko koko pääkaupunkiseudulla?           │  │
│  │  ▼ Miten julkisilla paikalle?                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FINAL CTA                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Varaa aika tänään"                              │  │
│  │  [Primary CTA: Varaa huoltoaika]                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Local SEO Focus:**
- H1 explicitly mentions "Helsinki"
- Local relevance content (weather, roads, seasons)
- NAP (Name, Address, Phone) clearly displayed
- Map integration
- Local business schema markup opportunity
- Helsinki-specific FAQ for long-tail keywords

---

### Template 5: ABOUT / TRUST PAGE
**Used for:** `/meista` (FI), `/about` (EN existing), `/en/about` (EN future)

```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H1: "Mitra Auto – Luotettava kumppanisi Helsingissä"│  │
│  │  Subtitle: "15 vuotta ammattitaitoista autohuoltoa"  │  │
│  │                                                        │  │
│  │  Background: Team photo or workshop                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  OUR STORY                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Tarinmme"                                        │  │
│  │                                                        │  │
│  │  3-4 paragraphs about:                                │  │
│  │  • How/when the business started                     │  │
│  │  • Core values and mission                            │  │
│  │  • Commitment to Helsinki community                   │  │
│  │  • Evolution and growth                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  EXPERTISE & EXPERIENCE (Stats section)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Kokemuksella ja ammattitaidolla"                │  │
│  │                                                        │  │
│  │  [Stat 1: 15+]     [Stat 2: 10,000+]  [Stat 3: 4.8/5]│  │
│  │  vuotta            palveltuja          asiakasarvo-   │  │
│  │  kokemusta         asiakkaita          stelu           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TEAM SECTION (Optional placeholder)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Tiimimme"                                        │  │
│  │                                                        │  │
│  │  [Photo Grid: Team members]                           │  │
│  │  Name + Role for each (if available)                  │  │
│  │                                                        │  │
│  │  Or: Group photo with general description             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  EQUIPMENT & QUALITY                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Laatu ja varusteet"                             │  │
│  │                                                        │  │
│  │  Text: Description of:                                │  │
│  │  • Modern equipment and tools                         │  │
│  │  • Quality standards followed                         │  │
│  │  • Certifications (if any)                           │  │
│  │  • Brands we work with                                │  │
│  │                                                        │  │
│  │  [Icons: Equipment, Certification, Quality]          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WHY CUSTOMERS TRUST US (3-column features)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Miksi asiakkaat luottavat meihin"              │  │
│  │                                                        │  │
│  │  [Col 1: Rehellisyys]  [Col 2: Osaaminen] [Col 3: Aika]│
│  │  Icon + Title          Icon + Title        Icon + Title│
│  │  Short description     Short description   Short desc. │
│  │                                                        │  │
│  │  • Läpinäkyvä hinnoittelu                            │  │
│  │  • Ammattitaitoinen tiimi                            │  │
│  │  • Nopea ja joustava palvelu                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  HELSINKI COMMITMENT                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Sitoutuneet Helsinkiin"                         │  │
│  │                                                        │  │
│  │  Paragraph: How we serve the Helsinki community,     │  │
│  │  understand local needs, contribute to the area.      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WORKSHOP GALLERY (Photo grid)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Huoltoliikkeemme"                               │  │
│  │                                                        │  │
│  │  [Photo 1] [Photo 2] [Photo 3]                        │  │
│  │  Workshop  Equipment  Waiting area                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FINAL CTA                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Haluatko tutustua?"                             │  │
│  │  Text: "Tule käymään tai varaa aika huollolle"       │  │
│  │                                                        │  │
│  │  [CTA: Varaa aika] [CTA: Yhteystiedot]               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Trust Building Elements:**
- Authentic story (no corporate speak)
- Specific stats/numbers if available
- Team humanization
- Quality/certification mentions
- Local commitment emphasis
- Visual proof (workshop photos)

---

### Template 6: FAQ PAGE
**Used for:** `/ukk` (FI), `/en/faq` (EN future)

```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H1: "Usein kysytyt kysymykset"                       │  │
│  │  Subtitle: "Vastauksia yleisimpiin kysymyksiin"      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FAQ CATEGORIES (Tab navigation or section links)           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Palvelut] [Renkaat] [Varaaminen] [Hinnoittelu]    │  │
│  │  [Huolto] [Yleistä]                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CATEGORY 1: PALVELUT                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Palveluihin liittyvät kysymykset"               │  │
│  │                                                        │  │
│  │  ▼ Mitä palveluja tarjoatte?                          │  │
│  │    Answer text...                                      │  │
│  │                                                        │  │
│  │  ▼ Kuinka kauan huolto kestää?                        │  │
│  │    Answer text...                                      │  │
│  │                                                        │  │
│  │  ▼ Tarjoatteko pikavaihtoa?                           │  │
│  │    Answer text...                                      │  │
│  │                                                        │  │
│  │  [5-7 questions per category]                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CATEGORY 2: RENKAAT                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Renkaisiin liittyvät kysymykset"                │  │
│  │                                                        │  │
│  │  ▼ Milloin vaihdan talvirenkaita?                     │  │
│  │  ▼ Mitä tarkoittaa rengashotelli?                     │  │
│  │  ▼ Myyttekö renkaita?                                 │  │
│  │  ▼ Kuinka tarkistan renkaan kunnon?                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CATEGORY 3: VARAAMINEN                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Ajanvaraukseen liittyvät kysymykset"            │  │
│  │                                                        │  │
│  │  ▼ Kuinka varaan ajan?                                │  │
│  │  ▼ Voinko perua varauksen?                            │  │
│  │  ▼ Kuinka nopeasti saan ajan?                         │  │
│  │  ▼ Onko walk-in -palvelu mahdollinen?                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CATEGORY 4: HINNOITTELU                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Hinnoitteluun liittyvät kysymykset"             │  │
│  │                                                        │  │
│  │  ▼ Paljonko huolto maksaa?                            │  │
│  │  ▼ Miten maksan?                                       │  │
│  │  ▼ Saanko laskun?                                      │  │
│  │  ▼ Onko hintaennuste mahdollinen?                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STILL HAVE QUESTIONS?                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Eikö löytynyt vastausta?"                       │  │
│  │  Text: "Ota meihin yhteyttä, autamme mielellämme!"   │  │
│  │                                                        │  │
│  │  [CTA: Ota yhteyttä] [CTA: Soita meille]             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**SEO/Voice Search Optimization:**
- Questions in natural language (how people actually search)
- Clear H2 + H3 structure per category
- FAQ schema markup ready
- Long-tail keyword coverage
- "People also ask" optimization

---

### Template 7: CATALOG LANDING PAGE
**Used for:** `/catalog` (language-neutral or adapted)

```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H1: "Renkaat ja vanteet"                             │  │
│  │  Subtitle: "Laadukkaat tuotteet – asennus saatavilla"│  │
│  │                                                        │  │
│  │  Note: "Kaikki tuotteet asennetaan ammattitaitoisesti│  │
│  │         Helsingin huoltoliikkeessämme"                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SERVICE-FIRST MESSAGE                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Callout box (subtle background):                     │  │
│  │                                                        │  │
│  │  "Tuotteet tukevat palveluitamme. Osta renkaat       │  │
│  │   verkosta ja varaa asennus samalla."                 │  │
│  │                                                        │  │
│  │  [Link: Katso palvelut →]                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PRODUCT CATEGORIES (2 large cards)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [RENKAAT / TIRES]                                    │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Image: Tire product                            │  │  │
│  │  │  H2: Renkaat                                   │  │  │
│  │  │  Description: Kesä-, talvi- ja ympärivuoti-    │  │  │
│  │  │  renkaat tunnetuilta valmistajilta             │  │  │
│  │  │                                                 │  │  │
│  │  │  [CTA: Selaa renkaita →]                       │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  [VANTEET / RIMS]                                     │  │
│  │  Similar card structure                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WHY BUY FROM US                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Miksi ostaa meiltä?"                            │  │
│  │                                                        │  │
│  │  • Ammattitaitoinen asennus sisältyy                 │  │
│  │  • Tuotteet varastossa tai nopeasti saatavilla      │  │
│  │  • Takuu ja tuki huoltoliikkeeltä                    │  │
│  │  • Helsinki-toimitus ja -asennus                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  HOW IT WORKS (3-step process)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  H2: "Näin se toimii"                                 │  │
│  │                                                        │  │
│  │  [Step 1] → [Step 2] → [Step 3]                      │  │
│  │                                                        │  │
│  │  1. Valitse tuote verkkokaupasta                      │  │
│  │  2. Varaa asennusaika kassalla                        │  │
│  │  3. Asennamme tuotteet huoltoliikkeessämme            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CTA SECTION                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Primary CTA: Selaa tuotteita]                       │  │
│  │  [Secondary: Lue lisää palveluista]                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Catalog Positioning:**
- Supporting role to services (not primary)
- Clear connection to installation service
- Emphasizes local pickup/installation
- Not positioned as standalone ecommerce

---

## 🧭 NAVIGATION ARCHITECTURE

### Header Navigation (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  [LOGO: Mitra Auto]                                          │
│                                                               │
│  Palvelut ▼  |  Helsinki  |  Tuotteet  |  Meistä  |  UKK  | │
│                                                               │
│  [🌐 FI | EN]                     [📞 Varaa aika] (Primary) │
└─────────────────────────────────────────────────────────────┘

Dropdown for "Palvelut ▼":
├─ Autohuolto
├─ Renkaanvaihto
├─ Rengashotelli
├─ Vikadiagnostiikka
├─ Autopesu
└─ [Näytä kaikki palvelut]
```

### Header Navigation (Mobile)

```
┌─────────────────────────────────────────────────┐
│  [☰ Menu]  MITRA AUTO        [🌐 FI|EN]       │
└─────────────────────────────────────────────────┘
│                                                 │
│  [Primary CTA: Varaa aika] (Full width)       │
└─────────────────────────────────────────────────┘

Mobile Menu (Drawer):
├─ Etusivu
├─ Palvelut
│  ├─ Autohuolto
│  ├─ Renkaanvaihto
│  ├─ Rengashotelli
│  ├─ Vikadiagnostiikka
│  └─ Autopesu
├─ Helsinki
├─ Tuotteet (Catalog)
├─ Meistä
├─ UKK
├─ Yhteystiedot
├─ ────────────
└─ [Varaa aika] (CTA)
```

### Footer Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [LOGO: Mitra Auto]                                          │
│  Tagline: "Luotettava autohuolto Helsingissä"               │
│                                                               │
│  ┌───────────────┬───────────────┬───────────────┬─────────┐│
│  │ PALVELUT      │ HELSINKI      │ TIETOA        │ YHTEYSTIEDOT│
│  │               │               │               │         ││
│  │ Autohuolto    │ Sijainti      │ Meistä        │ Osoite  ││
│  │ Renkaanvaihto │ Aukioloajat   │ Yhteystiedot  │ Helsinki││
│  │ Rengashotelli │ Reittiohjeet  │ UKK           │         ││
│  │ Vikadiagnostiikka│            │ Blogi (future)│ Puhelin ││
│  │ Autopesu      │               │               │ +358... ││
│  │               │               │               │         ││
│  │               │               │               │ Email   ││
│  │               │               │               │ info@...││
│  └───────────────┴───────────────┴───────────────┴─────────┘│
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TURVALLINEN VERKKOKAUPPA                               │  │
│  │ [Payment icons] [Security badges]                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ © 2024 Mitra Auto • Tietosuoja • Ehdot • Evästeet     │  │
│  │                                          🌐 FI | EN    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 DESIGN TOKENS & VISUAL HIERARCHY

### Typography Scale (SEO-Optimized)

```
H1: 48px / 3rem — Main page title (SERVICE + LOCATION)
    Example: "Autohuolto Helsingissä"
    Usage: Once per page, hero section

H2: 36px / 2.25rem — Major section headings
    Example: "Palvelumme", "Miksi valita meidät?"
    Usage: Section starters

H3: 28px / 1.75rem — Subsections, card titles
    Example: "Renkaanvaihto", service card titles
    Usage: Multiple per page, category titles

H4: 20px / 1.25rem — Minor headings
    Example: FAQ questions, feature titles
    
Body: 16px / 1rem — Main content
Subtitle: 18px / 1.125rem — Hero subtitles
Small: 14px / 0.875rem — Metadata, captions
```

### Content Hierarchy Rules

**For AI/SEO Reading:**
1. H1 must include PRIMARY service + Helsinki/location
2. First paragraph = clear value proposition
3. H2 sections = scannable topics (What/When/How/Why)
4. Lists > Paragraphs for features
5. FAQ in H3 question format (natural language)
6. CTAs repeated every 2-3 sections

**For Human Scanning:**
1. Visual hierarchy: Bigger = More important
2. White space between sections
3. Icons/images to break text
4. Color for CTAs and emphasis
5. Contrast for readability

---

## 🔄 LANGUAGE SWITCHING BEHAVIOR

### URL Mapping Table

| Finnish (Canonical)      | English (Existing)  | English (Future)         |
|--------------------------|---------------------|--------------------------|
| `/`                      | —                   | `/en`                    |
| `/palvelut`              | `/services`         | `/en/services`           |
| `/palvelut/renkaanvaihto`| `/tire-change` (new)| `/en/services/tire-change`|
| `/palvelut/rengashotelli`| `/tire-hotel`       | `/en/services/tire-hotel`|
| `/helsinki`              | `/helsinki` (new)   | `/en/helsinki`           |
| `/meista`                | `/about`            | `/en/about`              |
| `/yhteystiedot`          | `/contact` (new)    | `/en/contact`            |
| `/ukk`                   | `/faq` (new)        | `/en/faq`                |
| `/catalog`               | `/catalog`          | `/catalog` (neutral)     |

### Language Switch Implementation (Design Intent)

**User clicks language toggle:**

```javascript
// Pseudocode - Design Logic
function handleLanguageSwitch(newLanguage) {
  const currentPath = window.location.pathname;
  const pathMap = {
    'fi-to-en': {
      '/': '/en',
      '/palvelut': '/services',
      '/palvelut/renkaanvaihto': '/tire-change',
      '/palvelut/rengashotelli': '/tire-hotel',
      '/helsinki': '/helsinki',
      '/meista': '/about',
      // ... full mapping
    },
    'en-to-fi': {
      '/en': '/',
      '/services': '/palvelut',
      '/tire-change': '/palvelut/renkaanvaihto',
      '/tire-hotel': '/palvelut/rengashotelli',
      '/about': '/meista',
      // ... full mapping
    }
  };
  
  const targetPath = pathMap[`${currentLang}-to-${newLanguage}`][currentPath];
  navigate(targetPath || '/');
}
```

**Visual Indicator:**
- Current language = Bold or active state
- Switcher visible in header + footer
- Mobile: Accessible in hamburger menu

---

## 📱 RESPONSIVE BEHAVIOR

### Breakpoints

```
Mobile:   < 640px  (sm)
Tablet:   640–1024px (md-lg)
Desktop:  > 1024px (xl)
```

### Layout Adaptations

**Desktop (1024px+):**
- Full navigation in header
- Multi-column layouts (2-4 columns)
- Larger hero images
- Sidebar elements visible

**Tablet (640-1024px):**
- Condensed navigation (may need dropdown)
- 2-column layouts
- Reduced image sizes
- Stack some sidebars

**Mobile (<640px):**
- Hamburger menu
- Single column layout
- Full-width CTAs
- Simplified navigation
- Touch-friendly tap targets (min 44x44px)

### Mobile-First Content Priority

**Show first:**
1. H1 + Hero CTA
2. Core service/value proposition
3. Primary CTA
4. Key services (top 3-4)
5. Contact info

**Show later (scroll):**
- Detailed descriptions
- Full service lists
- FAQ
- Footer

---

## 🎯 CONTENT TONE & VOICE

### Writing Guidelines

**DO:**
- Use clear, simple Finnish (B1-B2 level)
- Write for non-native speakers (many Helsinki residents)
- Be direct and specific
- Use active voice
- Include Helsinki/location context
- Explain automotive terms simply

**DON'T:**
- Use jargon without explanation
- Write long, complex sentences
- Assume technical knowledge
- Use aggressive sales language
- Overpromise or exaggerate

### Example Transformations

❌ **BAD (Ecommerce-heavy):**
"Osta nyt! Rajattu tarjous! Parhaat renkaat markkinoilla!"

✅ **GOOD (Service-first):**
"Asennamme laadukkaat renkaat ammattitaitoisesti huoltoliikkeeseemme Helsingissä."

❌ **BAD (Too technical):**
"Suoritamme täydellisen geometrian säädön ja tasapainotuksen käyttäen kalibroituja Hunter-laitteita."

✅ **GOOD (Clear & accessible):**
"Tarkistamme ja säädämme renkaasi oikein, jotta auto kulkee turvallisesti."

### Bilingual Consistency

- Finnish = Primary, canonical content
- English = Direct translation (not localization)
- Both languages use same structure
- CTAs translated but maintain same urgency level
- Technical terms: Finnish term (English equivalent)

---

## 🔍 SEO & AI SEARCH OPTIMIZATION

### On-Page SEO Checklist

**Every page must have:**
- [ ] H1 with primary keyword + location
- [ ] Meta title (50-60 chars)
- [ ] Meta description (150-160 chars)
- [ ] Semantic HTML (header, main, section, article)
- [ ] Alt text for all images
- [ ] Internal links to related pages
- [ ] Canonical URL tag
- [ ] hreflang for language versions
- [ ] Local business schema (home + contact)
- [ ] FAQ schema (FAQ pages)
- [ ] Service schema (service pages)

### Primary Keywords (Finnish)

**Service Pages:**
- autohuolto helsinki
- renkaanvaihto helsinki
- rengashotelli helsinki
- vikadiagnostiikka helsinki
- autopesu helsinki

**Location Pages:**
- autohuolto [neighborhood]
- rengas palvelut helsinki
- autokorjaamo helsinki

### Content Structure for Featured Snippets

**Question + Answer format:**
```html
<h2>Mitä renkaanvaihto sisältää?</h2>
<p>Renkaanvaihto sisältää vanhojen renkaiden irrotuksen, 
uusien renkaiden asennuksen, tasapainotuksen ja 
ilmanpaineen tarkistuksen.</p>
```

**List format:**
```html
<h2>Milloin tarvitset renkaanvaihtoa?</h2>
<ul>
  <li>Kesä-/talvirenkaiden kausivaihdossa</li>
  <li>Kun renkaat ovat kuluneet alle 3 mm</li>
  <li>Renkaan vaurioituessa</li>
</ul>
```

**Table format (for pricing):**
```html
<h2>Hinnoittelu</h2>
<table>
  <tr><th>Palvelu</th><th>Hinta</th></tr>
  <tr><td>Renkaanvaihto</td><td>Alkaen 60 €</td></tr>
</table>
```

### Schema Markup (Implementation Notes)

**LocalBusiness Schema (Home page):**
```json
{
  "@context": "https://schema.org",
  "@type": "AutomotiveBusiness",
  "name": "Mitra Auto",
  "image": "https://...",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "...",
    "addressLocality": "Helsinki",
    "postalCode": "...",
    "addressCountry": "FI"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "...",
    "longitude": "..."
  },
  "telephone": "+358...",
  "openingHours": "Mo-Fr 08:00-17:00, Sa 09:00-14:00",
  "priceRange": "€€"
}
```

**Service Schema (Service pages):**
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Tire Change",
  "provider": {
    "@type": "AutomotiveBusiness",
    "name": "Mitra Auto"
  },
  "areaServed": {
    "@type": "City",
    "name": "Helsinki"
  }
}
```

**FAQ Schema (FAQ sections):**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Kuinka kauan renkaanvaihto kestää?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Renkaanvaihto kestää noin 30-45 minuuttia..."
    }
  }]
}
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)
- [ ] Create Finnish home page (`/`)
- [ ] Create Finnish services hub (`/palvelut`)
- [ ] Create Helsinki hub (`/helsinki`)
- [ ] Implement language switcher
- [ ] Update navigation structure
- [ ] Add bilingual footer

### Phase 2: Core Services (Week 3-4)
- [ ] Create 5 service detail pages (FI)
- [ ] Adapt existing `/services`, `/tire-hotel` to new design
- [ ] Create `/meista` (About FI)
- [ ] Create `/ukk` (FAQ FI)
- [ ] Implement service schema markup

### Phase 3: Helsinki Focus (Week 5)
- [ ] Create Helsinki sub-pages
- [ ] Add local SEO optimization
- [ ] Implement local business schema
- [ ] Add map integration
- [ ] Create contact page with full details

### Phase 4: English Mirror (Week 6-7)
- [ ] Create `/en` home
- [ ] Create `/en/services/*` pages
- [ ] Create `/en/helsinki`
- [ ] Create `/en/about`, `/en/faq`
- [ ] Implement hreflang tags

### Phase 5: Optimization (Week 8)
- [ ] Add FAQ schema markup
- [ ] Optimize images (WebP, lazy loading)
- [ ] Add structured data testing
- [ ] Mobile UX refinement
- [ ] Performance optimization (Core Web Vitals)

### Phase 6: Content & Polish (Ongoing)
- [ ] Professional photography (workshop, team)
- [ ] Customer testimonials
- [ ] Blog setup (future)
- [ ] Video content integration
- [ ] Seasonal content updates

---

## ✅ QUALITY CHECKLIST

### Every New Page Must Have:

**Content:**
- [ ] H1 includes service/topic + "Helsinki"
- [ ] Clear value proposition in first paragraph
- [ ] Scannable structure (H2, H3, lists)
- [ ] At least 1 CTA above the fold
- [ ] FAQ section (min 3 questions)
- [ ] Contact information visible

**SEO:**
- [ ] Meta title optimized
- [ ] Meta description written
- [ ] Alt text for all images
- [ ] Internal links to 2+ related pages
- [ ] Canonical URL set
- [ ] hreflang (if bilingual)
- [ ] Schema markup (if applicable)

**UX:**
- [ ] Mobile-responsive (tested)
- [ ] CTA buttons high-contrast
- [ ] Forms accessible (labels, validation)
- [ ] Load time < 3 seconds
- [ ] No horizontal scroll
- [ ] Touch targets min 44x44px (mobile)

**Accessibility:**
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Color contrast min 4.5:1
- [ ] Keyboard navigation works
- [ ] Screen reader tested

**Bilingual:**
- [ ] Finnish version exists
- [ ] English version exists or planned
- [ ] Language switcher works
- [ ] URLs mapped correctly
- [ ] Content matches (no missing sections)

---

## 📝 DESIGN NOTES FOR DEVELOPERS

### DO NOT Change:
- Existing checkout flow (`/checkout`, `/success`, `/cancel`)
- CMS routes (`/cms`, `/admin/*`)
- Product catalog functionality (only adapt landing page)
- Authentication logic
- Supabase integration
- Payment gateway integration

### Incremental Implementation Strategy:

1. **Create new pages** alongside existing ones
2. **Test individually** before linking
3. **Gradual navigation updates** (add new links without removing old)
4. **Parallel language versions** (don't delete EN until FI is complete)
5. **Monitor analytics** during transition

### Component Reusability:

**Reusable Components to Build:**
- `<ServiceCard>` — Used in grids
- `<ServiceHero>` — Service page heroes
- `<LocationInfo>` — Helsinki address/hours block
- `<FAQAccordion>` — Expandable FAQ
- `<CTASection>` — Repeated CTA blocks
- `<TrustBar>` — Icon + text trust signals
- `<Breadcrumb>` — Navigation breadcrumbs
- `<StepProcess>` — "How it works" steps

**Props Pattern:**
```typescript
interface ServiceCardProps {
  icon: IconType;
  title: string;
  description: string;
  link: string;
  language: 'fi' | 'en';
}
```

### Translation Management:

Use existing i18n structure (`/components/LanguageContext`):
```typescript
// Add new keys to translation files
const translations = {
  fi: {
    services: {
      hub: {
        title: "Autohuolto- ja rengaspalvelut",
        subtitle: "Ammattitaitoista palvelua Helsingissä"
      }
    }
  },
  en: {
    services: {
      hub: {
        title: "Car Service & Tire Services",
        subtitle: "Professional service in Helsinki"
      }
    }
  }
};
```

---

## 🎨 VISUAL DESIGN INSPIRATION

**Reference Style:**
- **Primary:** Garage/automotive professional
- **Secondary:** Helsinki local business (not chain)
- **Tertiary:** Modern service booking platform

**Color Palette (from existing brand):**
- Accent: Red/Orange (emergency, CTA)
- Primary: Dark (professional, trust)
- Secondary: Blue (service, tech)
- Neutral: Grays (content, backgrounds)

**Photography Style:**
- Authentic workshop photos (not stock)
- Helsinki context (recognizable if possible)
- Team members (builds trust)
- Equipment close-ups (quality signal)
- Before/after (where applicable)

**Iconography:**
- Wrench, gear (maintenance)
- Tire (tire services)
- Map pin (location)
- Calendar (booking)
- Shield (trust/warranty)
- Clock (speed/efficiency)

---

## 📊 SUCCESS METRICS (Post-Launch)

**SEO:**
- Organic traffic to `/palvelut` pages
- "autohuolto helsinki" keyword ranking
- Featured snippet appearances
- Local pack ranking (Google Maps)

**UX:**
- Booking conversion rate
- Bounce rate on service pages
- Time on page (engagement)
- Mobile vs desktop usage

**Business:**
- Online bookings (vs phone)
- Service page → booking funnel
- Helsinki-specific traffic
- Returning visitor rate

---

## 🔗 INTERNAL LINKING STRATEGY

**Hub & Spoke Model:**

```
Home (/)
├─ Links to: Palvelut, Helsinki, Meistä
│
Palvelut Hub (/palvelut)
├─ Links to: All 5 service detail pages
│
Service Detail (e.g., /palvelut/renkaanvaihto)
├─ Links to: Palvelut hub, Related services, Helsinki page, Booking
│
Helsinki Hub (/helsinki)
├─ Links to: Helsinki-specific service pages, Contact, Services hub
```

**Footer Links (Every Page):**
- Main navigation items
- Legal pages
- Contact page
- Language switcher

**Contextual Links (In Content):**
- Related services mentioned in text
- "Learn more about X" links
- Call-to-action links
- Cross-references in FAQ

---

## 🌐 FINAL NOTES

This design system is built for **incremental implementation** without breaking the live site. 

**Key Principles:**
1. **Service-first** — Everything supports garage services
2. **Helsinki-focused** — Local business, not national chain
3. **Bilingual clarity** — Finnish canonical, English mirror
4. **SEO-ready** — Structured for search and AI discovery
5. **Conversion-optimized** — Clear path to booking
6. **Maintainable** — Reusable components, clear structure

**Next Steps:**
1. Review and approve design system
2. Create component library
3. Build Finnish home page as pilot
4. Test and iterate
5. Roll out remaining pages incrementally

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Implementation
