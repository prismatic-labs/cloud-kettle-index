"""
Derives aggregate load-shape profiles from the UKPN Data Centre Demand Profiles
parquet file and writes src/data/ukpn-derived-load-shapes.json.

The raw parquet is NOT committed to git (.gitignore blocks *.parquet).
Only the derived, anonymised, aggregate JSON is committed.

Usage:
    pip install pandas pyarrow matplotlib
    python scripts/process_ukpn_profiles.py [path/to/ukpn-data-centre-demand-profiles.parquet]

If no path is given, looks for the file in the project root.
"""

import sys
import json
import hashlib
import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

ROOT     = Path(__file__).resolve().parent.parent
PARQUET  = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "ukpn-data-centre-demand-profiles.parquet"
OUT_JSON = ROOT / "src" / "data" / "ukpn-derived-load-shapes.json"
OUT_PNG  = ROOT / "public" / "press" / "ukpn-load-profiles.png"

if not PARQUET.exists():
    sys.exit(f"Parquet file not found: {PARQUET}\nPass the path as an argument or place it in the project root.")

# England & Wales bank holidays covering the data range
BANK_HOLIDAYS = set(pd.to_datetime([
    "2023-01-02","2023-04-07","2023-04-10","2023-05-01","2023-05-08",
    "2023-05-29","2023-08-28","2023-12-25","2023-12-26",
    "2024-01-01","2024-03-29","2024-04-01","2024-05-06","2024-05-27",
    "2024-08-26","2024-12-25","2024-12-26",
    "2025-01-01","2025-04-18","2025-04-21","2025-05-05","2025-05-26",
    "2025-08-25","2025-12-25","2025-12-26",
    "2026-01-01","2026-04-03","2026-04-06","2026-05-04","2026-05-25",
    "2026-08-31","2026-12-25","2026-12-28",
]).normalize())

print(f"Loading {PARQUET} …", flush=True)
df = pd.read_parquet(PARQUET)
print(f"  {len(df):,} rows  columns: {list(df.columns)}", flush=True)

# ── Timestamp: always parse utc_timestamp as UTC and convert to Europe/London ─
# local_timestamp in the UKPN export is marked +00:00 even during BST, making
# it unreliable for half-hour slot assignment. Using UTC → London conversion
# ensures correct slot assignment across winter (UTC=London) and BST (UTC+1h).
if "utc_timestamp" in df.columns:
    ts_col = "utc_timestamp"
    print("  Using utc_timestamp → Europe/London for slot/date assignment", flush=True)
else:
    ts_col = "local_timestamp"
    print(f"  WARNING: utc_timestamp not found, falling back to {ts_col}", flush=True)

ts = pd.to_datetime(df[ts_col], utc=True).dt.tz_convert("Europe/London")
df["date"]           = ts.dt.normalize().dt.tz_localize(None)
df["half_hour_slot"] = ts.dt.hour * 2 + ts.dt.minute // 30
dow                  = ts.dt.dayofweek  # 0=Monday, 6=Sunday

df["day_type"] = np.select(
    [df["date"].isin(BANK_HOLIDAYS), dow == 6, dow == 5],
    ["bank_holiday",                 "sunday",  "saturday"],
    default="weekday",
)

print("\nDay-type counts (distinct dates):")
for dt in ["weekday", "saturday", "sunday", "bank_holiday"]:
    n = df[df["day_type"] == dt]["date"].nunique()
    print(f"  {dt:14s}: {n} days")

# ── QA on raw utilisation values ──────────────────────────────────────────────
util = df["hh_utilisation_ratio"]
raw_min   = float(util.min())
raw_max   = float(util.max())
cnt_neg   = int((util < 0).sum())
cnt_gt1   = int((util > 1).sum())
cnt_gt1p5 = int((util > 1.5).sum())
cnt_invalid = int(util.isna().sum())

print(f"\nUtilisation QA (before filtering):")
print(f"  min={raw_min:.4f}  max={raw_max:.4f}")
print(f"  < 0: {cnt_neg}   > 1: {cnt_gt1}   > 1.5: {cnt_gt1p5}   NaN: {cnt_invalid}")

# ── Global per-site baseline ───────────────────────────────────────────────────
# Each site's shape index is computed relative to its own overall mean across ALL
# data. This preserves day-type level differences (e.g. bank holidays genuinely
# lower) rather than normalising each day type independently to mean=1.0.
site_means = (
    df.groupby("anonymised_data_centre_name")["hh_utilisation_ratio"]
    .mean()
    .rename("site_mean")
)
print(f"\nGlobal site means: min={site_means.min():.4f}  max={site_means.max():.4f}  "
      f"median={site_means.median():.4f}")

# Day-type mean factors: how does each day type compare to the overall baseline?
day_type_mean_factors = {}
for day in ["weekday", "saturday", "sunday", "bank_holiday"]:
    sub = df[df["day_type"] == day].copy()
    sub = sub.join(site_means, on="anonymised_data_centre_name")
    valid = sub[sub["site_mean"] > 0]
    if len(valid):
        day_type_mean_factors[day] = round(
            float((valid["hh_utilisation_ratio"] / valid["site_mean"]).mean()), 6
        )
    else:
        day_type_mean_factors[day] = None

print("\nDay-type mean factors vs overall baseline:")
for day, f in day_type_mean_factors.items():
    print(f"  {day:14s}: {f}")


def build_profile_with_bands(subset: pd.DataFrame) -> tuple[list, list, list]:
    """
    Median-of-medians with global-baseline normalisation and p10/p90 bands.

    For each site: compute the half-hourly median within the subset, divided by
    the site's overall mean across ALL data (not just this day type).
    Then take the cross-site median (and p10/p90) at each half-hour slot.
    """
    grp = (
        subset
        .groupby(["anonymised_data_centre_name", "half_hour_slot"])["hh_utilisation_ratio"]
        .median()
        .reset_index()
    )
    grp = grp.join(site_means, on="anonymised_data_centre_name")
    grp = grp[grp["site_mean"] > 0].copy()
    grp["shape"] = grp["hh_utilisation_ratio"] / grp["site_mean"]

    agg_median = grp.groupby("half_hour_slot")["shape"].median()
    agg_p10    = grp.groupby("half_hour_slot")["shape"].quantile(0.10)
    agg_p90    = grp.groupby("half_hour_slot")["shape"].quantile(0.90)

    def to_list(s: pd.Series) -> list:
        return [float(s.get(i, np.nan)) for i in range(48)]

    return to_list(agg_median), to_list(agg_p10), to_list(agg_p90)


def flatness(profile: list) -> dict:
    valid = [v for v in profile if not np.isnan(v)]
    # overnight: slots 0-11 = 00:00-05:30
    # daytime:   slots 16-35 = 08:00-17:30
    overnight = [profile[i] for i in range(12)    if not np.isnan(profile[i])]
    daytime   = [profile[i] for i in range(16, 36) if not np.isnan(profile[i])]
    return {
        "peak_to_trough_ratio":       round(max(valid) / min(valid), 6),
        "overnight_vs_daytime_ratio": round(np.mean(overnight) / np.mean(daytime), 6) if daytime and overnight else None,
        "overnight_slots": "00:00–05:30 (slots 0–11)",
        "daytime_slots":   "08:00–17:30 (slots 16–35)",
    }


DAY_TYPES  = ["weekday", "saturday", "sunday", "bank_holiday"]
results    = {}
flat_stats = {}

for label, mask in [
    ("all_sites",  df["dc_type"].notna()),
    ("co_located", df["dc_type"] == "Co-located"),
    ("enterprise", df["dc_type"] == "Enterprise"),
]:
    results[label]    = {}
    flat_stats[label] = {}
    sub_dc = df[mask]
    for day in DAY_TYPES:
        sub               = sub_dc[sub_dc["day_type"] == day]
        median, p10, p90  = build_profile_with_bands(sub)
        fl                = flatness(median)
        flat_stats[label][day] = fl
        results[label][day] = {
            "site_count": int(sub["anonymised_data_centre_name"].nunique()),
            "day_count":  int(sub["date"].nunique()),
            "median":     [round(v, 8) if not np.isnan(v) else None for v in median],
            "p10":        [round(v, 8) if not np.isnan(v) else None for v in p10],
            "p90":        [round(v, 8) if not np.isnan(v) else None for v in p90],
        }
        print(f"  {label}/{day}: sites={results[label][day]['site_count']:2d}, "
              f"days={results[label][day]['day_count']:3d}, "
              f"mean_factor={day_type_mean_factors.get(day)}, "
              f"peak/trough={fl['peak_to_trough_ratio']:.4f}, "
              f"overnight/daytime={fl['overnight_vs_daytime_ratio']:.4f}")


# ── File hash for provenance ───────────────────────────────────────────────────
print("\nHashing parquet …", flush=True)
sha256 = hashlib.sha256(PARQUET.read_bytes()).hexdigest()
print(f"  SHA-256: {sha256[:16]}…")

# ── Sparse-site count ──────────────────────────────────────────────────────────
# Sites with fewer than 100 observed days are considered sparse.
site_day_counts = df.groupby("anonymised_data_centre_name")["date"].nunique()
sparse_site_count = int((site_day_counts < 100).sum())

# ── Voltage level breakdown ────────────────────────────────────────────────────
sites_by_voltage: dict[str, int] = {}
vcol_candidates = ["cleansed_voltage_level", "voltage_level", "connection_voltage"]
vcol = next((c for c in vcol_candidates if c in df.columns), None)
if vcol:
    sites_by_voltage = {
        k: int(v)
        for k, v in df.drop_duplicates("anonymised_data_centre_name")[vcol]
        .value_counts().items()
    }
    print(f"  Voltage levels: {sites_by_voltage}")

date_range = [str(df["date"].min().date()), str(df["date"].max().date())]

# ── Write JSON ───────────────────────────────────────────────────────────────
out = {
    "source":             "UKPN Data Centre Demand Profiles",
    "source_url":         "https://ukpowernetworks.opendatasoft.com",
    "source_export_date": "2026-04-27",
    "derived_at":         datetime.date.today().isoformat(),
    "script":             "scripts/process_ukpn_profiles.py",
    "coverage":           "UK Power Networks licence areas only (London, South East, East of England)",
    "unit":               "relative utilisation shape, normalised to each site's own overall mean (mean = 1.0)",
    "normalisation_note": (
        "Each site's shape index = hh_utilisation_ratio / site_overall_mean_across_all_data. "
        "This preserves day-type differences (e.g. bank holidays may be genuinely lower than weekdays) "
        "rather than normalising each day type independently."
    ),
    "use": (
        "Used to shape modelled data-centre load — not to estimate absolute MW. "
        "National scale from NESO FES 2025. UKPN profiles cover UKPN licence areas only."
    ),
    "caveats": [
        "Not live data",
        "Not national GB coverage — UKPN licence areas only",
        "Uses apparent power utilisation ratios, not MW",
        "Sites are anonymised; raw data is not exposed",
        "Bank holiday profile based on observed days in dataset",
        "UTC timestamps converted to Europe/London for half-hour slot assignment",
    ],
    "day_type_mean_factors": day_type_mean_factors,
    "qa": {
        "site_count":                   int(df["anonymised_data_centre_name"].nunique()),
        "date_range":                   date_range,
        "row_count":                    len(df),
        "bank_holiday_days_in_dataset": int(df[df["day_type"] == "bank_holiday"]["date"].nunique()),
        "sites_by_type": {
            k: int(v) for k, v in df.drop_duplicates("anonymised_data_centre_name")["dc_type"].value_counts().items()
        },
        **({"sites_by_voltage": sites_by_voltage} if sites_by_voltage else {}),
        "sparse_site_count":       sparse_site_count,
        "invalid_utilisation_count": cnt_invalid,
        "raw_utilisation_min":     round(raw_min, 6),
        "raw_utilisation_max":     round(raw_max, 6),
        "count_utilisation_lt_0":  cnt_neg,
        "count_utilisation_gt_1":  cnt_gt1,
        "count_utilisation_gt_1p5": cnt_gt1p5,
        "raw_file_sha256":         sha256,
    },
    "flatness": flat_stats,
    "profiles": results,
}

with open(OUT_JSON, "w") as f:
    json.dump(out, f, indent=2)
print(f"\nJSON  → {OUT_JSON}")


# ── Chart ────────────────────────────────────────────────────────────────────
COLORS = {"weekday": "#334155", "saturday": "#64748b", "sunday": "#f59e0b", "bank_holiday": "#dc2626"}
LABELS = {"weekday": "Weekday", "saturday": "Saturday", "sunday": "Sunday", "bank_holiday": "Bank holiday"}

x       = [i * 0.5 for i in range(48)]
xticks  = list(range(0, 24, 3))
xlabels = [f"{h:02d}:00" for h in xticks]

fig, axes = plt.subplots(1, 3, figsize=(16, 5), sharey=True)
fig.patch.set_facecolor("#f9f9f7")

for ax, (label, title) in zip(axes, [
    ("all_sites",  "All sites (96)"),
    ("co_located", "Co-located (78)"),
    ("enterprise", "Enterprise (18)"),
]):
    ax.set_facecolor("white")
    for spine in ["top", "right"]:
        ax.spines[spine].set_visible(False)
    for spine in ["left", "bottom"]:
        ax.spines[spine].set_color("#e2e8f0")
    ax.tick_params(colors="#64748b", labelsize=8)
    ax.set_title(title, fontsize=10, color="#1e293b", pad=8)
    ax.set_xlabel("Time (London)", fontsize=8, color="#64748b")
    if ax is axes[0]:
        ax.set_ylabel("Relative utilisation\n(normalised to overall mean = 1.0)", fontsize=8, color="#64748b")
    ax.set_xticks(xticks)
    ax.set_xticklabels(xlabels, rotation=45)
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda v, _: f"{v:.3f}"))
    ax.axhline(1.0, color="#cbd5e1", linewidth=0.8, linestyle="--", zorder=0)
    for day in DAY_TYPES:
        p = results[label][day]["median"]
        ax.plot(x, p,
                color=COLORS[day],
                linewidth=2 if day == "bank_holiday" else 1.2,
                label=LABELS[day],
                zorder=3 if day == "bank_holiday" else 2)

axes[0].legend(fontsize=8, frameon=False, loc="lower right", labelcolor="#334155")
fig.suptitle(
    "UKPN data-centre relative utilisation profiles (global-baseline normalised)\n"
    "Median-of-medians · Jan 2023–Apr 2026 · Profiles normalised to overall site mean",
    fontsize=11, color="#1e293b", y=1.01,
)
plt.tight_layout()
plt.savefig(OUT_PNG, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
print(f"Chart → {OUT_PNG}")
