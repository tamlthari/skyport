import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { Award, Zap, Target, Clock } from 'lucide-react';

const statusColor: Record<string, string> = {
  Production: 'bg-green-100 text-green-700 border-green-200',
  Trained: 'bg-blue-100 text-blue-700 border-blue-200',
  Baseline: 'bg-gray-100 text-gray-600 border-gray-200',
  "Not Trained": 'bg-red-100 text-red-600 border-red-200',
};

const modelColors: Record<string, string> = {
  'Transformer (Flight-DT)': '#6366f1',
  'Bi-LSTM': '#10b981',
  'XGBoost Ensemble': '#f59e0b',
  'LightGBM': '#ef4444',
  'Random': '#9ca3af',
};

interface ModelPerformanceProps {
  models: any[];
  viewedModel?: any;
}

export function ModelPerformance({ models, viewedModel }: ModelPerformanceProps) {
  // Use the actively viewed model from the dropdown, or default to Production
  const best = viewedModel || models.find(m => m.status === 'Production') || models[0];

  if (!best || best.status === "Not Trained") {
    return <div className="p-8 text-center text-red-500">No trained models available. Run train_all_models.py first.</div>;
  }

  const { tn, fp, fn, tp } = best.confusionMatrix || { tn: 0, fp: 0, fn: 0, tp: 0 };
  const total = tn + fp + fn + tp;

  // Pivot ROC data for Recharts
  const fprLevels = best.rocCurve ? best.rocCurve.map((pt: any) => pt.fpr) : [];
  const dynamicRocData = fprLevels.map((fpr: number, index: number) => {
    const dataPoint: any = { fpr };
    models.forEach(m => {
      if (m.status !== "Not Trained" && m.rocCurve) {
        dataPoint[m.name] = m.rocCurve[index]?.tpr || 0;
      }
    });
    return dataPoint;
  });

  // Pivot Loss data for Recharts (assuming max 25 epochs based on Transformer)
  const epochCount = 25;
  const dynamicLossData = Array.from({ length: epochCount }).map((_, epochIdx) => {
    const dataPoint: any = { epoch: epochIdx + 1 };
    models.forEach(m => {
      // Only plot models that actually returned a loss curve array that covers this epoch
      if (m.status !== "Not Trained" && m.lossCurve && m.lossCurve[epochIdx] !== undefined) {
        dataPoint[m.name] = m.lossCurve[epochIdx];
      }
    });
    return dataPoint;
  });

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Model Accuracy', value: `${best.accuracy}%`, sub: best.name, icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'AUC-ROC Score', value: best.aucRoc ? best.aucRoc.toFixed(3) : '—', sub: 'Target ≥ 0.88 ✓', icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'F1 Score', value: best.f1 ? best.f1.toFixed(3) : '—', sub: 'Precision / Recall balanced', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Inference Latency', value: best.inferenceMs ? `${best.inferenceMs.toFixed(2)} ms` : '—', sub: '10-flight batch load', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{label}</CardTitle>
              <div className={`p-1.5 rounded-md ${bg}`}><Icon className={`h-4 w-4 ${color}`} /></div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <p className="text-xs text-gray-500 mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Model Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Model Architecture Comparison</CardTitle>
          <p className="text-sm text-gray-500">Evaluated on held-out test set</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {['Model', 'Status', 'Accuracy', 'AUC-ROC', 'F1', 'Precision', 'Recall', 'Inference', 'Parameters', 'Trained Date'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.name} className={`border-b border-gray-100 ${m.status === 'Production' ? 'bg-indigo-50/40' : 'hover:bg-gray-50'}`}>
                  <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap">
                    {m.status === 'Production' && <span className="mr-1.5">⭐</span>}{m.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[m.status] || statusColor['Baseline']}`}>{m.status}</span>
                  </td>
                  <td className="py-3 px-3 font-medium">{m.accuracy ? `${m.accuracy}%` : '—'}</td>
                  <td className="py-3 px-3">{m.aucRoc ? m.aucRoc.toFixed(3) : '—'}</td>
                  <td className="py-3 px-3">{m.f1 ? m.f1.toFixed(3) : '—'}</td>
                  <td className="py-3 px-3">{m.precision ? m.precision.toFixed(3) : '—'}</td>
                  <td className="py-3 px-3">{m.recall ? m.recall.toFixed(3) : '—'}</td>
                  <td className="py-3 px-3">{m.inferenceMs ? `${m.inferenceMs.toFixed(2)} ms` : '—'}</td>
                  <td className="py-3 px-3 font-mono text-gray-600">{m.params || '—'}</td>
                  <td className="py-3 px-3 text-gray-500">{m.trainedOn || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ROC Curve & Training Curves Container */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ROC Curves</CardTitle>
            <p className="text-sm text-gray-500">True Positive Rate vs False Positive Rate</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dynamicRocData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fpr" tickFormatter={v => v.toFixed(1)} label={{ value: 'FPR', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                <YAxis domain={[0, 1]} tickFormatter={v => v.toFixed(1)} label={{ value: 'TPR', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={(v: number) => v.toFixed(3)} />
                <Legend />
                {models.map(m => {
                  if (m.status === "Not Trained") return null;
                  return (
                    <Line
                      key={m.name}
                      type="monotone"
                      dataKey={m.name}
                      stroke={modelColors[m.name] || '#000'}
                      dot={false}
                      strokeWidth={m.name === best.name ? 3 : 2}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training Loss Curves</CardTitle>
            <p className="text-sm text-gray-500">Cross-entropy loss per epoch</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dynamicLossData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} tickFormatter={v => v.toFixed(2)} />
                <Tooltip formatter={(v: number) => v.toFixed(4)} />
                <Legend />
                {models.map(m => {
                  if (m.status === "Not Trained" || !m.lossCurve) return null;
                  return (
                    <Line
                      key={`${m.name}-loss`}
                      type="monotone"
                      dataKey={m.name}
                      stroke={modelColors[m.name] || '#000'}
                      dot={false}
                      strokeWidth={m.name === best.name ? 3 : 2}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Confusion Matrix Container */}
      <Card>
        <CardHeader>
          <CardTitle>Confusion Matrix — {best.name}</CardTitle>
          <p className="text-sm text-gray-500">Test set: {total > 0 ? total.toLocaleString() : 0} flights · threshold = 0.50</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-8 flex-wrap">
            <div>
              <div className="mb-2 text-xs text-gray-500 text-center">Predicted</div>
              <div className="grid grid-cols-3 gap-1 text-center text-sm">
                <div />
                <div className="py-1 px-3 text-gray-500 font-medium text-xs">No Delay</div>
                <div className="py-1 px-3 text-gray-500 font-medium text-xs">Delay</div>

                <div className="flex items-center text-gray-500 font-medium text-xs pr-2" style={{ writingMode: 'horizontal-tb' }}>
                  <span className="[writing-mode:vertical-rl] rotate-180 text-xs text-gray-500">Actual</span>
                </div>
                <div />
                <div />

                <div className="flex items-center justify-end text-gray-500 text-xs pr-2">No Delay</div>
                <div className="rounded-lg p-4 bg-green-100 border-2 border-green-300 min-w-[100px]">
                  <div className="text-xl font-bold text-green-700">{tn.toLocaleString()}</div>
                  <div className="text-xs text-green-600">TN · {total > 0 ? ((tn / total) * 100).toFixed(1) : 0}%</div>
                </div>
                <div className="rounded-lg p-4 bg-red-100 border-2 border-red-200 min-w-[100px]">
                  <div className="text-xl font-bold text-red-700">{fp.toLocaleString()}</div>
                  <div className="text-xs text-red-500">FP · {total > 0 ? ((fp / total) * 100).toFixed(1) : 0}%</div>
                </div>

                <div className="flex items-center justify-end text-gray-500 text-xs pr-2">Delay</div>
                <div className="rounded-lg p-4 bg-orange-100 border-2 border-orange-200 min-w-[100px]">
                  <div className="text-xl font-bold text-orange-700">{fn.toLocaleString()}</div>
                  <div className="text-xs text-orange-500">FN · {total > 0 ? ((fn / total) * 100).toFixed(1) : 0}%</div>
                </div>
                <div className="rounded-lg p-4 bg-green-100 border-2 border-green-300 min-w-[100px]">
                  <div className="text-xl font-bold text-green-700">{tp.toLocaleString()}</div>
                  <div className="text-xs text-green-600">TP · {total > 0 ? ((tp / total) * 100).toFixed(1) : 0}%</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              {[
                { label: 'Accuracy', value: total > 0 ? `${(((tn + tp) / total) * 100).toFixed(1)}%` : '—', color: 'text-indigo-600' },
                { label: 'Precision', value: (tp + fp) > 0 ? `${((tp / (tp + fp)) * 100).toFixed(1)}%` : '—', color: 'text-green-600' },
                { label: 'Recall', value: (tp + fn) > 0 ? `${((tp / (tp + fn)) * 100).toFixed(1)}%` : '—', color: 'text-blue-600' },
                { label: 'F1 Score', value: (() => { if (tp === 0) return '—'; const p = tp / (tp + fp); const r = tp / (tp + fn); return (2 * p * r / (p + r)).toFixed(3); })(), color: 'text-amber-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-20">{label}</span>
                  <span className={`text-lg font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}