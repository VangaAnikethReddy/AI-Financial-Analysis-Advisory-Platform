"""
Financial Health Scoring Engine
Calculates a score from 0 to 100 based on 5 financial ratios.
"""

import pandas as pd

# ── Industry Benchmarks ────────────────────────────────────────────────────────
# What counts as "good" or "okay" for each industry
BENCHMARKS = {
    "Manufacturing": {"profit_good": 15, "profit_ok": 8,  "expense_good": 70, "expense_ok": 82, "debt_good": 30, "debt_ok": 50, "growth_good": 10, "growth_ok": 4},
    "Retail":        {"profit_good": 8,  "profit_ok": 4,  "expense_good": 75, "expense_ok": 87, "debt_good": 35, "debt_ok": 55, "growth_good": 12, "growth_ok": 5},
    "Services":      {"profit_good": 20, "profit_ok": 10, "expense_good": 65, "expense_ok": 78, "debt_good": 25, "debt_ok": 45, "growth_good": 15, "growth_ok": 6},
    "Technology":    {"profit_good": 25, "profit_ok": 12, "expense_good": 60, "expense_ok": 75, "debt_good": 20, "debt_ok": 40, "growth_good": 20, "growth_ok": 8},
    "Agriculture":   {"profit_good": 12, "profit_ok": 5,  "expense_good": 72, "expense_ok": 84, "debt_good": 40, "debt_ok": 60, "growth_good": 8,  "growth_ok": 3},
    "E-commerce":    {"profit_good": 10, "profit_ok": 4,  "expense_good": 78, "expense_ok": 90, "debt_good": 30, "debt_ok": 52, "growth_good": 25, "growth_ok": 10},
    "Logistics":     {"profit_good": 10, "profit_ok": 5,  "expense_good": 75, "expense_ok": 87, "debt_good": 35, "debt_ok": 55, "growth_good": 10, "growth_ok": 4},
}


def score_value(value, good, ok, invert=False):
    """
    Convert a raw ratio into a 0-100 score.
    invert=True means lower is better (e.g. expenses, debt)
    """
    if invert:
        if value <= good:  return 100
        if value <= ok:    return 100 - ((value - good) / (ok - good)) * 40
        return max(0, 60 - (value - ok) * 2)
    else:
        if value >= good:  return 100
        if value >= ok:    return 60 + ((value - ok) / (good - ok)) * 40
        if value >= 0:     return (value / ok) * 60 if ok > 0 else 30
        return max(0, 30 + value * 2)


def calculate_score(df: pd.DataFrame, industry: str):
    """
    Main scoring function.
    Returns: (health_score, risk_level, metrics_dict)
    """
    b = BENCHMARKS.get(industry, BENCHMARKS["Services"])

    # ── Calculate the 5 key ratios ─────────────────────────────────────────────

    total_revenue  = float(df["revenue"].sum())
    total_expenses = float(df["expenses"].sum())
    total_profit   = float(df["profit"].sum())

    # 1. Profit Margin = Net Profit / Revenue × 100
    profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0

    # 2. Revenue Growth Rate - compare last 3 months to first 3 months
    if len(df) >= 6:
        early = df["revenue"].iloc[:3].mean()
        late  = df["revenue"].iloc[-3:].mean()
        growth_rate = ((late - early) / early * 100) if early > 0 else 0
    else:
        growth_rate = float(df["revenue"].pct_change().mean() * 100) if len(df) > 1 else 0

    # 3. Operating Expense Ratio = Expenses / Revenue × 100
    expense_ratio = (total_expenses / total_revenue * 100) if total_revenue > 0 else 100

    # 4. Debt to Revenue Ratio
    if "liabilities" in df.columns:
        debt_ratio = (float(df["liabilities"].mean()) / total_revenue * 100) if total_revenue > 0 else 30
    else:
        debt_ratio = 30.0  # Default assumption

    # 5. Cash Flow Stability = % of months with positive cash flow
    if "cash_flow" in df.columns:
        positive_months = (df["cash_flow"] > 0).sum()
        cashflow_score  = (positive_months / len(df)) * 100
    else:
        cashflow_score = 70.0  # Default

    # ── Score each dimension ───────────────────────────────────────────────────
    s_profit   = score_value(profit_margin, b["profit_good"],  b["profit_ok"])
    s_growth   = score_value(growth_rate,   b["growth_good"],  b["growth_ok"])
    s_expense  = score_value(expense_ratio, b["expense_good"], b["expense_ok"], invert=True)
    s_cashflow = cashflow_score  # Already 0-100
    s_debt     = score_value(debt_ratio,    b["debt_good"],    b["debt_ok"],    invert=True)

    # ── Weighted total (adds up to 100%) ──────────────────────────────────────
    health_score = round(
        s_profit   * 0.30 +
        s_growth   * 0.20 +
        s_expense  * 0.20 +
        s_cashflow * 0.15 +
        s_debt     * 0.15,
        1
    )
    health_score = max(0, min(100, health_score))

    # ── Risk Level ────────────────────────────────────────────────────────────
    if   health_score >= 70: risk_level = "Low Risk"
    elif health_score >= 45: risk_level = "Medium Risk"
    else:                    risk_level = "High Risk"

    metrics = {
        "profit_margin":   round(profit_margin,  1),
        "growth_rate":     round(growth_rate,    1),
        "expense_ratio":   round(expense_ratio,  1),
        "debt_ratio":      round(debt_ratio,     1),
        "cashflow_score":  round(cashflow_score, 1),
        "total_revenue":   round(total_revenue,  2),
        "total_profit":    round(total_profit,   2),
        "total_expenses":  round(total_expenses, 2),
        "avg_monthly_rev": round(total_revenue / len(df), 2),
        "sub_scores": {
            "profitability":   round(s_profit,   1),
            "revenue_growth":  round(s_growth,   1),
            "expense_control": round(s_expense,  1),
            "cash_flow":       round(s_cashflow, 1),
            "debt_mgmt":       round(s_debt,     1),
        }
    }

    return health_score, risk_level, metrics
