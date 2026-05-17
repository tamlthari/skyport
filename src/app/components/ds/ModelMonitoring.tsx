import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useDataSourceHealth } from '../../hooks/useDataSourceHealth';
import { useMLAnalytics } from '../../hooks/useMLAnalytics';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Database, RotateCcw, X, Clock, Zap, ChevronRight,
  Loader2, Play, Radio
} from 'lucide-react';
import { Button } from '../ui/button';

// ── Sub-components ─────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5 text-red-500" />;
  if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 text-green-500" />;
  return <Minus className="h-3.5 w-3.5 text-gray-400" />;
}

function DriftStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Stable: 'bg-green-100 text-green-700 border-green-200',
    Watch: 'bg-amber-100 text-amber-700 border-amber-200',
    Alert: 'bg-red-100   text-red-700   border-red-200',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] ?? styles.Stable}`}>
      {status}
    </span>
  );
}

function RetrainingStatusBadge({ status }: { status: string }) {
  if (status === 'Success')
    return <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle2 className="h-3.5 w-3.5" /> Success</span>;
  if (status === 'Degraded')
    return <span className="flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> Degraded</span>;
  return <span className="flex items-center gap-1 text-xs text-red-700"><XCircle className="h-3.5 w-3.5" /> Failed</span>;
}

function SourceStatusDot({ status }: { status: string }) {
  if (status === 'Healthy') return <span className="inline-block w-2 h-2 rounded-full bg-green-500" />;
  if (status === 'Degraded') return <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-red-500" />;
}

// ── Confirmation Dialog ────────────────────────────────────────────────────────

type DialogType = 'retrain' | 'rollback' | null;

interface ConfirmDialogProps {
  type: DialogType;
  targetDate?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ConfirmDialog({ type, targetDate, onConfirm, onCancel, isLoading }: ConfirmDialogProps) {
  const config = {
    retrain: {
      title: 'Trigger Model Retraining',
      description: 'This will spawn a background process on the inference server to execute train_all_models.py. The active production model will continue serving traffic until the new models are evaluated.',
      details: [
        { icon: Clock, label: 'Estimated duration', value: '1–2 minutes' },
        { icon: Database, label: 'Training data', value: 'data/features.parquet' },
        { icon: Zap, label: 'Compute', value: 'Local CPU Process' },
      ],
      confirmLabel: isLoading ? 'Queueing...' : 'Confirm Retraining',
      confirmClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      warningText: 'CPU usage will spike during XGBoost and PyTorch training phases.',
    },
    rollback: {
      title: `Rollback to Version`,
      description: `This will hot-swap the inference server memory back to the configuration from ${targetDate || 'the previous version'} and reload the weights without dropping requests.`,
      details: [
        { icon: RotateCcw, label: 'Target action', value: `Restore snapshot from ${targetDate || 'backup'}` },
        { icon: TrendingDown, label: 'Risk factor', value: 'Low' },
        { icon: Zap, label: 'Switch time', value: '< 5 seconds (zero downtime)' },
      ],
      confirmLabel: isLoading ? 'Swapping...' : 'Confirm Rollback',
      confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
      warningText: 'Rollback will overwrite the current production state. Ensure this is necessary.',
    },
  };

  if (!type) return null;
  const c = config[type];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slide-in">
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {type === 'retrain'
              ? <div className="p-2 bg-indigo-100 rounded-lg"><RefreshCw className="h-5 w-5 text-indigo-600" /></div>
              : <div className="p-2 bg-amber-100 rounded-lg"><RotateCcw className="h-5 w-5 text-amber-600" /></div>
            }
            <h3 className="font-semibold text-gray-900">{c.title}</h3>
          </div>
          <button onClick={onCancel} disabled={isLoading} className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">{c.description}</p>
          <div className="space-y-2">
            {c.details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-100">
                <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 flex-1">{label}</span>
                <span className="text-sm font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">{c.warningText}</p>
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isLoading}>Cancel</Button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 ${c.confirmClass}`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {c.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ModelMonitoring() {
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [rollbackTarget, setRollbackTarget] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string, desc: string, isError: boolean } | null>(null);
  const [isServerTraining, setIsServerTraining] = useState(false);

  const { sources, isLive, isLoading: isSourcesLoading, lastUpdated, refresh } = useDataSourceHealth();
  const { data: analyticsData, loading: isAnalyticsLoading } = useMLAnalytics();

  // Poll server status to check if a background training job is running
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('http://localhost:8000/model_status');
        if (res.ok) {
          const data = await res.json();
          if (isServerTraining && !data.is_training) {
            setToastMessage({
              title: "Retraining Complete",
              desc: `The active model is now ${data.active_model} (${data.framework}).`,
              isError: false
            });
          }
          setIsServerTraining(data.is_training);
        }
      } catch (e) {
        // Server unreachable
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [isServerTraining]);

  const handleActionConfirm = async () => {
    setIsActionLoading(true);
    const action = dialogType;

    try {
      const endpoint = action === 'retrain' ? '/retrain' : '/rollback';
      // Dynamically attach the target version if it's a rollback
      const body = action === 'rollback' ? JSON.stringify({ version_id: rollbackTarget }) : undefined;
      const headers = action === 'rollback' ? { 'Content-Type': 'application/json' } : undefined;

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        body,
        headers
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || 'Action failed');

      setDialogType(null);

      if (action === 'retrain') {
        setToastMessage({
          title: "Retraining Job Queued",
          desc: "The training pipeline is now running in the background. The server will hot-swap the winner automatically.",
          isError: false
        });
      } else {
        setToastMessage({
          title: "Rollback Successful",
          desc: `Traffic is now being routed to the model weights from ${rollbackTarget}.`,
          isError: false
        });
      }
    } catch (err: any) {
      setToastMessage({ title: "Action Failed", desc: err.message, isError: true });
      setDialogType(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isAnalyticsLoading || !analyticsData?.monitoring) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading monitoring data...</div>;
  }

  // Extract live data from the analytics hook
  const { driftScores, retrainingLog, accuracyOverTime } = analyticsData.monitoring;

  const currentAcc = accuracyOverTime[accuracyOverTime.length - 1]?.accuracy || 0;
  const alertFeatures = driftScores.filter((f: any) => f.status === 'Alert');
  const watchFeatures = driftScores.filter((f: any) => f.status === 'Watch');
  const degradedSources = sources.filter((s: any) => s.status === 'Degraded' || s.status === 'Down');

  return (
    <div className="space-y-6">
      {/* Dialogs & Toasts */}
      <ConfirmDialog
        type={dialogType}
        targetDate={rollbackTarget}
        onConfirm={handleActionConfirm}
        onCancel={() => setDialogType(null)}
        isLoading={isActionLoading}
      />

      {toastMessage && (
        <div className={`flex items-start gap-3 border rounded-lg px-4 py-3 mb-6 ${toastMessage.isError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          {toastMessage.isError
            ? <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            : <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          }
          <div className="flex-1">
            <p className={`text-sm font-semibold ${toastMessage.isError ? 'text-red-800' : 'text-green-800'}`}>{toastMessage.title}</p>
            <p className={`text-xs mt-0.5 ${toastMessage.isError ? 'text-red-700' : 'text-green-700'}`}>{toastMessage.desc}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ── Action Controls ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-800">Model Controls</p>
            {isServerTraining && (
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                <Loader2 className="h-3 w-3 animate-spin" /> Training in progress
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Trigger an immediate background retraining cycle or roll back to a previous metrics state.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setDialogType('retrain')}
            disabled={isServerTraining}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isServerTraining ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isServerTraining ? 'Training...' : 'Trigger Retraining'}
          </button>
          <button
            onClick={() => {
              if (retrainingLog.length > 1) {
                // Default to the previous valid version (index 1)
                setRollbackTarget(retrainingLog[1].date);
                setDialogType('rollback');
              } else {
                setToastMessage({ title: "Cannot Rollback", desc: "No historical versions available yet. Train a new model first to capture a snapshot.", isError: true });
              }
            }}
            disabled={isServerTraining}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Rollback Version
          </button>
        </div>
      </div>

      {/* ── System Status Alerts ─────────────────────────────────────────── */}
      {(alertFeatures.length > 0 || degradedSources.length > 0) && (
        <div className="space-y-2">
          {alertFeatures.map((f: any) => (
            <div key={f.feature} className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-medium text-red-800">Data Drift Alert — {f.feature}</span>
                <p className="text-xs text-red-600 mt-0.5">
                  PSI = {f.psi.toFixed(2)} (threshold 0.20) · Retraining recommended
                </p>
              </div>
              <button
                onClick={() => setDialogType('retrain')}
                className="flex items-center gap-1 text-xs text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 rounded-lg px-2.5 py-1 transition-colors flex-shrink-0"
              >
                <RefreshCw className="h-3 w-3" />Retrain<ChevronRight className="h-3 w-3" />
              </button>
            </div>
          ))}
          {watchFeatures.map((f: any) => (
            <div key={f.feature} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-amber-800">Watch — {f.feature}</span>
                <p className="text-xs text-amber-600 mt-0.5">PSI = {f.psi.toFixed(2)} · Approaching drift threshold</p>
              </div>
            </div>
          ))}
          {degradedSources.map((s: any) => (
            <div key={s.name} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <Database className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-amber-800">Data Source {s.status} — {s.name}</span>
                <p className="text-xs text-amber-600 mt-0.5">Feed latency increased or unreachable.</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Summary KPIs ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Current Accuracy', value: `${currentAcc.toFixed(1)}%`, sub: 'Live production model', color: currentAcc >= 90 ? 'text-green-700' : 'text-red-700' },
          { label: 'Drift Alerts', value: alertFeatures.length, sub: 'Features PSI > 0.20', color: alertFeatures.length > 0 ? 'text-red-700' : 'text-green-700' },
          { label: 'Features on Watch', value: watchFeatures.length, sub: 'PSI 0.10 – 0.20', color: watchFeatures.length > 0 ? 'text-amber-700' : 'text-green-700' },
          { label: 'Last Retrained', value: retrainingLog[0]?.date || 'N/A', sub: retrainingLog[0]?.trigger || '', color: 'text-indigo-700' },
        ].map(({ label, value, sub, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <p className="text-xs text-gray-500 mt-1 truncate">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Accuracy Over Time ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Live Model Accuracy Over Time</CardTitle>
          <p className="text-sm text-gray-500">Trailing accuracy on live production traffic. Red dashed line = 90% SLA threshold.</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={accuracyOverTime} margin={{ left: 4, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[80, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Accuracy']} />
              <Legend />
              <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="5 3" label={{ value: '90% SLA', fill: '#ef4444', fontSize: 11, position: 'insideTopLeft' }} />
              <Line type="monotone" dataKey="accuracy" stroke="#6366f1" dot={{ r: 4, fill: '#6366f1' }} strokeWidth={2.5} name="Production Accuracy" activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Feature Drift Scores ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Live Feature Drift Detection (PSI / KS Test) - Calculated dynamically between <code>data/features.parquet</code> (Training) and the live prediction roster.</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Population Stability Index (PSI) and Kolmogorov-Smirnov test comparing training vs. live distribution. PSI &gt; 0.20 = Alert, PSI 0.10 &ndash; 0.20 = Watch.
              </p>
            </div>
            {alertFeatures.length > 0 && (
              <button
                onClick={() => setDialogType('retrain')}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />Trigger Retraining
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {driftScores.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  {['Feature', 'PSI Score', 'KS Statistic', 'Trend', 'Status'].map((h) => (
                    <th key={h} className="py-2 px-3 text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {driftScores.map((row: any) => (
                  <tr key={row.feature} className={`border-b border-gray-100 ${row.status === 'Alert' ? 'bg-red-50/40' : row.status === 'Watch' ? 'bg-amber-50/30' : 'hover:bg-gray-50'}`}>
                    <td className="py-3 px-3 font-medium text-gray-900">{row.feature}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${row.psi >= 0.20 ? 'bg-red-500' : row.psi >= 0.10 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min((row.psi / 0.30) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs">{row.psi.toFixed(3)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-gray-600">{row.ks.toFixed(3)}</td>
                    <td className="py-3 px-3"><TrendIcon trend={row.trend} /></td>
                    <td className="py-3 px-3"><DriftStatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex h-16 items-center justify-center text-gray-400">Not enough data to calculate drift.</div>
          )}
        </CardContent>
      </Card>

      {/* ── Retraining Log + Data Sources ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-indigo-600" />
                <CardTitle>Model Version Log</CardTitle>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Tracks historical snapshots captured in `training_history.json`</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  {['Date', 'Trigger', 'Δ Accuracy', 'Result'].map((h) => (
                    <th key={h} className="py-2 px-2 text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Optimistic "Pending" Row */}
                {isServerTraining && (
                  <tr className="border-b border-gray-100 bg-indigo-50/50 animate-pulse">
                    <td className="py-2 px-2 font-mono text-xs text-indigo-600">{new Date().toISOString().slice(0, 10)}</td>
                    <td className="py-2 px-2 text-xs text-indigo-700">Manual Training Job</td>
                    <td className="py-2 px-2 text-xs text-indigo-600">—</td>
                    <td className="py-2 px-2"><span className="flex items-center gap-1 text-xs text-indigo-700"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Pending</span></td>
                  </tr>
                )}
                {retrainingLog.map((r: any, i: number) => (
                  <tr key={r.date + i} className={`border-b border-gray-100 hover:bg-gray-50 ${i === 0 && !isServerTraining ? 'bg-indigo-50/30' : ''}`}>
                    <td className="py-2 px-2 font-mono text-xs text-gray-600">{r.date}</td>
                    <td className="py-2 px-2 text-xs text-gray-700 max-w-[160px] truncate" title={r.trigger}>{r.trigger}</td>
                    <td className="py-2 px-2">
                      <span className={`text-xs font-medium ${r.newAcc > r.prevAcc ? 'text-green-600' : r.newAcc < r.prevAcc ? 'text-red-600' : 'text-gray-500'}`}>
                        {r.newAcc > r.prevAcc ? '+' : ''}{(r.newAcc - r.prevAcc).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <RetrainingStatusBadge status={r.status} />
                        {i > 0 && (
                          <button
                            onClick={() => {
                              setRollbackTarget(r.date);
                              setDialogType('rollback');
                            }}
                            title="Rollback to this snapshot"
                            className="text-xs text-amber-600 hover:underline flex items-center gap-0.5 ml-2"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* ── Data Sources card ──── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-600" />
                <CardTitle>Data Sources & Compute</CardTitle>
                {isLive && (
                  <span className="text-xs bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
                    <Radio className="h-2.5 w-2.5 animate-pulse" /> Live
                  </span>
                )}
              </div>
              <button
                onClick={refresh}
                disabled={isSourcesLoading}
                className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${isSourcesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {isLive
                ? lastUpdated
                  ? `Live pings · checked ${Math.round((Date.now() - lastUpdated.getTime()) / 1_000)}s ago`
                  : 'Live pings'
                : 'Mock status'
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {sources.map((s: any) => (
              <div key={s.name} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${s.status === 'Healthy' ? 'bg-white border-gray-100' : s.status === 'Degraded' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                <SourceStatusDot status={s.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{s.name}</div>
                  <div className="text-xs text-gray-500">
                    {s.type} · Latency: {s.latency}
                    {s.responseTimeMs !== undefined && s.responseTimeMs > 0 && ` · ${s.responseTimeMs} ms`}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-medium text-gray-700">{s.records}</div>
                  <div className={`text-xs ${s.status === 'Healthy' ? 'text-green-600' : s.status === 'Degraded' ? 'text-amber-600' : 'text-red-600'}`}>{s.status}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}