"""
train_all_models.py — Train all 4 model architectures
=======================================================
Trains XGBoost, LightGBM, Bi-LSTM, and Transformer (Flight-DT) on the
feature store, evaluates each on a held-out test set, and saves:
  - Model artifacts to models/
  - Metrics JSON to models/metrics.json (consumed by the inference server)

Usage:
  cd skyport-ml
  source .venv/bin/activate
  python scripts/train_all_models.py
"""

import json
import time
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score, f1_score, precision_score, recall_score,
    confusion_matrix, roc_curve,
)
import joblib

FEATURES = [
    "HIST_DELAY_RATE_ROUTE", "WEATHER_SEVERITY_SCORE",
    "DEP_HOUR_SIN", "DEP_HOUR_COS", "DOW_SIN", "DOW_COS",
    "TURNAROUND_MINUTES", "CARRIER_ONTIME_RATE",
    "AIRPORT_CONGESTION_IDX", "ROUTE_DISTANCE_MI",
    "WIND_SPEED_KT", "ATC_DELAY_PROGRAM", "ATC_AVG_DELAY_MIN",
    "SEASON_HOLIDAY_FLAG",
]
TARGET = "IS_DELAYED"
MODELS_DIR = Path("models")
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def load_data():
    """Load feature store and split into train/test."""
    df = pd.read_parquet("data/features.parquet").dropna(subset=FEATURES + [TARGET])
    X, y = df[FEATURES].values, df[TARGET].values
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    print(f"Data: {len(df):,} total → {len(X_train):,} train / {len(X_test):,} test")
    print(f"Delay rate: {y.mean()*100:.1f}%\n")
    return X_train, X_test, y_train, y_test


def evaluate(name, y_test, proba, train_time_s, inference_ms):
    """Compute all metrics for a model."""
    preds = (proba >= 0.5).astype(int)
    auc = roc_auc_score(y_test, proba)
    f1 = f1_score(y_test, preds)
    prec = precision_score(y_test, preds, zero_division=0)
    rec = recall_score(y_test, preds, zero_division=0)
    acc = (preds == y_test).mean() * 100
    tn, fp, fn, tp = confusion_matrix(y_test, preds).ravel()

    # ROC curve points
    fpr_arr, tpr_arr, _ = roc_curve(y_test, proba)
    # Sample 11 points for the dashboard chart
    fpr_samples = [0.0, 0.02, 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.70, 1.0]
    tpr_samples = list(np.interp(fpr_samples, fpr_arr, tpr_arr))

    print(f"  {name}: Acc={acc:.1f}% AUC={auc:.3f} F1={f1:.3f} P={prec:.3f} R={rec:.3f} [{train_time_s:.1f}s]")

    return {
        "name": name,
        "accuracy": round(acc, 1),
        "aucRoc": round(auc, 3),
        "f1": round(f1, 3),
        "precision": round(prec, 3),
        "recall": round(rec, 3),
        "trainTimeSeconds": round(train_time_s, 1),
        "inferenceMs": round(inference_ms, 2),
        "trainedOn": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "confusionMatrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "rocCurve": [{"fpr": round(f, 3), "tpr": round(t, 3)} for f, t in zip(fpr_samples, tpr_samples)],
    }


# ─── Model 1: XGBoost Ensemble ─────────────────────────────────────────────

def train_xgboost(X_train, X_test, y_train, y_test):
    import xgboost as xgb
    print("Training XGBoost Ensemble ...")
    t0 = time.time()
    model = xgb.XGBClassifier(
        n_estimators=300, max_depth=8, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        scale_pos_weight=(y_train == 0).sum() / (y_train == 1).sum(),
        use_label_encoder=False, eval_metric="logloss",
        tree_method="hist", n_jobs=-1,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=0)
    train_time = time.time() - t0

    model.save_model(str(MODELS_DIR / "xgboost_ensemble.json"))
    
    # Measure inference time for a batch of 10 flights
    t_inf = time.time()
    _ = model.predict_proba(X_test[:10])
    inference_ms = (time.time() - t_inf) * 1000

    proba = model.predict_proba(X_test)[:, 1]

    metrics = evaluate("XGBoost Ensemble", y_test, proba, train_time, inference_ms)
    metrics["status"] = "Trained"
    metrics["params"] = f"{model.get_num_boosting_rounds()} trees"
    metrics["framework"] = "XGBoost"
    metrics["featureImportance"] = dict(zip(FEATURES, [round(float(v), 4) for v in model.feature_importances_]))
    
    # Downsample training loss to 25 points to match epochs of NN models
    try:
        loss_arr = model.evals_result()['validation_0']['logloss']
        step = max(1, len(loss_arr) // 25)
        metrics["lossCurve"] = [round(l, 4) for l in loss_arr[::step][:25]]
    except:
        pass

    return metrics


# ─── Model 2: LightGBM ─────────────────────────────────────────────────────

def train_lightgbm(X_train, X_test, y_train, y_test):
    import lightgbm as lgb
    print("Training LightGBM ...")
    t0 = time.time()
    model = lgb.LGBMClassifier(
        n_estimators=300, max_depth=8, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        scale_pos_weight=(y_train == 0).sum() / (y_train == 1).sum(),
        verbose=-1, n_jobs=-1,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)])
    train_time = time.time() - t0

    joblib.dump(model, MODELS_DIR / "lightgbm.joblib")
    
    # Measure inference time
    t_inf = time.time()
    _ = model.predict_proba(X_test[:10])
    inference_ms = (time.time() - t_inf) * 1000

    proba = model.predict_proba(X_test)[:, 1]

    metrics = evaluate("LightGBM", y_test, proba, train_time, inference_ms)
    metrics["status"] = "Trained"
    metrics["params"] = f"{model.n_estimators} trees"
    metrics["framework"] = "LightGBM"
    metrics["featureImportance"] = dict(zip(FEATURES, [round(float(v)/max(model.feature_importances_)*100, 2) for v in model.feature_importances_]))
    return metrics


# ─── Model 3: Bi-LSTM ──────────────────────────────────────────────────────

def train_bilstm(X_train, X_test, y_train, y_test):
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset

    print("Training Bi-LSTM ...")

    class BiLSTM(nn.Module):
        def __init__(self, input_dim, hidden_dim=128, n_layers=2):
            super().__init__()
            self.lstm = nn.LSTM(input_dim, hidden_dim, n_layers,
                                batch_first=True, bidirectional=True, dropout=0.2)
            self.head = nn.Sequential(
                nn.Linear(hidden_dim * 2, 64), nn.ReLU(), nn.Dropout(0.2),
                nn.Linear(64, 1)
            )

        def forward(self, x):
            out, _ = self.lstm(x)
            return self.head(out[:, -1, :]).squeeze(-1)

    device = torch.device("cpu")
    X_tr = torch.FloatTensor(X_train).unsqueeze(1).to(device)
    y_tr = torch.FloatTensor(y_train).to(device)
    X_te = torch.FloatTensor(X_test).unsqueeze(1).to(device)

    dataset = TensorDataset(X_tr, y_tr)
    loader = DataLoader(dataset, batch_size=512, shuffle=True)

    model = BiLSTM(len(FEATURES)).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-5)
    pos_weight = torch.tensor([(y_train == 0).sum() / max((y_train == 1).sum(), 1)])
    loss_fn = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    loss_history = []
    t0 = time.time()
    model.train()
    for epoch in range(20):
        epoch_loss = 0
        for xb, yb in loader:
            pred = model(xb)
            loss = loss_fn(pred, yb)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        
        avg_loss = epoch_loss / len(loader)
        loss_history.append(round(avg_loss, 4))
        if (epoch + 1) % 5 == 0:
            print(f"    Epoch {epoch+1}/20  loss={avg_loss:.4f}")
    train_time = time.time() - t0

    torch.save(model.state_dict(), MODELS_DIR / "bilstm.pt")

    model.eval()
    
    # Measure inference time
    t_inf = time.time()
    with torch.no_grad():
        _ = torch.sigmoid(model(X_te[:10]))
    inference_ms = (time.time() - t_inf) * 1000

    with torch.no_grad():
        proba = torch.sigmoid(model(X_te)).cpu().numpy()

    param_count = sum(p.numel() for p in model.parameters())
    metrics = evaluate("Bi-LSTM", y_test, proba, train_time, inference_ms)
    metrics["status"] = "Trained"
    metrics["params"] = f"{param_count/1e6:.1f} M"
    metrics["framework"] = "PyTorch"
    metrics["lossCurve"] = loss_history
    return metrics


# ─── Model 4: Transformer (Flight-DT) ──────────────────────────────────────

def train_transformer(X_train, X_test, y_train, y_test):
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset

    print("Training Transformer (Flight-DT) ...")

    class FlightDT(nn.Module):
        def __init__(self, input_dim, d_model=128, nhead=4, n_layers=3):
            super().__init__()
            self.input_proj = nn.Linear(input_dim, d_model)
            self.pos_enc = nn.Parameter(torch.randn(1, 1, d_model) * 0.02)
            encoder_layer = nn.TransformerEncoderLayer(
                d_model, nhead, dim_feedforward=256,
                batch_first=True, dropout=0.1, activation='gelu'
            )
            self.transformer = nn.TransformerEncoder(encoder_layer, n_layers)
            self.norm = nn.LayerNorm(d_model)
            self.head = nn.Sequential(
                nn.Linear(d_model, 64), nn.GELU(), nn.Dropout(0.1),
                nn.Linear(64, 1)
            )

        def forward(self, x):
            x = self.input_proj(x) + self.pos_enc
            x = self.transformer(x)
            x = self.norm(x)
            return self.head(x.mean(dim=1)).squeeze(-1)

    device = torch.device("cpu")
    X_tr = torch.FloatTensor(X_train).unsqueeze(1).to(device)
    y_tr = torch.FloatTensor(y_train).to(device)
    X_te = torch.FloatTensor(X_test).unsqueeze(1).to(device)

    dataset = TensorDataset(X_tr, y_tr)
    loader = DataLoader(dataset, batch_size=512, shuffle=True)

    model = FlightDT(len(FEATURES)).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=25)
    pos_weight = torch.tensor([(y_train == 0).sum() / max((y_train == 1).sum(), 1)])
    loss_fn = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    loss_history = []
    t0 = time.time()
    model.train()
    for epoch in range(25):
        epoch_loss = 0
        for xb, yb in loader:
            pred = model(xb)
            loss = loss_fn(pred, yb)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        scheduler.step()
        
        avg_loss = epoch_loss / len(loader)
        loss_history.append(round(avg_loss, 4))
        if (epoch + 1) % 5 == 0:
            print(f"    Epoch {epoch+1}/25  loss={avg_loss:.4f}")
    train_time = time.time() - t0

    torch.save(model.state_dict(), MODELS_DIR / "flight_dt.pt")

    model.eval()

    # Measure inference time
    t_inf = time.time()
    with torch.no_grad():
        _ = torch.sigmoid(model(X_te[:10]))
    inference_ms = (time.time() - t_inf) * 1000

    with torch.no_grad():
        proba = torch.sigmoid(model(X_te)).cpu().numpy()

    param_count = sum(p.numel() for p in model.parameters())
    metrics = evaluate("Transformer (Flight-DT)", y_test, proba, train_time, inference_ms)
    metrics["status"] = "Production"
    metrics["params"] = f"{param_count/1e6:.1f} M"
    metrics["framework"] = "PyTorch"
    metrics["lossCurve"] = loss_history
    return metrics


# ─── Main ───────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Training all 4 model architectures")
    print("=" * 60 + "\n")

    X_train, X_test, y_train, y_test = load_data()

    all_metrics = []

    # 1. XGBoost
    try:
        all_metrics.append(train_xgboost(X_train, X_test, y_train, y_test))
    except Exception as e:
        print(f"  ⚠ XGBoost failed: {e}")
        all_metrics.append({"name": "XGBoost Ensemble", "status": "Not Trained", "framework": "XGBoost"})

    # 2. LightGBM
    try:
        all_metrics.append(train_lightgbm(X_train, X_test, y_train, y_test))
    except Exception as e:
        print(f"  ⚠ LightGBM failed: {e}")
        all_metrics.append({"name": "LightGBM", "status": "Not Trained", "framework": "LightGBM"})

    # 3. Bi-LSTM
    try:
        all_metrics.append(train_bilstm(X_train, X_test, y_train, y_test))
    except Exception as e:
        print(f"  ⚠ Bi-LSTM failed: {e}")
        all_metrics.append({"name": "Bi-LSTM", "status": "Not Trained", "framework": "PyTorch"})

    # 4. Transformer
    try:
        all_metrics.append(train_transformer(X_train, X_test, y_train, y_test))
    except Exception as e:
        print(f"  ⚠ Transformer failed: {e}")
        all_metrics.append({"name": "Transformer (Flight-DT)", "status": "Not Trained", "framework": "PyTorch"})

    # Sort by accuracy (best first), trained models first
    all_metrics.sort(key=lambda m: (-1 if m.get("status") == "Not Trained" else 0, -m.get("accuracy", 0)))

    # Mark best as Production
    # for m in all_metrics:
    #     if m.get("status") == "Not Trained":
    #         continue
    #     if m == all_metrics[0]:
    #         m["status"] = "Production"
    #     elif m.get("status") != "Production":
    #         m["status"] = "Trained"

    # Filter out the models that actually finished training
    trained_models = [m for m in all_metrics if m.get("status") != "Not Trained"]

    if trained_models:
        # 1. The highest accuracy model becomes "Production"
        trained_models[0]["status"] = "Production"
        
        # 2. If we have multiple models, the lowest accuracy becomes the "Baseline"
        if len(trained_models) > 1:
            trained_models[-1]["status"] = "Baseline"
            
        # 3. Any models in the middle remain standard "Trained" challengers
        for m in trained_models[1:-1]:
            m["status"] = "Trained"
            
    # Save metrics JSON
    metrics_path = MODELS_DIR / "metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"\n✅ All metrics saved to {metrics_path}")

    # Print summary
    print("\n" + "=" * 60)
    print(f"  {'Model':<28} {'Acc':>6} {'AUC':>6} {'F1':>6} {'Status':<12}")
    print("-" * 60)
    for m in all_metrics:
        if m.get("status") == "Not Trained":
            print(f"  {m['name']:<28} {'—':>6} {'—':>6} {'—':>6} {m['status']:<12}")
        else:
            print(f"  {m['name']:<28} {m['accuracy']:>5.1f}% {m['aucRoc']:>5.3f} {m['f1']:>5.3f} {m['status']:<12}")
    print("=" * 60)


if __name__ == "__main__":
    main()