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
  limeDecision: string;
  plantingDecision: string;
  satelliteDecision: string;
  language: 'en' | 'sw';
}

export async function generateAdvisory(params: GenerateAdvisoryParams): Promise<{
  text: string;
  language: 'en' | 'sw';
  wordCount: number;
  generatedBy: string;
}> {
  const ai = getGenAIClient();

  const isSwahili = params.language === 'sw';

  // Construct prompt strictly grounded in provided data
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

DECISION RULE RESULTS:
1. Apply Lime before NPK: "${params.limeDecision}"
2. Plant this week: "${params.plantingDecision}"
3. Fresh satellite view available: "${params.satelliteDecision}"
`;

  const systemInstruction = `You are FarmSense, an agronomy decision assistant for smallholder farmers.
Turn the provided numbers and decision rule results into a clear, direct, actionable advisory of MAXIMUM 80 WORDS.
CRITICAL CONSTRAINTS:
1. You MUST ONLY explain the rule results and exact numbers provided above. DO NOT invent, extrapolate, or hallucinate any numbers or metrics.
2. Target audience is smallholder farmers. Keep sentences crisp, friendly, and practical.
3. If language is Swahili ('sw'), write in clear, natural Kiswahili spoken across Kenya and East Africa.
4. If language is English ('en'), write in plain, accessible English without overly academic jargon.
5. Max length: 80 words. Be concise.`;

  if (ai) {
    try {
      const prompt = isSwahili
        ? `Tengeneza ujumbe mfupi wa ushauri wa kilimo (maneno yasiyozidi 80) kwa mkulima katika lugha ya Kiswahili kulingana na data hii tu bila kubuni nambari:\n${dataContext}`
        : `Generate a concise farm advisory (maximum 80 words) for the farmer based strictly on these verified numbers and decisions:\n${dataContext}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2, // Low temperature for high factual adherence
        },
      });

      const text = response.text?.trim() || '';
      if (text) {
        const words = text.split(/\s+/).filter(Boolean);
        return {
          text,
          language: params.language,
          wordCount: words.length,
          generatedBy: 'gemini-3.8-flash',
        };
      }
    } catch (err: any) {
      console.warn('Gemini advisory call failed, generating deterministic fallback:', err.message);
    }
  }

  // Deterministic rule-grounded fallback advisory (exact numbers, max 80 words)
  let fallbackText = '';
  if (isSwahili) {
    if (params.limeDecision.toLowerCase().includes('lime') || (params.soilPh && params.soilPh < 5.5)) {
      fallbackText = `Ushauri wa Shamba: Udongo una asidi kali (pH ${params.soilPh?.toFixed(1) || 'chini ya 5.5'}). Weka chokaa cha kilimo kabla ya mbolea ya NPK ili virutubisho visipotee. ${
        params.totalRain7DaysMm && params.totalRain7DaysMm >= 20
          ? `Mvua ya siku 7 inatarajiwa kuwa mm ${params.totalRain7DaysMm.toFixed(0)}, nzuri kwa kuanza kazi ya shamba.`
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
    if (params.limeDecision.toLowerCase().includes('lime') || (params.soilPh && params.soilPh < 5.5)) {
      fallbackText = `Farm Advisory: Topsoil is acidic at pH ${params.soilPh?.toFixed(2) || '< 5.5'}. Apply agricultural lime before NPK fertilizer to prevent nutrient lockup. ${
        params.totalRain7DaysMm && params.totalRain7DaysMm >= 20
          ? `Forecast shows ${params.totalRain7DaysMm.toFixed(1)} mm rain ahead—good moisture, but treat soil acidity first.`
          : `Wait on planting: 7-day rain is only ${params.totalRain7DaysMm?.toFixed(1) || 'low'} mm (20 mm recommended).`
      } Recent Sentinel-2 scene cloud cover is ${params.satelliteCloudCoverPercent?.toFixed(0) || '0'}%.`;
    } else {
      fallbackText = `Farm Advisory: Soil pH is favorable at ${params.soilPh?.toFixed(2) || 'optimal'}. Lime is not required before fertilizer. ${
        params.totalRain7DaysMm && params.totalRain7DaysMm >= 20
          ? `Conditions are green: ${params.totalRain7DaysMm.toFixed(1)} mm rain forecast over 7 days allows planting this week.`
          : `Hold planting: forecast rain is ${params.totalRain7DaysMm?.toFixed(1) || '0'} mm, below the 20 mm threshold.`
      } Latest satellite pass has ${params.satelliteCloudCoverPercent?.toFixed(0) || '0'}% cloud cover.`;
    }
  }

  const words = fallbackText.split(/\s+/).filter(Boolean);
  return {
    text: fallbackText,
    language: params.language,
    wordCount: words.length,
    generatedBy: 'deterministic-rules',
  };
}
