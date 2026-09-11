@echo off
echo ================================
echo   ClauseGuard Backend Setup
echo ================================

echo [1/4] Creating virtual environment...
python -m venv venv

echo [2/4] Activating virtual environment...
call venv\Scripts\activate

echo [3/4] Installing dependencies...
pip install fastapi uvicorn python-multipart PyMuPDF spacy sentence-transformers faiss-cpu httpx python-dotenv pydantic

echo [4/4] Downloading spaCy model...
python -m spacy download en_core_web_sm

echo.
echo ================================
echo   Setup Complete!
echo   Run: start.bat to launch
echo ================================
pause
