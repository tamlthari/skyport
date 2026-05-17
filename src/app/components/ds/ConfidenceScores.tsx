import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useMLAnalytics } from '../../hooks/useMLAnalytics';
import { ShieldCheck, UserCheck, AlertCircle, ArrowRight, LayoutDashboard, Wrench, Radio, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

function ReliabilityBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 55 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium w-8 text-right text-gray-700">{value}%</span>
    </div>
  );
}

function DelayProbBadge({ prob }: { prob: number }) {
  if (prob >= 55) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">High Risk</span>;
  if (prob >= 40) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Moderate</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Low Risk</span>;
}

// Helper component to tick seconds passed
function TimeAgo({ date }: { date: Date | null }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!date) return;
    const interval = setInterval(() => {
      setSeconds(Math.round((Date.now() - date.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [date]);

  if (!date) return null;
  return <span className="text-green-500 ml-1">· updated {seconds}s ago</span>;
}

export function ConfidenceScores() {
  // Use a SINGLE hook to pull everything (same hook the Manager Dashboard uses)
  const { data: analyticsData, loading, error, refresh, lastUpdated } = useMLAnalytics();

  if (loading || !analyticsData) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading live confidence scores...
      </div>
    );
  }

  // Extract the unified live data
  const liveFlights = analyticsData.liveFlights || [];
  const liveReliability = analyticsData.confidenceScores?.featureReliability || [];
  const liveCausalConf = analyticsData.confidenceScores?.causalAttributionConfidence || [];

  // Recalculate KPIs based on the true live array
  const reviewCount = liveFlights.filter((f: any) => f.dispatchReview).length;
  const avgConfidence = liveFlights.length > 0
    ? Math.round(liveFlights.reduce((s: number, f: any) => s + f.confidence, 0) / liveFlights.length)
    : 0;

  const avgReliability = liveReliability.length > 0
    ? Math.round(liveReliability.reduce((s: number, f: any) => s + f.reliability, 0) / liveReliability.length)
    : 0;

  return (
    <div className="space-y-6">

      {/* ── Live / error indicator ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 rounded-full px-3 py-1 font-medium">
            <Radio className="h-3 w-3 animate-pulse" />
            Live — polling
            <TimeAgo date={lastUpdated} />
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-2.5 py-1 transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── API error banner ──────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          {/* Change {error.message} to just {error} */}
          <p className="text-sm text-amber-800">Error connecting to Python backend: {error}</p>
        </div>
      )}

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-indigo-200 bg-indigo-50/40">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-sm">Avg Feature Reliability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-700">{avgReliability}%</div>
            <p className="text-xs text-gray-500 mt-1">Across all live input feeds</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/40">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <CardTitle className="text-sm">Avg Prediction Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{avgConfidence}%</div>
            <p className="text-xs text-gray-500 mt-1">Over current flight roster</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <UserCheck className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-sm">Dispatcher Review Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{reviewCount}</div>
            <p className="text-xs text-gray-500 mt-1">Confidence &lt; 55% threshold → human review</p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Reliability */}
      <Card>
        <CardHeader>
          <CardTitle>Per-Feature Reliability Scores</CardTitle>
          <p className="text-sm text-gray-500">
            Real-time health of API feeds. Features below 55% trigger fallback imputation in the pipeline.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {liveReliability.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  {['Feature', 'Data Source', 'Window', 'Impact', 'Reliability'].map(h => (
                    <th key={h} className="py-2 px-3 text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveReliability.map((row: any) => (
                  <tr key={row.feature} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{row.feature}</td>
                    <td className="py-3 px-3 text-gray-500">{row.source}</td>
                    <td className="py-3 px-3 text-gray-500 font-mono text-xs">{row.window}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${row.impact === 'High' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                        row.impact === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>{row.impact}</span>
                    </td>
                    <td className="py-3 px-3 w-44">
                      <ReliabilityBar value={row.reliability} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex h-32 items-center justify-center text-gray-400">Loading reliability metrics...</div>
          )}
        </CardContent>
      </Card>

      {/* Causal Attribution Confidence */}
      <Card>
        <CardHeader>
          <CardTitle>Causal Attribution Confidence</CardTitle>
          <p className="text-sm text-gray-500">
            Average ML confidence by root delay cause. Lower scores trigger cascading-delay analysis fallback.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {liveCausalConf.length > 0 ? (
            liveCausalConf.map(({ cause, confidence, note }: any) => {
              const barColor =
                confidence >= 70 ? 'bg-green-500' :
                  confidence >= 55 ? 'bg-amber-500' :
                    'bg-red-400';
              return (
                <div key={cause}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{cause}</span>
                    <span className="text-sm font-bold text-gray-700">{confidence}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2 mb-1">
                    <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${confidence}%` }} />
                  </div>
                  <p className="text-xs text-gray-500">{note}</p>
                </div>
              );
            })
          ) : (
            <div className="flex h-16 items-center justify-center text-gray-400">Loading attribution data...</div>
          )}
        </CardContent>
      </Card>

      {/* Live Flight Predictions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Live Delay Predictions — Current Roster</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Predictions from live ML inference server. Confidence &lt; 55% automatically flags for dispatcher review.
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 rounded-full px-2.5 py-1 flex-shrink-0">
              <Radio className="h-3 w-3 animate-pulse" /> Live
            </span>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {liveFlights.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  {['Flight', 'Route', 'Delay Prob.', 'Risk Level', 'Confidence', 'Top Cause', 'Review'].map(h => (
                    <th key={h} className="py-2 px-3 text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveFlights.map((f: any) => (
                  <tr key={f.id} className={`border-b border-gray-100 ${f.dispatchReview ? 'bg-amber-50/40' : 'hover:bg-gray-50'}`}>
                    <td className="py-3 px-3 font-medium text-gray-900">{f.flightNumber}</td>
                    <td className="py-3 px-3 text-gray-600 font-mono text-xs">{f.origin}→{f.destination}</td>
                    <td className="py-3 px-3 font-bold text-gray-800">{f.delayProb}%</td>
                    <td className="py-3 px-3"><DelayProbBadge prob={f.delayProb} /></td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${f.confidence >= 70 ? 'bg-green-500' : f.confidence >= 55 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${f.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{f.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-600 text-xs">{f.causeAttrib}</td>
                    <td className="py-3 px-3">
                      {f.dispatchReview ? (
                        <span className="flex items-center gap-1 text-xs text-amber-700">
                          <AlertCircle className="h-3.5 w-3.5" /> Required
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex justify-center items-center h-32 text-gray-500">
              No active flights found.
            </div>
          )}

          {/* Cross-role routing callout */}
          <div className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs font-semibold text-indigo-800 mb-2 flex items-center gap-1.5">
              <ArrowRight className="h-3.5 w-3.5" /> Where Dispatcher Review Flags Are Routed
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 bg-white rounded-lg border border-indigo-100 p-3">
                <LayoutDashboard className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">Manager Dashboard</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Review-flagged flights are highlighted in the Recent Flight Activity table with a red badge and appear
                    in the "ML Dispatcher Review Required" alert strip above the table.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-white rounded-lg border border-indigo-100 p-3">
                <Wrench className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">Ground Services Dashboard</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Flight cards for flagged flights show a red "Review" badge. The detail panel also
                    surfaces the ML confidence score and recommended human action directly to ground crews.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}