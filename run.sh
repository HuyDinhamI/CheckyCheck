#!/bin/bash

echo "🎭 CheckyCheck - Emotion Challenge Game"
echo "======================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 and try again."
    exit 1
fi

echo "🐍 Python 3 found"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    if [ $? -eq 0 ]; then
        echo "✅ Virtual environment created"
    else
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Check if requirements are installed
if [ ! -f "venv/pyvenv.cfg" ] || [ requirements.txt -nt venv/pyvenv.cfg ]; then
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Check if model file exists
if [ ! -f "../src/model.h5" ]; then
    echo "❌ Model file not found at ../src/model.h5"
    echo "   Please ensure the model.h5 file is in the src directory"
    exit 1
fi

echo "🤖 Model file found"

# Check if cascade file exists
if [ ! -f "../src/haarcascade_frontalface_default.xml" ]; then
    echo "⚠️  Face cascade not found at ../src/haarcascade_frontalface_default.xml"
    echo "   Will use OpenCV default cascade"
fi

echo ""
echo "🚀 Starting CheckyCheck server..."
echo "📱 Open your browser and go to: http://localhost:5000"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start the server
python server.py
