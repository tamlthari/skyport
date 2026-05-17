/**
 * useMetarWeather
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches the latest METAR observation for your airport and derives the
 * "Weather Severity Score" feature used by the ML model.
 *
 * Behaviour:
 *   • VITE_USE_REAL_DATA=true  → polls NOAA aviationweather.gov every 15 min
 *   • VITE_USE_REAL_DATA=false → returns null (no METAR equivalent in mock data)
 *
 * The severityScore returned (0–100) maps directly to the "Weather Severity
 * Score" feature that accounts for 16.4% of model importance (featureImportance
 * in mlData.ts, rank #2).
 *
 * Usage in feature engineering:
 *   const { metar, severityScore } = useMetarWeather();
 *   // pass severityScore as "weather_severity_score" in your feature vector
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMetar, type MetarWeather } from '../services/apiService';
import { computeWeatherSeverityScore, flightCategoryToRisk } from '../services/dataTransformers';
import { USE_REAL_DATA, AIRPORT_ICAO, POLL_INTERVALS } from '../services/config';

export interface UseMetarWeatherResult {
  metar:         MetarWeather | null;
  severityScore: number;          // 0–100 derived feature for ML model
  riskLevel:     'Low' | 'Medium' | 'High';
  riskDesc:      string;
  isLive:        boolean;
  isLoading:     boolean;
  error:         string | null;
  lastUpdated:   Date | null;
  refresh:       () => void;
}

export function useMetarWeather(icaoCode = AIRPORT_ICAO): UseMetarWeatherResult {
  const [metar,         setMetar]         = useState<MetarWeather | null>(null);
  const [severityScore, setSeverityScore] = useState(0);
  const [riskLevel,     setRiskLevel]     = useState<'Low' | 'Medium' | 'High'>('Low');
  const [riskDesc,      setRiskDesc]      = useState('');
  const [isLive,        setIsLive]        = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [lastUpdated,   setLastUpdated]   = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!USE_REAL_DATA) return;  // No METAR equivalent in mock data

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchMetar(icaoCode);
      if (data) {
        const score = computeWeatherSeverityScore(data);
        const risk  = flightCategoryToRisk(data.flightCategory);
        setMetar(data);
        setSeverityScore(score);
        setRiskLevel(risk.level);
        setRiskDesc(risk.description);
        setIsLive(true);
        setLastUpdated(new Date());
      } else {
        setError('NOAA METAR returned no data for ' + icaoCode);
      }
    } catch (err) {
      setError(
        `METAR fetch failed: ${err instanceof Error ? err.message : 'Unknown error'}. ` +
        'Check network connectivity to aviationweather.gov.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [icaoCode]);

  useEffect(() => {
    fetchData();

    if (USE_REAL_DATA) {
      intervalRef.current = setInterval(fetchData, POLL_INTERVALS.metar);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { metar, severityScore, riskLevel, riskDesc, isLive, isLoading, error, lastUpdated, refresh: fetchData };
}
