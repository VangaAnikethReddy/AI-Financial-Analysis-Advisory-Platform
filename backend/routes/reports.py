"""
Reports Routes
GET /api/reports          → List all my reports
GET /api/reports/{id}     → Get full report details
DELETE /api/reports/{id}  → Delete a report
GET /api/reports/summary  → Dashboard summary stats
"""

import json
from fastapi import APIRouter, HTTPException, Depends
from routes.auth import get_current_user
from database import get_connection

router = APIRouter()


@router.get("/summary")
def get_summary(current_user: dict = Depends(get_current_user)):
    """Dashboard home page stats."""
    conn = get_connection()
    reports = conn.execute(
        "SELECT * FROM reports WHERE user_id=? AND status='completed' ORDER BY created_at DESC",
        (current_user["id"],)
    ).fetchall()
    conn.close()

    reports = [dict(r) for r in reports]

    if not reports:
        return {"total": 0, "latest_score": None, "latest_risk": None, "reports": []}

    scores = [r["health_score"] for r in reports if r["health_score"]]
    return {
        "total":        len(reports),
        "latest_score": reports[0]["health_score"],
        "latest_risk":  reports[0]["risk_level"],
        "avg_score":    round(sum(scores) / len(scores), 1) if scores else None,
        "company":      current_user.get("company", ""),
        "reports": [{
            "id":          r["id"],
            "filename":    r["filename"],
            "industry":    r["industry"],
            "health_score": r["health_score"],
            "risk_level":  r["risk_level"],
            "created_at":  r["created_at"],
        } for r in reports[:5]],
    }


@router.get("/")
def list_reports(current_user: dict = Depends(get_current_user)):
    """List all reports for the current user."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, filename, industry, health_score, risk_level, status, created_at FROM reports WHERE user_id=? ORDER BY created_at DESC",
        (current_user["id"],)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.get("/{report_id}")
def get_report(report_id: int, current_user: dict = Depends(get_current_user)):
    """Get the full report including charts, AI insights, and recommendations."""
    conn = get_connection()

    report = conn.execute(
        "SELECT * FROM reports WHERE id=? AND user_id=?",
        (report_id, current_user["id"])
    ).fetchone()

    if not report:
        conn.close()
        raise HTTPException(404, "Report not found.")

    report = dict(report)

    if report["status"] == "processing":
        conn.close()
        raise HTTPException(202, "Analysis still processing. Please wait a few seconds.")

    if report["status"] == "failed":
        conn.close()
        raise HTTPException(500, f"Analysis failed: {report.get('error_msg', 'Unknown error')}")

    # Load recommendations
    recs = conn.execute(
        "SELECT * FROM recommendations WHERE report_id=? ORDER BY match_score DESC",
        (report_id,)
    ).fetchall()
    conn.close()

    # Parse monthly data JSON
    monthly_data = []
    if report.get("monthly_data"):
        try:
            monthly_data = json.loads(report["monthly_data"])
        except:
            monthly_data = []

    return {
        "id":            report["id"],
        "filename":      report["filename"],
        "industry":      report["industry"],
        "health_score":  report["health_score"],
        "risk_level":    report["risk_level"],
        "status":        report["status"],
        "created_at":    report["created_at"],
        "metrics": {
            "profit_margin":   report["profit_margin"],
            "growth_rate":     report["growth_rate"],
            "expense_ratio":   report["expense_ratio"],
            "debt_ratio":      report["debt_ratio"],
            "cashflow_score":  report["cashflow_score"],
            "total_revenue":   report["total_revenue"],
            "total_profit":    report["total_profit"],
        },
        "monthly_data":      monthly_data,
        "ai_insights":       report["ai_insights"] or "",
        "ai_risks":          report["ai_risks"] or "",
        "ai_opportunities":  report["ai_opportunities"] or "",
        "ai_cost_tips":      report["ai_cost_tips"] or "",
        "recommendations": [dict(r) for r in recs],
    }


@router.delete("/{report_id}")
def delete_report(report_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a report."""
    conn = get_connection()
    conn.execute("DELETE FROM recommendations WHERE report_id=?", (report_id,))
    conn.execute("DELETE FROM reports WHERE id=? AND user_id=?", (report_id, current_user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Report deleted."}
