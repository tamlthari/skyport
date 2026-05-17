
  # Airport Flight Data Dashboard

  This is a code bundle for Airport Flight Data Dashboard. The original project is available at https://violet-stuck-30699379.figma.site.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  

---

# ✈️ SkyPort ML: Flight Operations & Delay Prediction Dashboard

SkyPort ML is a full-stack, machine-learning-powered aviation dashboard. It combines a **React frontend** for real-time operational monitoring with a **FastAPI + Python backend** that runs live inference using PyTorch, XGBoost, and LightGBM to predict flight delays and manage ground operations.

---

## 🚀 Quick Start: Running the Project Locally

Follow these steps to spin up the pre-trained models and the frontend dashboards.

**1. Download and Extract the Source Folder**
Ensure you have the project extracted and open your terminal.

**2. Start the FastAPI Machine Learning Server**
Open a terminal and navigate into the backend directory, activate the Python environment, install the dependencies, and start the Uvicorn server:

```bash
# Navigate to the backend directory
cd skyport-ml

# Activate the virtual environment (Mac/Linux)
# Note: For Windows, use `.venv\Scripts\activate`
source .venv/bin/activate

# Install the required Python dependencies
pip install fastapi uvicorn requests pandas numpy pyarrow fastparquet nycflights13 holidays xgboost lightgbm torch scikit-learn joblib

# Start the live inference server
uvicorn inference_server:app --host 0.0.0.0 --port 8000 --reload

```

**3. Start the React Frontend**
Open a **second** terminal window, ensure you are in the root directory of the project (one level above `skyport-ml`), and start the Vite development server:

```bash
# Return to the project root
cd ..

# Install Node dependencies (if you haven't already or if you run into issues)
npm install

# Start the dashboard UI
npm run dev

```

*The application is now running! Open the local URL provided by Vite (usually `http://localhost:5173`) in your browser.*

---

## 🧠 Full Pipeline: Rebuilding Data & Retraining Models

If you want to clear out the historical data, fetch fresh datasets, engineer the ML features from scratch, and retrain all of the model architectures, follow this workflow:

**1. Clear Old Data**

* Go to `skyport-ml/data/` and **delete** `features.parquet`.
* Go to `skyport-ml/data/raw/` and **delete all files** inside it.

**2. Run the Data & Training Pipeline**
Open your terminal and run the following commands sequentially:

```bash
# Navigate to the scripts folder inside the active python environment
cd skyport-ml/scripts

# Download fresh Kaggle and nycflights13 raw data
python download_data.py

# Process raw data into the ML feature store (using the Kaggle dataset for JFK, 2021-2022)
python build_features.py --dataset kaggle --airport JFK --years 2021 2022

# Train all models (Transformer, Bi-LSTM, XGBoost, LightGBM) on the new feature store
python train_all_models.py

```

**3. Boot Up the Application**
Once the models finish training and save to the local registry, spin up the servers again:

```bash
# Step back to the backend root and start the API
cd ..
uvicorn inference_server:app --host 0.0.0.0 --port 8000 --reload

# In a new terminal window, go to the frontend root and start the UI
cd ..
npm install   # (Optional: Only if you have dependency issues)
npm run dev

```
