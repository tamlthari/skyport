// ─── ML / Data Scientist mock data ───────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// MODEL PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════

export const modelComparison = [
  {
    name: 'Transformer (Flight-DT)',
    accuracy: 92.4,
    aucRoc: 0.913,
    f1: 0.908,
    precision: 0.921,
    recall: 0.896,
    inferenceMs: 45,
    trainedOn: '2024-11-15',
    status: 'Production',
    params: '124 M',
    framework: 'PyTorch',
  },
  {
    name: 'Bi-LSTM',
    accuracy: 91.1,
    aucRoc: 0.901,
    f1: 0.895,
    precision: 0.908,
    recall: 0.883,
    inferenceMs: 38,
    trainedOn: '2024-11-10',
    status: 'Staging',
    params: '47 M',
    framework: 'PyTorch',
  },
  {
    name: 'XGBoost Ensemble',
    accuracy: 89.7,
    aucRoc: 0.887,
    f1: 0.881,
    precision: 0.893,
    recall: 0.870,
    inferenceMs: 12,
    trainedOn: '2024-10-28',
    status: 'Baseline',
    params: '—',
    framework: 'XGBoost',
  },
  {
    name: 'LightGBM',
    accuracy: 88.9,
    aucRoc: 0.881,
    f1: 0.874,
    precision: 0.886,
    recall: 0.863,
    inferenceMs: 9,
    trainedOn: '2024-10-20',
    status: 'Baseline',
    params: '—',
    framework: 'LightGBM',
  },
];

// Simulated ROC curve data (FPR → TPR per model)
export const rocCurveData = [
  { fpr: 0.00, transformer: 0.000, lstm: 0.000, xgboost: 0.000, lightgbm: 0.000, random: 0.000 },
  { fpr: 0.02, transformer: 0.312, lstm: 0.298, xgboost: 0.267, lightgbm: 0.251, random: 0.020 },
  { fpr: 0.05, transformer: 0.582, lstm: 0.563, xgboost: 0.521, lightgbm: 0.501, random: 0.050 },
  { fpr: 0.10, transformer: 0.741, lstm: 0.718, xgboost: 0.684, lightgbm: 0.661, random: 0.100 },
  { fpr: 0.15, transformer: 0.822, lstm: 0.803, xgboost: 0.771, lightgbm: 0.748, random: 0.150 },
  { fpr: 0.20, transformer: 0.874, lstm: 0.856, xgboost: 0.826, lightgbm: 0.804, random: 0.200 },
  { fpr: 0.30, transformer: 0.922, lstm: 0.907, xgboost: 0.881, lightgbm: 0.862, random: 0.300 },
  { fpr: 0.40, transformer: 0.951, lstm: 0.938, xgboost: 0.916, lightgbm: 0.899, random: 0.400 },
  { fpr: 0.50, transformer: 0.968, lstm: 0.957, xgboost: 0.940, lightgbm: 0.926, random: 0.500 },
  { fpr: 0.70, transformer: 0.984, lstm: 0.977, xgboost: 0.964, lightgbm: 0.953, random: 0.700 },
  { fpr: 1.00, transformer: 1.000, lstm: 1.000, xgboost: 1.000, lightgbm: 1.000, random: 1.000 },
];

// Deterministic training loss curves
export const trainingHistory = [
  { epoch: 1,  transformer: 0.680, lstm: 0.720, xgboost: 0.710 },
  { epoch: 3,  transformer: 0.572, lstm: 0.614, xgboost: 0.598 },
  { epoch: 5,  transformer: 0.487, lstm: 0.531, xgboost: 0.512 },
  { epoch: 7,  transformer: 0.421, lstm: 0.463, xgboost: 0.443 },
  { epoch: 10, transformer: 0.352, lstm: 0.389, xgboost: 0.374 },
  { epoch: 13, transformer: 0.298, lstm: 0.334, xgboost: 0.318 },
  { epoch: 16, transformer: 0.254, lstm: 0.287, xgboost: 0.271 },
  { epoch: 20, transformer: 0.204, lstm: 0.232, xgboost: 0.219 },
  { epoch: 24, transformer: 0.167, lstm: 0.193, xgboost: 0.184 },
  { epoch: 28, transformer: 0.143, lstm: 0.167, xgboost: 0.161 },
  { epoch: 30, transformer: 0.135, lstm: 0.158, xgboost: 0.154 },
];

// Confusion matrix – Transformer (production model), n = 2000 test samples
export const confusionMatrixData = {
  tn: 1124, // True Negative  – correctly predicted on-time
  fp: 98,   // False Positive – predicted delay, was on-time
  fn: 54,   // False Negative – predicted on-time, actually delayed
  tp: 724,  // True Positive  – correctly predicted delayed
};

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE ENGINEERING
// ═══════════════════════════════════════════════════════════════════════════

export const delayCauseDistribution = [
  { cause: 'Weather',      count: 312, percentage: 28.4, fill: '#3b82f6' },
  { cause: 'Carrier',      count: 287, percentage: 26.1, fill: '#f59e0b' },
  { cause: 'NAS / ATC',   count: 234, percentage: 21.3, fill: '#8b5cf6' },
  { cause: 'Late Aircraft',count: 198, percentage: 18.0, fill: '#ef4444' },
  { cause: 'Security',     count: 69,  percentage: 6.3,  fill: '#6b7280' },
];

export const featureImportance = [
  { feature: 'Historical Delay Rate (Route)', importance: 18.6 },
  { feature: 'Weather Severity Score',        importance: 16.4 },
  { feature: 'Departure Hour',                importance: 14.2 },
  { feature: 'Aircraft Turnaround Time',      importance: 11.8 },
  { feature: 'Carrier On-Time Rate',          importance: 9.7  },
  { feature: 'Airport Congestion Index',      importance: 8.8  },
  { feature: 'Day of Week',                   importance: 7.1  },
  { feature: 'Season / Holiday Flag',         importance: 6.2  },
  { feature: 'Route Distance',                importance: 4.8  },
  { feature: 'METAR Wind Speed',              importance: 2.4  },
];

export const delayDurationDistribution = [
  { label: '0–15 min',   count: 412 },
  { label: '15–30 min',  count: 287 },
  { label: '30–60 min',  count: 198 },
  { label: '60–120 min', count: 134 },
  { label: '120–180 min',count: 67  },
  { label: '180+ min',   count: 24  },
];

export const specialCasesStats = [
  { case: 'Timezone Conversions',   handled: 1247, errors: 3, accuracy: '99.8%' },
  { case: 'Overnight Flights',      handled: 342,  errors: 7, accuracy: '98.0%' },
  { case: 'Diversions',             handled: 58,   errors: 4, accuracy: '93.1%' },
  { case: 'Cancellations',          handled: 214,  errors: 2, accuracy: '99.1%' },
  { case: 'Irregular Operations',   handled: 129,  errors: 9, accuracy: '93.0%' },
];

// ═══════════════════════════════════════════════════════════════════════════
// CONFIDENCE SCORES
// ═══════════════════════════════════════════════════════════════════════════

export const featureReliability = [
  { feature: 'Carrier Schedule (OAG)',  reliability: 96, window: 'Static',    source: 'OAG',  impact: 'High'   },
  { feature: 'Historical Route Data',   reliability: 94, window: 'All-time',  source: 'BTS',  impact: 'High'   },
  { feature: 'Aircraft Positioning',    reliability: 91, window: 'Real-time', source: 'OAG',  impact: 'High'   },
  { feature: 'Current Weather (METAR)', reliability: 91, window: '0–2 h',     source: 'NOAA', impact: 'High'   },
  { feature: 'ATC Flow Control',        reliability: 82, window: '0–3 h',     source: 'FAA',  impact: 'Medium' },
  { feature: 'Weather Forecast 2–6 h',  reliability: 78, window: '2–6 h',     source: 'NOAA', impact: 'Medium' },
  { feature: 'NOTAM Alerts',            reliability: 73, window: '0–24 h',    source: 'FAA',  impact: 'Medium' },
  { feature: 'Weather Forecast 6–12 h', reliability: 54, window: '6–12 h',    source: 'NOAA', impact: 'Low'    },
];

export const causalAttributionConfidence = [
  { cause: 'Weather Delay',         confidence: 88, note: 'Direct METAR correlation — high signal' },
  { cause: 'NAS / ATC Delay',       confidence: 82, note: 'ATC flow report available for window' },
  { cause: 'Security Delay',        confidence: 71, note: 'NOTAM correlation — moderate signal' },
  { cause: 'Carrier Delay',         confidence: 79, note: 'Depends on carrier data completeness' },
  { cause: 'Late Aircraft (cascade)',confidence: 64, note: 'Upstream leg inference — lower confidence' },
];

export const currentFlightPredictions = [
  { flightNumber: 'AA123', route: 'JFK → LAX', delayProb: 12, confidence: 94, causeAttrib: 'Weather (62%)',  dispatchReview: false },
  { flightNumber: 'UA789', route: 'JFK → SFO', delayProb: 78, confidence: 87, causeAttrib: 'Carrier (71%)',  dispatchReview: false },
  { flightNumber: 'AF123', route: 'CDG → JFK', delayProb: 91, confidence: 61, causeAttrib: 'NAS (44%)',      dispatchReview: true  },
  { flightNumber: 'DL456', route: 'ORD → JFK', delayProb: 34, confidence: 83, causeAttrib: 'Weather (58%)', dispatchReview: false },
  { flightNumber: 'EK456', route: 'DXB → JFK', delayProb: 8,  confidence: 96, causeAttrib: 'N/A',           dispatchReview: false },
  { flightNumber: 'LH890', route: 'FRA → JFK', delayProb: 55, confidence: 67, causeAttrib: 'NAS (38%)',      dispatchReview: true  },
  { flightNumber: 'QR789', route: 'DOH → JFK', delayProb: 22, confidence: 91, causeAttrib: 'Carrier (49%)', dispatchReview: false },
];

// ═══════════════════════════════════════════════════════════════════════════
// ROBUSTNESS ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

export const performanceByCarrierType = [
  { type: 'Legacy Airlines',     accuracy: 92.4, aucRoc: 0.913, f1: 0.908, flights: 4821 },
  { type: 'Low-Cost Carriers',   accuracy: 91.8, aucRoc: 0.907, f1: 0.901, flights: 3247 },
  { type: 'Regional Operators',  accuracy: 88.2, aucRoc: 0.876, f1: 0.869, flights: 1893 },
  { type: 'Charter / Special',   accuracy: 84.7, aucRoc: 0.841, f1: 0.834, flights: 412  },
];

export const seasonalPerformance = [
  { month: 'Jan', accuracy: 91.2, delayRate: 31.2 },
  { month: 'Feb', accuracy: 90.8, delayRate: 28.7 },
  { month: 'Mar', accuracy: 91.7, delayRate: 24.3 },
  { month: 'Apr', accuracy: 92.1, delayRate: 21.8 },
  { month: 'May', accuracy: 92.4, delayRate: 20.1 },
  { month: 'Jun', accuracy: 91.8, delayRate: 26.4 },
  { month: 'Jul', accuracy: 91.3, delayRate: 29.8 },
  { month: 'Aug', accuracy: 91.6, delayRate: 27.3 },
  { month: 'Sep', accuracy: 92.3, delayRate: 22.1 },
  { month: 'Oct', accuracy: 92.8, delayRate: 19.4 },
  { month: 'Nov', accuracy: 91.4, delayRate: 25.7 },
  { month: 'Dec', accuracy: 90.1, delayRate: 34.1 },
];

export const dataCompletenessScenarios = [
  { scenario: 'Full Data',         accuracy: 92.4 },
  { scenario: 'Missing METAR',     accuracy: 88.1 },
  { scenario: 'Missing ATC Feed',  accuracy: 89.3 },
  { scenario: 'Sparse Route Data', accuracy: 84.7 },
  { scenario: 'No NOTAM',          accuracy: 90.8 },
  { scenario: 'Partial All Feeds', accuracy: 83.2 },
];

export const robustnessTechniques = [
  {
    technique: 'Data Augmentation',
    description: 'Synthetic delay scenarios generated from historical edge cases (storms, holidays, IROPS)',
    impact: '+1.8% accuracy on sparse routes',
    status: 'Active',
  },
  {
    technique: 'Transfer Learning',
    description: 'Pretrained on 12 similar hub airports, fine-tuned on local traffic patterns',
    impact: '+3.2% on new routes (<6 months history)',
    status: 'Active',
  },
  {
    technique: 'Ensemble Voting',
    description: 'Weighted combination of XGBoost + LSTM + Transformer for low-confidence predictions',
    impact: '+0.9% AUC-ROC overall',
    status: 'Active',
  },
  {
    technique: 'KNN Imputation',
    description: 'Rule-based + k-NN imputation for missing real-time feeds (METAR, ATC, NOTAM)',
    impact: 'Maintains 89%+ accuracy under 30% data loss',
    status: 'Active',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MODEL MONITORING & DRIFT DETECTION
// ═══════════════════════════════════════════════════════════════════════════

export const modelAccuracyOverTime = [
  { date: 'Sep 1',  accuracy: 92.8, threshold: 90.0 },
  { date: 'Sep 8',  accuracy: 92.4, threshold: 90.0 },
  { date: 'Sep 15', accuracy: 91.9, threshold: 90.0 },
  { date: 'Sep 22', accuracy: 91.4, threshold: 90.0 },
  { date: 'Sep 29', accuracy: 92.1, threshold: 90.0 },
  { date: 'Oct 6',  accuracy: 92.6, threshold: 90.0 },
  { date: 'Oct 13', accuracy: 92.4, threshold: 90.0 },
  { date: 'Oct 20', accuracy: 91.7, threshold: 90.0 },
  { date: 'Oct 27', accuracy: 90.9, threshold: 90.0 },
  { date: 'Nov 3',  accuracy: 91.3, threshold: 90.0 },
  { date: 'Nov 10', accuracy: 92.2, threshold: 90.0 },
  { date: 'Nov 17', accuracy: 92.4, threshold: 90.0 },
];

export const featureDriftScores = [
  { feature: 'Historical Delay Rate',       psi: 0.04, ks: 0.032, status: 'Stable', trend: 'stable' },
  { feature: 'Weather Severity Score',       psi: 0.07, ks: 0.058, status: 'Stable', trend: 'up'     },
  { feature: 'Departure Hour Distribution',  psi: 0.03, ks: 0.024, status: 'Stable', trend: 'stable' },
  { feature: 'Aircraft Turnaround Time',     psi: 0.14, ks: 0.112, status: 'Watch',  trend: 'up'     },
  { feature: 'Carrier On-Time Rate',         psi: 0.09, ks: 0.074, status: 'Stable', trend: 'up'     },
  { feature: 'Airport Congestion Index',     psi: 0.22, ks: 0.187, status: 'Alert',  trend: 'up'     },
  { feature: 'Day of Week Pattern',          psi: 0.02, ks: 0.018, status: 'Stable', trend: 'stable' },
  { feature: 'Season / Holiday Flag',        psi: 0.01, ks: 0.009, status: 'Stable', trend: 'stable' },
];

export const retrainingLog = [
  { date: '2024-11-15', trigger: 'Scheduled (weekly)',           duration: '4 h 23 m', prevAcc: 91.8, newAcc: 92.4, status: 'Success'  },
  { date: '2024-11-01', trigger: 'Drift Alert (PSI > 0.20)',     duration: '5 h 11 m', prevAcc: 90.2, newAcc: 91.8, status: 'Success'  },
  { date: '2024-10-15', trigger: 'Scheduled (weekly)',           duration: '4 h 47 m', prevAcc: 91.3, newAcc: 90.2, status: 'Degraded' },
  { date: '2024-10-01', trigger: 'Manual (new airline policy)',  duration: '6 h 02 m', prevAcc: 92.1, newAcc: 91.3, status: 'Success'  },
  { date: '2024-09-15', trigger: 'Scheduled (weekly)',           duration: '4 h 18 m', prevAcc: 91.6, newAcc: 92.1, status: 'Success'  },
];

export const dataSources = [
  { name: 'BTS (Bureau of Transportation Statistics)', type: 'Historical', latency: 'Daily',      status: 'Healthy',  records: '42.3 M' },
  { name: 'OAG Schedule Data',                          type: 'Schedule',  latency: 'Weekly',     status: 'Healthy',  records: '8.1 M'  },
  { name: 'NOAA / METAR Weather Feed',                  type: 'Real-time', latency: '< 15 min',   status: 'Healthy',  records: 'Stream' },
  { name: 'FAA ATC Flow Control',                       type: 'Real-time', latency: '< 5 min',    status: 'Healthy',  records: 'Stream' },
  { name: 'FAA NOTAM API',                              type: 'Real-time', latency: '< 2 min',    status: 'Degraded', records: 'Stream' },
  { name: 'ML Inference Server (Flight-DT)',            type: 'Real-time', latency: 'On-demand',  status: 'Healthy',  records: 'Stream'      },
];

export const featureDictionary = [
  { id: 1, name: 'Historical Delay Rate (Route)', source: 'BTS', description: 'Compute rolling 90-day delay % per route from bts_ontime.parquet' },
  { id: 2, name: 'Weather Severity Score', source: 'NOAA METAR', description: 'computeWeatherSeverityScore(metar) — see dataTransformers.ts' },
  { id: 3, name: 'Departure Hour', source: 'BTS/OAG', description: 'CRS_DEP_TIME → cyclical sin/cos encoding' },
  { id: 4, name: 'Aircraft Turnaround Time', source: 'OAG', description: 'OAG Aircraft Status API — time from arrival to next departure' },
  { id: 5, name: 'Carrier On-Time Rate', source: 'BTS', description: 'Rolling 30-day on-time % per carrier from BTS' },
  { id: 6, name: 'Airport Congestion Index', source: 'FAA ASPM', description: 'FAA ASPM API — throughput vs. capacity ratio' },
  { id: 7, name: 'Day of Week', source: 'FL_DATE.dayofweek', description: '→ cyclical sin/cos encoding' },
  { id: 8, name: 'Season / Holiday Flag', source: 'OPM Calendar', description: 'Boolean flag from US federal holidays + school breaks lookup' },
  { id: 9, name: 'Route Distance', source: 'OAG/FAA', description: 'Great-circle distance from airport coordinate pairs' },
  { id: 10, name: 'METAR Wind Speed', source: 'NOAA METAR', description: 'metar.windSpeedKt — direct from fetchMetar()' }
];
