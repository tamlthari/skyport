import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useDataSourceHealth } from '../hooks/useDataSourceHealth';
import { USE_REAL_DATA, AIRPORT_ICAO, AIRPORT_IATA, ENDPOINTS } from '../services/config';
import {
  Database, CheckCircle2, XCircle, AlertTriangle, Copy, Check,
  RefreshCw, Terminal, Server, Zap, GitBranch, Globe,
  Lock, ChevronDown, ChevronRight, ExternalLink, Radio,
  FlaskConical, CloudRain, Shield,
} from 'lucide-react';

// ─── Code block with copy button ─────────────────────────────────────────────

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code.trim();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-700 mt-3">
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 text-xs font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre">
        {code.trim()}
      </pre>
    </div>
  );
}

// ─── Step card wrapper ────────────────────────────────────────────────────────

function StepCard({
  number, title, subtitle, status, children,
}: {
  number: number;
  title: string;
  subtitle: string;
  status: 'complete' | 'pending' | 'warning';
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);

  const statusConfig = {
    complete: { dot: 'bg-green-500', ring: 'ring-green-200', bg: 'bg-green-50' },
    warning:  { dot: 'bg-amber-500', ring: 'ring-amber-200', bg: 'bg-amber-50'  },
    pending:  { dot: 'bg-gray-300',  ring: 'ring-gray-200',  bg: 'bg-gray-50'   },
  }[status];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ring-4 ${statusConfig.dot} ${statusConfig.ring}`}>
          <span className="text-white text-sm font-bold">{number}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        {expanded
          ? <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
        }
      </button>
      {expanded && (
        <div className={`px-5 pb-6 pt-1 border-t border-gray-100 ${statusConfig.bg}`}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Connection status dot ────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'Healthy' | 'Degraded' | 'Down' | 'unknown' }) {
  if (status === 'Healthy')  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />;
  if (status === 'Degraded') return <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />;
  if (status === 'Down')     return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />;
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-300 flex-shrink-0 animate-pulse" />;
}

// ─── Inline callout ───────────────────────────────────────────────────────────

function Callout({ type, children }: { type: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const config = {
    info:    { bg: 'bg-blue-50 border-blue-200',   icon: <Globe      className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" /> },
    warning: { bg: 'bg-amber-50 border-amber-200', icon: <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" /> },
    tip:     { bg: 'bg-green-50 border-green-200', icon: <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" /> },
  }[type];
  return (
    <div className={`flex items-start gap-2 border rounded-lg px-3 py-2.5 mt-3 text-sm ${config.bg}`}>
      {config.icon}
      <span className="text-gray-700">{children}</span>
    </div>
  );
}

// ─── External link helper ─────────────────────────────────────────────────────

function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DataPipelineGuide() {
  const { sources, isLive, isLoading, lastUpdated, refresh } = useDataSourceHealth();

  const healthyCount = sources.filter((s) => s.status === 'Healthy').length;
  const mlSource     = sources.find((s) => s.name.includes('ML Inference'));
  const notamSource  = sources.find((s) => s.name.includes('NOTAM'));
  const noaaSource   = sources.find((s) => s.name.includes('NOAA'));

  const overallStatus = healthyCount === sources.length
    ? 'All systems operational'
    : healthyCount >= sources.length - 1
    ? `${sources.length - healthyCount} source degraded`
    : `${sources.length - healthyCount} sources down`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <GitBranch className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Data Pipeline Setup</h1>
          </div>
          <p className="text-gray-600 max-w-xl">
            Step-by-step guide to connect real training data and live API feeds to SkyPort.
            Follow these 6 steps to move from mock data to production-quality ML predictions.
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium flex-shrink-0 ${
          USE_REAL_DATA
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-gray-100 border-gray-200 text-gray-700'
        }`}>
          <Radio className={`h-3.5 w-3.5 ${USE_REAL_DATA ? 'text-green-600 animate-pulse' : 'text-gray-400'}`} />
          {USE_REAL_DATA ? 'Live Mode Active' : 'Mock Mode — VITE_USE_REAL_DATA=false'}
        </div>
      </div>

      {/* ── Live Connection Status Panel ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-600" />
              <CardTitle>Connection Status</CardTitle>
              {isLive && (
                <span className="text-xs bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-gray-400">
                  Checked {Math.round((Date.now() - lastUpdated.getTime()) / 1_000)}s ago
                </span>
              )}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-2.5 py-1 transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          <div className={`flex items-center gap-2 mt-1 text-sm font-medium ${
            healthyCount === sources.length ? 'text-green-700' : 'text-amber-700'
          }`}>
            {healthyCount === sources.length
              ? <CheckCircle2 className="h-4 w-4" />
              : <AlertTriangle className="h-4 w-4" />
            }
            {overallStatus}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sources.map((s) => (
              <div
                key={s.name}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${
                  s.status === 'Healthy'  ? 'bg-white border-gray-100' :
                  s.status === 'Degraded' ? 'bg-amber-50 border-amber-200' :
                                            'bg-red-50 border-red-200'
                }`}
              >
                <StatusDot status={isLoading ? 'unknown' : s.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.type} · {s.latency}</p>
                  {s.responseTimeMs !== undefined && s.responseTimeMs > 0 && (
                    <p className="text-xs text-gray-400">{s.responseTimeMs} ms</p>
                  )}
                </div>
                <span className={`text-xs font-medium flex-shrink-0 ${
                  s.status === 'Healthy'  ? 'text-green-600' :
                  s.status === 'Degraded' ? 'text-amber-600' : 'text-red-600'
                }`}>{s.status}</span>
              </div>
            ))}
          </div>

          {!USE_REAL_DATA && (
            <div className="mt-4 flex items-start gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700">
                Status above is <strong>simulated mock data</strong> — connection pings are disabled.
                Set <code className="bg-indigo-100 px-1 rounded font-mono">VITE_USE_REAL_DATA=true</code> in your{' '}
                <code className="bg-indigo-100 px-1 rounded font-mono">.env</code> to enable live checks.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Data Flow Diagram ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Data Flow Architecture</CardTitle>
          <p className="text-sm text-gray-500">How real data moves from raw sources to dashboard predictions</p>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-xl p-5 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
            <pre>{`
┌─ DATA SOURCES ──────────────────────────────────────────────────────────────┐
│                                                                              │
│  [BTS CSV / REST]   ──→  Nightly ETL job                                    │
│  [OAG REST]         ──→  6-hour schedule sync      ┌─────────────────────┐  │
│  [NOAA METAR]       ──→  Poll every 15 min    ─→   │   Feature Store     │  │
│  [FAA TFMS]         ──→  Poll every 5 min     ─→   │  (Parquet / DB)     │  │
│  [FAA NOTAM]        ──→  Poll every 2 min     ─→   │                     │  │
│                                                     │  · Per-flight rows  │  │
└─────────────────────────────────────────────────────│  · Joined features  │  │
                                                      └─────────┬───────────┘  │
                                                                │               
                                          ┌─────────────────────┴──────────────┐
                                          │         Feature Assembler          │
                                          │  Joins on flight_id + time_window  │
                                          └─────────────┬──────────────────────┘
                                                        │
                          ┌─────────────────────────────┴────────────────────────┐
                          │                                                        │
                   ┌──────┴──────┐                                   ┌────────────┴──────────┐
                   │ Training    │                                   │  Inference Server     │
                   │ (weekly /   │                                   │  FastAPI / Flask      │
                   │  on drift)  │                                   │  GET /predictions     │
                   └──────┬──────┘                                   │  GET /health          │
                          │                                           └────────────┬──────────┘
                          └───────────────────────────────────────────────────────┘
                                                                                   │
                                                                                   ↓
                                                             SkyPort Dashboard (React)
                                                           useFlightPredictions() hook
                                                         → Dispatcher review badges
                                                         → Manager KPIs + risk table
                                                         → Ground Services flight cards`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEPS                                                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      <div className="space-y-4">

        {/* ── STEP 1: Prerequisites ──────────────────────────────────────── */}
        <StepCard
          number={1}
          title="Install Prerequisites"
          subtitle="Python 3.10+, pip, a free FAA API key, and (optional) a FlightAware key"
          status="pending"
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Terminal,    label: 'Python 3.10+',    note: 'For training scripts + inference server' },
                { icon: Server,      label: 'Node.js 18+',     note: 'Already running (this dashboard)' },
                { icon: Shield,      label: 'FAA API Key',     note: 'Free at api.faa.gov — for NOTAM feed' },
                { icon: FlaskConical,label: 'Git + Docker',    note: 'Optional — for containerised deployment' },
              ].map(({ icon: Icon, label, note }) => (
                <div key={label} className="flex items-start gap-3 bg-white rounded-lg border border-gray-200 px-3 py-2.5">
                  <Icon className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{note}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Install Python ML dependencies</p>
              <CodeBlock language="bash" code={`
# Clone / navigate to your project repo
cd skyport-ml

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\\Scripts\\activate

# Install all dependencies
pip install pandas numpy scikit-learn xgboost lightgbm \\
            torch torchvision fastapi uvicorn pydantic   \\
            shap mlflow python-dotenv requests pyarrow
              `} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Register for a free FAA API key</p>
              <div className="flex flex-wrap gap-3">
                <DocLink href="https://api.faa.gov/login">Register at api.faa.gov →</DocLink>
                <DocLink href="https://aviationweather.gov/data/api/">NOAA Aviation Weather API →</DocLink>
                <DocLink href="https://nasstatus.faa.gov">FAA NAS Status (ATC) →</DocLink>
              </div>
            </div>
          </div>
        </StepCard>

        {/* ── STEP 2: Configure .env ──────────────────────────────────────── */}
        <StepCard
          number={2}
          title="Configure Environment Variables"
          subtitle="Copy .env.example → .env and fill in your API keys"
          status="pending"
        >
          <div className="space-y-4 pt-2">
            <Callout type="info">
              Your <code className="font-mono bg-blue-100 px-1 rounded">.env</code> file is already
              gitignored. Never commit API keys to version control.
            </Callout>
            <p className="text-sm text-gray-700">
              A <code className="font-mono bg-gray-100 px-1 rounded">.env.example</code> file has been created at the project root.
              Copy it and fill in your values:
            </p>
            <CodeBlock language="bash" code={`
cp .env.example .env
# Then edit .env with your values
            `} />

            <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
              <div className="text-gray-500 mb-2"># .env — current effective values</div>
              <div><span className="text-amber-400">VITE_USE_REAL_DATA</span>=<span className="text-green-400">{String(USE_REAL_DATA)}</span></div>
              <div><span className="text-amber-400">VITE_AIRPORT_ICAO</span>=<span className="text-green-400">{AIRPORT_ICAO}</span></div>
              <div><span className="text-amber-400">VITE_AIRPORT_IATA</span>=<span className="text-green-400">{AIRPORT_IATA}</span></div>
              <div><span className="text-amber-400">VITE_ML_API_URL</span>=<span className="text-green-400">{ENDPOINTS.mlInference}</span></div>
              <div><span className="text-amber-400">VITE_FAA_API_KEY</span>=<span className="text-gray-500">&lt;not set&gt;</span></div>
              <div><span className="text-amber-400">VITE_API_PROXY_URL</span>=<span className="text-gray-500">&lt;not set&gt;</span></div>
            </div>

            <Callout type="warning">
              <strong>Security:</strong> Vite exposes all <code className="font-mono bg-amber-100 px-1 rounded">VITE_*</code> variables
              in the browser bundle. For production, proxy sensitive keys
              (FAA NOTAM, FlightAware) through <code className="font-mono bg-amber-100 px-1 rounded">VITE_API_PROXY_URL</code> —
              see Step 5b for the proxy server template.
            </Callout>
          </div>
        </StepCard>

        {/* ── STEP 3: Download Training Data ───────────────────────────────── */}
        <StepCard
          number={3}
          title="Download & Build Training Data"
          subtitle="BTS historical flights + NOAA METAR backfill → feature store"
          status="pending"
        >
          <div className="space-y-5 pt-2">
            {/* 3a — BTS */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-indigo-500" />
                <p className="text-sm font-semibold text-gray-800">3a — BTS On-Time Performance data (free)</p>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Download 3–5 years of on-time data for your airport from the Bureau of Transportation Statistics.
                This provides the ground-truth <code className="font-mono bg-gray-100 px-1 rounded">delay_minutes</code> labels
                and the <strong>Historical Delay Rate (18.6%)</strong> feature.
              </p>
              <CodeBlock language="python" code={`
# scripts/download_bts.py
import requests, zipfile, io, pandas as pd
from pathlib import Path

AIRPORT = "JFK"   # change to your airport
YEARS   = range(2021, 2026)

dfs = []
for year in YEARS:
    for month in range(1, 13):
        url = (
            "https://www.transtats.bts.gov/DownLoad_Table.asp?"
            f"Table_ID=236&Has_Group=3&Is_Zipped=0"
            f"&Geo={AIRPORT}&Year={year}&Period={month}"
        )
        r = requests.get(url, timeout=30)
        if r.ok:
            dfs.append(pd.read_csv(io.StringIO(r.text)))
            print(f"Downloaded {year}-{month:02d}")

df = pd.concat(dfs, ignore_index=True)
Path("data/raw").mkdir(parents=True, exist_ok=True)
df.to_parquet("data/raw/bts_ontime.parquet", index=False)
print(f"Saved {len(df):,} rows")
              `} />
              <Callout type="tip">
                The BTS download page at{' '}
                <DocLink href="https://www.transtats.bts.gov/DL_SelectFields.aspx">transtats.bts.gov</DocLink>
                {' '}also offers manual CSV downloads if the API is slow.
              </Callout>
            </div>

            {/* 3b — METAR backfill */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-semibold text-gray-800">3b — NOAA METAR historical backfill (free)</p>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Download historical METAR observations to backfill the weather features.
                Use the NOAA ISD (Integrated Surface Database) for multi-year records.
              </p>
              <CodeBlock language="python" code={`
# scripts/download_metar_history.py
import requests, pandas as pd
from pathlib import Path

STATION = "72502094789"  # JFK WBAN station ID — find yours at ncdc.noaa.gov
YEARS   = range(2021, 2026)

dfs = []
for year in YEARS:
    url = (
        f"https://www.ncei.noaa.gov/data/global-hourly/access/{year}/"
        f"{STATION}.csv"
    )
    r = requests.get(url, timeout=60)
    if r.ok:
        dfs.append(pd.read_csv(
            pd.io.common.StringIO(r.text),
            low_memory=False
        ))
        print(f"Downloaded {year}")

df = pd.concat(dfs, ignore_index=True)
df.to_parquet("data/raw/metar_history.parquet", index=False)
print(f"Saved {len(df):,} METAR observations")
              `} />
            </div>

            {/* 3c — Build feature store */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-gray-800">3c — Build the feature store</p>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Join all sources on <code className="font-mono bg-gray-100 px-1 rounded">flight_date + departure_hour</code>,
                apply the transformations from <code className="font-mono bg-gray-100 px-1 rounded">dataTransformers.ts</code> (mirrored in Python),
                and write the ML-ready feature matrix.
              </p>
              <CodeBlock language="python" code={`
# scripts/build_features.py
import pandas as pd
import numpy as np

bts    = pd.read_parquet("data/raw/bts_ontime.parquet")
metar  = pd.read_parquet("data/raw/metar_history.parquet")

# --- Parse & normalize BTS ---
bts["FL_DATE"]    = pd.to_datetime(bts["FL_DATE"])
bts["DEP_HOUR"]   = bts["CRS_DEP_TIME"].astype(str).str.zfill(4).str[:2].astype(int)
bts["IS_DELAYED"] = (bts["ARR_DELAY_NEW"].fillna(0) >= 15).astype(int)
bts["DELAY_CAUSE"] = bts.apply(classify_delay_cause, axis=1)  # your rule engine

# --- Cyclical encoding ---
bts["DEP_HOUR_SIN"] = np.sin(2 * np.pi * bts["DEP_HOUR"] / 24)
bts["DEP_HOUR_COS"] = np.cos(2 * np.pi * bts["DEP_HOUR"] / 24)
bts["DOW_SIN"]      = np.sin(2 * np.pi * bts["FL_DATE"].dt.dayofweek / 7)
bts["DOW_COS"]      = np.cos(2 * np.pi * bts["FL_DATE"].dt.dayofweek / 7)

# --- Join METAR on (STATION, DATE, HOUR) ---
metar_agg = aggregate_metar_by_hour(metar)  # your aggregation function
features  = bts.merge(metar_agg, on=["FL_DATE", "DEP_HOUR"], how="left")

# --- Save feature store ---
features.to_parquet("data/features.parquet", index=False)
print(f"Feature store: {len(features):,} rows × {len(features.columns)} columns")
              `} />
            </div>
          </div>
        </StepCard>

        {/* ── STEP 4: Train the Models ──────────────────────────────────────── */}
        <StepCard
          number={4}
          title="Train the ML Models"
          subtitle="XGBoost baseline → Transformer (Flight-DT) production model"
          status="pending"
        >
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-700">
              Train the four models used in the Data Scientist dashboard. Start with XGBoost (fast, 12 ms inference)
              to validate your features, then train the Transformer for production.
            </p>

            {/* 4a — XGBoost baseline */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">4a — XGBoost / LightGBM baseline (fastest)</p>
              <CodeBlock language="python" code={`
# scripts/train_xgboost.py
import pandas as pd, numpy as np, xgboost as xgb
import mlflow
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, f1_score

FEATURES = [
    "HIST_DELAY_RATE_ROUTE",  # rolling 90-day delay % for this route
    "WEATHER_SEVERITY_SCORE", # from compute_weather_severity_score()
    "DEP_HOUR_SIN", "DEP_HOUR_COS",
    "DOW_SIN", "DOW_COS",
    "TURNAROUND_MINUTES",     # from OAG aircraft positioning data
    "CARRIER_ONTIME_RATE",    # rolling 30-day carrier on-time %
    "AIRPORT_CONGESTION_IDX", # from FAA ASPM
    "ROUTE_DISTANCE_MI",
    "WIND_SPEED_KT",
    "ATC_DELAY_PROGRAM",      # 0/1 from FAA TFMS
    "ATC_AVG_DELAY_MIN",
]
TARGET = "IS_DELAYED"

df = pd.read_parquet("data/features.parquet").dropna(subset=FEATURES + [TARGET])
X, y = df[FEATURES], df[TARGET]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

with mlflow.start_run(run_name="xgboost-baseline"):
    model = xgb.XGBClassifier(
        n_estimators=400, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        scale_pos_weight=y_train.value_counts()[0] / y_train.value_counts()[1],
        use_label_encoder=False, eval_metric="logloss",
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)

    preds = model.predict_proba(X_test)[:, 1]
    auc   = roc_auc_score(y_test, preds)
    f1    = f1_score(y_test, preds > 0.5)
    print(f"AUC-ROC: {auc:.4f}  F1: {f1:.4f}")

    mlflow.xgboost.log_model(model, "xgboost-model")
    mlflow.log_metrics({"auc_roc": auc, "f1": f1})

model.save_model("models/xgboost_baseline.json")
              `} />
            </div>

            {/* 4b — Transformer */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">4b — Transformer (Flight-DT) production model</p>
              <CodeBlock language="python" code={`
# scripts/train_transformer.py
"""
Flight-DT: Transformer encoder for flight delay prediction.
Architecture: 87-dim feature → positional embedding → 6 encoder layers
              → mean-pool → 2-layer MLP → sigmoid(delay_probability)
"""
import torch, torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import mlflow.pytorch

class FlightDT(nn.Module):
    def __init__(self, input_dim=87, d_model=256, nhead=8, n_layers=6):
        super().__init__()
        self.input_proj  = nn.Linear(input_dim, d_model)
        encoder_layer    = nn.TransformerEncoderLayer(d_model, nhead, dim_feedforward=1024, batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, n_layers)
        self.head        = nn.Sequential(
            nn.Linear(d_model, 128), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(128, 1), nn.Sigmoid()
        )

    def forward(self, x):                       # x: (batch, seq, input_dim)
        x = self.input_proj(x)
        x = self.transformer(x)
        return self.head(x.mean(dim=1)).squeeze()

model   = FlightDT()
optim   = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-5)
loss_fn = nn.BCELoss()

for epoch in range(30):
    for X_batch, y_batch in train_loader:
        pred  = model(X_batch.unsqueeze(1))     # add sequence dim
        loss  = loss_fn(pred, y_batch.float())
        optim.zero_grad(); loss.backward(); optim.step()
    print(f"Epoch {epoch+1}/30  loss={loss.item():.4f}")

torch.save(model.state_dict(), "models/flight_dt_latest.pt")
mlflow.pytorch.log_model(model, "flight-dt-model")
              `} />
            </div>

            <Callout type="tip">
              Run <code className="font-mono bg-green-100 px-1 rounded">mlflow ui</code> in your project directory
              to compare training runs, AUC-ROC scores, and feature importance across all four model types.
            </Callout>
          </div>
        </StepCard>

        {/* ── STEP 5: Start Inference Server ──────────────────────────────── */}
        <StepCard
          number={5}
          title="Start the ML Inference Server"
          subtitle="FastAPI server that serves live predictions to the dashboard"
          status={mlSource?.status === 'Healthy' ? 'complete' : 'pending'}
        >
          <div className="space-y-4 pt-2">
            {mlSource && mlSource.status !== 'Healthy' && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  ML Inference Server is <strong className="text-red-700">unreachable</strong> at{' '}
                  <code className="font-mono bg-gray-100 px-1 rounded">{ENDPOINTS.mlInference}</code>.
                  Complete this step and restart the dev server.
                </p>
              </div>
            )}

            {/* 5a — FastAPI server */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">5a — Create <code className="font-mono">inference_server.py</code></p>
              <CodeBlock language="python" code={`
# inference_server.py  —  place this in your Python project root
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch, xgboost as xgb
import pandas as pd
from typing import List

app = FastAPI(title="SkyPort ML Inference API", version="1.0.0")

# Allow requests from your Vite dev server (change for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Load model once at startup ──────────────────────────────────────────────
model = xgb.XGBClassifier()
model.load_model("models/xgboost_baseline.json")
# For Transformer: model = FlightDT(); model.load_state_dict(torch.load(...))

class FlightPrediction(BaseModel):
    flightNumber:   str
    route:          str
    delayProb:      int     # 0–100
    confidence:     int     # 0–100 (model calibration confidence)
    causeAttrib:    str     # top cause with probability, e.g. "Weather (62%)"
    dispatchReview: bool    # auto-set when confidence < 70

# ── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/predictions", response_model=List[FlightPrediction])
async def get_predictions():
    """
    Runs inference on today's active flights.
    1. Fetch today's flight schedule (from your AODB or OAG)
    2. Fetch current METAR + ATC status
    3. Build feature vectors using buildFlightFeatureVector()
    4. Run model.predict_proba()
    5. Return predictions
    """
    # ---- Replace this block with your real data fetch + inference ----
    active_flights = load_todays_schedule()         # your function
    features_df    = build_feature_matrix(active_flights)  # your pipeline
    proba          = model.predict_proba(features_df)[:, 1]

    return [
        FlightPrediction(
            flightNumber   = row.flight_number,
            route          = f"{row.origin} → {row.dest}",
            delayProb      = int(p * 100),
            confidence     = compute_confidence(model, features_df.iloc[i]),
            causeAttrib    = get_top_cause(model, features_df.iloc[i]),
            dispatchReview = compute_confidence(model, features_df.iloc[i]) < 70,
        )
        for i, (_, row) in enumerate(active_flights.iterrows())
        for p in [proba[i]]
    ]

@app.get("/health")
async def health():
    return {
        "status":        "healthy",
        "model_version": "2026-04-16",
        "model_type":    "XGBoost Ensemble",
    }
              `} />
            </div>

            {/* 5b — Start command */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">5b — Start the server</p>
              <CodeBlock language="bash" code={`
# From your Python project directory:
uvicorn inference_server:app --host 0.0.0.0 --port 8000 --reload

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)

# Test it:
curl http://localhost:8000/health
# → {"status":"healthy","model_version":"2026-04-16","model_type":"XGBoost Ensemble"}

curl http://localhost:8000/predictions
# → [{"flightNumber":"AA123","route":"JFK → LAX","delayProb":12,...}]
              `} />
            </div>

            {/* 5c — Proxy server for FAA keys */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">
                <Lock className="inline h-3.5 w-3.5 mr-1 text-amber-500" />
                5c — Optional: backend proxy for API keys (Node.js, ~20 lines)
              </p>
              <p className="text-sm text-gray-600 mb-1">
                This hides your FAA NOTAM API key from the browser bundle and handles CORS for restricted APIs.
              </p>
              <CodeBlock language="javascript" code={`
// scripts/proxy-server.js  —  run with: node scripts/proxy-server.js
const http      = require('http');
const httpProxy = require('http-proxy');  // npm install http-proxy
const url       = require('url');

const proxy = httpProxy.createProxy();
const PORT  = 3001;

http.createServer((req, res) => {
  const target = url.parse(req.url, true).query.url;
  if (!target) { res.writeHead(400); res.end('Missing ?url='); return; }

  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,client_id');

  // Inject FAA API key server-side so it never touches the browser
  req.headers['client_id'] = process.env.FAA_API_KEY;

  proxy.web(req, res, { target, changeOrigin: true }, (err) => {
    res.writeHead(502); res.end(String(err));
  });
}).listen(PORT, () => console.log(\`Proxy running on port \${PORT}\`));
              `} />
              <CodeBlock language="bash" code={`
# Install dependency
npm install http-proxy

# Start proxy (set FAA key as env var — never in .env for server secrets)
FAA_API_KEY=your_faa_key_here node scripts/proxy-server.js

# Then set in your .env:
# VITE_API_PROXY_URL=http://localhost:3001
              `} />
            </div>
          </div>
        </StepCard>

        {/* ── STEP 6: Enable Live Mode ──────────────────────────────────────── */}
        <StepCard
          number={6}
          title="Enable Live Data Mode"
          subtitle="Set VITE_USE_REAL_DATA=true and restart the dev server"
          status={USE_REAL_DATA ? 'complete' : 'pending'}
        >
          <div className="space-y-4 pt-2">
            {USE_REAL_DATA ? (
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">
                  <strong>Live mode is already active.</strong>{' '}
                  The dashboard is polling real APIs. Check the Connection Status panel above for feed health.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-700">
                  Once your inference server is running and API keys are set, flip the feature flag.
                  The dashboard will immediately start polling real data.
                </p>
                <CodeBlock language="bash" code={`
# Edit your .env file:
VITE_USE_REAL_DATA=true

# Restart the Vite dev server for the change to take effect:
# (Ctrl+C then restart, or trigger a hot-reload in Figma Make)
                `} />
              </>
            )}

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-800">What changes when you flip the flag</p>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  {
                    component: 'ConfidenceScores.tsx',
                    before:    'Static currentFlightPredictions from mlData.ts',
                    after:     'Polls GET /predictions every 5 minutes',
                    badge:     'indigo',
                  },
                  {
                    component: 'ModelMonitoring.tsx',
                    before:    'Static dataSources mock array',
                    after:     'Live HEAD pings to all 6 data sources every 1 minute',
                    badge:     'indigo',
                  },
                  {
                    component: 'ManagerDashboard.tsx',
                    before:    'Mock dispatcher review badges',
                    after:     'Real confidence scores → live badge updates',
                    badge:     'blue',
                  },
                  {
                    component: 'GroundServicesDashboard.tsx',
                    before:    'Mock review flags on flight cards',
                    after:     'Real ML confidence thresholds drive review state',
                    badge:     'teal',
                  },
                ].map(({ component, before, after, badge }) => (
                  <div key={component} className="flex items-start gap-3 px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${badge}-100 text-${badge}-700 border border-${badge}-200 font-mono flex-shrink-0 mt-0.5`}>
                      {component}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 line-through">{before}</p>
                      <p className="text-xs text-gray-800 mt-0.5">→ {after}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </StepCard>

      </div>{/* end steps */}

      {/* ── Training Data Reference Table ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Training Feature Reference</CardTitle>
          <p className="text-sm text-gray-500">
            All 10 model features, their data source, and how to obtain them
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                {['#', 'Feature', 'Importance', 'Source', 'How to get it'].map((h) => (
                  <th key={h} className="py-2 px-3 text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { rank: 1, feature: 'Historical Delay Rate (Route)', pct: '18.6%', source: 'BTS',          how: 'Compute rolling 90-day delay % per route from bts_ontime.parquet' },
                { rank: 2, feature: 'Weather Severity Score',         pct: '16.4%', source: 'NOAA METAR',   how: 'computeWeatherSeverityScore(metar) — see dataTransformers.ts' },
                { rank: 3, feature: 'Departure Hour',                 pct: '14.2%', source: 'BTS/OAG',      how: 'CRS_DEP_TIME → cyclical sin/cos encoding' },
                { rank: 4, feature: 'Aircraft Turnaround Time',       pct: '11.8%', source: 'OAG',          how: 'OAG Aircraft Status API — time from arrival to next departure' },
                { rank: 5, feature: 'Carrier On-Time Rate',           pct: '9.7%',  source: 'BTS',          how: 'Rolling 30-day on-time % per carrier from BTS' },
                { rank: 6, feature: 'Airport Congestion Index',       pct: '8.8%',  source: 'FAA ASPM',     how: 'FAA ASPM API — throughput vs. capacity ratio' },
                { rank: 7, feature: 'Day of Week',                    pct: '7.1%',  source: 'Derived',      how: 'FL_DATE.dayofweek → cyclical sin/cos encoding' },
                { rank: 8, feature: 'Season / Holiday Flag',          pct: '6.2%',  source: 'OPM Calendar', how: 'Boolean flag from US federal holidays + school breaks lookup' },
                { rank: 9, feature: 'Route Distance',                 pct: '4.8%',  source: 'OAG/FAA',      how: 'Great-circle distance from airport coordinate pairs' },
                { rank: 10, feature: 'METAR Wind Speed',              pct: '2.4%',  source: 'NOAA METAR',   how: 'metar.windSpeedKt — direct from fetchMetar()' },
              ].map(({ rank, feature, pct, source, how }) => (
                <tr key={rank} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-400 font-mono text-xs">{rank}</td>
                  <td className="py-2.5 px-3 font-medium text-gray-900">{feature}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5">
                      {pct}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs font-medium text-gray-600">{source}</td>
                  <td className="py-2.5 px-3 text-xs text-gray-500">{how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

    </div>
  );
}
