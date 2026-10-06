import { FarmProfile, IndiaWeatherData, SoilGridsDetail, MandiData, IndiaDecisionsMap, DecisionResult } from '../types/indiaFarm.ts';
import { INDIA_THRESHOLDS } from './indiaThresholds.ts';
import { getPaddyStageInfo } from '../utils/indiaFormat.ts';

export function computeIndiaDecisions(
  profile: FarmProfile,
  weather: IndiaWeatherData | null,
  soil: SoilGridsDetail | null,
  mandi: MandiData | null
): IndiaDecisionsMap {
  // Missing inputs tracking
  const missingInputs: string[] = [];
  if (!weather) missingInputs.push('Weather forecast');
  if (!soil) missingInputs.push('SoilGrids data');
  if (!mandi) missingInputs.push('Mandi market prices');

  // 1. Irrigate today?
  let irrigateResult: DecisionResult;
  if (!weather) {
    irrigateResult = {
      id: 'irrigate',
      title: 'Irrigate today?',
      titleTa: 'இன்று தண்ணீர் பாய்ச்சவா?',
      status: 'amber',
      icon: 'pause',
      verdictEn: 'WAIT',
      verdictTa: 'காத்திருக்கவும்',
      shortEn: 'Weather data loading. Check 48h rain first.',
      shortTa: 'வானிலை தகவல் பெறப்படுகிறது. மழையை சரிபார்க்கவும்.',
      reasonEn: 'Weather data currently unavailable to evaluate 48-hour rainfall forecast.',
      reasonTa: '48 மணி நேர மழை முன்னறிவிப்பு இன்னும் கிடைக்கவில்லை.',
      thresholdNote: 'SKIP if >= 10 mm rain in next 48h',
    };
  } else if (profile.waterSource === 'rainfed') {
    irrigateResult = {
      id: 'irrigate',
      title: 'Irrigate today?',
      titleTa: 'இன்று தண்ணீர் பாய்ச்சவா?',
      status: 'amber',
      icon: 'pause',
      verdictEn: 'RAINFED PLOT',
      verdictTa: 'மானாவாரி நிலம்',
      shortEn: 'Rainfed plot: no borewell or canal irrigation.',
      shortTa: 'மானாவாரி நிலம்: பாசன வசதி இல்லை.',
      reasonEn: 'Farm water source is configured as rainfed.',
      reasonTa: 'நிலம் மானாவாரி பயிராக பதிவு செய்யப்பட்டுள்ளது.',
      thresholdNote: 'Borewell / canal / tank not in use',
    };
  } else if (weather.next48hRainMm >= INDIA_THRESHOLDS.irrigate.next48hRainMmSkipThreshold) {
    irrigateResult = {
      id: 'irrigate',
      title: 'Irrigate today?',
      titleTa: 'இன்று தண்ணீர் பாய்ச்சவா?',
      status: 'amber',
      icon: 'pause',
      verdictEn: 'SKIP IRRIGATION',
      verdictTa: 'பாசனம் தவிர்க்கவும்',
      shortEn: `SKIP: ${weather.next48hRainMm}mm rain forecast in next 48 hours.`,
      shortTa: `பாசனம் வேண்டாம்: 48 மணி நேரத்தில் ${weather.next48hRainMm} மிமீ மழை.`,
      reasonEn: `Forecast predicts ${weather.next48hRainMm} mm rain within 48 hours (>= ${INDIA_THRESHOLDS.irrigate.next48hRainMmSkipThreshold} mm cutoff). Save borewell power and prevent waterlogging.`,
      reasonTa: `அடுத்த 48 மணி நேரத்தில் ${weather.next48hRainMm} மிமீ மழை எதிர்பார்க்கப்படுகிறது. மின்சாரம் சேமித்து பயிரை பாதுகாக்கவும்.`,
      thresholdNote: `Threshold: SKIP if >= ${INDIA_THRESHOLDS.irrigate.next48hRainMmSkipThreshold} mm in 48h`,
    };
  } else {
    irrigateResult = {
      id: 'irrigate',
      title: 'Irrigate today?',
      titleTa: 'இன்று தண்ணீர் பாய்ச்சவா?',
      status: 'green',
      icon: 'check',
      verdictEn: 'IRRIGATE TODAY',
      verdictTa: 'தண்ணீர் பாய்ச்சலாம்',
      shortEn: 'IRRIGATE: Low rain forecast over next 48 hours.',
      shortTa: 'இன்று பாசனம் செய்யலாம். மழை வாய்ப்பு குறைவு.',
      reasonEn: `Next 48-hour rain is only ${weather.next48hRainMm} mm (< ${INDIA_THRESHOLDS.irrigate.next48hRainMmSkipThreshold} mm). Routine irrigation from ${profile.waterSource} is safe and recommended.`,
      reasonTa: `அடுத்த 48 மணி நேரத்தில் ${weather.next48hRainMm} மிமீ மழை மட்டுமே வாய்ப்பு. ${profile.waterSource} மூலம் பாசனம் செய்யலாம்.`,
      thresholdNote: `Threshold: IRRIGATE if < ${INDIA_THRESHOLDS.irrigate.next48hRainMmSkipThreshold} mm in 48h`,
    };
  }

  // 2. Spray today?
  let sprayResult: DecisionResult;
  if (!weather) {
    sprayResult = {
      id: 'spray',
      title: 'Spray today?',
      titleTa: 'இன்று மருந்து தெளிக்கவா?',
      status: 'amber',
      icon: 'pause',
      verdictEn: 'WAIT',
      verdictTa: 'காத்திருக்கவும்',
      shortEn: 'Hourly rain and wind data loading.',
      shortTa: 'காற்று மற்றும் மழை விபரம் பெறப்படுகிறது.',
      reasonEn: 'Awaiting hourly weather data.',
      reasonTa: 'வானிலை விபரம் பதிவாகிறது.',
      thresholdNote: 'NO if rain prob > 60% or wind > 15 km/h',
    };
  } else {
    const isRainHigh = weather.next24hMaxRainProb > INDIA_THRESHOLDS.spray.maxRainProbability24hPercent;
    const isWindHigh = weather.next24hMaxWindKmH > INDIA_THRESHOLDS.spray.maxWindSpeedKmH;

    if (isRainHigh || isWindHigh) {
      const issues = [];
      const issuesTa = [];
      if (isRainHigh) {
        issues.push(`rain probability is ${weather.next24hMaxRainProb}% (> 60%)`);
        issuesTa.push(`மழை வாய்ப்பு ${weather.next24hMaxRainProb}%`);
      }
      if (isWindHigh) {
        issues.push(`wind is ${weather.next24hMaxWindKmH} km/h (> 15 km/h)`);
        issuesTa.push(`காற்று வேகம் ${weather.next24hMaxWindKmH} கிமீ/மணி`);
      }

      sprayResult = {
        id: 'spray',
        title: 'Spray today?',
        titleTa: 'இன்று மருந்து தெளிக்கவா?',
        status: 'red',
        icon: 'alert',
        verdictEn: 'DO NOT SPRAY',
        verdictTa: 'மருந்து தெளிக்க வேண்டாம்',
        shortEn: `NO: High ${isRainHigh ? 'rain risk' : 'wind'} in next 24 hours.`,
        shortTa: `தெளிக்க வேண்டாம்: அதிக ${isRainHigh ? 'மழை' : 'காற்று'} வாய்ப்புள்ளது.`,
        reasonEn: `Spraying not recommended today because ${issues.join(' and ')}. Chemicals will drift or wash off.`,
        reasonTa: `இன்று மருந்து தெளிக்க வேண்டாம்: ${issuesTa.join(' மற்றும் ')}. மருந்து வீணாகும்.`,
        thresholdNote: 'Rule: Rain prob <= 60% & Wind <= 15 km/h',
      };
    } else {
      const windowStr = weather.bestSprayWindow ? weather.bestSprayWindow.windowText : '06:00 – 09:00 AM';
      sprayResult = {
        id: 'spray',
        title: 'Spray today?',
        titleTa: 'இன்று மருந்து தெளிக்கவா?',
        status: 'green',
        icon: 'check',
        verdictEn: 'SAFE TO SPRAY',
        verdictTa: 'மருந்து தெளிக்கலாம்',
        shortEn: `YES: Safe spray window ${windowStr}.`,
        shortTa: `தெளிக்கலாம்: உகந்த நேரம் ${windowStr}.`,
        reasonEn: `Conditions are calm: 24h rain probability is ${weather.next24hMaxRainProb}% and wind speed is ${weather.next24hMaxWindKmH} km/h. Best 3-hour window is ${windowStr}.`,
        reasonTa: `வானிலை சாதகமாக உள்ளது. காற்று வேகம் ${weather.next24hMaxWindKmH} கிமீ/மணி மட்டுமே. உகந்த நேரம்: ${windowStr}.`,
        thresholdNote: `Window: ${windowStr} (Wind < 15 km/h, Rain prob < 40%)`,
      };
    }
  }

  // 3. Sow / transplant this week?
  let sowResult: DecisionResult;
  if (!weather) {
    sowResult = {
      id: 'sow',
      title: 'Sow / transplant this week?',
      titleTa: 'இந்த வாரம் நடவு செய்யவா?',
      status: 'amber',
      icon: 'pause',
      verdictEn: 'WAIT',
      verdictTa: 'காத்திருக்கவும்',
      shortEn: '7-day precipitation forecast loading.',
      shortTa: '7 நாள் மழை அளவு பெறப்படுகிறது.',
      reasonEn: 'Awaiting 7-day cumulative rainfall forecast.',
      reasonTa: '7 நாள் மழை அளவு விவரம் தேவை.',
      thresholdNote: 'Favorable range: 25 - 100 mm',
    };
  } else {
    const rain7Days = weather.totalRain7DaysMm;
    const hasVeryHeavyRainDay = weather.daily.some(
      (d) => d.precipitationSumMm >= INDIA_THRESHOLDS.sow.veryHeavyRainTransplantCutoffMm
    );

    if (hasVeryHeavyRainDay) {
      sowResult = {
        id: 'sow',
        title: 'Sow / transplant this week?',
        titleTa: 'இந்த வாரம் நடவு செய்யவா?',
        status: 'red',
        icon: 'alert',
        verdictEn: 'WAIT - VERY HEAVY RAIN',
        verdictTa: 'நடவு தவிர்க்கவும்',
        shortEn: 'WAIT: Very heavy rain day ahead. Seedling risk.',
        shortTa: 'நடவு வேண்டாம்: அதிகனமழை வாய்ப்பால் நாற்று அழுகும்.',
        reasonEn: `Never transplant just before a Very Heavy Rain day (>= 115.6 mm). Seedlings will submerge and uproot.`,
        reasonTa: `அதிகனமழை நாள் (>= 115.6 மிமீ) எதிர்பார்க்கப்படுகிறது. இளம் நாற்றுகள் நீரில் மூழ்கி அழுகும் அபாயம்.`,
        thresholdNote: 'Constraint: Never transplant before >= 115.6 mm day',
      };
    } else if (rain7Days < INDIA_THRESHOLDS.sow.minRain7DaysMm) {
      sowResult = {
        id: 'sow',
        title: 'Sow / transplant this week?',
        titleTa: 'இந்த வாரம் நடவு செய்யவா?',
        status: 'amber',
        icon: 'pause',
        verdictEn: 'WAIT - TOO DRY',
        verdictTa: 'ஈரப்பதம் போதாது',
        shortEn: `WAIT: 7-day rain is ${rain7Days}mm (min 25mm needed).`,
        shortTa: `காத்திருக்கவும்: 7 நாள் மழை ${rain7Days} மிமீ மட்டுமே.`,
        reasonEn: `Cumulative 7-day rain is ${rain7Days} mm, below the recommended 25 mm threshold. Ensure supplementary irrigation or wait for rain.`,
        reasonTa: `7 நாள் மழை ${rain7Days} மிமீ மட்டுமே (குறைந்தது 25 மிமீ தேவை). போதிய ஈரப்பதம் வரும் வரை காத்திருக்கவும்.`,
        thresholdNote: 'Target: 25 - 100 mm 7-day rain',
      };
    } else if (rain7Days > INDIA_THRESHOLDS.sow.maxRain7DaysMm) {
      sowResult = {
        id: 'sow',
        title: 'Sow / transplant this week?',
        titleTa: 'இந்த வாரம் நடவு செய்யவா?',
        status: 'red',
        icon: 'alert',
        verdictEn: 'WAIT - WATERLOGGING',
        verdictTa: 'வெள்ள அபாயம்',
        shortEn: `WAIT: Excessive rain (${rain7Days}mm) risks waterlogging.`,
        shortTa: `தவிர்க்கவும்: அதிக மழை (${rain7Days} மிமீ) தேங்கும் அபாயம்.`,
        reasonEn: `Cumulative rain is ${rain7Days} mm (> 100 mm threshold). Severe risk of nursery inundation and seed washing.`,
        reasonTa: `7 நாள் மழை ${rain7Days} மிமீ (> 100 மிமீ). வயலில் நீர் தேங்கி நாற்று அழுகும் அபாயம்.`,
        thresholdNote: 'Target: 25 - 100 mm 7-day rain',
      };
    } else {
      sowResult = {
        id: 'sow',
        title: 'Sow / transplant this week?',
        titleTa: 'இந்த வாரம் நடவு செய்யவா?',
        status: 'green',
        icon: 'check',
        verdictEn: 'YES - SOW THIS WEEK',
        verdictTa: 'நடவு செய்யலாம்',
        shortEn: `YES: Optimal rain (${rain7Days}mm) for sowing/transplanting.`,
        shortTa: `நடவு செய்யலாம்: உகந்த மழை (${rain7Days} மிமீ).`,
        reasonEn: `7-day rain forecast of ${rain7Days} mm falls right in the ideal 25–100 mm moisture window without extreme storm events.`,
        reasonTa: `7 நாள் மழை ${rain7Days} மிமீ உகந்த 25-100 மிமீ வரம்பில் உள்ளது. பயிர் நடவுக்கு ஏற்ற சூழல்.`,
        thresholdNote: 'Optimal: 25 - 100 mm moisture band',
      };
    }
  }

  // 4. Soil amendment?
  let soilResult: DecisionResult;
  const meanPh = soil?.topsoilSummary?.meanPh ?? 8.0;

  if (meanPh > INDIA_THRESHOLDS.soilAmendment.alkalineGypsumCutoffPh) {
    soilResult = {
      id: 'soilAmendment',
      title: 'Soil amendment?',
      titleTa: 'மண் சீர்திருத்தம் தேவையா?',
      status: 'amber',
      icon: 'pause',
      verdictEn: 'GYPSUM MAY HELP',
      verdictTa: 'ஜிப்சம் இடலாம்',
      shortEn: `Alkaline/sodic soil (pH ${meanPh}). Gypsum may help.`,
      shortTa: `கார மண் (pH ${meanPh}). ஜிப்சம் இடவும்.`,
      reasonEn: `Topsoil pH is ${meanPh} (> 8.5). May be alkaline/sodic: gypsum may help reduce exchangeable sodium. ${INDIA_THRESHOLDS.soilAmendment.soilHealthCardNotice}`,
      reasonTa: `மண் காரத்தன்மை pH ${meanPh} (> 8.5). ஜிப்சம் இடுவது நலம் பயக்கும். மண் பரிசோதனை அட்டை எடுத்து, ஆழ்துளை கிணற்று நீரின் உவர்ப்பையும் சோதிக்கவும்.`,
      thresholdNote: 'pH > 8.5 → Alkaline/Sodic (Gypsum)',
    };
  } else if (meanPh >= INDIA_THRESHOLDS.soilAmendment.slightlyAlkalineMinPh) {
    soilResult = {
      id: 'soilAmendment',
      title: 'Soil amendment?',
      titleTa: 'மண் சீர்திருத்தம் தேவையா?',
      status: 'green',
      icon: 'check',
      verdictEn: 'SLIGHTLY ALKALINE',
      verdictTa: 'மிதமான காரம்',
      shortEn: `Slightly alkaline (pH ${meanPh}). Select suited fertilisers.`,
      shortTa: `மிதமான காரம் (pH ${meanPh}). தகுந்த உரம் இடவும்.`,
      reasonEn: `Topsoil pH is ${meanPh} (7.5–8.5). Slightly alkaline: choose fertilisers suited to alkaline soil (e.g., ammonium sulphate, zinc sulphate). ${INDIA_THRESHOLDS.soilAmendment.soilHealthCardNotice}`,
      reasonTa: `மண் pH ${meanPh} (7.5–8.5). மிதமான காரத்தன்மை உள்ளதால் கார மண்ணிற்கு உகந்த உரங்களை தேர்ந்தெடுக்கவும். மண் பரிசோதனை அட்டை எடுக்கவும்.`,
      thresholdNote: 'pH 7.5 - 8.5 → Slightly alkaline fertilisers',
    };
  } else if (meanPh < INDIA_THRESHOLDS.soilAmendment.stronglyAcidicCutoffPh) {
    soilResult = {
      id: 'soilAmendment',
      title: 'Soil amendment?',
      titleTa: 'மண் சீர்திருத்தம் தேவையா?',
      status: 'amber',
      icon: 'alert',
      verdictEn: 'APPLY LIME BEFORE NPK',
      verdictTa: 'சுண்ணாம்பு இடவும்',
      shortEn: `Acidic soil (pH ${meanPh}). Apply lime first.`,
      shortTa: `அமில மண் (pH ${meanPh}). சுண்ணாம்பு இடவும்.`,
      reasonEn: `Topsoil pH is ${meanPh} (< 5.5). Apply lime before fertiliser to prevent phosphate lockup. ${INDIA_THRESHOLDS.soilAmendment.soilHealthCardNotice}`,
      reasonTa: `மண் pH ${meanPh} (< 5.5). உரமிடுவதற்கு முன் விவசாய சுண்ணாம்பு இடவும். மண் பரிசோதனை அட்டை பெறவும்.`,
      thresholdNote: 'pH < 5.5 → Agricultural lime',
    };
  } else {
    soilResult = {
      id: 'soilAmendment',
      title: 'Soil amendment?',
      titleTa: 'மண் சீர்திருத்தம் தேவையா?',
      status: 'green',
      icon: 'check',
      verdictEn: 'OPTIMAL PH',
      verdictTa: 'உகந்த pH அளவு',
      shortEn: `Balanced pH (${meanPh}). Standard fertilisers safe.`,
      shortTa: `சமநிலை pH (${meanPh}). வழக்கமான உரம் போதும்.`,
      reasonEn: `Topsoil pH is ${meanPh} (neutral range 5.5–7.5). Direct application of organic and mineral fertilisers is safe. ${INDIA_THRESHOLDS.soilAmendment.soilHealthCardNotice}`,
      reasonTa: `மண் pH ${meanPh} நடுநிலையானது. வழக்கமான உரங்களை பயன்படுத்தலாம். மண் பரிசோதனை அட்டை மூலம் உறுதிப்படுத்தவும்.`,
      thresholdNote: 'pH 5.5 - 7.5 → Optimal',
    };
  }

  // 5. Sell now or hold? (evaluated per crop in family profile)
  const sellMap: Record<string, DecisionResult> = {};
  const selectedCrops = profile.crops && profile.crops.length > 0 ? profile.crops : ['paddy', 'groundnut'];

  selectedCrops.forEach((cropKey) => {
    const refPrice =
      profile.referencePrices[cropKey] ||
      INDIA_THRESHOLDS.defaultReferencePrices[cropKey] ||
      2000;

    // Search mandi records for commodity matching cropKey
    const matchingRecords = (mandi?.records || []).filter((r) => {
      const commLower = (r.commodity || '').toLowerCase();
      if (cropKey === 'paddy') return commLower.includes('paddy') || commLower.includes('rice') || commLower.includes('dhan');
      if (cropKey === 'groundnut') return commLower.includes('groundnut') || commLower.includes('peanut');
      if (cropKey === 'coconut') return commLower.includes('coconut');
      if (cropKey === 'banana') return commLower.includes('banana');
      if (cropKey === 'tomato') return commLower.includes('tomato');
      if (cropKey === 'brinjal') return commLower.includes('brinjal') || commLower.includes('eggplant');
      if (cropKey === 'bhindi') return commLower.includes('bhindi') || commLower.includes('okra') || commLower.includes('ladies');
      if (cropKey === 'jasmine') return commLower.includes('jasmine') || commLower.includes('flower') || commLower.includes('malli');
      return commLower.includes(cropKey);
    });

    // If no matching records exist in the feed or snapshot
    if (matchingRecords.length === 0) {
      const errStatus = mandi?.errorCode || (mandi?.error ? 'error' : 'no_data');
      sellMap[cropKey] = {
        id: `sell_${cropKey}`,
        title: `Sell ${cropKey.toUpperCase()} now?`,
        titleTa: `${cropKey} விற்கலாமா?`,
        status: 'amber',
        icon: 'pause',
        verdictEn: 'PRICES UNAVAILABLE',
        verdictTa: 'விலை விபரம் இல்லை',
        shortEn: `Prices unavailable: data.gov.in error ${errStatus}.`,
        shortTa: `விலை கிடைக்கவில்லை (பிழை ${errStatus}).`,
        reasonEn: `Market prices unavailable right now (data.gov.in error ${errStatus}). Family target price is ₹${refPrice}/qtl. Never showing sample prices.`,
        reasonTa: `சந்தை விலை தகவல் தற்போது கிடைக்கவில்லை (data.gov.in பிழை ${errStatus}). குடும்ப இலக்கு விலை ₹${refPrice}/குவிண்டால். மாதிரி விலைகள் காட்டப்படவில்லை.`,
        thresholdNote: `Target Ref Price: ₹${refPrice}/qtl | Live price unavailable`,
      };
      return;
    }

    // Check user chosen markets first if available
    let bestRecord = matchingRecords[0];
    if (matchingRecords.length > 1) {
      bestRecord = matchingRecords.reduce((max, r) => (r.modal_price > max.modal_price ? r : max), matchingRecords[0]);
    }

    const modalPrice = bestRecord?.modal_price || refPrice;
    const marketName = bestRecord?.market || 'Koyambedu / Regional Mandi';
    const isStateWide = Boolean(bestRecord?.isStateWide);
    const diff = modalPrice - refPrice;
    const shouldSell = modalPrice >= refPrice;

    sellMap[cropKey] = {
      id: `sell_${cropKey}`,
      title: `Sell ${cropKey.toUpperCase()} now?`,
      titleTa: `${cropKey} விற்கலாமா?`,
      status: shouldSell ? 'green' : 'amber',
      icon: shouldSell ? 'check' : 'pause',
      verdictEn: shouldSell ? 'SELL NOW' : 'HOLD',
      verdictTa: shouldSell ? 'விற்கலாம்' : 'காத்திருக்கவும்',
      shortEn: shouldSell
        ? `SELL: ₹${modalPrice}/qtl at ${marketName.slice(0, 15)} (diff +₹${diff}).`
        : `HOLD: ₹${modalPrice}/qtl is below target ₹${refPrice}.`,
      shortTa: shouldSell
        ? `விற்கலாம்: குவிண்டால் ₹${modalPrice} (+₹${diff}).`
        : `காத்திருக்கவும்: விலை ₹${modalPrice} இலக்கை விட குறைவு.`,
      reasonEn: shouldSell
        ? `Today's modal price at ${marketName} is ₹${modalPrice}/qtl (₹${diff} above family target of ₹${refPrice}/qtl). ${isStateWide ? 'Note: State-wide price, not local.' : ''} Price guide only, not financial advice.`
        : `Today's modal price at ${marketName} is ₹${modalPrice}/qtl (₹${Math.abs(diff)} below family target of ₹${refPrice}/qtl). Consider holding if storage allows. Price guide only, not financial advice.`,
      reasonTa: shouldSell
        ? `${marketName} மண்டியில் இன்றைய விலை ₹${modalPrice}/குவிண்டால் (இலக்கை விட +₹${diff} அதிகம்). ${isStateWide ? 'மாநில சராசரி விலை.' : ''} இது விலை வழிகாட்டி மட்டுமே.`
        : `${marketName} மண்டியில் இன்றைய விலை ₹${modalPrice}/குவிண்டால் (இலக்கை விட -₹${Math.abs(diff)} குறைவு). சேமித்து விற்கலாம். இது விலை வழிகாட்டி மட்டுமே.`,
      thresholdNote: `Target Ref Price: ₹${refPrice}/qtl | Modal: ₹${modalPrice}/qtl`,
    };
  });

  // 6. Harvest window
  const dryDays = weather?.consecutiveDryDays ?? 3;
  const hasDryWindow = dryDays >= INDIA_THRESHOLDS.harvest.consecutiveDryDaysRunThreshold;
  const paddyInfo = getPaddyStageInfo(profile.paddySowingDate);

  let harvestResult: DecisionResult;
  if (!weather) {
    harvestResult = {
      id: 'harvest',
      title: 'Harvest window',
      titleTa: 'அறுவடைக்கு உகந்த காலமா?',
      status: 'amber',
      icon: 'pause',
      verdictEn: 'CHECKING',
      verdictTa: 'சரிபார்க்கவும்',
      shortEn: 'Checking rain forecast for 3+ dry days.',
      shortTa: '3+ வறண்ட நாட்கள் உள்ளதா என சோதிக்கப்படுகிறது.',
      reasonEn: 'Awaiting dry run analysis.',
      reasonTa: 'வறண்ட நாட்கள் ஆய்வு செய்யப்படுகிறது.',
      thresholdNote: 'Criteria: 3+ consecutive dry days (< 2 mm/day)',
    };
  } else if (hasDryWindow) {
    harvestResult = {
      id: 'harvest',
      title: 'Harvest window',
      titleTa: 'அறுவடைக்கு உகந்த காலமா?',
      status: 'green',
      icon: 'check',
      verdictEn: 'DRY WINDOW OPEN',
      verdictTa: 'அறுவடைக்கு ஏற்ற சூழல்',
      shortEn: `OPEN: ${dryDays} consecutive dry days forecast (< 2mm/day).`,
      shortTa: `சாதகமானது: ${dryDays} நாட்கள் மழை இல்லை (< 2மிமீ).`,
      reasonEn: `A clean dry run of ${dryDays} consecutive days (< 2 mm/day) is forecast. Excellent window for grain drying, thresher movement, and field operations.${paddyInfo ? ` Paddy crop stage: ${paddyInfo.stage}.${paddyInfo.isSambaHarvestOpportunity ? ' Prime Samba harvest window!' : ''}` : ''}`,
      reasonTa: `அடுத்த ${dryDays} நாட்கள் தொடர்ச்சியாக வறண்ட வானிலை (< 2 மிமீ) இருக்கும். அறுவடை மற்றும் தானிய உலர்த்தலுக்கு உகந்தது.${paddyInfo ? ` நெல் பருவம்: ${paddyInfo.stageTa}.${paddyInfo.isSambaHarvestOpportunity ? ' சம்பா அறுவடைக்கு சிறந்த தருணம்!' : ''}` : ''}`,
      thresholdNote: 'Dry window: 3+ consecutive days with < 2 mm rain',
    };
  } else {
    harvestResult = {
      id: 'harvest',
      title: 'Harvest window',
      titleTa: 'அறுவடைக்கு உகந்த காலமா?',
      status: 'amber',
      icon: 'pause',
      verdictEn: 'NO DRY RUN',
      verdictTa: 'தொடர் மழை வாய்ப்பு',
      shortEn: 'HOLD: Intermittent rain ahead; lacks 3 dry days.',
      shortTa: 'காத்திருக்கவும்: தொடர் வறண்ட நாட்கள் இல்லை.',
      reasonEn: `Forecast lacks a 3-day dry sequence (< 2 mm/day). Wet soil will hinder harvesters and cause grain moisture spoiling.${paddyInfo ? ` Paddy stage: ${paddyInfo.stage}.` : ''}`,
      reasonTa: `அடுத்த சில நாட்களில் 3 தொடர் வறண்ட நாட்கள் இல்லை. ஈரப்பதம் அதிகமாக இருப்பதால் அறுவடை இயந்திரங்களை இறக்க வேண்டாம்.${paddyInfo ? ` நெல் பருவம்: ${paddyInfo.stageTa}.` : ''}`,
      thresholdNote: 'Requires: >= 3 consecutive days with < 2 mm rain',
    };
  }

  // 7. Rain and Wind Alerts (IMD categories)
  const alerts: DecisionResult[] = [];
  if (weather && weather.daily.length > 0) {
    weather.daily.forEach((d) => {
      if (d.alertLevel !== 'normal') {
        const isWind = d.alertLevel === 'wind';
        const color = d.alertLevel === 'dark_red' ? 'red' : d.alertLevel === 'red' ? 'red' : 'amber';

        alerts.push({
          id: `alert_${d.date}`,
          title: `IMD ${d.alertTitle} on ${d.formattedDate}`,
          titleTa: `${d.formattedDate} அன்று ${d.alertTitle}`,
          status: color,
          icon: 'alert',
          verdictEn: d.alertTitle || 'WEATHER ALERT',
          verdictTa: isWind ? 'பலத்த காற்று எச்சரிக்கை' : 'கனமழை எச்சரிக்கை',
          shortEn: `ALERT: ${d.alertTitle} expected on ${d.formattedDate}.`,
          shortTa: `எச்சரிக்கை: ${d.formattedDate} அன்று ${isWind ? 'பலத்த காற்று' : 'கனமழை'}.`,
          reasonEn: `${d.alertTitle} forecast (${isWind ? `${d.windSpeedMaxKmH} km/h` : `${d.precipitationSumMm} mm rain`}). ${INDIA_THRESHOLDS.imdAlerts.disclaimer}`,
          reasonTa: `${isWind ? `${d.windSpeedMaxKmH} கிமீ/மணி காற்று` : `${d.precipitationSumMm} மிமீ மழை`} எதிர்பார்க்கப்படுகிறது. ${INDIA_THRESHOLDS.imdAlerts.disclaimer}`,
          thresholdNote: 'IMD Alert Categories (Chennai Region)',
          detailsEn: d.alertActions?.join('; '),
          detailsTa: isWind
            ? 'வாழை மற்றும் இளம் தென்னை மரங்களுக்கு முட்டு கொடுக்கவும்.'
            : 'வடிகால்களை தூர்வாரவும்; நெல், உர மூட்டைகளை மேடான பகுதிக்கு மாற்றவும்; பம்ப் மோட்டாரை பாதுகாக்கவும்.',
        });
      }
    });
  }

  return {
    irrigate: irrigateResult,
    spray: sprayResult,
    sow: sowResult,
    soilAmendment: soilResult,
    sell: sellMap,
    harvest: harvestResult,
    alerts,
  };
}
