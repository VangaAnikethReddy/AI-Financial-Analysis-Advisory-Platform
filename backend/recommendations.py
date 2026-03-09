"""
Loan Recommendation Engine
Matches business profile to suitable Indian bank loan products.
"""

PRODUCTS = [
    {
        "product_name":  "SBI SME Business Loan",
        "product_type":  "Business Loan",
        "provider":      "SBI",
        "rate_min":      8.60,
        "rate_max":      11.20,
        "max_amount":    5000000,
        "min_revenue":   500000,
        "max_debt":      70,
        "min_score":     40,
        "risk_ok":       ["Low Risk", "Medium Risk"],
        "industries":    ["Manufacturing", "Retail", "Services", "Technology", "Logistics", "E-commerce", "Agriculture"],
        "apply_url":     "https://sbi.co.in/web/business/loans/sme-loans",
    },
    {
        "product_name":  "SBI Working Capital Loan",
        "product_type":  "Working Capital",
        "provider":      "SBI",
        "rate_min":      9.00,
        "rate_max":      12.00,
        "max_amount":    2500000,
        "min_revenue":   200000,
        "max_debt":      80,
        "min_score":     30,
        "risk_ok":       ["Low Risk", "Medium Risk", "High Risk"],
        "industries":    ["Manufacturing", "Retail", "Agriculture", "Logistics"],
        "apply_url":     "https://sbi.co.in/web/business/loans/working-capital",
    },
    {
        "product_name":  "PMMY Mudra Loan - Kishor",
        "product_type":  "Mudra Loan",
        "provider":      "SBI / Any Bank",
        "rate_min":      9.50,
        "rate_max":      12.00,
        "max_amount":    500000,
        "min_revenue":   50000,
        "max_debt":      90,
        "min_score":     10,
        "risk_ok":       ["Low Risk", "Medium Risk", "High Risk"],
        "industries":    ["Manufacturing", "Retail", "Services", "Agriculture"],
        "apply_url":     "https://www.mudra.org.in",
    },
    {
        "product_name":  "HDFC Business Growth Loan",
        "product_type":  "Business Loan",
        "provider":      "HDFC Bank",
        "rate_min":      10.00,
        "rate_max":      14.00,
        "max_amount":    7500000,
        "min_revenue":   1000000,
        "max_debt":      60,
        "min_score":     55,
        "risk_ok":       ["Low Risk"],
        "industries":    ["Technology", "Services", "E-commerce", "Manufacturing"],
        "apply_url":     "https://www.hdfcbank.com/sme/loans/business-loans",
    },
    {
        "product_name":  "HDFC Invoice Financing",
        "product_type":  "Invoice Financing",
        "provider":      "HDFC Bank",
        "rate_min":      11.00,
        "rate_max":      15.00,
        "max_amount":    3000000,
        "min_revenue":   400000,
        "max_debt":      70,
        "min_score":     40,
        "risk_ok":       ["Low Risk", "Medium Risk"],
        "industries":    ["Manufacturing", "Retail", "Logistics", "Services"],
        "apply_url":     "https://www.hdfcbank.com/sme",
    },
    {
        "product_name":  "ICICI Business Installment Loan",
        "product_type":  "Business Loan",
        "provider":      "ICICI Bank",
        "rate_min":      9.00,
        "rate_max":      13.00,
        "max_amount":    10000000,
        "min_revenue":   1500000,
        "max_debt":      55,
        "min_score":     60,
        "risk_ok":       ["Low Risk"],
        "industries":    ["Manufacturing", "Technology", "Services", "E-commerce"],
        "apply_url":     "https://www.icicibank.com/business-banking/loans",
    },
    {
        "product_name":  "ICICI Working Capital Finance",
        "product_type":  "Working Capital",
        "provider":      "ICICI Bank",
        "rate_min":      9.50,
        "rate_max":      13.50,
        "max_amount":    4000000,
        "min_revenue":   500000,
        "max_debt":      70,
        "min_score":     40,
        "risk_ok":       ["Low Risk", "Medium Risk"],
        "industries":    ["Manufacturing", "Retail", "Logistics", "Agriculture"],
        "apply_url":     "https://www.icicibank.com/business-banking/working-capital",
    },
    {
        "product_name":  "Axis Bank Business Gold Loan",
        "product_type":  "Secured Loan",
        "provider":      "Axis Bank",
        "rate_min":      7.50,
        "rate_max":      10.00,
        "max_amount":    2000000,
        "min_revenue":   100000,
        "max_debt":      90,
        "min_score":     15,
        "risk_ok":       ["Low Risk", "Medium Risk", "High Risk"],
        "industries":    ["Manufacturing", "Retail", "Agriculture", "Services", "Logistics"],
        "apply_url":     "https://www.axisbank.com/business-banking/loans",
    },
]


def get_recommendations(metrics: dict, health_score: float, risk_level: str, industry: str) -> list:
    """
    Return list of matching loan products sorted by match score.
    """
    revenue   = metrics.get("total_revenue", 0)
    debt_ratio = metrics.get("debt_ratio", 0)
    matched = []

    for p in PRODUCTS:
        # Check eligibility
        if revenue < p["min_revenue"]:     continue
        if debt_ratio > p["max_debt"]:     continue
        if health_score < p["min_score"]:  continue
        if risk_level not in p["risk_ok"]: continue

        # Calculate match score 0-100
        match = 50.0
        if industry in p["industries"]: match += 15
        match += (health_score / 100) * 20
        if risk_level == "Low Risk":    match += 15
        elif risk_level == "Medium Risk": match += 8
        if metrics.get("growth_rate", 0) > 10: match += 5

        matched.append({
            **{k: v for k, v in p.items() if k not in ["min_revenue", "max_debt", "min_score", "risk_ok", "industries"]},
            "match_score": round(min(100, match), 1),
            "reason": _reason(p, health_score, industry),
        })

    matched.sort(key=lambda x: x["match_score"], reverse=True)
    return matched[:6]


def _reason(product: dict, score: float, industry: str) -> str:
    if score >= 70:
        return f"Strong financial profile qualifies you for this {product['product_type'].lower()} with competitive rates."
    elif score >= 45:
        return f"Your business meets the eligibility criteria. This {product['product_type'].lower()} suits your current financial stage."
    else:
        return f"Basic eligibility met. This {product['product_type'].lower()} can help stabilize your business finances."
