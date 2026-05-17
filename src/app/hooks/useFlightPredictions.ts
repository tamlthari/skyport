import { useState, useEffect, useCallback } from 'react';

// Make sure this matches the FlightPrediction class in inference_server.py
export interface FlightPrediction {
  flightNumber: string;
  route: string;
  delayProb: number;
  confidence: number;
  causeAttrib: string;
  dispatchReview: boolean;
}

export function useFlightPredictions() {
  const [predictions, setPredictions] = useState<FlightPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPredictions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/predictions');
      if (!response.ok) {
        throw new Error('Failed to fetch live predictions from ML server');
      }
      const data = await response.json();
      setPredictions(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('ML Predictions Error:', err);
      setError(err.message + " (Make sure inference_server is running on port 8000)");
      // Optional: If it fails, you could set fallback mock data here
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchPredictions();

    // Poll every 5 minutes (300,000 ms)
    const intervalId = setInterval(fetchPredictions, 300000);

    return () => clearInterval(intervalId);
  }, [fetchPredictions]);

  return {
    predictions,
    isLive: true, // It is always attempting to be live now
    isLoading,
    error,
    lastUpdated,
    refresh: fetchPredictions,
  };
}