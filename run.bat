@echo off
echo 🎭 CheckyCheck - Emotion Challenge Game
echo =======================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python and try again.
    pause
    exit /b 1
)

echo 🐍 Python found

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
)

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

REM Check if model file exists
if not exist "..\src\model.h5" (
    echo ❌ Model file not found at ..\src\model.h5
    echo    Please ensure the model.h5 file is in the src directory
    pause
    exit /b 1
)

echo 🤖 Model file found

REM Check if cascade file exists
if not exist "..\src\haarcascade_frontalface_default.xml" (
    echo ⚠️  Face cascade not found at ..\src\haarcascade_frontalface_default.xml
    echo    Will use OpenCV default cascade
)

echo.
echo 🚀 Starting CheckyCheck server...
echo 📱 Open your browser and go to: http://localhost:5000
echo 🛑 Press Ctrl+C to stop the server
echo.

REM Start the server
python server.py

pause
