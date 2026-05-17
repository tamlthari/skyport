import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useMLAnalytics } from '../../hooks/useMLAnalytics';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts';
import { CheckCircle2, Layers, GitMerge, Database, Cpu } from 'lucide-react';
import { JSX } from 'react';

const techniqueIcons: Record<string, JSX.Element> = {
  'Data Augmentation': <Database className="h-5 w-5 text-blue-600" />,
  'Transfer Learning': <GitMerge className="h-5 w-5 text-purple-600" />,
  'Ensemble Voting': <Layers className="h-5 w-5 text-indigo-600" />,
  'KNN Imputation': <Cpu className="h-5 w-5 text-green-600" />,
};

const CARRIER_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export function RobustnessAnalysis() {
  const { data, loading } = useMLAnalytics();

  if (loading || !data?.robustness) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Calculating robustness metrics...</div>;
  }

  // Extract the live technique impacts alongside the charts
  const {
    performanceByCarrierType,
    seasonalPerformance,
    dataCompletenessScenarios,
    techniqueImpacts
  } = data.robustness;

  return (
    <div className="space-y-6">

      {/* Robustness Techniques - NOW LIVE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(techniqueImpacts || []).map((t: any) => (
          <Card key={t.technique} className="border-l-4 border-l-indigo-400">
            <CardContent className="pt-4 flex gap-4">
              <div className="flex-shrink-0 mt-0.5">
                {techniqueIcons[t.technique] ?? <CheckCircle2 className="h-5 w-5 text-gray-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">{t.technique}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">{t.status}</span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{t.description}</p>
                <p className="text-xs text-indigo-600 font-medium">📈 {t.impact}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Carrier Type Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Live Performance by Carrier Type</CardTitle>
          <p className="text-sm text-gray-500">
            Model generalization across carrier categories (evaluated on historical hold-out sample).
          </p>
        </CardHeader>
        <CardContent>
          {performanceByCarrierType?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={performanceByCarrierType} margin={{ left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} angle={-10} textAnchor="end" height={50} />
                  <YAxis domain={[80, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: number, name: string) => [name === 'accuracy' ? `${v}%` : v.toFixed(3), name === 'accuracy' ? 'Accuracy' : 'AUC-ROC']} />
                  <Legend />
                  <Bar dataKey="accuracy" name="Accuracy (%)" radius={[4, 4, 0, 0]}>
                    {performanceByCarrierType.map((_: any, i: number) => (
                      <Cell key={i} fill={CARRIER_COLORS[i % CARRIER_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {performanceByCarrierType.map((c: any, i: number) => (
                  <div key={c.type} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: CARRIER_COLORS[i % CARRIER_COLORS.length] }} />
                        <span className="font-medium text-sm text-gray-800">{c.type}</span>
                      </div>
                      <span className="text-xs text-gray-400">{c.flights.toLocaleString()} flights</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-sm font-bold text-gray-800">{c.accuracy}%</div>
                        <div className="text-xs text-gray-500">Accuracy</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{c.aucRoc.toFixed(3)}</div>
                        <div className="text-xs text-gray-500">AUC-ROC</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{c.f1.toFixed(3)}</div>
                        <div className="text-xs text-gray-500">F1</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-gray-400">Not enough data to calculate performance</div>
          )}
        </CardContent>
      </Card>

      {/* Seasonal Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Live Seasonal Performance & Delay Rate</CardTitle>
          <p className="text-sm text-gray-500">
            Model accuracy tracks well across all seasons. Slight dips in accuracy often correlate with peak traffic / extreme weather months.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={seasonalPerformance} margin={{ left: 4, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" domain={[80, 100]} tickFormatter={v => `${v}%`} />
              <YAxis yAxisId="right" domain={[0, 40]} tickFormatter={v => `${v}%`} orientation="right" />
              <Tooltip />
              <Legend />
              <ReferenceLine yAxisId="left" y={90} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '90% target', fill: '#ef4444', fontSize: 11, position: 'insideTopLeft' }} />
              <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#6366f1" dot={{ r: 3 }} strokeWidth={2} name="Model Accuracy (%)" />
              <Line yAxisId="right" type="monotone" dataKey="delayRate" stroke="#f59e0b" dot={{ r: 3 }} strokeWidth={2} name="Delay Rate (%)" strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data Completeness Degradation */}
      <Card>
        <CardHeader>
          <CardTitle>Live Accuracy Under Missing Data Scenarios</CardTitle>
          <p className="text-sm text-gray-500">
            Dynamically computed robustness testing — simulating model performance when individual data feeds fail.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dataCompletenessScenarios} margin={{ left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
              <YAxis domain={[80, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Accuracy']} />
              <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '90% SLA', fill: '#ef4444', fontSize: 11 }} />
              <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} name="Accuracy">
                {dataCompletenessScenarios?.map((s: any, i: number) => (
                  <Cell key={i} fill={s.accuracy >= 90 ? '#10b981' : s.accuracy >= 86 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dataCompletenessScenarios?.map((s: any) => (
              <div key={s.scenario} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${s.accuracy >= 90 ? 'bg-green-50 border-green-200 text-green-800' :
                s.accuracy >= 86 ? 'bg-amber-50 border-amber-200 text-amber-800' :
                  'bg-red-50 border-red-200 text-red-800'
                }`}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.accuracy >= 90 ? '#10b981' : s.accuracy >= 86 ? '#f59e0b' : '#ef4444' }} />
                <span className="text-xs">{s.scenario}</span>
                <span className="ml-auto font-bold text-xs">{s.accuracy}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}