/**
 * Utility functions for South India - Tamil Nadu FarmSense
 * Formats dates in Asia/Kolkata (DD/MM/YYYY), speech synthesis, and monsoon detection
 */

export function formatDateIST(dateInput: string | Date | number): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    // Format in Asia/Kolkata timezone
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return formatter.format(d); // returns DD/MM/YYYY
  } catch {
    return String(dateInput);
  }
}

export function formatTimeIST(dateInput: string | Date | number): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';

    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(d);
  } catch {
    return '';
  }
}

export function getTodayFormattedIST(): string {
  return formatDateIST(new Date());
}

/**
 * Northeast monsoon season in Tamil Nadu:
 * 1 October to 31 December
 */
export function isNortheastMonsoonSeason(date: Date = new Date()): boolean {
  try {
    // Get month in Asia/Kolkata timezone
    const istString = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    const month = istDate.getMonth(); // 0-indexed: 9 = Oct, 10 = Nov, 11 = Dec
    return month >= 9 && month <= 11;
  } catch {
    const m = date.getMonth();
    return m >= 9 && m <= 11;
  }
}

/**
 * Text-to-Speech using Web Speech API:
 * Prefers 'ta-IN' voice. If no Tamil voice exists on the client device,
 * falls back to reading the English text aloud.
 */
export function speakDecisionAudio(tamilText: string, englishText: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const voices = window.speechSynthesis.getVoices();
      const tamilVoice = voices.find((v) => v.lang === 'ta-IN' || v.lang.startsWith('ta'));

      const textToSpeak = tamilVoice ? tamilText : englishText;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      if (tamilVoice) {
        utterance.voice = tamilVoice;
        utterance.lang = 'ta-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Estimate Samba paddy crop stage based on sowing date
 */
export function getPaddyStageInfo(sowingDateStr?: string): { stage: string; stageTa: string; days: number; isSambaHarvestOpportunity: boolean } | null {
  if (!sowingDateStr) return null;

  try {
    const sow = new Date(sowingDateStr);
    if (isNaN(sow.getTime())) return null;

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - sow.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const nowMonth = now.getMonth(); // 11 = Dec, 0 = Jan
    const nowDate = now.getDate();
    const isMidDecToJan = (nowMonth === 11 && nowDate >= 15) || nowMonth === 0;

    let stage = 'Nursery / Seedling (0-25 days)';
    let stageTa = 'நாற்றங்கால் பருவம் (0-25 நாட்கள்)';
    let isSambaHarvestOpportunity = false;

    if (days >= 120) {
      stage = 'Maturity / Harvest Stage (120+ days)';
      stageTa = 'முதிர்வு / அறுவடை பருவம் (120+ நாட்கள்)';
      isSambaHarvestOpportunity = true;
    } else if (days >= 90) {
      stage = 'Grain Filling / Ripening (90-120 days)';
      stageTa = 'பால் பிடிக்கும் / கதிர் முதிர்ச்சி (90-120 நாட்கள்)';
      isSambaHarvestOpportunity = isMidDecToJan;
    } else if (days >= 60) {
      stage = 'Panicle Initiation & Flowering (60-90 days)';
      stageTa = 'கதிர் உருவாக்கம் / பூக்கும் பருவம் (60-90 நாட்கள்)';
    } else if (days >= 25) {
      stage = 'Tillering & Vegetative Growth (25-60 days)';
      stageTa = 'தூர்கட்டும் பருவம் (25-60 நாட்கள்)';
    }

    return { stage, stageTa, days, isSambaHarvestOpportunity };
  } catch {
    return null;
  }
}
