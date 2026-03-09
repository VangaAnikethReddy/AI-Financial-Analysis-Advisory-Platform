@echo off
echo ========================================
echo   SME Financial Health Tool - Frontend
echo ========================================
echo.

cd frontend

echo Installing npm packages (first time only)...
npm install

echo.
echo Starting React app...
echo Opening http://localhost:3000
echo Press Ctrl+C to stop
echo.

npm start

pause
