# FarmSense Agronomic Decision Intelligence Engine — Knowledge Graph & RAG Document

**Document ID:** `FARMSENSE-KG-RAG-V1`  
**Schema Version:** `1.2.0`  
**Ontology Type:** Property Graph / Domain Knowledge Graph / Semantic Triples  
**Primary Domain:** Precision Agriculture, Smallholder & Family Farm Agrometeorology, Geointelligence, Mandi Economics  
**Target Systems:** GraphRAG, Vector RAG (Hybrid Dense + Sparse), Knowledge-grounded LLM Agents, Graph Databases (Neo4j, Memgraph, RDF/SPARQL)

---

## 1. Executive System Overview & Mission Context

```
                                [FarmSense Engine]
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
     [Africa Pilot: Kenya]                      [South India: Tamil Nadu Farm]
     • Region: East Africa                      • Region: Chennai / Thiruvallur / Kanchipuram
     • Coords: Nakuru (-0.30, 36.07)            • Coords: Lat 13.08, Lon 80.27
     • Soil: iSDAsoil v2 (30m)                  • Soil: ISRIC SoilGrids v2.0 (250m, 3 depths)
     • Sat: Digital Earth Africa                • Sat: AWS Earth Search Sentinel-2 L2A
     • Weather: Open-Meteo                      • Weather: Open-Meteo (Asia/Kolkata, IST)
     • Advisory: Swahili / English              • Advisory: Tamil (ta-IN) / English (Max 60w)
     • Delivery: AT Sandbox SMS                 • Delivery: Parents' Mobile View + WhatsApp
```

FarmSense is an agronomic decision assistant engineered for smallholders and multi-generational farming families. It bridges satellite remote sensing, digital soil mapping, hyper-local meteorological forecasts, and agricultural produce market data into concise, deterministic daily operational verdicts.

- **Primary Mission (South India):** Enable a family farming plot near Chennai (Thiruvallur / Chengalpattu / Kancheepuram, Tamil Nadu) to decide each day whether to **irrigate**, **spray**, **sow**, **apply soil amendments**, or **sell/hold crops**, with cyclone and Northeast monsoon readiness, coordinated cross-border with family members in Singapore.
- **Primary Mission (East Africa):** Provide Kenyan smallholders in Nakuru with real-time soil acidity assessments (lime vs no lime), 7-day planting moisture guidance, and cloud-filtered satellite crop inspection, dispatched via Africa's Talking SMS.

---

## 2. Core Entities & Class Taxonomy

### 2.1 Entity Classes (`Class` Hierarchy)

```
SpatialEntity
 └── Location
      ├── FarmPlot
      ├── District
      └── RegulatedMarket (Mandi)

ProviderService
 ├── SoilDataProvider (iSDAsoil, ISRIC SoilGrids)
 ├── SatelliteDataProvider (Digital Earth Africa, AWS Earth Search STAC)
 ├── MeteorologicalProvider (Open-Meteo)
 ├── CommodityPriceProvider (Agmarknet data.gov.in)
 └── NotificationGateway (Africa's Talking SMS, Web Speech API, WhatsApp)

AgronomicMetric
 ├── SoilMetric (pH_H2O, Total_Nitrogen, SOC, Clay_Pct, Sand_Pct, Silt_Pct)
 ├── WeatherMetric (Rain_48h_Sum, Rain_7d_Sum, Rain_Prob_24h, Wind_Speed_Max, Dry_Days_Run)
 ├── SatelliteMetric (Cloud_Cover_Pct, True_Color_RGB, Acquisition_Date)
 └── MarketMetric (Modal_Price, Min_Price, Max_Price, Target_Ref_Price)

DecisionRule
 ├── IrrigationRule
 ├── SprayRule
 ├── SowingRule
 ├── SoilAmendmentRule
 ├── HarvestWindowRule
 ├── ProduceSellingRule
 └── WeatherAlertRule (IMD Protocol)

FarmerProfile
 ├── UserPersona (Parent / Field Operator, Singapore Remote Coordinator, Extension Officer)
 └── PlotConfiguration (District, Area_Acres, Water_Source, Sowing_Date, Target_Crops)
```

---

## 3. Explicit Knowledge Graph Triples (Subject ➔ Predicate ➔ Object)

### 3.1 Geographic & Administrative Relationships
```turtle
:FarmPlot_ChennaiTN a :FarmPlot ;
    :hasLatitude "13.08"^^xsd:float ;
    :hasLongitude "80.27"^^xsd:float ;
    :locatedInDistrict :District_Thiruvallur ;
    :locatedInState :State_TamilNadu ;
    :locatedInCountry :Country_India ;
    :hasTimezone "Asia/Kolkata" ;
    :hasDateFormat "DD/MM/YYYY" ;
    :belongsToProfile :Profile_VickramanFamily .

:District_Thiruvallur :partOfRegion :Region_NorthernCoastalTamilNadu .
:District_Chennai :partOfRegion :Region_NorthernCoastalTamilNadu .
:District_Chengalpattu :partOfRegion :Region_NorthernCoastalTamilNadu .
:District_Kancheepuram :partOfRegion :Region_NorthernCoastalTamilNadu .

:Region_NorthernCoastalTamilNadu :experiencesSeason :Season_NortheastMonsoon .
:Season_NortheastMonsoon :startDate "10-01" ; :endDate "12-31" ;
    :characteristics "Contributes ~60% of annual rainfall; frequent cyclone depression tracks" .
```

### 3.2 Data Integration & Provenance Triples
```turtle
:Service_SoilGrids a :SoilDataProvider ;
    :endpoint "https://rest.isric.org/soilgrids/v2.0/properties/query" ;
    :resolution "250m" ;
    :cachePolicy "30-day memory/disk cache" ;
    :depthLayers ("0-5cm" "5-15cm" "15-30cm") ;
    :scalingFactorRule "Divide raw value by layer.unit_measure.d_factor" ;
    :mandatoryNotice "Modelled estimate at 250 m. Confirm with a Soil Health Card test before buying lime or gypsum." .

:Service_EarthSearchSTAC a :SatelliteDataProvider ;
    :endpoint "https://earth-search.aws.element84.com/v1" ;
    :collection "sentinel-2-l2a" ;
    :cloudCoverProperty "eo:cloud_cover" ;
    :sortingStrategy "Cloud cover ascending" ;
    :monsoonCloudConstraint "If no scene is < 20% cloud cover, show clearest pass with warning notice" .

:Service_OpenMeteoIndia a :MeteorologicalProvider ;
    :endpoint "https://api.open-meteo.com/v1/forecast" ;
    :timezone "Asia/Kolkata" ;
    :parameters ("precipitation_sum" "precipitation_probability_max" "wind_speed_10m_max" "hourly.precipitation_probability" "hourly.wind_speed_10m") .

:Service_AgmarknetDataGovIn a :CommodityPriceProvider ;
    :endpoint "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070" ;
    :paginationConstraint "limit=10, page offset (+10) up to 100 max records" ;
    :fallbackOrder (
        "1. filters[state]=Tamil Nadu"
        "2. filters[state.keyword]=Tamil Nadu"
        "3. No state filter + client-side state match"
    ) ;
    :snapshotPolicy "Save daily snapshot; NEVER render mock/sample prices when offline" .
```

---

## 4. Deterministic Agronomic Decision Rules Ontology

All decision thresholds are codified in `src/config/indiaThresholds.ts` and evaluated by `src/config/indiaDecisions.ts`.

| Decision ID | Question | Input Variables | Condition / Threshold | Verdict Label (EN) | Verdict Label (TA) | Status Icon |
|---|---|---|---|---|---|---|
| `DEC_IRRIGATE` | Irrigate today? | `Rain_48h_Sum`, `Water_Source` | `Rain_48h_Sum >= 10.0 mm` | `SKIP IRRIGATION` | பாசனம் தவிர்க்கவும் | ⏸️ Amber |
| `DEC_IRRIGATE` | Irrigate today? | `Rain_48h_Sum`, `Water_Source` | `Rain_48h_Sum < 10.0 mm` | `IRRIGATE TODAY` | தண்ணீர் பாய்ச்சலாம் | ✅ Green |
| `DEC_IRRIGATE` | Irrigate today? | `Water_Source` | `Water_Source == "rainfed"` | `RAINFED PLOT` | மானாவாரி நிலம் | ⏸️ Amber |
| `DEC_SPRAY` | Spray today? | `Rain_Prob_24h`, `Wind_Max_24h` | `Rain_Prob_24h > 60%` OR `Wind_Max_24h > 15 km/h` | `DO NOT SPRAY` | மருந்து தெளிக்க வேண்டாம் | ⚠️ Red |
| `DEC_SPRAY` | Spray today? | `Rain_Prob_24h`, `Wind_Max_24h` | `Rain_Prob_24h <= 60%` AND `Wind_Max_24h <= 15 km/h` | `SAFE TO SPRAY` | மருந்து தெளிக்கலாம் | ✅ Green |
| `DEC_SOW` | Sow / transplant this week? | `Rain_7d_Sum`, `Daily_Rain_Max` | `Daily_Rain_Max >= 115.6 mm` | `WAIT - VERY HEAVY RAIN` | நடவு தவிர்க்கவும் | ⚠️ Red |
| `DEC_SOW` | Sow / transplant this week? | `Rain_7d_Sum` | `Rain_7d_Sum < 25.0 mm` | `WAIT - TOO DRY` | ஈரப்பதம் போதாது | ⏸️ Amber |
| `DEC_SOW` | Sow / transplant this week? | `Rain_7d_Sum` | `Rain_7d_Sum > 100.0 mm` | `WAIT - WATERLOGGING` | வெள்ள அபாயம் | ⚠️ Red |
| `DEC_SOW` | Sow / transplant this week? | `Rain_7d_Sum` | `25.0 <= Rain_7d_Sum <= 100.0 mm` | `YES - SOW THIS WEEK` | நடவு செய்யலாம் | ✅ Green |
| `DEC_SOIL` | Soil amendment? | `Topsoil_pH` | `Topsoil_pH > 8.5` | `GYPSUM MAY HELP` | ஜிப்சம் இடலாம் | ⏸️ Amber |
| `DEC_SOIL` | Soil amendment? | `Topsoil_pH` | `7.5 <= Topsoil_pH <= 8.5` | `SLIGHTLY ALKALINE` | மிதமான காரம் | ✅ Green |
| `DEC_SOIL` | Soil amendment? | `Topsoil_pH` | `Topsoil_pH < 5.5` | `APPLY LIME BEFORE NPK` | சுண்ணாம்பு இடவும் | ⚠️ Red |
| `DEC_SOIL` | Soil amendment? | `Topsoil_pH` | `5.5 <= Topsoil_pH < 7.5` | `OPTIMAL PH` | உகந்த pH அளவு | ✅ Green |
| `DEC_SELL` | Sell now or hold? | `Modal_Price`, `Target_Ref_Price` | `Modal_Price >= Target_Ref_Price` | `SELL NOW` | விற்கலாம் | ✅ Green |
| `DEC_SELL` | Sell now or hold? | `Modal_Price`, `Target_Ref_Price` | `Modal_Price < Target_Ref_Price` | `HOLD` | காத்திருக்கவும் | ⏸️ Amber |
| `DEC_HARVEST` | Harvest window | `Consecutive_Dry_Days` (< 2mm/d) | `Consecutive_Dry_Days >= 3` | `DRY WINDOW OPEN` | அறுவடைக்கு ஏற்ற சூழல் | ✅ Green |
| `DEC_HARVEST` | Harvest window | `Consecutive_Dry_Days` (< 2mm/d) | `Consecutive_Dry_Days < 3` | `NO DRY RUN` | தொடர் மழை வாய்ப்பு | ⏸️ Amber |

---

## 5. IMD Extreme Weather Classification & Disaster Mitigation Graph

FarmSense adheres strictly to India Meteorological Department (IMD) Regional Meteorological Centre Chennai storm standards:

```turtle
:Alert_HeavyRain a :WeatherAlert ;
    :thresholdMin "64.5"^^xsd:float ;
    :thresholdMax "115.5"^^xsd:float ;
    :unit "mm/day" ;
    :severityColor "Orange" ;
    :mandatoryActions (
        "Clear field drains and bunds to prevent waterlogging"
        "Move harvested grain and fertiliser bags to high ground"
        "Postpone pesticide spraying and fertiliser top-dressing"
    ) .

:Alert_VeryHeavyRain a :WeatherAlert ;
    :thresholdMin "115.6"^^xsd:float ;
    :thresholdMax "204.4"^^xsd:float ;
    :unit "mm/day" ;
    :severityColor "Red" ;
    :transplantConstraint "Strict prohibition against nursery transplantation" ;
    :mandatoryActions (
        "Secure pump motor and electrical starter boxes"
        "Check borewell and low-lying farm area for flood ingress"
    ) .

:Alert_ExtremelyHeavyRain a :WeatherAlert ;
    :thresholdMin "204.5"^^xsd:float ;
    :unit "mm/day" ;
    :severityColor "DarkRed" ;
    :disclaimer "Forecast model guidance, not an official warning. Check IMD Regional Meteorological Centre Chennai." ;
    :officialUrl "https://mausam.imd.gov.in/chennai/" .

:Alert_StrongWind a :WeatherAlert ;
    :thresholdMin "50.0"^^xsd:float ;
    :unit "km/h" ;
    :targetCrops (:Crop_Banana :Crop_Coconut) ;
    :mitigationInstruction "Strong winds: prop up banana plants with casuarina poles and support young coconut palms" .
```

---

## 6. Crop Growth Stage & Samba Paddy Sowing Calendar

```
  [Day 0: Sowing]
        │
        ▼  (0 - 25 days)
  [Nursery / Seedling (நாற்றங்கால் பருவம்)]
        │
        ▼  (25 - 60 days)
  [Tillering & Vegetative Growth (தூர்கட்டும் பருவம்)]
        │
        ▼  (60 - 90 days)
  [Panicle Initiation & Flowering (கதிர் உருவாக்கம் / பூக்கும் பருவம்)]
        │
        ▼  (90 - 120 days)
  [Grain Filling & Ripening (பால் பிடிக்கும் / கதிர் முதிர்ச்சி)]
        │  * Mid-Dec to January: Flag dry windows as Samba harvest opportunities
        ▼  (120+ days)
  [Maturity & Harvest Stage (முதிர்வு / அறுவடை பருவம்)]
```

- **Target Crops in Profile:**
  - `paddy` (Samba / Navarai)
  - `groundnut` (மணிலா / நிலக்கடலை)
  - `coconut` (தென்னை)
  - `banana` (வாழை)
  - `tomato` (தக்காளி)
  - `brinjal` (கத்தரி)
  - `bhindi` (வெண்டை)
  - `jasmine` (மல்லி / பூக்கள்)

---

## 7. Dual View Architectural Pattern

```
                       [FarmSense State Store]
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[Parents' View (Mobile)]                         [My View (Web Dashboard)]
• Target: Parents on mobile phone                • Target: Remote coordinator / desktop
• UX: Ultra-large text & high-contrast tiles     • UX: Multi-panel analytics
• Language: Tamil (default) or English           • Depth table: 0-5cm, 5-15cm, 15-30cm
• Tile constraint: Strictly < 10 words           • 7-Day Precipitation Bar Chart
• Voice: Web Speech API (ta-IN voice / EN audio) • Copernicus Sentinel-2 True Color View
• Sharing: One-click WhatsApp export             • Mandi price table + 7-day trend sparkline
                                                 • Rule thresholds visible side-by-side
```

### 7.1 Text-to-Speech Engine
- Primary voice target: `ta-IN` (Tamil India).
- Hardware / OS fallback: If no Tamil voice exists on the user's mobile browser, display Tamil on screen but trigger voice narration in `en-IN` (Indian English) to guarantee audio playback.

---

## 8. Failure Modes, Edge Cases & Circuit Breakers

| Failure Scenario | Upstream Origin | System Behavior / Fallback | User-Facing Label |
|---|---|---|---|
| HTTP 401 / 403 on Mandi API | `api.data.gov.in` | `/api/health` flags `auth_failed`, includes first 200 chars of body (wipes API key). | `Market prices unavailable right now (data.gov.in error 401/403)` |
| HTTP 429 Rate Limit | `api.data.gov.in` | `/api/health` flags `rate_limited`. | `Market prices unavailable right now (data.gov.in error 429)` |
| HTTP 5xx Server Error | `api.data.gov.in` | `/api/health` flags `upstream_error`. | `Market prices unavailable right now (data.gov.in error 5xx)` |
| 0 Records on Mandi API | `api.data.gov.in` | Fallback: try `filters[state.keyword]=Tamil Nadu`, then un-filtered scan. If still 0: flags `no_data_today`. | Shows latest real saved snapshot with date, **never sample prices**. |
| ISRIC SoilGrids Latency > 6s | `rest.isric.org` | Returns modeled 250m coastal benchmark from 30-day cache. | `Modelled estimate at 250 m. Confirm with a Soil Health Card test before buying lime or gypsum.` |
| High Cloud Cover (> 20%) | Sentinel-2 STAC | Sorts passes ascending by `eo:cloud_cover`. Picks lowest pass. | `Monsoon clouds are common: no passes under 20% cloud cover. Showing the clearest available scene.` |
| Gemini Quota Exhaustion (429) | Google GenAI SDK | Triggers 60-minute internal cooldown; routes to deterministic rule generator. | Pure rule-grounded advisory (max 60 words for India). |

---

## 9. Typical RAG Query-Answer Grounding Pairs

### Q1: Under what conditions does FarmSense tell the family to SKIP irrigation in Chennai?
**Grounding:** `DEC_IRRIGATE` rule.  
**Answer:** FarmSense instructs the farmer to `SKIP IRRIGATION` if cumulative precipitation predicted in the next 48 hours is **≥ 10.0 mm** (or if the plot water source is configured as `rainfed`). If predicted 48-hour rainfall is **< 10.0 mm**, the verdict is `IRRIGATE TODAY`.

### Q2: What are the exact thresholds for pesticide spraying?
**Grounding:** `DEC_SPRAY` rule.  
**Answer:** Spraying is flagged as `DO NOT SPRAY` if the 24-hour maximum rain probability exceeds **60%** OR maximum wind speed exceeds **15 km/h**. If both conditions are satisfied, it returns `SAFE TO SPRAY` along with the calmest 3-hour window (typically 06:00 – 09:00 AM).

### Q3: How does the application handle coastal soil pH in Tamil Nadu?
**Grounding:** `DEC_SOIL` rule and ISRIC SoilGrids v2.0 benchmark.  
**Answer:**
- **pH > 8.5:** Alkaline/sodic soil: Gypsum may help displace exchangeable sodium.
- **pH 7.5 – 8.5:** Slightly alkaline coastal soil: Select fertilizers suited to alkaline reactions (e.g., ammonium sulphate, zinc sulphate).
- **pH < 5.5:** Strongly acidic: Apply agricultural lime before applying NPK to prevent phosphate lockup.
- **pH 5.5 – 7.5:** Optimal balanced pH.
*All verdicts mandate:* "Get a Soil Health Card test. Near the coast, also test borewell water for salinity."

### Q4: What does the mandi card show if data.gov.in is down?
**Grounding:** Requirement 4 & Agmarknet integration.  
**Answer:** The mandi card displays `"Market prices unavailable right now (data.gov.in error <status>)"` and the latest real saved snapshot with its date. Under no circumstance does the application invent or display fake sample prices.

---

## 10. Semantic Search & Vector Embedding Tags

`#precision_agriculture` `#tamil_nadu_farming` `#chennai_agriculture` `#agmarknet_api` `#sentinel2_stac` `#isric_soilgrids` `#northeast_monsoon` `#samba_paddy` `#imd_weather_alerts` `#kenya_isdasoil` `#africas_talking` `#multilingual_advisory` `#gemini_grounding` `#offline_snapshot_resilience`
