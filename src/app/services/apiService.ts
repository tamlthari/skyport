/**
 * apiService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * All external data source fetch functions for the SkyPort dashboard.
 *
 * Each function:
 *   1. Calls the real API when USE_REAL_DATA = true
 *   2. Returns null on any network / parse error (hooks fall back to mock data)
 *   3. Is fully typed so downstream hooks & components stay type-safe
 *
 * CORS NOTE:
 *   Some APIs (FAA NOTAM, ATC TFMS) may block direct browser requests.
 *   Set VITE_API_PROXY_URL to route them through a local proxy server.
 *   See the Data Pipeline guide (/data-pipeline) for the 15-line proxy snippet.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ENDPOINTS, API_KEYS, AIRPORT_ICAO, AIRPORT_IATA } from './config';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED TYPES
// These mirror the shapes of arrays in mlData.ts / flightData.ts so that
// components can use real & mock data interchangeably.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Delay prediction for a single flight — mirrors currentFlightPredictions
 * in mlData.ts. Your inference server must return objects in this shape.
 */
export interface FlightPrediction {
  flightNumber:   string;   // e.g. "AA123"
  route:          string;   // e.g. "JFK → LAX"
  delayProb:      number;   // 0–100 integer (probability %)
  confidence:     number;   // 0–100 integer (model confidence %)
  causeAttrib:    string;   // e.g. "Weather (62%)"
  dispatchReview: boolean;  // true when confidence < 70 — triggers badges
}

/** Parsed METAR weather observation */
export interface MetarWeather {
  stationId:         string;
  observationTime:   string;   // ISO 8601
  tempC:             number;
  dewpointC:         number;
  windDirectionDeg:  number;
  windSpeedKt:       number;
  windGustKt?:       number;
  visibilityMi:      number;
  altimeterInHg:     number;
  wxString?:         string;   // e.g. "-RA" (light rain), "TS" (thunderstorm)
  cloudLayers:       CloudLayer[];
  flightCategory:    'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  rawMetar:          string;   // full raw METAR string for reference
}

export interface CloudLayer {
  coverage:       'SKC' | 'FEW' | 'SCT' | 'BKN' | 'OVC';
  baseHundredsFt: number;
}

/** A single ATC flow control program (GDP, Ground Stop, etc.) */
export interface AtcProgram {
  type:                 'GDP' | 'GS' | 'AFP' | 'MIT' | 'Clear';
  reason:               string;
  averageDelayMinutes?: number;
  minDelayMinutes?:     number;
  maxDelayMinutes?:     number;
  startTime?:           string;
  endTime?:             string;
}

/** ATC flow status for your airport */
export interface AtcStatus {
  airport:     string;
  programs:    AtcProgram[];
  advisories:  string[];
  lastUpdated: string;
}

/** A single NOTAM entry from the FAA NOTAM API */
export interface NotamEntry {
  notamId:        string;
  classification: 'CRITICAL' | 'WARNING' | 'INFO';
  keyword:        string;   // e.g. "RWY", "NAV", "OBST"
  location:       string;   // airport / NAVAID identifier
  startTime:      string;
  endTime?:       string;
  text:           string;
}

/** Live health status of a single external data source */
export interface DataSourceStatus {
  name:            string;
  type:            'Historical' | 'Schedule' | 'Real-time' | 'Compute';
  latency:         string;
  status:          'Healthy' | 'Degraded' | 'Down';
  records:         string;
  responseTimeMs?: number;
  lastChecked:     string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * If VITE_API_PROXY_URL is set, route the upstream URL through the local
 * proxy to handle CORS and to avoid exposing API keys in the browser.
 * The proxy must accept ?url=<encoded> and forward the request server-side.
 */
function buildUrl(upstream: string): string {
  if (ENDPOINTS.proxy) {
    return `${ENDPOINTS.proxy}?url=${encodeURIComponent(upstream)}`;
  }
  return upstream;
}

/** fetch() wrapper that throws on non-2xx status codes */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} → ${url}`);
  }
  return res.json() as Promise<T>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. ML INFERENCE SERVER
// ─────────────────────────────────────────────────────────────────────────
// Your own FastAPI / Flask server that loads the trained Transformer or
// XGBoost model and runs inference against today's active flight roster.
//
// Required endpoints:
//   GET /predictions → FlightPrediction[]
//   GET /health      → { status: "healthy", model_version: string }
//
// See the Data Pipeline guide for the full Python server template.
// Start locally: uvicorn inference_server:app --host 0.0.0.0 --port 8000
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch delay predictions for the current active flight roster from your
 * trained ML inference server.
 *
 * @returns Predictions array, or null if the server is unreachable (hook falls back to mock)
 */
export async function fetchFlightPredictions(): Promise<FlightPrediction[] | null> {
  try {
    const headers: Record<string, string> = {};
    if (API_KEYS.mlInference) {
      headers['Authorization'] = `Bearer ${API_KEYS.mlInference}`;
    }
    const data = await apiFetch<FlightPrediction[]>(
      `${ENDPOINTS.mlInference}/predictions`,
      { headers }
    );
    // Ensure dispatchReview is set correctly regardless of what the server returns
    return data.map((p) => ({
      ...p,
      dispatchReview: p.confidence < 70,
    }));
  } catch (err) {
    console.warn('[apiService] fetchFlightPredictions failed — will use mock data', err);
    return null;
  }
}

/**
 * Health check for the ML inference server.
 * Returns whether the server is reachable and the current model version.
 */
export async function checkMlServerHealth(): Promise<{
  healthy: boolean;
  version?: string;
  responseTimeMs: number;
}> {
  const start = performance.now();
  try {
    const data = await apiFetch<{ status: string; model_version?: string }>(
      `${ENDPOINTS.mlInference}/health`
    );
    return {
      healthy:       data.status === 'healthy',
      version:       data.model_version,
      responseTimeMs: Math.round(performance.now() - start),
    };
  } catch {
    return { healthy: false, responseTimeMs: Math.round(performance.now() - start) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. NOAA METAR  (Free — no API key required)
// ─────────────────────────────────────────────────────────────────────────
// Source: https://aviationweather.gov/data/api/
// Provides: current surface observations (wind, visibility, clouds, wx)
// Update cycle: ~15–20 minutes per station
// CORS: YES — works directly from browser
//
// This data drives the "Weather Severity Score" feature (16.4% importance)
// and the "METAR Wind Speed" feature (2.4% importance) in the ML model.
// ═══════════════════════════════════════════════════════════════════════════

interface _RawMetar {
  icaoId:   string;
  obsTime:  number;
  temp:     number;
  dewp:     number;
  wdir:     number;
  wspd:     number;
  wgst?:    number;
  visib:    string;
  altim:    number;
  wxString?: string;
  clouds:   Array<{ cover: string; base: number }>;
  rawOb:    string;
  fltcat:   string;
}

/**
 * Fetch the latest METAR observation for your airport.
 *
 * Example: const metar = await fetchMetar('KJFK');
 *
 * @param icaoCode  4-letter ICAO code (default: VITE_AIRPORT_ICAO from .env)
 */
export async function fetchMetar(icaoCode = AIRPORT_ICAO): Promise<MetarWeather | null> {
  try {
    const url = buildUrl(
      `${ENDPOINTS.noaaMetar}?ids=${icaoCode}&format=json&taf=false&hours=2`
    );
    const data = await apiFetch<_RawMetar[]>(url);
    if (!data || data.length === 0) return null;

    const m = data[0];
    return {
      stationId:        m.icaoId,
      observationTime:  new Date(m.obsTime * 1_000).toISOString(),
      tempC:            m.temp,
      dewpointC:        m.dewp,
      windDirectionDeg: m.wdir,
      windSpeedKt:      m.wspd,
      windGustKt:       m.wgst,
      visibilityMi:     parseFloat(m.visib) || 10,
      altimeterInHg:    m.altim,
      wxString:         m.wxString,
      cloudLayers:      (m.clouds ?? []).map((c) => ({
        coverage:       c.cover as CloudLayer['coverage'],
        baseHundredsFt: c.base,
      })),
      flightCategory:   m.fltcat as MetarWeather['flightCategory'],
      rawMetar:         m.rawOb,
    };
  } catch (err) {
    console.warn('[apiService] fetchMetar failed', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. FAA ATC / TFMS STATUS  (Free — no API key required)
// ─────────────────────────────────────────────────────────────────────────
// Source: https://nasstatus.faa.gov
// Provides: active Ground Delay Programs (GDP), Ground Stops (GS),
//           Airspace Flow Programs (AFP), and En Route delays across the NAS
// Update cycle: ~5 minutes
// CORS: MAY be blocked — set VITE_API_PROXY_URL if needed
//
// This data drives the "ATC Flow Control" feature (82% reliability score)
// and is used to set AtcProgram context in causal delay attribution.
// ═══════════════════════════════════════════════════════════════════════════

interface _RawTfmsItem {
  ARPT?:         string;
  Reason?:       string;
  Type?:         string;
  Avg?:          string;
  Min?:          string;
  Max?:          string;
  'Start Time'?: string;
  'End Time'?:   string;
}

/**
 * Fetch active ATC flow control programs for your airport.
 *
 * Example: const atc = await fetchAtcStatus('JFK');
 *
 * @param iataCode  3-letter IATA code (default: VITE_AIRPORT_IATA from .env)
 */
export async function fetchAtcStatus(iataCode = AIRPORT_IATA): Promise<AtcStatus | null> {
  try {
    const url   = buildUrl(ENDPOINTS.faaTfms);
    const data  = await apiFetch<_RawTfmsItem[]>(url);

    const airportItems = data.filter((item) => item.ARPT?.includes(iataCode));
    const programs: AtcProgram[] = airportItems.map((item) => ({
      type:                 (item.Type as AtcProgram['type']) ?? 'Clear',
      reason:               item.Reason ?? 'Not specified',
      averageDelayMinutes:  item.Avg ? parseInt(item.Avg) : undefined,
      minDelayMinutes:      item.Min ? parseInt(item.Min) : undefined,
      maxDelayMinutes:      item.Max ? parseInt(item.Max) : undefined,
      startTime:            item['Start Time'],
      endTime:              item['End Time'],
    }));

    return {
      airport:     iataCode,
      programs:    programs.length > 0 ? programs : [{ type: 'Clear', reason: 'No active programs' }],
      advisories:  [],
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[apiService] fetchAtcStatus failed', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. FAA NOTAM API  (Free — API key required)
// ─────────────────────────────────────────────────────────────────────────
// Source: https://api.faa.gov  (register for free key)
// Provides: active Notices to Air Missions for runways, navaids, obstacles
// Update cycle: ~2 minutes
// CORS: BLOCKED — must route through VITE_API_PROXY_URL
//
// ⚠  Register at https://api.faa.gov/login then set VITE_FAA_API_KEY
//    Never expose this key client-side without a proxy.
// ═══════════════════════════════════════════════════════════════════════════

interface _RawNotam {
  notam: {
    id:             string;
    keyword?:       { code?: string };
    location:       string;
    effectiveStart: string;
    effectiveEnd?:  string;
    text:           string;
  };
  classification?: string;
}

/**
 * Fetch active NOTAMs for your airport.
 *
 * Prerequisites:
 *   VITE_FAA_API_KEY   — your FAA API key
 *   VITE_API_PROXY_URL — your local proxy server (to hide the key)
 *
 * @param icaoCode  4-letter ICAO code
 */
export async function fetchNotams(icaoCode = AIRPORT_ICAO): Promise<NotamEntry[] | null> {
  if (!API_KEYS.faa) {
    console.warn(
      '[apiService] VITE_FAA_API_KEY is not set. ' +
      'Register at https://api.faa.gov and add it to your .env.'
    );
    return null;
  }
  try {
    const params = new URLSearchParams({
      icaoLocation: icaoCode,
      pageSize:     '50',
      pageNum:      '1',
      sortBy:       'effectiveStartDate',
      sortOrder:    'Asc',
    });
    const url = buildUrl(`${ENDPOINTS.faaNotam}?${params}`);

    const data = await apiFetch<{ items: _RawNotam[] }>(url, {
      headers: { client_id: API_KEYS.faa },
    });

    return (data.items ?? []).map((item) => ({
      notamId:        item.notam.id,
      classification: (item.classification as NotamEntry['classification']) ?? 'INFO',
      keyword:        item.notam.keyword?.code ?? 'GEN',
      location:       item.notam.location,
      startTime:      item.notam.effectiveStart,
      endTime:        item.notam.effectiveEnd,
      text:           item.notam.text,
    }));
  } catch (err) {
    console.warn('[apiService] fetchNotams failed', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. DATA SOURCE HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────
// Pings each external data source and measures response time.
// Used by the ModelMonitoring dashboard "Data Sources & Compute" card
// and the Data Pipeline guide status panel.
//
// Runs HEAD / GET requests — no data is parsed, just connectivity is checked.
// Times out after 5 seconds per source.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check connectivity and latency for all external data sources.
 * Returns a DataSourceStatus[] compatible with the dataSources mock in mlData.ts.
 */
export async function fetchDataSourceHealth(): Promise<DataSourceStatus[]> {
  const TIMEOUT_MS = 5_000;

  async function ping(url: string): Promise<{ ok: boolean; ms: number }> {
    const start = performance.now();
    try {
      await Promise.race([
        fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
        ),
      ]);
      return { ok: true, ms: Math.round(performance.now() - start) };
    } catch {
      return { ok: false, ms: Math.round(performance.now() - start) };
    }
  }

  const now = new Date().toISOString();

  // Fire all pings in parallel
  const [noaa, faa, notam, ml] = await Promise.all([
    ping(`${ENDPOINTS.noaaMetar}?ids=${AIRPORT_ICAO}&format=json&hours=1`),
    ping(ENDPOINTS.faaTfms),
    ping(ENDPOINTS.faaNotam),
    ping(`${ENDPOINTS.mlInference}/health`),
  ]);

  return [
    {
      name:        'BTS (Bureau of Transportation Statistics)',
      type:        'Historical',
      latency:     'Daily',
      // BTS is a batch CSV download — no live endpoint to ping
      status:      'Healthy',
      records:     '42.3 M',
      lastChecked: now,
    },
    {
      name:        'OAG Schedule Data',
      type:        'Schedule',
      latency:     'Weekly',
      // OAG uses push/webhook or SFTP — check your OAG dashboard for status
      status:      'Healthy',
      records:     '8.1 M',
      lastChecked: now,
    },
    {
      name:           'NOAA / METAR Weather Feed',
      type:           'Real-time',
      latency:        '< 15 min',
      status:         noaa.ok ? 'Healthy' : 'Down',
      records:        'Stream',
      responseTimeMs: noaa.ms,
      lastChecked:    now,
    },
    {
      name:           'FAA ATC Flow Control',
      type:           'Real-time',
      latency:        '< 5 min',
      status:         faa.ok ? 'Healthy' : 'Degraded',
      records:        'Stream',
      responseTimeMs: faa.ms,
      lastChecked:    now,
    },
    {
      name:           'FAA NOTAM API',
      type:           'Real-time',
      latency:        '< 2 min',
      // Degraded if no API key is configured — it won't return useful data
      status:         API_KEYS.faa
                        ? (notam.ok ? 'Healthy' : 'Degraded')
                        : 'Degraded',
      records:        'Stream',
      responseTimeMs: notam.ms,
      lastChecked:    now,
    },
    {
      name:           'ML Inference Server (Flight-DT)',
      type:           'Real-time',
      latency:        ml.ok ? `~${ml.ms} ms` : 'Unreachable',
      status:         ml.ok ? 'Healthy' : 'Down',
      records:        'Stream',
      responseTimeMs: ml.ms,
      lastChecked:    now,
    },
  ];
}
