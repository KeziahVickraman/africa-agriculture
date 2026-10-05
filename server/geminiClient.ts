import { GoogleGenAI } from '@google/genai';

// Initialize Gemini with server-side API key and User-Agent telemetry
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GenerateAdvisoryParams {
  locationName: string;
  coords: { lat: number; lon: number };
  soilPh?: number;
  nitrogen?: number;
  organicCarbon?: number;
  texture?: string;
  totalRain7DaysMm?: number;
  satelliteCloudCoverPercent?: number;
  satelliteDate?: string;
  limeDecision?: string;
  plantingDecision?: string;
  satelliteDecision?: string;
  language: 'en' | 'sw' | 'ta';
  region?: 'africa' | 'india';
  indiaDecisionsSummary?: string; // Summary of irrigate, spray, sow, soil, sell, harvest, alerts
}

// In-memory advisory cache to eliminate duplicate network calls
const advisoryCache = new Map<string, { text: string; language: 'en' | 'sw' | 'ta'; wordCount: number; generatedBy: string }>();

// Quota exhaustion cooldown tracking (timestamp ms)
let quotaExhaustedUntil = 0;

export async function generateAdvisory(params: GenerateAdvisoryParams): Promise<{
  text: string;
  language: 'en' | 'sw' | 'ta';
  wordCount: number;
  generatedBy: string;
}> {
  const isTamil = params.language === 'ta';
  const isSwahili = params.language === 'sw';
  const isIndia = params.region === 'india' || isTamil;
  const maxWords = isIndia ? 60 : 80;

  // Build cache key based on coordinates, language, and core inputs
  const cacheKey = `${params.coords.lat.toFixed(3)}_${params.coords.lon.toFixed(3)}_${params.language}_${params.soilPh?.toFixed(1) || '0'}_${params.totalRain7DaysMm?.toFixed(0) || '0'}_${params.satelliteCloudCoverPercent?.toFixed(0) || '0'}_${params.indiaDecisionsSummary ? params.indiaDecisionsSummary.slice(0, 30) : ''}`;

  if (advisoryCache.has(cacheKey)) {
    return advisoryCache.get(cacheKey)!;
  }

  // If currently in a 429 quota cooldown, immediately use the deterministic advisory generator
  const isQuotaCoolingDown = Date.now() < quotaExhaustedUntil;
  const ai = !isQuotaCoolingDown ? getGenAIClient() : null;

  const dataContext = `
LOCATION: ${params.locationName} (Lat ${params.coords.lat.toFixed(3)}, Lon ${params.coords.lon.toFixed(3)})
SOIL DATA:
- Topsoil pH: ${params.soilPh != null ? params.soilPh.toFixed(2) : 'Not available'}
- Total Nitrogen: ${params.nitrogen != null ? `${params.nitrogen} g/kg` : 'Not available'}
- Organic Carbon: ${params.organicCarbon != null ? `${params.organicCarbon} g/kg` : 'Not available'}
- Soil Texture: ${params.texture || 'Not available'}

WEATHER FORECAST:
- Next 7 Days Cumulative Rain: ${params.totalRain7DaysMm != null ? `${params.totalRain7DaysMm.toFixed(1)} mm` : 'Not available'}

SATELLITE SCENE (Sentinel-2):
- Recent Cloud Cover: ${params.satelliteCloudCoverPercent != null ? `${params.satelliteCloudCoverPercent.toFixed(1)}%` : 'Not available'}
- Scene Date: ${params.satelliteDate || 'Not available'}

DECISIONS SUMMARY:
${params.indiaDecisionsSummary || `
1. Apply Lime: "${params.limeDecision || 'N/A'}"
2. Plant this week: "${params.plantingDecision || 'N/A'}"
3. Satellite view: "${params.satelliteDecision || 'N/A'}"
`}
`;

  const systemInstruction = `You are FarmSense, an agronomy decision assistant for family farmers.
Turn the provided numbers and decision rule results into a clear, direct, actionable daily advisory of MAXIMUM ${maxWords} WORDS.
CRITICAL CONSTRAINTS:
1. You MUST ONLY explain the rule results and exact numbers provided above. DO NOT invent, extrapolate, or hallucinate any numbers, prices, or weather warnings.
2. Target audience is a smallholder family farming. Keep sentences crisp, friendly, and practical.
3. If language is Tamil ('ta'), write in clear, natural Tamil (தமிழ்).
4. If language is Swahili ('sw'), write in clear, natural Kiswahili.
5. If language is English ('en'), write in plain, accessible English.
6. Max length: strictly under ${maxWords} words. Be concise.`;

  if (ai) {
    const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash'];

    for (const model of modelsToTry) {
      try {
        let prompt = `Generate a concise farm advisory (maximum ${maxWords} words) based strictly on these verified numbers and decisions:\n${dataContext}`;
        if (isTamil) {
          prompt = `இந்த தகவல்களின் அடிப்படையில் விவசாயிக்கு சுருக்கமான தினசரி ஆலோசனை (அதிகபட்சம் ${maxWords} வார்த்தைகள்) தமிழில் எழுதவும். எண்களையோ விலையையோ சொந்தமாக உருவாக்க வேண்டாம்:\n${dataContext}`;
        } else if (isSwahili) {
          prompt = `Tengeneza ujumbe mfupi wa ushauri wa kilimo (maneno yasiyozidi ${maxWords}) kwa mkulima katika lugha ya Kiswahili kulingana na data hii tu bila kubuni nambari:\n${dataContext}`;
        }

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });

        const text = response.text?.trim() || '';
        if (text) {
          const words = text.split(/\s+/).filter(Boolean);
          const result = {
            text,
            language: params.language,
            wordCount: words.length,
            generatedBy: model,
          };
          advisoryCache.set(cacheKey, result);
          return result;
        }
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        const isQuotaErr = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded');
        if (isQuotaErr) {
          quotaExhaustedUntil = Date.now() + 60 * 60 * 1000;
          break;
        }
      }
    }
  }

  // Deterministic rule-grounded fallback advisory
  let fallbackText = '';
  if (isTamil) {
    if (params.soilPh && params.soilPh > 8.5) {
      fallbackText = `இன்றைய பண்ணை ஆலோசனை: நிலத்தின் காரத்தன்மை pH ${params.soilPh.toFixed(1)} ஆக உள்ளது (ஜிப்சம் தேவைப்படலாம்). ${
        params.totalRain7DaysMm && params.totalRain7DaysMm >= 10
          ? `அடுத்த 7 நாட்களில் ${params.totalRain7DaysMm.toFixed(0)} மிமீ மழை வாய்ப்புள்ளது; பாசனம் தவிர்க்கவும்.`
          : 'மழை வாய்ப்பு குறைவு; பயிருக்கு தேவையான பாசனம் செய்யவும்.'
      } மண் பரிசோதனை அட்டை மூலம் உறுதிப்படுத்தவும்.`;
    } else {
      fallbackText = `இன்றைய பண்ணை ஆலோசனை: நிலத்தின் pH ${params.soilPh?.toFixed(1) || '8.0'} சாதகமாக உள்ளது. ${
        params.totalRain7DaysMm && params.totalRain7DaysMm >= 25
          ? `7 நாள் மழை ${params.totalRain7DaysMm.toFixed(0)} மிமீ எதிர்பார்க்கப்படுகிறது; நடவுக்கு சாதகமான ஈரப்பதம்.`
          : `7 நாள் மழை ${params.totalRain7DaysMm?.toFixed(0) || '0'} மிமீ மட்டுமே; போதிய ஈரப்பதம் வரும்வரை காத்திருக்கவும்.`
      } மண்டியில் நல்ல விலையை ஒப்பிட்டு விற்கவும்.`;
    }
  } else if (isSwahili) {
    if (params.limeDecision?.toLowerCase().includes('lime') || (params.soilPh && params.soilPh < 5.5)) {
      fallbackText = `Ushauri wa Shamba: Udongo una asidi kali (pH ${params.soilPh?.toFixed(1) || 'chini ya 5.5'}). Weka chokaa cha kilimo kabla ya mbolea ya NPK ili virutubisho visipotee. ${
        params.totalRain7DaysMm && params.totalRain7DaysMm >= 20
          ? `Mvua ya siku 7 inatarajiwa kuwa mm ${params.totalRain7DaysMm.toFixed(0)}, nzuri kuanza kazi ya shamba.`
          : `Mvua ya siku 7 ni mm ${params.totalRain7DaysMm?.toFixed(0) || '0'}, subiri unyevu wa kutosha kabla ya kupanda.`
      } Picha ya satelaiti ina mawingu ya ${params.satelliteCloudCoverPercent?.toFixed(0) || '0'}%.`;
    } else {
      fallbackText = `Ushauri wa Shamba: Udongo wako uko katika kiwango bora (pH ${params.soilPh?.toFixed(1) || 'salama'}), chokaa haihitajiki sasa. ${
        params.totalRain7DaysMm && params.totalRain7DaysMm >= 20
          ? `Mvua ya siku 7 inakadiriwa kuwa mm ${params.totalRain7DaysMm.toFixed(0)}; unaweza kupanda wiki hii.`
          : `Mvua ya siku 7 ni mm ${params.totalRain7DaysMm?.toFixed(0) || '0'}; subiri mvua ifikie mm 20 kabla ya kupanda.`
      } Satelaiti inaonyesha mawingu ya ${params.satelliteCloudCoverPercent?.toFixed(0) || '0'}%.`;
    }
  } else {
    // English
    if (isIndia) {
      fallbackText = `Farm Advisory: Topsoil pH is ${params.soilPh?.toFixed(1) || '8.0'} (${params.soilPh && params.soilPh > 8.5 ? 'sodic/alkaline; gypsum may help' : 'slightly alkaline'}). ${
        params.totalRain7DaysMm && params.totalRain7DaysMm >= 10
          ? `Next 7-day rain is ${params.totalRain7DaysMm.toFixed(1)} mm; hold off routine irrigation.`
          : `Dry weather ahead (${params.totalRain7DaysMm?.toFixed(1) || '0'} mm rain); proceed with scheduled irrigation.`
      } Check mandi prices before selling.`;
    } else {
      fallbackText = `Farm Advisory: Topsoil pH is ${params.soilPh?.toFixed(2) || 'optimal'}. ${
        params.totalRain7DaysMm && params.totalRain7DaysMm >= 20
          ? `Forecast shows ${params.totalRain7DaysMm.toFixed(1)} mm rain ahead—good moisture for field operations.`
          : `7-day rain is only ${params.totalRain7DaysMm?.toFixed(1) || 'low'} mm (20 mm recommended).`
      } Recent Sentinel-2 scene cloud cover is ${params.satelliteCloudCoverPercent?.toFixed(0) || '0'}%.`;
    }
  }

  const words = fallbackText.split(/\s+/).filter(Boolean);
  const result = {
    text: fallbackText,
    language: params.language,
    wordCount: words.length,
    generatedBy: 'advisory-rules',
  };

  advisoryCache.set(cacheKey, result);
  return result;
}
