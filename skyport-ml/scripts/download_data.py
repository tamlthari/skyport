"""
download_data.py — Unified Raw Data Acquisition
================================================
Downloads raw datasets (Kaggle and nycflights13) to data/raw/.
No feature engineering occurs here.

Usage:
  python download_data.py
"""

import os
import requests
import pandas as pd
from pathlib import Path
import warnings

warnings.filterwarnings('ignore')

# ─── Dynamic Pathing ────────────────────────────────────────────────────────
# Resolves to the 'skyport-ml' root directory regardless of where you run the script
PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw"

def download_kaggle_dataset():
    print("\n--- [1/2] Downloading Kaggle Flight Dataset ---")
    token = "KGAT_7057636528740db08303ffade8c68701"
    url = "https://www.kaggle.com/api/v1/datasets/download/robikscube/flight-delay-dataset-20182022"
    headers = {"Authorization": f"Bearer {token}"}
    zip_path = RAW_DIR / "kaggle_flights.zip"

    if not zip_path.exists():
        print("Downloading dataset from Kaggle (~2GB)... This may take a few minutes.")
        try:
            with requests.get(url, headers=headers, stream=True) as r:
                r.raise_for_status()
                with open(zip_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
            print("✅ Kaggle download complete.")
        except Exception as e:
            print(f"❌ Failed to download Kaggle data: {e}")
    else:
        print("✅ Kaggle zip already exists. Skipping download.")

def download_nycflights_dataset():
    print("\n--- [2/2] Extracting nycflights13 Dataset ---")
    try:
        from nycflights13 import flights, weather
        
        # Filter for JFK to keep it manageable and focused
        bts_df = flights[(flights['origin'] == 'JFK') | (flights['dest'] == 'JFK')].copy()
        noaa_df = weather[weather['origin'] == 'JFK'].copy()
        
        bts_df.to_parquet(RAW_DIR / "nycflights_bts.parquet", index=False)
        noaa_df.to_parquet(RAW_DIR / "nycflights_metar.parquet", index=False)
        
        print(f"✅ Successfully saved {len(bts_df):,} flight records from JFK.")
        print(f"✅ Successfully saved {len(noaa_df):,} weather records from JFK.")
        
    except ImportError:
        print("❌ Failed to import nycflights13. Run: pip install nycflights13")

if __name__ == "__main__":
    # Create the raw data directory if it doesn't exist yet
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    
    print("Initializing SkyPort Raw Data Acquisition...")
    download_kaggle_dataset()
    download_nycflights_dataset()
    
    print(f"\n🎉 All raw data downloaded to {RAW_DIR}!")