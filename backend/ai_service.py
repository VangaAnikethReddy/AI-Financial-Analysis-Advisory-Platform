"""
AI Insight Generator
Uses Anthropic Claude API to generate financial insights.
Falls back to rule-based insights if API key not set.
"""

import anthropic
import json
import os
from dotenv import load_dotenv

load_dotenv()


def generate_insights(metrics: dict, industry: str, health_score: float, risk_level: str) -> dict:
    """
    Generate 4 types of AI insights.
    Returns dict with: insights, risks, opportunities, cost_tips
    """
    api_key = os.getenv("ANTHROPIC_API_KEY", "")

    if api_key and api_key != "your-api-key-here":
        try:
            return _call_claude(api_key, metrics, industry, health_score, risk_level)
        except Exception as e:
            print(f"Claude API error: {e} — using fallback insights")

    # Fallback if no API key or API fails
    return _fallback_insights(metrics, industry, health_score, risk_level)


def _call_claude(api_key: str, metrics: dict, industry: str, health_score: float, risk_level: str) -> dict:
    """Call the Claude API."""
    client = anthropic.Anthropic(api_key=api_key)

    prompt = f"""You are a financial advisor for Indian small businesses (SMEs).
Analyze this business data and give practical, simple advice.

Industry: {industry}
Health Score: {health_score}/100
Risk Level: {risk_level}

Key Metrics:
- Profit Margin: {metrics.get('profit_margin', 0):.1f}%
- Revenue Growth: {metrics.get('growth_rate', 0):.1f}%
- Expense Ratio: {metrics.get('expense_ratio', 0):.1f}%
- Debt Ratio: {metrics.get('debt_ratio', 0):.1f}%
- Cash Flow Stability: {metrics.get('cashflow_score', 0):.1f}%
- Total Annual Revenue: ₹{metrics.get('total_revenue', 0):,.0f}
- Total Annual Profit: ₹{metrics.get('total_profit', 0):,.0f}

Reply ONLY with this JSON (no extra text):
{{
  "insights": "2-3 sentences about the business financial health. Use simple language.",
  "risks": "2-3 sentences about the main financial risks. Be specific.",
  "opportunities": "2-3 sentences about growth opportunities for {industry} businesses in India.",
  "cost_tips": "2-3 sentences with specific cost-cutting suggestions for this business."
}}"""

    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}]
    )

    text = msg.content[0].text.strip()
    # Remove any markdown code blocks if present
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


def _fallback_insights(metrics: dict, industry: str, health_score: float, risk_level: str) -> dict:
    """
    Rule-based insights when Claude API is not available.
    Still gives useful, personalized advice based on the numbers.
    """
    pm = metrics.get("profit_margin", 0)
    gr = metrics.get("growth_rate", 0)
    er = metrics.get("expense_ratio", 0)
    dr = metrics.get("debt_ratio", 0)
    rev = metrics.get("total_revenue", 0)

    # Insights
    if health_score >= 70:
        insights = f"Your business is financially healthy with a score of {health_score}/100. Profit margin of {pm:.1f}% is strong for a {industry} business. Revenue growth of {gr:.1f}% shows good momentum."
    elif health_score >= 45:
        insights = f"Your business has moderate financial health (score: {health_score}/100). While revenue is ₹{rev:,.0f}, the profit margin of {pm:.1f}% has room for improvement. Focus on reducing expenses to improve profitability."
    else:
        insights = f"Your business needs financial attention urgently (score: {health_score}/100). Profit margin of {pm:.1f}% is critically low and expenses are consuming {er:.1f}% of revenue. Immediate cost reduction is necessary."

    # Risks
    risks_list = []
    if er > 85:
        risks_list.append(f"Operating expenses at {er:.1f}% of revenue is dangerously high — any revenue dip could cause losses.")
    if dr > 55:
        risks_list.append(f"Debt ratio of {dr:.1f}% makes it harder to get new loans and increases financial burden.")
    if pm < 5:
        risks_list.append(f"Very thin profit margin of {pm:.1f}% leaves no buffer for unexpected costs or slow months.")
    if gr < 0:
        risks_list.append("Declining revenue trend is a serious warning sign that needs immediate attention.")
    if not risks_list:
        risks_list.append("Monitor expense growth carefully. Rising costs faster than revenue is the most common SME risk.")
    risks = " ".join(risks_list[:2])

    # Opportunities
    opps = {
        "Manufacturing": "Explore government MSME schemes for machinery upgrades. Export markets offer 20-30% higher margins than domestic sales.",
        "Retail":        "Online selling via Flipkart/Amazon can add 25-40% more revenue. Private label products offer better margins than reselling.",
        "Services":      "Retainer contracts provide stable monthly income. Adding digital delivery of services can reduce costs by 30%.",
        "Technology":    "SaaS pricing model gives predictable revenue. Government Digital India contracts are a large untapped opportunity.",
        "Agriculture":   "FPO membership reduces input costs by 15-20%. Direct-to-consumer models via apps eliminate middlemen.",
        "E-commerce":    "Own website reduces marketplace fees by 10-15%. WhatsApp Business can convert 3x more leads at zero cost.",
        "Logistics":     "Fleet management software cuts fuel costs 10-15%. Last-mile delivery partnerships with e-commerce platforms give steady volume.",
    }
    opportunities = opps.get(industry, "Explore digital channels to reduce costs. Government MSME schemes offer subsidized loans and training.")

    # Cost tips
    if er > 75:
        cost_tips = f"Your expense ratio of {er:.1f}% is high. Review your top 3 expense categories and target 10% reduction each. Switch to cloud software (Zoho, Tally on Cloud) to reduce IT costs. Negotiate 30-60 day payment terms with suppliers."
    else:
        cost_tips = "Automate repetitive tasks using free tools like Google Workspace. Bulk purchase raw materials quarterly for 5-10% discounts. Review subscriptions and vendor contracts annually for better rates."

    return {
        "insights":     insights,
        "risks":        risks,
        "opportunities": opportunities,
        "cost_tips":    cost_tips,
    }
