"""
Financial Data Parser
Reads CSV, XLSX, or PDF files and returns a clean pandas DataFrame.
"""

import pandas as pd
import pdfplumber
import io

# Map different column names people might use → our standard names
COLUMN_MAP = {
    "revenue":   ["revenue", "total_revenue", "sales", "total_sales", "income", "turnover", "gross_revenue"],
    "expenses":  ["expenses", "operating_expenses", "opex", "total_expenses", "costs", "operating_costs", "cost_of_goods_sold", "cogs"],
    "profit":    ["profit", "net_profit", "net_income", "earnings", "net_earnings"],
    "cash_flow": ["cash_flow", "operating_cash_flow", "net_cash", "cashflow"],
    "liabilities": ["liabilities", "total_liabilities", "debt", "total_debt"],
    "month":     ["month", "period", "date", "month_year"],
}


def parse_file(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """
    Parse uploaded file and return a clean DataFrame.
    Automatically detects CSV, XLSX, or PDF.
    """
    ext = filename.lower().split(".")[-1]

    if ext == "csv":
        df = pd.read_csv(io.BytesIO(file_bytes))
    elif ext in ("xlsx", "xls"):
        df = pd.read_excel(io.BytesIO(file_bytes))
    elif ext == "pdf":
        df = _parse_pdf(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}. Please use CSV, XLSX, or PDF.")

    df = _normalize_columns(df)
    df = _clean_numbers(df)
    df = _fill_missing(df)
    return df


def _parse_pdf(file_bytes: bytes) -> pd.DataFrame:
    """Extract table data from PDF."""
    rows = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            for table in (page.extract_tables() or []):
                if len(table) > 1:
                    headers = [str(h or "").strip().lower() for h in table[0]]
                    for row in table[1:]:
                        if any(row):
                            rows.append(dict(zip(headers, row)))
    if not rows:
        raise ValueError("No tables found in PDF. Please use CSV or XLSX format instead.")
    return pd.DataFrame(rows)


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Rename columns to standard names."""
    # Lowercase all column names first
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    rename = {}
    for standard, aliases in COLUMN_MAP.items():
        for col in df.columns:
            if col in aliases and col != standard and standard not in rename.values():
                rename[col] = standard
    return df.rename(columns=rename)


def _clean_numbers(df: pd.DataFrame) -> pd.DataFrame:
    """Remove currency symbols and convert to numbers."""
    skip = {"month", "industry", "period", "date"}
    for col in df.columns:
        if col not in skip:
            df[col] = df[col].astype(str).str.replace(r"[₹$€£,\s]", "", regex=True)
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def _fill_missing(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate missing columns from what we have."""

    # Must have revenue and expenses at minimum
    if "revenue" not in df.columns:
        raise ValueError("File must have a 'revenue' or 'sales' column.")
    if "expenses" not in df.columns:
        raise ValueError("File must have an 'expenses' or 'operating_expenses' column.")

    # Calculate profit if missing
    if "profit" not in df.columns:
        df["profit"] = df["revenue"] - df["expenses"]

    # Estimate cash flow if missing
    if "cash_flow" not in df.columns:
        df["cash_flow"] = df["profit"] * 0.85

    # Fill any NaN with column median
    for col in ["revenue", "expenses", "profit", "cash_flow"]:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())

    return df


def to_chart_data(df: pd.DataFrame) -> list:
    """Convert DataFrame to list of dicts for frontend charts."""
    result = []
    for i, row in df.iterrows():
        result.append({
            "month":     str(row.get("month", f"Month {i+1}")),
            "revenue":   float(row.get("revenue", 0)),
            "expenses":  float(row.get("expenses", 0)),
            "profit":    float(row.get("profit", 0)),
            "cash_flow": float(row.get("cash_flow", 0)),
        })
    return result
