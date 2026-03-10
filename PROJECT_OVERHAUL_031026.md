This project plan is designed to transform your current site from a "Dune Dashboard" into a **Quantitative Intelligence Platform**.

You should feed the following text into **Cursor** as a new file (e.g., `PROJECT_OVERHAUL.md`) and then tell the Agent: *"Read `PROJECT_OVERHAUL.md` and execute Phase 1."*

---

# Project: "The Stablecoin Must Flow" – Quantitative Overhaul

## 1. Objective

Transition the website from a descriptive dashboard to a predictive signaling tool for stablecoin-driven capital flight and liquidity momentum.

## 2. Core Metrics & Mathematical Logic

**YOU MUST NOT** use "Total Supply" as a primary metric. Implement the following:

* **Net Momentum ($M$):** 
$$M = \frac{(Supply_{t} - Supply_{t-7}) - (Supply_{t-7} - Supply_{t-14})}{Supply_{t-14}}$$


* **Stablecoin Velocity ($V$):** 
$$V = \frac{\text{Daily On-Chain Volume}}{\text{Current Market Cap}}$$


* **Kimchi Flight Index ($KFI$):** Correlation between Stablecoin Velocity on Korean-linked exchanges and the $KRW/USD$ spot rate.

---

## 3. Phase 1: The Python ETL Pipeline (Data Engineering)

**File to Create:** `scripts/data_pipeline.py`

### **What to do:**

1. **Dune Integration:** Use the `dune-client` Python SDK to fetch Query IDs (I will provide these).
2. **Macro Integration:** Use `yfinance` to fetch the daily closing price of `KRW=X` (KRW/USD).
3. **Feature Engineering:**
* Calculate $M$ (7-day and 30-day).
* Calculate $V$ for USDT, USDC, and FDUSD.


4. **GCP Storage:** * Authentication: Use `google-cloud-storage` with `service_account.json`.
* Output: Save a daily-stamped `.parquet` file AND a `latest_indices.json` to the bucket.



### **What NOT to do:**

* **DO NOT** hardcode API keys. Use a `.env` file.
* **DO NOT** upload raw, uncleaned Dune data to GCP. Only upload the calculated indices.

---

## 4. Phase 2: The ML Inference Engine (LightGBM)

**File to Create:** `scripts/ml_forecast.py`

### **What to do:**

1. **Training:** Load the historical `.parquet` from GCP.
2. **Model:** Initialize a `lightgbm.LGBMRegressor` to predict the next 24-hour $KRW/USD$ volatility based on $M$ and $V$.
3. **Output:** Generate a `forecast.json` containing:
* `predicted_volatility_score` (0-100).
* `confidence_interval`.
* `feature_importance` (Which index moved the needle?).



### **What NOT to do:**

* **DO NOT** use Deep Learning (LSTMs). Stick to LightGBM for better performance on small, tabular time-series data.
* **DO NOT** retrain the model on every single run; only retrain if new data is available.

---

## 5. Phase 3: Frontend Overhaul (Next.js)

**Target Directory:** `app/` and `components/`

### **What to do:**

1. **Data Fetching:** Replace all direct Dune embeds with a `fetch()` to your GCP Public URL for `latest_indices.json` and `forecast.json`.
2. **The "Proprietary Chart":** * Create a dual-axis chart using `recharts`.
* Axis A: Stablecoin Net Momentum ($M$).
* Axis B: KRW/USD Price.


3. **The Prediction UI:** * Add a "24h Liquidity Forecast" card.
* Display the `predicted_volatility_score` with a "BULLISH/BEARISH" or "STABLE/VOLATILE" sentiment tag.


4. **Cleanup:** Remove all "clutter" charts (e.g., historical supply charts that don't contribute to the prediction).

### **What NOT to do:**

* **DO NOT** use heavy client-side libraries. Keep the bundle small.
* **DO NOT** show raw data tables unless they are filtered for "Institutional Flows" (> $100k transfers).

---

## 6. Deployment & Automation

1. **GitHub Actions:** Create `.github/workflows/daily_update.yml`.
2. **Sequence:** * Run `data_pipeline.py`.
* Run `ml_forecast.py`.
* Upload results to GCP.
* Trigger a Vercel redeploy (if necessary) or let the frontend fetch the new JSON live.



---

## 7. Next Steps for Cursor

> "Cursor, start by creating the `scripts/data_pipeline.py` file. I will provide the Dune Query IDs. Focus on the connection logic between Dune, yfinance, and GCP Storage first."

**Would you like me to generate the specific SQL for the Dune Queries (Velocity/Momentum) so you can paste them into Dune and get the IDs for Cursor?**