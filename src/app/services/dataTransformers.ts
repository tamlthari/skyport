/**
 * dataTransformers.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Functions that normalize raw API responses into the shapes the dashboard
 * components expect, matching the structures in mlData.ts / flightData.ts.
 *
 * Use these when your real API returns slightly different field names,
 * or when you need to derive a feature value from raw data.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { FlightPrediction, MetarWeather, AtcStatus, DataSourceStatus } from './apiService';

// ═══════════════════════════════════════════════════════════════════════════
// PREDICTION NORMALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize FlightPrediction[] from the ML API into the exact format used by
 * currentFlightPredictions in mlData.ts.
 *
 * This is a safety net for field-name differences between your Python model's
 * output and the TypeScript shape expected by the dashboard.
 *
 * If your inference server already returns the correct shape, this is a no-op.
 */
export function normalizePredictions(raw: FlightPrediction[]): FlightPrediction[] {
  return raw.map((p) => ({
    flightNumber:   (p.flightNumber ?? 'UNKNOWN').toUpperCase(),
    route:          p.route ?? '??? → ???',
    delayProb:      clamp(Math.round(p.delayProb ?? 0), 0, 100),
    confidence:     clamp(Math.round(p.confidence ?? 0), 0, 100),
    causeAttrib:    p.causeAttrib ?? 'N/A',
    dispatchReview: (p.confidence ?? 0) < 70,  // always recompute from confidence
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// WEATHER SEVERITY SCORE  (ML Feature #2 — 16.4% importance)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the "Weather Severity Score" feature (0–100) from a METAR observation.
 *
 * This is the same feature used by the ML model's second-most-important input.
 * Call this after fetchMetar() and pass the result to your inference server
 * as the `weather_severity_score` feature in your feature vector.
 *
 * Scoring rules (additive, capped at 100):
 *   Wind > 20 kt:         +25     Wind > 35 kt:    +20 more  (total +45)
 *   Wind gust > 30 kt:    +15
 *   Visibility < 3 mi:    +20     Visibility < 1 mi: +15 more (total +35)
 *   BKN/OVC < 1000 ft AGL: +20    BKN/OVC < 500 ft:  +15 more (total +35)
 *   Thunderstorm (TS):    +30
 *   Freezing / Snow:      +20
 *   Rain (RA):            +10
 */
export function computeWeatherSeverityScore(metar: MetarWeather): number {
  let score = 0;

  // Wind component
  if (metar.windSpeedKt > 35)      score += 45;
  else if (metar.windSpeedKt > 20) score += 25;
  if ((metar.windGustKt ?? 0) > 30) score += 15;

  // Visibility component
  if (metar.visibilityMi < 1)      score += 35;
  else if (metar.visibilityMi < 3) score += 20;

  // Cloud ceiling component (BKN/OVC layers only)
  const ceilingLayers = metar.cloudLayers.filter(
    (c) => c.coverage === 'BKN' || c.coverage === 'OVC'
  );
  const lowestCeiling = ceilingLayers.length > 0
    ? Math.min(...ceilingLayers.map((c) => c.baseHundredsFt))
    : 999;

  if (lowestCeiling < 5)        score += 35;   // Below 500 ft
  else if (lowestCeiling < 10)  score += 20;   // Below 1000 ft

  // Weather phenomena (wxString)
  const wx = metar.wxString ?? '';
  if (wx.includes('TS'))                     score += 30;  // Thunderstorm
  if (wx.includes('FZ') || wx.includes('SN')) score += 20; // Freezing precip / snow
  if (wx.includes('RA'))                     score += 10;  // Rain

  return clamp(score, 0, 100);
}

/**
 * Convert METAR flight category to a human-readable delay risk level.
 * Useful for displaying in the Manager / Ground Services detail panel.
 */
export function flightCategoryToRisk(
  category: MetarWeather['flightCategory']
): { level: 'Low' | 'Medium' | 'High'; description: string; color: string } {
  const map: Record<string, { level: 'Low' | 'Medium' | 'High'; description: string; color: string }> = {
    VFR:  { level: 'Low',    description: 'Visual conditions — minimal weather impact',    color: 'text-green-700' },
    MVFR: { level: 'Medium', description: 'Marginal VFR — possible minor delays',          color: 'text-amber-700' },
    IFR:  { level: 'High',   description: 'Instrument conditions — expect delays',         color: 'text-red-700'   },
    LIFR: { level: 'High',   description: 'Low IFR — significant delays likely',           color: 'text-red-700'   },
  };
  return map[category] ?? map.VFR;
}

// ═══════════════════════════════════════════════════════════════════════════
// ATC STATUS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Summarize an AtcStatus object into a single human-readable status.
 * Useful for the Manager Dashboard KPI strip and Ground Services cards.
 */
export function summarizeAtcStatus(atc: AtcStatus): {
  hasDelayProgram: boolean;
  summary:         string;
  worstDelayMin:   number;
} {
  const active = atc.programs.filter((p) => p.type !== 'Clear');
  const worstDelayMin = Math.max(0, ...active.map((p) => p.averageDelayMinutes ?? 0));
  const summary = active.length > 0
    ? active.map((p) => `${p.type}: ${p.reason}`).join(' · ')
    : 'No active ATC programs';

  return { hasDelayProgram: active.length > 0, summary, worstDelayMin };
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA SOURCE HEALTH → mlData FORMAT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert DataSourceStatus[] (from the real health check API) to the exact
 * shape used by the dataSources array in mlData.ts.
 *
 * Allows ModelMonitoring.tsx to use live health data with zero JSX changes.
 */
export function toMlDataSourceFormat(
  statuses: DataSourceStatus[]
): Array<{ name: string; type: string; latency: string; status: string; records: string }> {
  return statuses.map((s) => ({
    name:    s.name,
    type:    s.type,
    latency: s.latency,
    status:  s.status,
    records: s.records,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE VECTOR BUILDER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a partial feature vector for a single flight, combining data from
 * multiple live API sources.
 *
 * Pass this to your inference server's POST /predict endpoint.
 * Field names must match your Python model's feature schema exactly.
 *
 * Usage:
 *   const features = buildFlightFeatureVector(flight, metar, atcStatus);
 *   const prediction = await fetch(`${ML_URL}/predict`, {
 *     method: 'POST',
 *     body: JSON.stringify(features)
 *   });
 */
export function buildFlightFeatureVector(params: {
  flightNumber:    string;
  route:           string;
  scheduledHour:   number;    // 0–23 (local departure hour)
  dayOfWeek:       number;    // 0=Mon … 6=Sun
  carrierCode:     string;    // e.g. "AA"
  routeDistanceMi: number;
  metar?:          MetarWeather;
  atcStatus?:      AtcStatus;
}): Record<string, number | string> {
  const { metar, atcStatus } = params;

  // Cyclical encoding for hour (prevents model treating hour 23 as "far from" hour 0)
  const hourSin = Math.sin((2 * Math.PI * params.scheduledHour) / 24);
  const hourCos = Math.cos((2 * Math.PI * params.scheduledHour) / 24);

  // Cyclical encoding for day of week
  const dowSin = Math.sin((2 * Math.PI * params.dayOfWeek) / 7);
  const dowCos = Math.cos((2 * Math.PI * params.dayOfWeek) / 7);

  return {
    flight_number:        params.flightNumber,
    carrier_code:         params.carrierCode,
    route:                params.route,
    route_distance_mi:    params.routeDistanceMi,
    departure_hour_sin:   hourSin,
    departure_hour_cos:   hourCos,
    day_of_week_sin:      dowSin,
    day_of_week_cos:      dowCos,
    // Weather features (0 if METAR unavailable — model uses KNN imputation)
    weather_severity_score: metar ? computeWeatherSeverityScore(metar) : 0,
    wind_speed_kt:          metar?.windSpeedKt  ?? 0,
    visibility_mi:          metar?.visibilityMi ?? 10,
    temp_c:                 metar?.tempC        ?? 15,
    flight_category:        metar?.flightCategory ?? 'VFR',
    // ATC features (0 if no active program)
    atc_delay_program:      atcStatus
      ? (atcStatus.programs.some((p) => p.type !== 'Clear') ? 1 : 0)
      : 0,
    atc_avg_delay_min:      atcStatus
      ? Math.max(0, ...atcStatus.programs.map((p) => p.averageDelayMinutes ?? 0))
      : 0,
  };
}

// ─── Utility ───────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
