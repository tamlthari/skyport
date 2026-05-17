"""
build_features.py — Unified Feature Engineering Pipeline
=========================================================
Engineers all 10 features for the SkyPort flight delay prediction model.
Supports both the massive Kaggle dataset and the lightweight nycflights13 dataset.

Usage:
  python build_features.py --dataset nycflights13
  python build_features.py --dataset kaggle --years 2021 2022
"""

import argparse
import io
import zipfile
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import requests

try:
    import holidays as holidays_pkg
except ImportError:
    holidays_pkg = None
    print("⚠  `holidays` package not installed. Feature #8 will use a static list.")

warnings.filterwarnings("ignore")

# ─── Configuration & Dynamic Pathing ────────────────────────────────────────
# Resolves to the 'skyport-ml' root directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent

KAGGLE_ZIP = PROJECT_ROOT / "data" / "raw" / "kaggle_flights.zip"
NYC_FLIGHTS_PATH = PROJECT_ROOT / "data" / "raw" / "nycflights_bts.parquet"
NYC_METAR_PATH = PROJECT_ROOT / "data" / "raw" / "nycflights_metar.parquet"
METAR_CACHE = PROJECT_ROOT / "data" / "raw" / "metar_iem.parquet"
OUTPUT_PATH = PROJECT_ROOT / "data" / "features.parquet"

BTS_COLS = [
    "FlightDate", "Airline", "Origin", "Dest", "Cancelled", "Diverted",
    "CRSDepTime", "DepTime", "DepDelayMinutes", "DepDelay",
    "ArrTime", "CRSArrTime", "Distance", "DayOfWeek",
    "IATA_Code_Marketing_Airline", "Flight_Number_Marketing_Airline",
    "Operating_Airline", "Tail_Number", "TaxiOut", "TaxiIn",
]

IEM_STATION_MAP = {
    "JFK": "JFK", "LAX": "LAX", "ORD": "ORD", "ATL": "ATL",
    "DFW": "DFW", "DEN": "DEN", "SFO": "SFO", "SEA": "SEA",
}

AIRPORT_CAPACITY = {"JFK": 80, "LAX": 120, "ORD": 140, "ATL": 160}

SCHOOL_BREAKS = [
    ("12-20", "01-05"), ("03-10", "03-25"), 
    ("06-10", "09-05"), ("11-20", "11-30")
]


# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: Load Raw Data (Kaggle OR nycflights13)
# ═══════════════════════════════════════════════════════════════════════════

def load_kaggle_bts(airport: str, years: list[int]) -> pd.DataFrame:
    if not KAGGLE_ZIP.exists():
        raise FileNotFoundError(f"Kaggle dataset not found at {KAGGLE_ZIP}.")

    dfs = []
    with zipfile.ZipFile(KAGGLE_ZIP, "r") as z:
        for year in years:
            parquet_name = f"Combined_Flights_{year}.parquet"
            csv_name = f"Combined_Flights_{year}.csv"

            if parquet_name in z.namelist():
                with z.open(parquet_name) as f:
                    df = pd.read_parquet(io.BytesIO(f.read()), columns=BTS_COLS)
            elif csv_name in z.namelist():
                with z.open(csv_name) as f:
                    df = pd.read_csv(f, usecols=BTS_COLS, low_memory=False)
            else:
                continue

            mask = (df["Origin"] == airport) | (df["Dest"] == airport)
            dfs.append(df[mask].copy())

    bts = pd.concat(dfs, ignore_index=True)
    print(f"  Total: {len(bts):,} Kaggle flights loaded\n")
    return bts

def load_nycflights_bts() -> (pd.DataFrame, pd.DataFrame):
    if not NYC_FLIGHTS_PATH.exists():
        raise FileNotFoundError(f"nycflights not found at {NYC_FLIGHTS_PATH}. Run download_data.py first.")
    
    bts = pd.read_parquet(NYC_FLIGHTS_PATH)
    metar = pd.read_parquet(NYC_METAR_PATH)
    
    # Map nycflights columns to Kaggle standard format
    bts["FlightDate"] = pd.to_datetime(bts[['year', 'month', 'day']])
    bts["Cancelled"] = bts["dep_time"].isna().astype(int)
    bts["Diverted"] = 0 
    bts["DepDelayMinutes"] = bts["dep_delay"].clip(lower=0)
    
    bts.rename(columns={
        "carrier": "Airline", "flight": "Flight_Number_Marketing_Airline",
        "origin": "Origin", "dest": "Dest", "distance": "Distance",
        "sched_dep_time": "CRSDepTime", "dep_time": "DepTime",
        "sched_arr_time": "CRSArrTime", "arr_time": "ArrTime",
        "tailnum": "Tail_Number"
    }, inplace=True)
    
    bts["IATA_Code_Marketing_Airline"] = bts["Airline"]
    bts["Operating_Airline"] = bts["Airline"]

    # Map weather to IEM METAR format
    metar["valid"] = pd.to_datetime(metar[['year', 'month', 'day', 'hour']])
    metar["sknt"] = metar["wind_speed"] * 0.868976 # mph to kt
    metar["gust"] = metar["wind_gust"] * 0.868976
    metar.rename(columns={"visib": "vsby"}, inplace=True)
    
    print(f"  Total: {len(bts):,} nycflights loaded\n")
    return bts, metar


def download_iem_metar(station: str, year_start: int, year_end: int) -> pd.DataFrame:
    if METAR_CACHE.exists():
        print(f"  METAR cache found at {METAR_CACHE}, loading ...")
        return pd.read_parquet(METAR_CACHE)

    iem_station = IEM_STATION_MAP.get(station, station)
    print(f"  Downloading METAR for station {iem_station} ({year_start}–{year_end}) from IEM ...")
    
    url = (f"https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py?"
           f"station={iem_station}&data=tmpf&data=dwpf&data=sknt&data=gust&data=vsby&data=wxcodes"
           f"&tz=UTC&format=onlycomma&year1={year_start}&month1=1&day1=1&year2={year_end + 1}&month2=1&day2=1")

    try:
        r = requests.get(url, timeout=120)
        r.raise_for_status()
        metar = pd.read_csv(io.StringIO(r.text), na_values=["M", ""])
        METAR_CACHE.parent.mkdir(parents=True, exist_ok=True)
        metar.to_parquet(METAR_CACHE, index=False)
        print(f"    → {len(metar):,} observations downloaded and cached")
        return metar
    except Exception as e:
        print(f"  ⚠ METAR download failed: {e}")
        return pd.DataFrame()


# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: Parse & Normalize
# ═══════════════════════════════════════════════════════════════════════════

def parse_bts(bts: pd.DataFrame) -> pd.DataFrame:
    bts["FL_DATE"] = pd.to_datetime(bts["FlightDate"])
    bts["DEP_HOUR"] = (bts["CRSDepTime"].fillna(0).astype(int) // 100).clip(0, 23)
    bts["IS_DELAYED"] = (bts["DepDelayMinutes"].fillna(0) >= 15).astype(int)
    bts = bts[~bts["Cancelled"].astype(bool) & ~bts["Diverted"].astype(bool)].copy()

    bts["carrier"] = bts["IATA_Code_Marketing_Airline"].fillna(bts["Operating_Airline"])
    bts["flight"] = bts["Flight_Number_Marketing_Airline"].fillna(0).astype(int).astype(str)
    bts["origin"] = bts["Origin"]
    bts["dest"] = bts["Dest"]
    return bts


# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: Engineer Features
# ═══════════════════════════════════════════════════════════════════════════

def engineer_feature_1_hist_delay_rate(bts: pd.DataFrame) -> pd.DataFrame:
    print("  #1 Historical Delay Rate (Route) ...")
    bts = bts.sort_values("FL_DATE")
    bts["_route"] = bts["origin"] + "-" + bts["dest"]
    bts["HIST_DELAY_RATE_ROUTE"] = bts.groupby("_route")["IS_DELAYED"].transform(
        lambda x: x.rolling(window=90, min_periods=10).mean()
    )
    bts["HIST_DELAY_RATE_ROUTE"] = bts["HIST_DELAY_RATE_ROUTE"].fillna(bts.groupby("_route")["IS_DELAYED"].transform("mean"))
    bts.drop(columns=["_route"], inplace=True)
    return bts

def compute_weather_severity(row) -> float:
    score = 0.0
    wind, gust, vis, wx = row.get("sknt", 0) or 0, row.get("gust", 0) or 0, row.get("vsby", 10) or 10, str(row.get("wxcodes", "") or "")
    if wind > 25: score += 30
    elif wind > 15: score += 15
    if gust > 35: score += 20
    elif gust > 25: score += 10
    if vis < 1: score += 50
    elif vis < 3: score += 25
    elif vis < 5: score += 10
    if "TS" in wx: score += 40
    if "FG" in wx: score += 20
    if "SN" in wx: score += 15
    if "FZ" in wx: score += 25
    return min(score, 100)

def engineer_feature_2_10_weather(bts: pd.DataFrame, metar: pd.DataFrame) -> pd.DataFrame:
    print("  #2 Weather Severity Score & #10 METAR Wind Speed ...")
    if metar.empty:
        np.random.seed(42)
        bts["WIND_SPEED_KT"] = np.random.gamma(2, 5, len(bts)).clip(0, 50)
        bts["WEATHER_SEVERITY_SCORE"] = np.where(bts["WIND_SPEED_KT"] > 15, bts["WIND_SPEED_KT"] * 2, 10)
        return bts

    metar["valid"] = pd.to_datetime(metar["valid"], errors="coerce")
    metar = metar.dropna(subset=["valid"])
    metar["FL_DATE"] = metar["valid"].dt.normalize()
    metar["DEP_HOUR"] = metar["valid"].dt.hour

    metar["WIND_SPEED_KT"] = metar["sknt"].fillna(0).astype(float)
    metar["WEATHER_SEVERITY_SCORE"] = metar.apply(compute_weather_severity, axis=1)

    metar_hourly = metar.groupby(["FL_DATE", "DEP_HOUR"]).agg(
        WIND_SPEED_KT=("WIND_SPEED_KT", "mean"), WEATHER_SEVERITY_SCORE=("WEATHER_SEVERITY_SCORE", "max")
    ).reset_index()

    bts = bts.merge(metar_hourly, on=["FL_DATE", "DEP_HOUR"], how="left")
    bts["WIND_SPEED_KT"] = bts["WIND_SPEED_KT"].fillna(5.0)
    bts["WEATHER_SEVERITY_SCORE"] = bts["WEATHER_SEVERITY_SCORE"].fillna(10.0)
    return bts

def engineer_feature_3_dep_hour(bts: pd.DataFrame) -> pd.DataFrame:
    print("  #3 Departure Hour (cyclical) ...")
    bts["DEP_HOUR_SIN"] = np.sin(2 * np.pi * bts["DEP_HOUR"] / 24)
    bts["DEP_HOUR_COS"] = np.cos(2 * np.pi * bts["DEP_HOUR"] / 24)
    return bts

def engineer_feature_4_turnaround(bts: pd.DataFrame) -> pd.DataFrame:
    print("  #4 Aircraft Turnaround Time ...")
    if "Tail_Number" not in bts.columns or bts["Tail_Number"].isna().all():
        bts["TURNAROUND_MINUTES"] = 90.0
        return bts

    bts = bts.sort_values(["Tail_Number", "FL_DATE", "CRSDepTime"])
    def hhmm_to_min(col):
        h = (col.fillna(0).astype(int) // 100).clip(0, 23)
        m = (col.fillna(0).astype(int) % 100).clip(0, 59)
        return h * 60 + m

    bts["_dep_min"] = hhmm_to_min(bts["CRSDepTime"])
    bts["_arr_min"] = hhmm_to_min(bts["CRSArrTime"])
    bts["_prev_arr_min"] = bts.groupby("Tail_Number")["_arr_min"].shift(1)
    bts["_prev_date"] = bts.groupby("Tail_Number")["FL_DATE"].shift(1)

    same_day = bts["FL_DATE"] == bts["_prev_date"]
    bts["TURNAROUND_MINUTES"] = np.where(same_day, (bts["_dep_min"] - bts["_prev_arr_min"]).clip(15, 480), np.nan)
    bts["TURNAROUND_MINUTES"] = bts["TURNAROUND_MINUTES"].fillna(bts.groupby("carrier")["TURNAROUND_MINUTES"].transform("median")).fillna(90.0)
    bts.drop(columns=["_dep_min", "_arr_min", "_prev_arr_min", "_prev_date"], inplace=True)
    return bts

def engineer_feature_5_carrier_ontime(bts: pd.DataFrame) -> pd.DataFrame:
    print("  #5 Carrier On-Time Rate ...")
    bts = bts.sort_values("FL_DATE")
    bts["CARRIER_ONTIME_RATE"] = bts.groupby("carrier")["IS_DELAYED"].transform(lambda x: 1 - x.rolling(window=30, min_periods=5).mean())
    bts["CARRIER_ONTIME_RATE"] = bts["CARRIER_ONTIME_RATE"].fillna(bts.groupby("carrier")["IS_DELAYED"].transform(lambda x: 1 - x.mean())).fillna(0.8)
    return bts

def engineer_feature_6_congestion(bts: pd.DataFrame, airport: str) -> pd.DataFrame:
    print("  #6 Airport Congestion Index ...")
    capacity = AIRPORT_CAPACITY.get(airport, 80)
    ops = bts.groupby(["FL_DATE", "DEP_HOUR"]).size().reset_index(name="_ops_count")
    ops["AIRPORT_CONGESTION_IDX"] = (ops["_ops_count"] / capacity * 10).clip(0, 10)
    bts = bts.merge(ops[["FL_DATE", "DEP_HOUR", "AIRPORT_CONGESTION_IDX"]], on=["FL_DATE", "DEP_HOUR"], how="left")
    bts["AIRPORT_CONGESTION_IDX"] = bts["AIRPORT_CONGESTION_IDX"].fillna(3.0)
    return bts

def engineer_feature_7_dow(bts: pd.DataFrame) -> pd.DataFrame:
    print("  #7 Day of Week ...")
    dow = bts["FL_DATE"].dt.dayofweek
    bts["DOW_SIN"] = np.sin(2 * np.pi * dow / 7)
    bts["DOW_COS"] = np.cos(2 * np.pi * dow / 7)
    return bts

def _is_school_break(mmdd: str) -> bool:
    for start, end in SCHOOL_BREAKS:
        if start <= end:
            if start <= mmdd <= end: return True
        else:
            if mmdd >= start or mmdd <= end: return True
    return False

def engineer_feature_8_holiday(bts: pd.DataFrame) -> pd.DataFrame:
    print("  #8 Season / Holiday Flag ...")
    years = bts["FL_DATE"].dt.year.unique()
    if holidays_pkg is not None:
        us_holidays = holidays_pkg.US(years=list(years))
        is_holiday = bts["FL_DATE"].dt.date.isin(us_holidays)
    else:
        static = set()
        for y in years:
            for m, d in [(1,1),(1,17),(2,21),(5,30),(6,19),(7,4),(9,5),(10,10),(11,11),(11,24),(12,25)]:
                try: static.add(pd.Timestamp(y, m, d).date())
                except ValueError: pass
        is_holiday = bts["FL_DATE"].dt.date.isin(static)

    is_break = bts["FL_DATE"].dt.strftime("%m-%d").apply(_is_school_break)
    bts["SEASON_HOLIDAY_FLAG"] = (is_holiday | is_break).astype(int)
    return bts

def engineer_feature_9_distance(bts: pd.DataFrame) -> pd.DataFrame:
    print("  #9 Route Distance ...")
    bts["ROUTE_DISTANCE_MI"] = bts["Distance"].fillna(bts["Distance"].median())
    return bts

def add_atc_columns(bts: pd.DataFrame) -> pd.DataFrame:
    print("  [extra] ATC Delay Program & Avg Delay ...")
    if "AIRPORT_CONGESTION_IDX" in bts.columns:
        bts["ATC_DELAY_PROGRAM"] = (bts["AIRPORT_CONGESTION_IDX"] > 6).astype(int)
        bts["ATC_AVG_DELAY_MIN"] = np.where(bts["ATC_DELAY_PROGRAM"] == 1, (bts["AIRPORT_CONGESTION_IDX"] * 5).clip(15, 120), 0)
    else:
        bts["ATC_DELAY_PROGRAM"] = bts["ATC_AVG_DELAY_MIN"] = 0
    return bts

def save_feature_store(bts: pd.DataFrame) -> None:
    MODEL_FEATURES = [
        "HIST_DELAY_RATE_ROUTE", "WEATHER_SEVERITY_SCORE", "DEP_HOUR_SIN", "DEP_HOUR_COS", 
        "TURNAROUND_MINUTES", "CARRIER_ONTIME_RATE", "AIRPORT_CONGESTION_IDX", "DOW_SIN", 
        "DOW_COS", "SEASON_HOLIDAY_FLAG", "ROUTE_DISTANCE_MI", "WIND_SPEED_KT", 
        "ATC_DELAY_PROGRAM", "ATC_AVG_DELAY_MIN"
    ]
    META_COLUMNS = ["FL_DATE", "DEP_HOUR", "carrier", "flight", "origin", "dest", "IS_DELAYED"]

    keep = META_COLUMNS + MODEL_FEATURES
    missing = set(keep) - set(bts.columns)
    for col in missing: bts[col] = 0

    output = bts[keep].dropna(subset=["IS_DELAYED"]).copy()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    output.to_parquet(OUTPUT_PATH, index=False)
    
    print(f"\n✅ Feature store saved: {OUTPUT_PATH}")
    print(f"   {len(output):,} rows × {len(output.columns)} columns")
    print(f"   Delay rate: {output['IS_DELAYED'].mean() * 100:.1f}%")

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", choices=["kaggle", "nycflights13"], default="kaggle", help="Raw dataset to process")
    parser.add_argument("--airport", default="JFK", help="IATA airport code (default: JFK)")
    parser.add_argument("--years", nargs="+", type=int, default=[2021, 2022], help="Years to load (Kaggle only)")
    parser.add_argument("--skip-metar", action="store_true", help="Use synthetic weather")
    args = parser.parse_args()

    print("=" * 70)
    print(f"  SkyPort Feature Engineering Pipeline ({args.dataset.upper()})")
    print("=" * 70)

    # 1. Load Data
    print("\n[1/4] Loading Raw Data ...")
    if args.dataset == "nycflights13":
        bts, metar = load_nycflights_bts()
    else:
        bts = load_kaggle_bts(args.airport, args.years)
        metar = pd.DataFrame() if args.skip_metar else download_iem_metar(args.airport, min(args.years), max(args.years))

    # 2. Parse Data
    print("\n[2/4] Parsing Data ...")
    bts = parse_bts(bts)

    # 3. Build Features
    print("\n[3/4] Engineering Features ...")
    bts = engineer_feature_1_hist_delay_rate(bts)
    bts = engineer_feature_2_10_weather(bts, metar)
    bts = engineer_feature_3_dep_hour(bts)
    bts = engineer_feature_4_turnaround(bts)
    bts = engineer_feature_5_carrier_ontime(bts)
    bts = engineer_feature_6_congestion(bts, args.airport)
    bts = engineer_feature_7_dow(bts)
    bts = engineer_feature_8_holiday(bts)
    bts = engineer_feature_9_distance(bts)
    bts = add_atc_columns(bts)

    # 4. Save
    print("\n[4/4] Finalizing Feature Store ...")
    save_feature_store(bts)

if __name__ == "__main__":
    main()