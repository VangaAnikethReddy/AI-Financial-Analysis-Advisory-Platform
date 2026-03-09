# 🏦 SME Financial Health Assessment Tool

> **Final Year BTech CS Project** — AI-powered financial analysis for small businesses

---

## ⚡ Quick Setup (5 minutes)

### What you need installed:
- Python 3.9+ (already installed on your PC)
- Node.js 18+ → download from https://nodejs.org

**No PostgreSQL needed! Uses SQLite (built into Python)**

---

### Step 1 — Setup Backend

Open a terminal in the `backend` folder and run:

```
pip install -r requirements.txt
```

Then edit the `.env` file and add your Anthropic API key:
```
ANTHROPIC_API_KEY=your-key-here
```
Get a free key from: https://console.anthropic.com

Start the backend:
```
uvicorn main:app --reload
```

✅ Backend running at: http://localhost:8000  
📖 API docs at: http://localhost:8000/docs

---

### Step 2 — Setup Frontend

Open a **new** terminal in the `frontend` folder and run:

```
npm install
npm start
```

✅ App opens at: http://localhost:3000

---

### OR — Just double-click these files:
- `start_backend.bat` — starts the backend
- `start_frontend.bat` — starts the frontend

---

## 🗄️ Database

Uses **SQLite** — the database file `financial_health.db` is created automatically in the `backend` folder when you first run the app. No setup needed.

---

## 📁 Project Structure

```
sme-financial-health/
├── backend/
│   ├── main.py           ← FastAPI app entry point
│   ├── database.py       ← SQLite setup (auto-creates tables)
│   ├── scoring.py        ← Financial health scoring algorithm
│   ├── parser.py         ← CSV/XLSX/PDF file parser
│   ├── ai_service.py     ← Claude AI API integration
│   ├── recommendations.py ← Loan product matching
│   ├── routes/
│   │   ├── auth.py       ← Login/Register
│   │   ├── upload.py     ← File upload + analysis
│   │   └── reports.py    ← Report data endpoints
│   ├── requirements.txt
│   └── .env              ← Add your API key here
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx / Register.jsx
│       │   ├── Home.jsx      ← Dashboard
│       │   ├── Upload.jsx    ← File upload
│       │   ├── Report.jsx    ← Full report with charts
│       │   └── MyReports.jsx ← All reports list
│       └── utils/api.js      ← All API calls
│
├── data/
│   └── sample_financial_data.csv  ← Use this to test
│
├── start_backend.bat   ← Double-click to start backend
└── start_frontend.bat  ← Double-click to start frontend
```

---

## 📊 How Scoring Works

| Dimension | Weight | Metric |
|-----------|--------|--------|
| Profitability | 30% | Net Profit Margin |
| Revenue Growth | 20% | Year-over-year growth |
| Expense Control | 20% | Expense/Revenue ratio |
| Cash Flow | 15% | % months positive |
| Debt Management | 15% | Debt/Revenue ratio |

**Score → Risk Level:**
- 70–100 = 🟢 Low Risk
- 45–69  = 🟡 Medium Risk
- 0–44   = 🔴 High Risk

---

## 🧪 Test the App

Use the sample file: `data/sample_financial_data.csv`

Expected result:
- Industry: Manufacturing
- Score: ~74/100
- Risk: Low Risk

---

## 🤖 AI Features

If you add an Anthropic API key, you get AI-generated:
- Financial insights
- Risk warnings
- Growth opportunities
- Cost reduction tips

**No API key?** The system still works using built-in rule-based analysis.
