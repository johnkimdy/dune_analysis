# Deployment Architecture

## How it works

The conda env (`stablecoinmustflow`) and Python scripts are **batch jobs**, not the website.

```
Dune API ──► Python ETL (data_pipeline.py) ──► GCP Storage (.parquet, JSON)
                                                     │
                                                     ▼
Next.js (Vercel) ◄───────────────────────── fetch() latest_indices.json
```

- **Website** = Next.js app on Vercel (no Python)
- **Python pipeline** = Runs on schedule, writes to GCP
- **Conda env** = For running the pipeline (local dev or CI)

---

## Conda env: local use

```bash
conda env create -f environment.yml
conda activate stablecoinmustflow
python scripts/data_pipeline.py
```

Use this for:
- Local development
- Running the pipeline on your machine
- Inspecting data in Python (no "web deploy" of the env)

---

## Deploying the pipeline (daily automation)

You don’t deploy the conda env as a website. Options:

| Option | Docker? | Notes |
|--------|---------|-------|
| **GitHub Actions** | No | Use `actions/setup-python` + `pip install -r requirements.txt`. Runs on cron (e.g. daily). |
| **GCP Cloud Run Jobs** | Yes | Containerize the script with Docker, run on schedule via Cloud Scheduler. |
| **Local cron** | No | `crontab` to run the script with your conda env (only when machine is on). |

Recommended: **GitHub Actions** (no Docker) once `.github/workflows/daily_update.yml` is in place.

---

## Summary

- **Conda env** = For running the Python ETL locally.
- **Docker** = Optional; only needed for Cloud Run Jobs (or similar).
- **Website** = Next.js on Vercel; it reads from GCP, not from Dune or Python.
