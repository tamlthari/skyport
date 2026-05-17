import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useMLAnalytics } from '../hooks/useMLAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, Activity, PieChart as PieChartIcon, BarChart3,
  Brain, Wrench, ShieldCheck, Layers, Radio, AlertCircle
} from 'lucide-react';

import { ModelPerformance } from '../components/ds/ModelPerformance';
import { FeatureEngineering } from '../components/ds/FeatureEngineering';
import { ConfidenceScores } from '../components/ds/ConfidenceScores';
import { RobustnessAnalysis } from '../components/ds/RobustnessAnalysis';
import { ModelMonitoring } from '../components/ds/ModelMonitoring';

type TabId = 'overview' | 'model' | 'features' | 'confidence' | 'robustness' | 'monitoring';

const TABS: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'overview', label: 'Analytics Overview', icon: BarChart3, description: 'Live flight statistics & airline performance' },
  { id: 'model', label: 'Model Performance', icon: Brain, description: 'Architecture comparison, ROC, confusion matrix' },
  { id: 'features', label: 'Feature Engineering', icon: Wrench, description: 'Delay cause classification, SHAP importance, pipeline' },
  { id: 'confidence', label: 'Confidence Scores', icon: ShieldCheck, description: 'Feature reliability, causal attribution, live predictions' },
  { id: 'robustness', label: 'Robustness', icon: Layers, description: 'Carrier types, seasonality, missing data scenarios' },
  { id: 'monitoring', label: 'Monitoring & Drift', icon: Radio, description: 'Live accuracy, PSI drift detection, retraining log' },
];

export default function DataScientistDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { data, loading, error } = useMLAnalytics();

  // --- NEW: State for Model Selection ---
  const [selectedModelName, setSelectedModelName] = useState<string | null>(null);

  // Set the default selected model to the Production model once data loads
  useEffect(() => {
    if (data?.models && !selectedModelName) {
      const prod = data.models.find((m: any) => m.status === 'Production') || data.models[0];
      if (prod) setSelectedModelName(prod.name);
    }
  }, [data, selectedModelName]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center text-gray-500 animate-pulse">Loading live ML analytics...</div>;
  }

  if (error || !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-red-500 gap-2">
        <AlertCircle className="h-8 w-8" />
        <p>Failed to connect to the Inference Server.</p>
        <p className="text-sm text-gray-400">Ensure uvicorn inference_server:app is running on port 8000.</p>
      </div>
    );
  }

  const { stats, hourlyData, statusData, airlineData } = data.overview;

  // Identify the true Production model for the badge
  const prodModel = data.models.find((m: any) => m.status === 'Production') || data.models[0];

  // Identify the currently viewed model for the child components
  const viewedModel = data.models.find((m: any) => m.name === selectedModelName) || prodModel;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Scientist / ML Engineer Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Flight delay prediction · XGBoost / LightGBM / LSTM / Transformer architectures
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Production Badge */}
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-700">
                Production: {prodModel?.name || 'None'} · {prodModel?.accuracy || 0}% accuracy
              </span>
            </div>

            {/* --- NEW: Model Selector Dropdown --- */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-lg p-1">
              <Brain className="h-4 w-4 text-indigo-500 ml-2" />
              <span className="text-xs font-medium text-gray-500">Viewing:</span>
              <select
                value={selectedModelName || ''}
                onChange={(e) => setSelectedModelName(e.target.value)}
                className="text-sm border-none bg-transparent focus:ring-0 text-indigo-700 font-bold cursor-pointer pl-1 pr-6 py-1 outline-none"
              >
                {data.models.map((m: any) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.accuracy}%) {m.status === 'Production' ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max bg-gray-100 rounded-xl p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === id
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        {/* Tab description */}
        <p className="mt-2 text-xs text-gray-400 pl-1">
          {TABS.find(t => t.id === activeTab)?.description}
        </p>
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Passengers</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgPassengers}</div>
                <p className="text-xs text-gray-600 mt-1">Per flight</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On-Time %</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.onTimePercentage}%</div>
                <p className="text-xs text-gray-600 mt-1">Target: 85%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delay Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round((stats.delayedFlights / stats.totalFlights) * 100)}%</div>
                <p className="text-xs text-gray-600 mt-1">{stats.delayedFlights} flights delayed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
                <PieChartIcon className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round((stats.cancelledFlights / stats.totalFlights) * 100)}%</div>
                <p className="text-xs text-gray-600 mt-1">{stats.cancelledFlights} flights cancelled</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Live Hourly Flight Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="onTime" fill="#10b981" name="On Time Ops" stackId="a" />
                    <Bar dataKey="delayed" fill="#f59e0b" name="Delayed Ops" stackId="a" />
                    <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled Ops" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Live Flight Status Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                      outerRadius={100} dataKey="value">
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Live Airline Performance Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={airlineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="airline" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="onTime" fill="#22c55e" name="On Time" />
                  <Bar dataKey="delayed" fill="#f59e0b" name="Delayed" />
                  <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── MODEL PERFORMANCE TAB ────────────────────────────────────────── */}
      {/* Pass the currently selected viewedModel down instead of prodModel */}
      {activeTab === 'model' && <ModelPerformance models={data.models} viewedModel={viewedModel} />}

      {/* ── FEATURE ENGINEERING TAB ─────────────────────────────────────── */}
      {activeTab === 'features' && (
        <FeatureEngineering
          featureData={data.features}
          productionModel={viewedModel}
        />
      )}

      {/* ── CONFIDENCE SCORES TAB ───────────────────────────────────────── */}
      {activeTab === 'confidence' && <ConfidenceScores />}

      {/* ── ROBUSTNESS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'robustness' && <RobustnessAnalysis />}

      {/* ── MONITORING TAB ──────────────────────────────────────────────── */}
      {activeTab === 'monitoring' && <ModelMonitoring />}
    </div>
  );
}