import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { specialCasesStats, featureDictionary } from '../../data/mlData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { CheckCircle, AlertTriangle, Clock, GitBranch } from 'lucide-react';
import { JSX } from 'react';

const specialCaseIcons: Record<string, JSX.Element> = {
  'Timezone Conversions': <Clock className="h-4 w-4 text-blue-500" />,
  'Overnight Flights': <Clock className="h-4 w-4 text-indigo-500" />,
  'Diversions': <GitBranch className="h-4 w-4 text-amber-500" />,
  'Cancellations': <AlertTriangle className="h-4 w-4 text-red-500" />,
  'Irregular Operations': <AlertTriangle className="h-4 w-4 text-orange-500" />,
};

const PIPELINE_STEPS = [
  { step: 'Raw Input', desc: 'Scheduled vs. actual timestamps, airline codes, METAR data, NOTAM flags' },
  { step: 'Parsing & Normalization', desc: 'UTC conversion, overnight-flight detection, timezone disambiguation' },
  { step: 'Delay Extraction', desc: 'Compute delay_minutes = actual − scheduled; assign delay_category (weather / carrier / NAS / security / late_aircraft)' },
  { step: 'Feature Encoding', desc: 'Cyclical encoding for hour/weekday; one-hot for carrier type; log-scaling for distance' },
  { step: 'Semantic Disambiguation', desc: 'Rule engine maps airline code + METAR + ATC tags → causal label with probability' },
  { step: 'Model Input Vector', desc: '14-dimensional feature tensor passed to inference pipeline' },
];

export function FeatureEngineering({ featureData, productionModel }: { featureData: any, productionModel: any }) {

  // Transform the featureImportance dictionary from the backend into a sorted array for Recharts
  const rawImportance = productionModel?.featureImportance || {};
  const totalImportance = Object.values(rawImportance).reduce((acc: number, val: any) => acc + val, 0) as number;

  const dynamicFeatureImportance = Object.entries(rawImportance)
    .map(([key, val]: [string, any]) => ({
      feature: key.replace(/_/g, ' '), // Make it readable
      // If it's not already a percentage, convert it
      importance: totalImportance > 100
        ? Number(((val / totalImportance) * 100).toFixed(1))
        : Number(val),
    }))
    .sort((a, b) => a.importance - b.importance); // Sort ascending for vertical bar chart

  return (
    <div className="space-y-6">

      {/* Pipeline Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Engineering Pipeline</CardTitle>
          <p className="text-sm text-gray-500">End-to-end data processing from raw flight records to model-ready tensors</p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-indigo-200" />
            <div className="space-y-4">
              {PIPELINE_STEPS.map(({ step, desc }, i) => (
                <div key={step} className="flex gap-4 relative pl-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold z-10">
                    {i + 1}
                  </div>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 flex-1 border border-gray-100">
                    <div className="font-medium text-gray-900 text-sm">{step}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delay Cause + Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Delay Cause Classification</CardTitle>
            <p className="text-sm text-gray-500">Semantic label distribution for today's simulated operations</p>
          </CardHeader>
          <CardContent>
            {featureData?.delayCauses?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={featureData.delayCauses} cx="50%" cy="50%" outerRadius={90} dataKey="count" nameKey="cause"
                      label={({ cause, percentage }) => `${cause}: ${percentage}%`} labelLine={false}>
                      {featureData.delayCauses.map((entry: any) => (
                        <Cell key={entry.cause} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [v, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {featureData.delayCauses.map(({ cause, count, percentage, fill }: any) => (
                    <div key={cause} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: fill }} />
                      <span className="text-gray-600">{cause}</span>
                      <span className="ml-auto font-medium text-gray-800">{count} ({percentage}%)</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-400">No delay data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Feature Importance (SHAP)</CardTitle>
            <p className="text-sm text-gray-500">Mean |SHAP| values — {productionModel?.name}</p>
          </CardHeader>
          <CardContent>
            {dynamicFeatureImportance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dynamicFeatureImportance} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `${v}%`} domain={[0, 'auto']} />
                  <YAxis dataKey="feature" type="category" width={190} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Importance']} />
                  <Bar dataKey="importance" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-400">Model does not support SHAP extraction</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delay Duration Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Live Delay Duration Distribution</CardTitle>
          <p className="text-sm text-gray-500">Number of delayed flights by delay length bucket (today's ops)</p>
        </CardHeader>
        <CardContent>
          {featureData?.delayDurations?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={featureData.delayDurations} margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v: number) => [v, 'Flights']} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Flights" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-gray-400">No delay data available</div>
          )}
        </CardContent>
      </Card>

      {/* Engineered Features Dictionary */}
      <Card>
        <CardHeader>
          <CardTitle>Engineered Features Dictionary</CardTitle>
          <p className="text-sm text-gray-500">Core features engineered for the model pipeline</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 px-3 text-gray-500 w-12">#</th>
                <th className="py-2 px-3 text-gray-500 w-64">Feature Name</th>
                <th className="py-2 px-3 text-gray-500 w-48">Source</th>
                <th className="py-2 px-3 text-gray-500">Description / Engineering Logic</th>
              </tr>
            </thead>
            <tbody>
              {featureDictionary.map((feature) => (
                <tr key={feature.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 text-gray-500 font-medium">{feature.id}</td>
                  <td className="py-3 px-3 font-medium text-gray-900">{feature.name}</td>
                  <td className="py-3 px-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {feature.source}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{feature.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Special Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Special Case Handling — Semantic Disambiguation Module</CardTitle>
          <p className="text-sm text-gray-500">Evaluates pipeline robustness against dirty or missing records. Edge-case scenarios processed in the current 30-day window (Live Projected)</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 px-3 text-gray-500">Case Type</th>
                <th className="py-2 px-3 text-gray-500">Handled</th>
                <th className="py-2 px-3 text-gray-500">Parsing Errors</th>
                <th className="py-2 px-3 text-gray-500">Accuracy</th>
                <th className="py-2 px-3 text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Fallback to empty array if backend hasn't returned it yet */}
              {(featureData?.specialCases || []).map((row: any) => (
                <tr key={row.case} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 flex items-center gap-2">
                    {specialCaseIcons[row.case] ?? <CheckCircle className="h-4 w-4 text-green-500" />}
                    <span className="font-medium text-gray-900">{row.case}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-700">{row.handled.toLocaleString()}</td>
                  <td className="py-3 px-3 text-gray-700">{row.errors.toLocaleString()}</td>
                  <td className="py-3 px-3 font-medium text-green-700">{row.accuracy}</td>
                  <td className="py-3 px-3">
                    {parseFloat(row.accuracy) >= 99
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Excellent</span>
                      : parseFloat(row.accuracy) >= 95
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Good</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Needs Work</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}