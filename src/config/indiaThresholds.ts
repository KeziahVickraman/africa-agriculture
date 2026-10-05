/**
 * Centralized Decision Thresholds & Rules Configuration
 * for FarmSense - South India Family Farm (Chennai / Tamil Nadu)
 */

export const INDIA_THRESHOLDS = {
  irrigate: {
    next48hRainMmSkipThreshold: 10.0, // SKIP if >= 10 mm rain forecast in next 48h
    description: 'Irrigation: SKIP if >= 10 mm rain forecast in next 48 hours; otherwise IRRIGATE.',
  },
  spray: {
    maxRainProbability24hPercent: 60, // NO if > 60%
    maxWindSpeedKmH: 15.0, // NO if wind > 15 km/h
    description: 'Spraying: NO if rain prob > 60% in 24h or wind > 15 km/h; otherwise YES with best 3h window.',
  },
  sow: {
    minRain7DaysMm: 25.0, // WAIT if < 25 mm (too dry)
    maxRain7DaysMm: 100.0, // WAIT if > 100 mm (waterlogging risk)
    veryHeavyRainTransplantCutoffMm: 115.6, // Never transplant before Very Heavy Rain day
    description: 'Sow/Transplant: YES if 7-day rain is 25-100 mm; WAIT if < 25 mm or > 100 mm. Never before heavy rain.',
  },
  soilAmendment: {
    alkalineGypsumCutoffPh: 8.5, // > 8.5 -> May be alkaline/sodic: gypsum may help
    slightlyAlkalineMinPh: 7.5, // 7.5 - 8.5 -> Slightly alkaline: choose fertilisers suited to alkaline soil
    stronglyAcidicCutoffPh: 5.5, // < 5.5 -> Apply lime before fertiliser
    soilHealthCardNotice: 'Get a Soil Health Card test. Near the coast, also test borewell water for salinity.',
  },
  harvest: {
    consecutiveDryDaysRunThreshold: 3, // 3+ consecutive dry days (< 2 mm/day)
    dryDayPrecipitationMaxMm: 2.0, // < 2 mm/day
    sambaHarvestPeriodStartMonth: 11, // December (month 11 zero-indexed, mid-Dec)
    sambaHarvestPeriodEndMonth: 0, // January (month 0 zero-indexed)
  },
  imdAlerts: {
    heavyRainMinMm: 64.5,
    heavyRainMaxMm: 115.5,
    veryHeavyRainMinMm: 115.6,
    veryHeavyRainMaxMm: 204.4,
    extremelyHeavyRainMinMm: 204.5,
    strongWindMinKmH: 50.0,
    disclaimer: 'Forecast model guidance, not an official warning. Check IMD Regional Meteorological Centre Chennai.',
    imdChennaiUrl: 'https://mausam.imd.gov.in/chennai/',
    actions: [
      'Clear field drains and bunds to prevent waterlogging',
      'Move harvested grain and fertiliser bags to high ground',
      'Postpone pesticide spraying and fertiliser top-dressing',
      'Secure pump motor and electrical starter boxes',
      'Check borewell and low-lying farm area for flood ingress',
    ],
    bananaCoconutAction: 'Strong winds: prop up banana plants with casuarina poles and support young coconut palms.',
  },
  defaultReferencePrices: {
    paddy: 2300, // ₹ per quintal (Samba MSP / market baseline)
    groundnut: 6800,
    coconut: 2800, // ₹ per 100 nuts / equivalent quintal
    banana: 2200,
    tomato: 1800,
    brinjal: 2200,
    bhindi: 2400,
    jasmine: 45000, // Jasmine/flowers per quintal
  } as Record<string, number>,
};
