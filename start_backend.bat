@echo off
echo ========================================
echo   SME Financial Health Tool - Backend
echo ========================================
echo.

cd backend

echo Installing required packages...
pip install -r requirements.txt

echo.
echo Starting backend server...
echo Open http://localhost:8000 in your browser
echo API Docs: http://localhost:8000/docs
echo Press Ctrl+C to stop
echo.

uvicorn main:app --reload --port 8000

pause
