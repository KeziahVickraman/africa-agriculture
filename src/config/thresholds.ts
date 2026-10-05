export interface ThresholdConfig {
  lime: {
    stronglyAcidicCutoff: number; // default 5.5: below this, recommend lime
    moderatelyAcidicCutoff: number; // default 6.0: 5.5 to 6.0 = monitor, > 6.0 = not needed
  };
  planting: {
    minRain7DaysMm: number; // default 20.0 mm
    minSoilPh: number; // default 5.5: soil must not be strongly acidic (< 5.5)
  };
  satellite: {
    maxCloudCoverPercent: number; // default 20%: below this = fresh view available
    maxSearchDays: number; // default 30 days
  };
  cropPresetName: string;
}

export const CROP_PRESETS: Record<string, ThresholdConfig> = {
  maize_east_africa: {
    cropPresetName: 'Maize (East Africa / Rift Valley Standard)',
    lime: {
      stronglyAcidicCutoff: 5.5,
      moderatelyAcidicCutoff: 6.0,
    },
    planting: {
      minRain7DaysMm: 20.0,
      minSoilPh: 5.5,
    },
    satellite: {
      maxCloudCoverPercent: 20.0,
      maxSearchDays: 30,
    },
  },
  beans_legumes: {
    cropPresetName: 'Common Beans & Legumes (High pH Sensitivity)',
    lime: {
      stronglyAcidicCutoff: 5.8,
      moderatelyAcidicCutoff: 6.3,
    },
    planting: {
      minRain7DaysMm: 25.0,
      minSoilPh: 5.8,
    },
    satellite: {
      maxCloudCoverPercent: 20.0,
      maxSearchDays: 30,
    },
  },
  tea_coffee: {
    cropPresetName: 'Tea & Coffee (Acid Tolerant Highlands)',
    lime: {
      stronglyAcidicCutoff: 4.8,
      moderatelyAcidicCutoff: 5.4,
    },
    planting: {
      minRain7DaysMm: 30.0,
      minSoilPh: 4.8,
    },
    satellite: {
      maxCloudCoverPercent: 25.0,
      maxSearchDays: 30,
    },
  },
  india_monsoon_kharif: {
    cropPresetName: 'Indian Kharif / Monsoon Farmhouse (Phase 2)',
    lime: {
      stronglyAcidicCutoff: 5.6,
      moderatelyAcidicCutoff: 6.2,
    },
    planting: {
      minRain7DaysMm: 35.0,
      minSoilPh: 5.6,
    },
    satellite: {
      maxCloudCoverPercent: 25.0,
      maxSearchDays: 30,
    },
  },
};

export const DEFAULT_THRESHOLDS: ThresholdConfig = CROP_PRESETS.maize_east_africa;

export function evaluateDecisions(
  soilPh: number | null | undefined,
  totalRain7DaysMm: number | null | undefined,
  latestSceneCloudCover: number | null | undefined,
  latestSceneDate: string | null | undefined,
  config: ThresholdConfig = DEFAULT_THRESHOLDS
) {
  // 1. Lime recommendation rule
  let limeStatus: 'green' | 'amber' | 'red' = 'green';
  let limeVerdict = 'Not needed';
  let limeRecommendation = 'No lime required prior to NPK.';
  let limeReason = 'Soil pH is sufficient for optimal fertilizer uptake.';
  let limeDetails = `pH > ${config.lime.moderatelyAcidicCutoff.toFixed(1)}: Soil is slightly acidic to neutral. High NPK nutrient availability.`;

  if (soilPh == null || isNaN(soilPh)) {
    limeStatus = 'amber';
    limeVerdict = 'Pending soil test';
    limeRecommendation = 'Soil pH data not yet retrieved.';
    limeReason = 'Awaiting laboratory or satellite iSDA soil property scan.';
    limeDetails = 'Testing ensures you do not waste fertilizer on acidic soils.';
  } else if (soilPh < config.lime.stronglyAcidicCutoff) {
    limeStatus = 'red';
    limeVerdict = 'Recommend lime before NPK';
    limeRecommendation = 'Apply agricultural lime 2-4 weeks prior to planting and NPK application.';
    limeReason = `Topsoil pH is ${soilPh.toFixed(2)}, which is below the critical ${config.lime.stronglyAcidicCutoff} threshold.`;
    limeDetails = 'Phosphorus and Nitrogen are chemically fixed and locked out in strongly acidic soil (pH < 5.5). Lime neutralizes aluminium toxicity and restores fertilizer efficiency.';
  } else if (soilPh <= config.lime.moderatelyAcidicCutoff) {
    limeStatus = 'amber';
    limeVerdict = 'Monitor soil closely';
    limeRecommendation = 'Lime optional this season, but monitor for acidifying fertilizers (like DAP/Urea).';
    limeReason = `Topsoil pH is ${soilPh.toFixed(2)} (moderately acidic: ${config.lime.stronglyAcidicCutoff}-${config.lime.moderatelyAcidicCutoff}).`;
    limeDetails = 'Consider applying agricultural dolomitic lime or organic compost at lower maintenance dosage before heavy inorganic nitrogen applications.';
  } else {
    limeStatus = 'green';
    limeVerdict = 'Lime not needed';
    limeRecommendation = 'Safe to apply standard basal and top-dressing fertilizers directly.';
    limeReason = `Topsoil pH is ${soilPh.toFixed(2)} (optimal range above ${config.lime.moderatelyAcidicCutoff}).`;
    limeDetails = 'Macronutrients (N, P, K) will be readily available in root zone without chemical fixation.';
  }

  // 2. Planting this week rule
  let plantingStatus: 'green' | 'amber' | 'red' = 'green';
  let plantingVerdict = 'YES - Plant this week';
  let plantingRecommendation = 'Soil moisture and pH conditions are favorable for sowing.';
  let plantingReason = '';
  let plantingDetails = '';

  const hasSufficientRain = totalRain7DaysMm != null && totalRain7DaysMm >= config.planting.minRain7DaysMm;
  const isSoilNotStronglyAcidic = soilPh == null || soilPh >= config.planting.minSoilPh;

  if (totalRain7DaysMm == null || isNaN(totalRain7DaysMm)) {
    plantingStatus = 'amber';
    plantingVerdict = 'WAIT - Weather unknown';
    plantingRecommendation = 'Await rainfall forecast update before sowing seed.';
    plantingReason = 'Rainfall forecast data unavailable.';
    plantingDetails = 'Checking 7-day cumulative precipitation prevents losing high-cost certified seed.';
  } else if (hasSufficientRain && isSoilNotStronglyAcidic) {
    plantingStatus = 'green';
    plantingVerdict = 'YES - Plant this week';
    plantingRecommendation = 'Prepare furrow lines, sow certified seed, and apply starter nutrients.';
    plantingReason = `Forecast rain is ${totalRain7DaysMm.toFixed(1)} mm (>= ${config.planting.minRain7DaysMm} mm threshold)${soilPh ? ` and soil pH is acceptable (${soilPh.toFixed(2)})` : ''}.`;
    plantingDetails = 'Adequate soil moisture expected over the next 7 days will ensure steady germination and initial root establishment.';
  } else {
    plantingStatus = 'amber';
    plantingVerdict = 'WAIT - Do not plant yet';

    const reasons: string[] = [];
    if (!hasSufficientRain) {
      reasons.push(`Insufficient 7-day forecast rain (${totalRain7DaysMm.toFixed(1)} mm, min ${config.planting.minRain7DaysMm} mm needed)`);
    }
    if (!isSoilNotStronglyAcidic && soilPh != null) {
      reasons.push(`Soil strongly acidic (pH ${soilPh.toFixed(2)} < ${config.planting.minSoilPh})`);
      plantingStatus = 'red';
    }

    plantingReason = reasons.join(' and ') + '.';
    plantingRecommendation = !hasSufficientRain
      ? 'Conserve moisture and wait for the rain front to develop before risking seed.'
      : 'Apply lime to ameliorate root-zone acidity before sowing.';
    plantingDetails = !hasSufficientRain
      ? `Dry soil planting without irrigation risks patchy germination or seed desiccation. Target >= ${config.planting.minRain7DaysMm} mm cumulative rainfall.`
      : 'Root tips will scorch and fail to absorb starter phosphate in acidic soils. Ameliorate with agricultural lime first.';
  }

  // 3. Fresh satellite view rule
  let satStatus: 'green' | 'amber' | 'red' = 'green';
  let satVerdict = 'YES - Fresh view available';
  let satRecommendation = 'Clear Sentinel-2 imagery available for plot inspection.';
  let satReason = '';
  let satDetails = '';

  if (latestSceneCloudCover == null) {
    satStatus = 'amber';
    satVerdict = 'WAIT - Searching imagery';
    satRecommendation = 'Checking Digital Earth Africa catalog for Sentinel-2 cloud-free passes.';
    satReason = 'Satellite scene metadata retrieving.';
    satDetails = 'Sentinel-2 passes every 5 days over Kenya. Searching latest 30-day window.';
  } else if (latestSceneCloudCover < config.satellite.maxCloudCoverPercent) {
    satStatus = 'green';
    satVerdict = 'YES - Fresh view available';
    satRecommendation = 'Recent cloud-free Sentinel-2 pass available in Digital Earth Africa catalog.';
    satReason = `Cloud cover is ${latestSceneCloudCover.toFixed(1)}% (below ${config.satellite.maxCloudCoverPercent}% cutoff) from ${latestSceneDate || 'recent pass'}.`;
    satDetails = 'Scene has minimal cloud obstruction over plot coordinates. Suitable for optical ground validation.';
  } else {
    satStatus = 'amber';
    satVerdict = 'WAIT - Cloud obscured';
    satRecommendation = 'Latest satellite pass had high cloud obstruction. Awaiting next clear orbital pass.';
    satReason = `Cloud cover is ${latestSceneCloudCover.toFixed(1)}% (exceeds ${config.satellite.maxCloudCoverPercent}% limit) recorded on ${latestSceneDate || 'latest pass'}.`;
    satDetails = `Optical Sentinel-2 imagery requires < ${config.satellite.maxCloudCoverPercent}% cloud cover for reliable visual and multispectral assessment.`;
  }

  return {
    lime: {
      id: 'lime' as const,
      title: 'Apply lime before NPK?',
      status: limeStatus,
      verdict: limeVerdict,
      recommendation: limeRecommendation,
      reason: limeReason,
      details: limeDetails,
    },
    planting: {
      id: 'planting' as const,
      title: 'Plant this week?',
      status: plantingStatus,
      verdict: plantingVerdict,
      recommendation: plantingRecommendation,
      reason: plantingReason,
      details: plantingDetails,
    },
    satellite: {
      id: 'satellite' as const,
      title: 'Fresh satellite view available?',
      status: satStatus,
      verdict: satVerdict,
      recommendation: satRecommendation,
      reason: satReason,
      details: satDetails,
    },
  };
}
