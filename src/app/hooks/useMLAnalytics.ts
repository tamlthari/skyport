import { useState, useEffect, useCallback } from 'react';

export function useMLAnalytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/analytics');
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            const result = await response.json();
            setData(result);
            setError(null);
            setLastUpdated(new Date());
        } catch (err: any) {
            console.error("Failed to fetch analytics:", err);
            setError(err.message || "Failed to connect to backend");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();

        // Auto-refresh data every 5 minutes (300,000 ms)
        const intervalId = setInterval(fetchAnalytics, 300000);
        return () => clearInterval(intervalId);
    }, [fetchAnalytics]);

    return {
        data,
        loading,
        error,
        lastUpdated,
        refresh: fetchAnalytics,
    };
}