#!/usr/bin/env python3
"""
Phase 2: ML Inference Engine

Loads historical indices from GCS parquet, trains a LightGBM model to predict
next 24h KRW/USD volatility from M and V, then uploads forecast.json.

Required env vars (use .env):
  GCP_BUCKET_NAME           - GCS bucket (default: stablecoin-flow-data)
  GOOGLE_APPLICATION_CREDENTIALS - Path to service_account.json

Output: forecast.json with predicted_volatility_score (0-100), confidence_interval,
        feature_importance. Uploaded to bucket root.
"""

import io
import json
import os
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from google.cloud import storage
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split

try:
    import lightgbm as lgb

    USE_LIGHTGBM = True
except (ImportError, OSError):
    USE_LIGHTGBM = False  # Fallback to sklearn (e.g. libomp missing on macOS)

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

BUCKET_NAME = os.getenv("GCP_BUCKET_NAME", "stablecoin-flow-data")
INDICES_PREFIX = "indices/indices_"
FORECAST_KEY = "forecast.json"
MIN_TRAINING_ROWS = 14


def _get_gcs_client() -> storage.Client:
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_path or not Path(creds_path).exists():
        raise RuntimeError(
            "GOOGLE_APPLICATION_CREDENTIALS must point to service_account.json"
        )
    return storage.Client()


def load_latest_parquet(client: storage.Client, bucket_name: str) -> pd.DataFrame:
    """Load the most recent indices parquet from GCS."""
    bucket = client.bucket(bucket_name)
    blobs = list(bucket.list_blobs(prefix=INDICES_PREFIX))
    if not blobs:
        raise FileNotFoundError(
            f"No parquet files found under gs://{bucket_name}/{INDICES_PREFIX}* "
            "(run data_pipeline.py first)"
        )
    latest = max(blobs, key=lambda b: b.name)
    buf = io.BytesIO()
    latest.download_to_file(buf)
    buf.seek(0)
    df = pd.read_parquet(buf)
    print(f"  Loaded gs://{bucket_name}/{latest.name} ({len(df)} rows)")
    return df


def prepare_training_data(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.Series, pd.DataFrame, list[str], tuple[float, float]]:
    """
    Aggregate to daily level and create target: next 24h KRW/USD volatility.
    Target = |(close_t+1 - close_t) / close_t| * 100, scaled to 0-100.
    """
    # Aggregate M and V across symbols (mean)
    daily = (
        df.groupby("date")
        .agg(
            m_7d=("m_7d", "mean"),
            m_30d=("m_30d", "mean"),
            velocity=("velocity", "mean"),
            krw_usd_close=("krw_usd_close", "first"),
        )
        .reset_index()
    )
    if "kfi" in df.columns and df["kfi"].notna().any():
        kfi = df.groupby("date")["kfi"].mean().reset_index()
        daily = daily.merge(kfi, on="date", how="left")
    else:
        daily["kfi"] = np.nan

    daily = daily.sort_values("date").dropna(subset=["krw_usd_close"])
    daily["returns"] = daily["krw_usd_close"].pct_change()
    daily["volatility"] = daily["returns"].abs() * 100  # % move
    daily["target"] = daily["volatility"].shift(-1)  # next-day volatility
    daily = daily.dropna(subset=["target"])

    # Scale target to 0-100 using min-max from this sample
    t_min, t_max = daily["target"].min(), daily["target"].max()
    if t_max > t_min:
        daily["target_scaled"] = (daily["target"] - t_min) / (t_max - t_min) * 100
    else:
        daily["target_scaled"] = 50.0  # flat

    # Core features (M, V) - require non-null; KFI optional (fill 0 if missing)
    feature_cols = [c for c in ["m_7d", "m_30d", "velocity"] if c in daily.columns]
    if "kfi" in daily.columns and daily["kfi"].notna().sum() > len(daily) // 2:
        feature_cols.append("kfi")
    else:
        daily["kfi"] = daily.get("kfi", 0).fillna(0)
        if "kfi" not in feature_cols:
            feature_cols.append("kfi")  # use as feature even if sparse
    daily[feature_cols] = daily[feature_cols].fillna(0)
    if len(daily) < MIN_TRAINING_ROWS:
        raise ValueError(
            f"Need at least {MIN_TRAINING_ROWS} rows after aggregation, got {len(daily)}"
        )

    X = daily[feature_cols]
    y = daily["target_scaled"]
    return X, y, daily, feature_cols, (t_min, t_max)


def train_and_predict(
    X: pd.DataFrame,
    y: pd.Series,
    daily: pd.DataFrame,
    feature_cols: list[str],
) -> dict:
    """Train LightGBM (or sklearn fallback), predict next 24h volatility, return forecast payload."""
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )
    if USE_LIGHTGBM:
        model = lgb.LGBMRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            verbosity=-1,
            random_state=42,
        )
        model.fit(
            X_train,
            y_train,
            eval_set=[(X_val, y_val)],
            callbacks=[lgb.early_stopping(10, verbose=False)],
        )
    else:
        model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            random_state=42,
        )
        model.fit(X_train, y_train)

    val_pred = model.predict(X_val)
    residual_std = np.std(y_val - val_pred)
    feature_imp = dict(
        zip(feature_cols, model.feature_importances_.astype(float).tolist())
    )

    # Predict for next 24h using most recent row
    last_row = daily.iloc[-1:][feature_cols]
    pred = float(model.predict(last_row)[0])
    pred = max(0.0, min(100.0, pred))
    margin = 1.96 * residual_std
    lower = max(0.0, pred - margin)
    upper = min(100.0, pred + margin)

    return {
        "predicted_volatility_score": round(pred, 1),
        "confidence_interval": {
            "lower": round(lower, 1),
            "upper": round(upper, 1),
        },
        "feature_importance": feature_imp,
    }


def should_retrain(
    client: storage.Client,
    bucket_name: str,
    parquet_max_date: str,
) -> bool:
    """Only retrain if we have newer parquet than last forecast (or no forecast yet)."""
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(FORECAST_KEY)
    if not blob.exists():
        return True
    data = json.loads(blob.download_as_text())
    last_max = data.get("trained_on_max_date")
    if not last_max:
        return True
    return parquet_max_date > last_max


def upload_forecast(
    client: storage.Client,
    bucket_name: str,
    payload: dict,
) -> None:
    """Upload forecast.json to GCS."""
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(FORECAST_KEY)
    blob.upload_from_string(
        json.dumps(payload, indent=2),
        content_type="application/json",
    )
    print(f"  Uploaded gs://{bucket_name}/{FORECAST_KEY}")


def main() -> None:
    print("[ml_forecast] Phase 2 ML inference starting...")
    print(f"  Model: {'LightGBM' if USE_LIGHTGBM else 'sklearn GradientBoosting (LightGBM unavailable)'}")

    client = _get_gcs_client()
    df = load_latest_parquet(client, BUCKET_NAME)
    df["date"] = pd.to_datetime(df["date"]).dt.date

    X, y, daily, feature_cols, scale_bounds = prepare_training_data(df)
    parquet_max_date = str(daily["date"].max())

    if not should_retrain(client, BUCKET_NAME, parquet_max_date):
        print("  [SKIP] No new data since last run — using existing forecast")
        return

    print(f"  Training on {len(X)} daily rows, features: {feature_cols}")
    forecast = train_and_predict(X, y, daily, feature_cols)

    payload = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "horizon": "24h",
        "model_version": "lightgbm_v1" if USE_LIGHTGBM else "sklearn_gbm_v1",
        "trained_on_max_date": parquet_max_date,
        "trained_on_row_count": len(daily),
        **forecast,
    }

    upload_forecast(client, BUCKET_NAME, payload)
    print(f"  Predicted volatility: {forecast['predicted_volatility_score']} (0-100)")
    print("[ml_forecast] Done.")


if __name__ == "__main__":
    main()
