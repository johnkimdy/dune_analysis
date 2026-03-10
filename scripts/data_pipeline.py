#!/usr/bin/env python3
"""
Phase 1: The Python ETL Pipeline

Fetches stablecoin supply/volume from Dune, KRW/USD from yfinance,
computes Net Momentum (M) and Stablecoin Velocity (V), then uploads
processed indices to GCP Storage. Raw Dune data is never uploaded.

Required env vars (use .env):
  DUNE_API_KEY              - Dune Analytics API key (not needed if using mock)
  DUNE_QUERY_IDS            - Comma-separated Query IDs for supply/volume (first)
                              If unset, uses mock data to test yfinance + GCP.
  DUNE_QUERY_ID_KOREAN_VOLUME - Query ID for Korean exchange volume (KFI).
                                Optional; KFI omitted if unset.
  GCP_BUCKET_NAME           - GCP Storage bucket (default: stablecoin-flow-data)
  GOOGLE_APPLICATION_CREDENTIALS - Path to service_account.json

Query 1 schema (supply/volume): date, symbol, supply, daily_volume, market_cap
Query 2 schema (Korean volume): date, symbol, korean_daily_volume

Core metrics: M (Net Momentum), V (Velocity), KFI (Kimchi Flight Index).
"""

import io
import os
import json
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
import yfinance as yf
from dotenv import load_dotenv
from google.cloud import storage

# Load .env from project root (parent of scripts/)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


# ─── Dune ───────────────────────────────────────────────────────────────────


def _normalize_col(df: pd.DataFrame) -> pd.DataFrame:
    """Lowercase column names for flexible schema matching."""
    df = df.copy()
    df.columns = [c.lower().strip() for c in df.columns]
    return df


def _parse_date(ser: pd.Series) -> pd.Series:
    """Parse date-like column to datetime.date."""
    return pd.to_datetime(ser).dt.date


def _mock_dune_data(days: int = 90) -> pd.DataFrame:
    """Synthetic stablecoin data for testing pipeline without Dune Query IDs."""
    import random
    dates = [d.date() for d in pd.date_range(end=pd.Timestamp.today(), periods=days, freq="D")]
    symbols = ["USDT", "USDC", "FDUSD"]
    rows = []
    base_supply = {"USDT": 120e9, "USDC": 35e9, "FDUSD": 3e9}
    for d in dates:
        for sym in symbols:
            base = base_supply[sym]
            supply = base * (1 + 0.001 * random.gauss(0, 1))
            mc = supply  # approx for stables
            vol = supply * (0.01 + 0.005 * random.random())
            rows.append({
                "date": d,
                "symbol": sym,
                "supply": supply,
                "daily_volume": vol,
                "market_cap": mc,
            })
    return pd.DataFrame(rows)


def fetch_dune_data() -> pd.DataFrame:
    """Fetch and merge results from all Dune query IDs, or use mock data if unset."""
    raw_ids = os.getenv("DUNE_QUERY_IDS", "").strip()
    if not raw_ids:
        print("  [MOCK] DUNE_QUERY_IDS not set — using synthetic data to test pipeline")
        return _mock_dune_data()

    api_key = os.getenv("DUNE_API_KEY")
    if not api_key:
        raise RuntimeError("DUNE_API_KEY is not set in .env")

    from dune_client.client import DuneClient
    from dune_client.query import QueryBase

    client = DuneClient(api_key=api_key)
    query_ids = [int(qid.strip()) for qid in raw_ids.split(",") if qid.strip()]

    if not query_ids:
        raise RuntimeError("No valid Dune Query IDs in DUNE_QUERY_IDS")

    frames = []
    for qid in query_ids:
        query = QueryBase(name=f"Query-{qid}", query_id=qid)
        df = client.run_query_dataframe(query)
        if df is not None and not df.empty:
            frames.append(df)

    if not frames:
        raise RuntimeError("All Dune queries returned empty results")

    df = pd.concat(frames, ignore_index=True)
    df = _normalize_col(df)

    required = {"date", "symbol", "supply", "daily_volume", "market_cap"}
    have = set(df.columns)
    missing = required - have
    if missing:
        raise RuntimeError(
            f"Dune query result missing columns: {missing}. "
            f"Expected: {required}. Got: {list(df.columns)}"
        )

    df["date"] = _parse_date(df["date"])
    df = df.sort_values(["date", "symbol"]).drop_duplicates(
        subset=["date", "symbol"], keep="last"
    )

    return df


def fetch_korean_volume() -> Optional[pd.DataFrame]:
    """Fetch Korean exchange daily volume for KFI. Returns None if not configured."""
    raw_id = os.getenv("DUNE_QUERY_ID_KOREAN_VOLUME", "").strip()
    if not raw_id:
        return None

    api_key = os.getenv("DUNE_API_KEY")
    if not api_key:
        raise RuntimeError("DUNE_API_KEY is required when DUNE_QUERY_ID_KOREAN_VOLUME is set")

    from dune_client.client import DuneClient
    from dune_client.query import QueryBase

    client = DuneClient(api_key=api_key)
    query = QueryBase(name="Korean-Volume", query_id=int(raw_id))
    df = client.run_query_dataframe(query)
    if df is None or df.empty:
        return None

    df = _normalize_col(df)
    required = {"date", "symbol", "korean_daily_volume"}
    have = set(df.columns)
    missing = required - have
    if missing:
        raise RuntimeError(
            f"Korean volume query missing columns: {missing}. "
            f"Expected: {required}. Got: {list(df.columns)}"
        )
    df["date"] = _parse_date(df["date"])
    df["symbol"] = df["symbol"].str.upper()
    df["korean_daily_volume"] = pd.to_numeric(df["korean_daily_volume"], errors="coerce")
    return df.sort_values(["date", "symbol"])


# ─── Macro (KRW/USD) ────────────────────────────────────────────────────────


def fetch_krw_usd(limit_days: int = 120) -> pd.DataFrame:
    """Fetch KRW/USD daily closing prices from yfinance."""
    ticker = yf.Ticker("KRW=X")
    hist = ticker.history(period=f"{limit_days}d")
    if hist.empty:
        raise RuntimeError("yfinance returned no data for KRW=X")

    df = hist.reset_index()
    df = df.rename(columns={"Date": "date", "Close": "krw_usd_close"})
    df["date"] = df["date"].dt.date
    return df[["date", "krw_usd_close"]]


# ─── Feature Engineering ────────────────────────────────────────────────────


def net_momentum(
    supply_t: float, supply_t_n: float, supply_t_2n: float
) -> Optional[float]:
    """
    Net Momentum: M = ((S_t - S_{t-n}) - (S_{t-n} - S_{t-2n})) / S_{t-2n}
    """
    if supply_t_2n is None or supply_t_2n <= 0:
        return None
    delta1 = supply_t - supply_t_n if supply_t_n is not None else None
    delta2 = supply_t_n - supply_t_2n if supply_t_n is not None else None
    if delta1 is None or delta2 is None:
        return None
    return (delta1 - delta2) / supply_t_2n


def velocity(daily_volume: float, market_cap: float) -> Optional[float]:
    """Stablecoin Velocity: V = daily_volume / market_cap"""
    if market_cap is None or market_cap <= 0:
        return None
    if daily_volume is None:
        return None
    return daily_volume / market_cap


def compute_kfi(
    indices_df: pd.DataFrame,
    krw_df: pd.DataFrame,
    window: int = 30,
) -> pd.DataFrame:
    """
    Kimchi Flight Index: rolling correlation between aggregate Korean velocity
    and KRW/USD. Korean velocity = sum(korean_daily_volume) / sum(market_cap).
    """
    if "korean_daily_volume" not in indices_df.columns:
        indices_df["kfi"] = None
        return indices_df

    # Daily aggregates: Korean volume and market cap (denominator for velocity)
    daily = (
        indices_df.groupby("date")
        .agg(
            korean_volume=("korean_daily_volume", "sum"),
            market_cap=("market_cap", "sum"),
        )
        .reset_index()
    )
    daily = daily.merge(krw_df, on="date", how="inner")
    daily["korean_velocity"] = np.where(
        daily["market_cap"] > 0,
        daily["korean_volume"] / daily["market_cap"],
        np.nan,
    )
    daily["kfi"] = daily["korean_velocity"].rolling(window).corr(daily["krw_usd_close"])
    kfi_map = dict(zip(daily["date"], daily["kfi"]))

    indices_df["kfi"] = indices_df["date"].map(kfi_map)
    return indices_df


def compute_indices(
    dune_df: pd.DataFrame,
    krw_df: pd.DataFrame,
    korean_df: Optional[pd.DataFrame] = None,
) -> pd.DataFrame:
    """
    Compute M (7d, 30d), V, and optionally KFI for each symbol, merge with KRW/USD.
    """
    dune = dune_df.copy()
    dune["supply"] = pd.to_numeric(dune["supply"], errors="coerce")
    dune["daily_volume"] = pd.to_numeric(dune["daily_volume"], errors="coerce")
    dune["market_cap"] = pd.to_numeric(dune["market_cap"], errors="coerce")

    all_dates = sorted(dune["date"].unique())
    rows = []

    for sym in dune["symbol"].str.upper().unique():
        sym_upper = sym.upper()
        sym_df = dune[dune["symbol"].str.upper() == sym_upper].sort_values("date")
        if sym_df.empty:
            continue

        supply_by_date = dict(zip(sym_df["date"], sym_df["supply"]))
        vol_by_date = dict(zip(sym_df["date"], sym_df["daily_volume"]))
        mc_by_date = dict(zip(sym_df["date"], sym_df["market_cap"]))

        for d in all_dates:
            dd = pd.Timestamp(d)
            d7 = (dd - pd.Timedelta(days=7)).date()
            d14 = (dd - pd.Timedelta(days=14)).date()
            d30 = (dd - pd.Timedelta(days=30)).date()
            d60 = (dd - pd.Timedelta(days=60)).date()

            s_t = supply_by_date.get(d)
            s_7 = supply_by_date.get(d7)
            s_14 = supply_by_date.get(d14)
            s_30 = supply_by_date.get(d30)
            s_60 = supply_by_date.get(d60)

            m_7 = net_momentum(s_t, s_7, s_14)
            m_30 = net_momentum(s_t, s_30, s_60)

            vol = vol_by_date.get(d)
            mc = mc_by_date.get(d)
            v = velocity(vol, mc)

            row = {
                "date": d,
                "symbol": sym_upper,
                "m_7d": m_7,
                "m_30d": m_30,
                "velocity": v,
                "supply": s_t,
                "market_cap": mc,
            }
            if korean_df is not None:
                k_row = korean_df[
                    (korean_df["date"] == d) & (korean_df["symbol"].str.upper() == sym_upper)
                ]
                row["korean_daily_volume"] = k_row["korean_daily_volume"].iloc[0] if not k_row.empty else None
            rows.append(row)

    idx_df = pd.DataFrame(rows)
    if idx_df.empty:
        raise RuntimeError("No indices computed from Dune data")

    result = idx_df.merge(krw_df, on="date", how="left")

    # KFI: correlation between Korean velocity and KRW/USD
    result = compute_kfi(result, krw_df, window=30)
    return result


# ─── GCP Storage ────────────────────────────────────────────────────────────


def upload_to_gcp(
    indices_df: pd.DataFrame,
    bucket_name: str,
    stamp: str,
) -> None:
    """
    Upload daily-stamped parquet and latest_indices.json.
    Only computed indices (M, V, KFI, krw_usd) are uploaded; raw Dune data is never stored.
    """
    # Drop raw inputs; keep only computed indices + date/symbol for join keys
    cols = ["date", "symbol", "m_7d", "m_30d", "velocity", "kfi", "krw_usd_close"]
    cols = [c for c in cols if c in indices_df.columns]
    upload_df = indices_df[cols].copy()
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_path or not Path(creds_path).exists():
        raise RuntimeError(
            "GOOGLE_APPLICATION_CREDENTIALS must point to service_account.json. "
            "Create a GCP service account and download the JSON key."
        )

    client = storage.Client()
    bucket = client.bucket(bucket_name)

    # Daily-stamped parquet
    parquet_key = f"indices/indices_{stamp}.parquet"
    blob_parquet = bucket.blob(parquet_key)
    buf = io.BytesIO()
    upload_df.to_parquet(buf, index=False)
    buf.seek(0)
    blob_parquet.upload_from_file(
        buf,
        content_type="application/vnd.apache.parquet",
    )
    print(f"  Uploaded gs://{bucket_name}/{parquet_key}")

    # latest_indices.json — last row per symbol + metadata
    latest = (
        upload_df.sort_values("date", ascending=False)
        .groupby("symbol", as_index=False)
        .first()
    )
    # Convert NaN to null for JSON
    latest = latest.replace({np.nan: None})
    payload = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "stamp": stamp,
        "metrics": ["m_7d", "m_30d", "velocity", "kfi"],
        "latest": latest.to_dict(orient="records"),
        "summary": {
            "date_range": {
                "min": str(upload_df["date"].min()),
                "max": str(upload_df["date"].max()),
            },
            "symbols": list(latest["symbol"].unique()),
        },
    }
    json_key = "latest_indices.json"
    blob_json = bucket.blob(json_key)
    blob_json.upload_from_string(
        json.dumps(payload, indent=2),
        content_type="application/json",
    )
    print(f"  Uploaded gs://{bucket_name}/{json_key}")


# ─── Main ───────────────────────────────────────────────────────────────────


def main() -> None:
    print("[data_pipeline] Phase 1 ETL starting...")
    stamp = datetime.utcnow().strftime("%Y%m%d")

    print("  Fetching Dune data...")
    dune_df = fetch_dune_data()
    print(f"    Rows: {len(dune_df)}, symbols: {dune_df['symbol'].nunique()}")

    print("  Fetching KRW/USD...")
    krw_df = fetch_krw_usd()
    print(f"    Rows: {len(krw_df)}")

    korean_df = None
    if os.getenv("DUNE_QUERY_ID_KOREAN_VOLUME", "").strip():
        print("  Fetching Korean volume (KFI)...")
        korean_df = fetch_korean_volume()
        print(f"    Rows: {len(korean_df) if korean_df is not None else 0}")
    else:
        print("  [SKIP] DUNE_QUERY_ID_KOREAN_VOLUME not set — KFI omitted")

    print("  Computing indices (M, V, KFI)...")
    indices_df = compute_indices(dune_df, krw_df, korean_df)
    print(f"    Rows: {len(indices_df)}")

    bucket = os.getenv("GCP_BUCKET_NAME", "stablecoin-flow-data")
    print(f"  Uploading to GCP bucket: {bucket}")
    upload_to_gcp(indices_df, bucket, stamp)

    print("[data_pipeline] Done.")


if __name__ == "__main__":
    main()
