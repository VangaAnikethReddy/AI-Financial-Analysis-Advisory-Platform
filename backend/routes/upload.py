"""
Upload Route
POST /api/upload  → Upload a financial file, run full analysis, return results
"""

import json
import os
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from routes.auth import get_current_user
from database import get_connection
from parser import parse_file, to_chart_data
from scoring import calculate_score
from ai_service import generate_insights
from recommendations import get_recommendations

router = APIRouter()

ALLOWED = {"csv", "xlsx", "xls", "pdf"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB

VALID_INDUSTRIES = ["Manufacturing", "Retail", "Services", "Technology", "Agriculture", "E-commerce", "Logistics"]


@router.post("/")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    industry: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload financial file and start analysis."""

    # Validate file type
    ext = (file.filename or "").split(".")[-1].lower()
    if ext not in ALLOWED:
        raise HTTPException(400, f"Only CSV, XLSX, and PDF files are allowed. Got: .{ext}")

    if industry not in VALID_INDUSTRIES:
        raise HTTPException(400, f"Invalid industry. Choose from: {VALID_INDUSTRIES}")

    # Read file
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(413, "File too large. Maximum size is 10MB.")

    # Create a report record with 'processing' status
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO reports (user_id, filename, industry, status) VALUES (?,?,?,?)",
        (current_user["id"], file.filename, industry, "processing")
    )
    conn.commit()
    report_id = cursor.lastrowid
    conn.close()

    # Run the analysis in background (non-blocking)
    background_tasks.add_task(run_analysis, report_id, content, file.filename, industry)

    return {"report_id": report_id, "message": "File uploaded. Analysis started."}


def run_analysis(report_id: int, content: bytes, filename: str, industry: str):
    """
    Full analysis pipeline:
    1. Parse file
    2. Calculate score
    3. Generate AI insights
    4. Get loan recommendations
    5. Save everything to database
    """
    conn = get_connection()
    try:
        # Step 1: Parse the file
        df = parse_file(content, filename)
        chart_data = to_chart_data(df)

        # Step 2: Calculate health score
        health_score, risk_level, metrics = calculate_score(df, industry)

        # Step 3: Generate AI insights
        ai = generate_insights(metrics, industry, health_score, risk_level)

        # Step 4: Get loan recommendations
        recs = get_recommendations(metrics, health_score, risk_level, industry)

        # Step 5: Save results to database
        conn.execute("""
            UPDATE reports SET
                health_score   = ?,
                risk_level     = ?,
                profit_margin  = ?,
                growth_rate    = ?,
                expense_ratio  = ?,
                debt_ratio     = ?,
                cashflow_score = ?,
                total_revenue  = ?,
                total_profit   = ?,
                monthly_data   = ?,
                ai_insights    = ?,
                ai_risks       = ?,
                ai_opportunities = ?,
                ai_cost_tips   = ?,
                status         = ?
            WHERE id = ?
        """, (
            health_score, risk_level,
            metrics["profit_margin"], metrics["growth_rate"],
            metrics["expense_ratio"], metrics["debt_ratio"],
            metrics["cashflow_score"], metrics["total_revenue"],
            metrics["total_profit"],
            json.dumps(chart_data),
            ai["insights"], ai["risks"], ai["opportunities"], ai["cost_tips"],
            "completed",
            report_id
        ))

        # Save loan recommendations
        for r in recs:
            conn.execute("""
                INSERT INTO recommendations
                (report_id, product_name, product_type, provider, rate_min, rate_max, max_amount, match_score, reason, apply_url)
                VALUES (?,?,?,?,?,?,?,?,?,?)
            """, (
                report_id, r["product_name"], r["product_type"], r["provider"],
                r["rate_min"], r["rate_max"], r["max_amount"],
                r["match_score"], r["reason"], r["apply_url"]
            ))

        conn.commit()
        print(f"✅ Report {report_id} completed. Score: {health_score}")

    except Exception as e:
        print(f"❌ Report {report_id} failed: {e}")
        conn.execute("UPDATE reports SET status=?, error_msg=? WHERE id=?",
                     ("failed", str(e), report_id))
        conn.commit()
    finally:
        conn.close()


@router.get("/status/{report_id}")
def get_status(report_id: int, current_user: dict = Depends(get_current_user)):
    """Poll analysis status."""
    conn = get_connection()
    row = conn.execute(
        "SELECT status, error_msg FROM reports WHERE id=? AND user_id=?",
        (report_id, current_user["id"])
    ).fetchone()
    conn.close()

    if not row:
        raise HTTPException(404, "Report not found.")
    return {"status": row["status"], "error": row["error_msg"]}
