"""
Generate a synthetic dataset for the Oil Smart Park system (OIPMS).

Run:
    pip install -r requirements.txt
    python generate_synthetic_data.py --out ./output

Output: a set of CSV files in the output folder for loading into the backend/dashboard.
This script is the Python equivalent of the existing TypeScript generator in src/data/generate.ts.
"""
from __future__ import annotations

import argparse
import os

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

try:
    from faker import Faker
    fake = Faker("fa_IR")
except Exception:  # pragma: no cover
    fake = None

SEED = 42
np.random.seed(SEED)
random.seed(SEED)
if fake:
    Faker.seed(SEED)

FIELDS = [
    "Oil & Gas", "Refining", "Petrochemical", "Renewable Energy",
    "Information Technology", "Industrial Machinery", "Management Consulting", "Laboratory",
]


def _company_name(i: int) -> str:
    return fake.company() if fake else f"Technology Company No. {i + 1}"


def generate_companies(n: int = 52) -> pd.DataFrame:
    rows = []
    for i in range(n):
        rows.append({
            "Company_ID": f"C{1000 + i}",
            "Company_Name": _company_name(i),
            "Establishment_Date": (datetime.now() - timedelta(days=int(np.random.randint(365, 365 * 15)))).strftime("%Y-%m-%d"),
            "Employee_Count": int(np.random.randint(5, 200)),
            "Field_of_Activity": random.choice(FIELDS),
            "Area_m2": int(np.random.randint(50, 2000)),
            "Rental_Rate_per_m2": round(float(np.random.uniform(2_000_000, 8_000_000))),
            "Maturity_Level": int(np.random.randint(1, 6)),
            "Is_Knowledge_Based": bool(np.random.choice([True, False], p=[0.42, 0.58])),
            "Has_Patent": bool(np.random.choice([True, False], p=[0.3, 0.7])),
        })
    return pd.DataFrame(rows)


def generate_rental_payments(companies: pd.DataFrame, n_months: int = 12) -> pd.DataFrame:
    rows = []
    start = datetime.now() - timedelta(days=n_months * 30)
    for _, c in companies.iterrows():
        streak = 0
        for m in range(n_months):
            issue = start + timedelta(days=m * 30)
            due = issue + timedelta(days=30)
            total = int(c["Area_m2"] * c["Rental_Rate_per_m2"])
            status = random.choices(["Paid", "Pending", "Overdue"], weights=[0.68, 0.18, 0.14])[0]
            if due > datetime.now() and status == "Overdue":
                status = "Pending"
            streak = streak + 1 if status == "Overdue" else 0
            penalty = int(total * 0.02 * streak) if streak else 0
            rows.append({
                "Invoice_ID": f"INV-{c['Company_ID']}-{m + 1}",
                "Tenant_ID": c["Company_ID"],
                "Company_Name": c["Company_Name"],
                "Total_Rent": total,
                "Issue_Date": issue.strftime("%Y-%m-%d"),
                "Due_Date": due.strftime("%Y-%m-%d"),
                "Payment_Date": (issue + timedelta(days=int(np.random.randint(-3, 20)))).strftime("%Y-%m-%d") if status == "Paid" else None,
                "Status": status,
                "Months_Overdue": streak,
                "Penalty": penalty,
                "Gate_Access_Revoked": streak >= 2,
            })
    return pd.DataFrame(rows)


def generate_startup_evaluations(n: int = 200) -> pd.DataFrame:
    rows = []
    for i in range(n):
        team = np.random.uniform(40, 95)
        market = np.random.uniform(30, 90)
        product = np.random.uniform(35, 92)
        final = team * 0.3 + market * 0.35 + product * 0.35
        valuation = int(final * 100_000_000 * np.random.uniform(0.8, 2.5) * np.random.uniform(0.5, 3.0))
        rows.append({
            "Team_ID": f"T{1000 + i}",
            "Team_Score": round(team, 1),
            "Market_Score": round(market, 1),
            "Product_Score": round(product, 1),
            "AI_Final_Score": round(final, 1),
            "Valuation_Rial": valuation,
            "Valuation_USD": int(valuation / 620000),
            "Investment_Recommendation": bool(final > 68),
            "Suggested_Investment_Rial": int(valuation * np.random.uniform(0.1, 0.4)),
            "TRL_Level": int(np.random.randint(3, 9)),
        })
    return pd.DataFrame(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="./output")
    args = parser.parse_args()
    os.makedirs(args.out, exist_ok=True)

    print("🔄 Generating synthetic data for the oil smart park…")
    companies = generate_companies()
    rental = generate_rental_payments(companies)
    startups = generate_startup_evaluations()

    companies.to_csv(os.path.join(args.out, "companies.csv"), index=False)
    rental.to_csv(os.path.join(args.out, "rental_payments.csv"), index=False)
    startups.to_csv(os.path.join(args.out, "startup_evaluations.csv"), index=False)

    print(f"✅ Companies: {len(companies)} | Rental invoices: {len(rental)} | Startups: {len(startups)}")
    print(f"📁 Output in: {os.path.abspath(args.out)}")


if __name__ == "__main__":
    main()
