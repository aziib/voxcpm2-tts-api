@echo off
echo ==============================================
echo       VoxCPM API Server Startup Script
echo ==============================================
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Loading VoxCPM model and starting API server...
echo The model will be loaded into memory before the server starts accepting requests.
echo.
uvicorn api:app --host 0.0.0.0 --port 8000
pause
