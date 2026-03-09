"""
SME Financial Health Assessment Tool
Simple FastAPI backend with SQLite database
Run with: uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Import all route files
from routes import auth, upload, reports

# Import database setup
from database import init_db

# Create the FastAPI app
app = FastAPI(
    title="SME Financial Health Tool",
    description="AI-powered financial health assessment for small businesses",
    version="1.0.0"
)

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads folder if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Create all database tables when app starts
init_db()

# Register routes
app.include_router(auth.router,    prefix="/api/auth",    tags=["Auth"])
app.include_router(upload.router,  prefix="/api/upload",  tags=["Upload"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/")
def home():
    return {"message": "SME Financial Health API is running!", "docs": "/docs"}
