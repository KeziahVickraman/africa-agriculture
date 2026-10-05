# FarmSense: Smallholder Farm Decision Assistant

**FarmSense** is a mobile-first web application designed for smallholder farmers. 
- **Phase 1 (Active)**: Pilot deployment in **Nakuru, Kenya** using LIVE African geo-data APIs.
- **Phase 2 (Architected & Ready)**: Swappable to an Indian farmhouse (or any global farm) via the pluggable `DataProvider` interface.

---

## Features

1. **Interactive Plot Picker**: Tap on a Leaflet map (OpenStreetMap tiles), use GPS location, or type lat/lon coordinates. Default: Nakuru, Kenya (`-0.30, 36.07`).
2. **Three Live Data Cards**:
   - **SOIL (iSDAsoil API)**: Topsoil pH, total nitrogen, organic carbon, and texture at 0–20 cm (and 20–50 cm subsoil). Raw JSON inspector included. Credit: *"Soil data: iSDA / Digital Earth Africa, CC BY 4.0"*.
   - **SATELLITE (Digital Earth Africa STAC API)**: Date and cloud cover % of the most recent Sentinel-2 scene in the last 30 days with thumbnail preview. Credit: *"Satellite data: Digital Earth Africa, CC BY 4.0"*.
   - **WEATHER (Open-Meteo)**: 7-day cumulative rainfall forecast and daily distribution bars. Credit: *"Weather data: Open-Meteo (CC BY 4.0)"*.
3. **Decisions Panel (Traffic Light Rules)**:
   - **"Apply lime before NPK?"**: Recommend lime if topsoil pH < 5.5, monitor if 5.5–6.0, not needed if > 6.0.
   - **"Plant this week?"**: YES if 7-day forecast rain ≥ 20 mm and soil is not strongly acidic; otherwise WAIT with the exact reason.
   - **"Fresh satellite view available?"**: YES if Sentinel-2 scene with < 20% cloud cover exists in the last 30 days.
   - **Tuning**: All thresholds live in `src/config/thresholds.ts` and can be adjusted interactively in the app per crop/region.
4. **Gemini Plain-Language Advisory**:
   - Formulates a max 80-word advisory understandable by smallholder farmers.
   - Strictly grounded in visible numbers and decision rules (no hallucinations).
   - Instant toggle between **English** and **Kiswahili**.
5. **Africa's Talking Sandbox SMS**:
   - "Send as SMS" button dispatches the advisory to Africa's Talking Sandbox.
   - Messages appear live in their web simulator at [https://simulator.africastalking.com](https://simulator.africastalking.com).

---

## Environment Variables

Configure these variables in `.env` (or via your hosting provider's Secrets panel):

| Variable | Description | Where to Obtain |
|---|---|---|
| `GEMINI_API_KEY` | Server-side Gemini API key (`gemini-3.8-flash`) | Google AI Studio UI (injected automatically in Studio) |
| `ISDA_EMAIL` | iSDAsoil account email | Register at [isda-africa.com](https://isda-africa.com) |
| `ISDA_PASSWORD` | iSDAsoil account password | Created during iSDA registration |
| `AT_SANDBOX_API_KEY` | Africa's Talking Sandbox API Key | [africastalking.com](https://africastalking.com) Sandbox dashboard |
| `AT_SANDBOX_USERNAME` | Sandbox username (default: `sandbox`) | Africa's Talking Sandbox (always `sandbox`) |

> **Note on Demo Mode**: If `ISDA_EMAIL` or `AT_SANDBOX_API_KEY` are not set, FarmSense automatically runs in Demo Mode with verified Nakuru pilot benchmark data and full UI functionality.

---

## 1. How to Register for iSDAsoil (Email + Password only)

1. Go to [https://isda-africa.com](https://isda-africa.com) or the [iSDA Soil API Portal](https://api.isda-africa.com).
2. Create an account providing only your **email** and **password** (no credit card required).
3. Put the email and password into your environment:
   ```bash
   ISDA_EMAIL="farmer@example.com"
   ISDA_PASSWORD="YourPasswordHere"
   ```
4. The FarmSense server (`server/isdaClient.ts`) handles JWT authentication (`POST /isdasoil/v2/login`), 1-hour token caching, and automatic token refresh on 401.

---

## 2. How to Set Up Africa's Talking Sandbox SMS

1. Sign up for a free account at [https://africastalking.com](https://africastalking.com).
2. From the main dashboard, switch to the **Sandbox** app (upper right or menu).
3. In the Sandbox sidebar, go to **Settings > API Key**.
4. Generate a new API Key:
   - **CRITICAL**: Copy the key immediately—it is shown **only once**.
   - **CRITICAL**: **Wait ~3 minutes** after generating the key before making requests; the sandbox gateway takes a few minutes to propagate the key across their authentication servers.
5. Set the key in your `.env`:
   ```bash
   AT_SANDBOX_API_KEY="your_copied_api_key_here"
   AT_SANDBOX_USERNAME="sandbox"
   ```
6. Open the Africa's Talking web simulator:
   - Go to [https://simulator.africastalking.com](https://simulator.africastalking.com).
   - Enter your test phone number (e.g., `+254712345678`).
   - Every SMS sent from FarmSense will immediately show up on this simulated phone screen!

---

## 3. How to Deploy to Vercel

FarmSense is built to deploy to Vercel with zero configuration:

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New > Project** and import this repository.
3. In the **Environment Variables** section, add:
   - `GEMINI_API_KEY`
   - `ISDA_EMAIL`
   - `ISDA_PASSWORD`
   - `AT_SANDBOX_API_KEY`
   - `AT_SANDBOX_USERNAME` (`sandbox`)
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Click **Deploy**. Vercel will build the frontend and deploy the serverless functions in `/api/soil.ts`, `/api/sms.ts`, and `/api/gemini/advisory.ts`.

---

## 4. Phase 2: Where to Add the India Provider

The data layer is completely swappable via the `DataProvider` interface located in:
- `src/services/providers/types.ts`: Interface definition (`getSoil`, `getLatestScene`, `getRainForecast`).
- `src/services/providers/IndiaProvider.ts`: Pre-built stub for your Indian farmhouse with detailed `TODO` comments.
- `src/services/providers/index.ts`: Provider registry and factory.

### To implement Phase 2:
1. Open `src/services/providers/IndiaProvider.ts`.
2. Update `defaultLocation` with the exact GPS coordinates of your farmhouse (e.g. Maharashtra, Karnataka, or Punjab).
3. Implement `getSoil(lat, lon)`:
   - Connect to the [Soil Health Card Portal API](https://soilhealth.dac.gov.in) or [ISRO Bhuvan Soil Information System](https://bhuvan.nrsc.gov.in).
   - Or connect a LoRaWAN / RS485 soil sensor gateway.
4. Implement `getLatestScene(lat, lon)`:
   - Connect to the [Copernicus Data Space Ecosystem STAC API](https://catalogue.dataspace.copernicus.eu/stac) or [AWS Earth Search](https://earth-search.aws.element84.com/v1) for Sentinel-2 scenes over India.
5. In the UI, the **"Region: India"** selector in the header instantly routes all map queries, decision rules, and AI advisories to `IndiaProvider` without modifying any UI components!
