/**
 * useDataSourceHealth
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns live health status for all external data sources.
 *
 * Behaviour:
 *   • VITE_USE_REAL_DATA=true  → pings each source once per minute
 *   • VITE_USE_REAL_DATA=false → returns mock dataSources from mlData.ts
 *
 * Used by:
 *   • ModelMonitoring.tsx — "Data Sources & Compute" card
 *   • DataPipelineGuide.tsx — live connection status panel
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { dataSources as mockSources } from '../data/mlData';

export function useDataSourceHealth() {
  const [sources, setSources] = useState<any[]>(mockSources);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || mockSources);
        setIsLive(true);
        setLastUpdated(new Date());
      } else {
        throw new Error("Server returned non-200");
      }
    } catch (err) {
      console.warn('Failed to fetch live health data, falling back to mock.', err);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();

    // Poll the health endpoint every 60 seconds
    const intervalId = setInterval(fetchHealth, 60000);
    return () => clearInterval(intervalId);
  }, [fetchHealth]);

  return {
    sources,
    isLive,
    isLoading,
    lastUpdated,
    refresh: fetchHealth,
  };
}