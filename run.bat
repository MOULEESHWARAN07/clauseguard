@echo off
echo Starting ClauseGuard...
start "Backend" cmd /k "cd N:\clauseguard\backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"
timeout /t 3
start "Frontend" cmd /k "cd N:\clauseguard\frontend && npm run dev"
timeout /t 3
start http://localhost:5173
echo ClauseGuard is running!