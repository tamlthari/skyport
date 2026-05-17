/**
 * config.ts — API configuration and feature flags
 * ─────────────────────────────────────────────────────────────────────────────
 * All environment variables used by the dashboard live here.
 *
 * How to use:
 *   1. Copy /.env.example → /.env
 *   2. Fill in your API keys and URLs
 *   3. Set VITE_USE_REAL_DATA=true to switch from mock → live data
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Master switch: true → live APIs, false → static mock data from mlData.ts
 * Controlled by VITE_USE_REAL_DATA in your .env file.
 */
export const USE_REAL_DATA = import.meta.env.VITE_USE_REAL_DATA === 'true';

/** 4-letter ICAO code for your airport (used in METAR + NOTAM requests) */
export const AIRPORT_ICAO: string = (import.meta.env.VITE_AIRPORT_ICAO as string) ?? 'KJFK';

/** 3-letter IATA code for your airport */
export const AIRPORT_IATA: string = (import.meta.env.VITE_AIRPORT_IATA as string) ?? 'JFK';

// ─── External API endpoints ────────────────────────────────────────────────

export const ENDPOINTS = {
  /**
   * YOUR trained ML inference server.
   * Start locally: uvicorn inference_server:app --host 0.0.0.0 --port 8000
   * See the Data Pipeline guide (/data-pipeline) for the FastAPI template.
   */
  mlInference: (import.meta.env.VITE_ML_API_URL as string) ?? 'http://localhost:8000',

  /**
   * NOAA Aviation Weather – METAR observations.
   * Free, no key required. CORS-friendly for browser requests.
   * Docs: https://aviationweather.gov/data/api/#/Data/dataMetar
   * Update cycle: ~15–20 minutes per station.
   */
  noaaMetar: 'https://aviationweather.gov/api/data/metar',

  /**
   * NOAA Aviation Weather – TAF forecasts (2–30 h).
   * Free, no key required. CORS-friendly.
   */
  noaaTaf: 'https://aviationweather.gov/api/data/taf',

  /**
   * FAA NAS Status – active Ground Delay Programs, Ground Stops, AFP.
   * Free, no key required.
   * Note: May block direct browser requests — use VITE_API_PROXY_URL if needed.
   * Docs: https://nasstatus.faa.gov
   */
  faaTfms: 'https://nasstatus.faa.gov/api/airport-status-information',

  /**
   * FAA NOTAM API – active NOTAMs for your airport.
   * Requires a free key from https://api.faa.gov
   * IMPORTANT: Proxy this through VITE_API_PROXY_URL to keep the key off
   * the client bundle and avoid CORS issues.
   */
  faaNotam: 'https://api.faa.gov/notamSearch/api/v1/notams',

  /**
   * Optional backend proxy URL.
   * When set, all CORS-restricted requests are routed through your local proxy.
   * See the proxy snippet in the Data Pipeline guide to set one up in ~15 lines.
   * Example: VITE_API_PROXY_URL=http://localhost:3001
   */
  proxy: (import.meta.env.VITE_API_PROXY_URL as string) ?? '',
} as const;

// ─── API keys ──────────────────────────────────────────────────────────────
//
// ⚠  SECURITY: Vite exposes all VITE_* variables inside the browser bundle.
//    Never store production secrets here.
//    Route sensitive keys (FAA NOTAM, FlightAware) through VITE_API_PROXY_URL.

export const API_KEYS = {
  faa:         (import.meta.env.VITE_FAA_API_KEY as string)         ?? '',
  flightAware: (import.meta.env.VITE_FLIGHTAWARE_API_KEY as string) ?? '',
  mlInference: (import.meta.env.VITE_ML_API_KEY as string)          ?? '',
} as const;

// ─── Polling intervals ─────────────────────────────────────────────────────

export const POLL_INTERVALS = {
  /** ML model inference output — aligned with METAR update cycle */
  flightPredictions:  5 * 60 * 1_000,  // 5 min
  /** NOAA METAR stations update every ~15–20 min */
  metar:             15 * 60 * 1_000,  // 15 min
  /** FAA TFMS programs change on 5-min boundaries */
  atcStatus:          5 * 60 * 1_000,  // 5 min
  /** FAA NOTAM API propagates new NOTAMs within ~2 min */
  notams:             2 * 60 * 1_000,  // 2 min
  /** Dashboard health panel refresh */
  dataSourceHealth:   1 * 60 * 1_000,  // 1 min
} as const;
