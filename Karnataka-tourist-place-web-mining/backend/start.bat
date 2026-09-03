@echo off
REM Local backend startup script for Windows

echo Starting Karnataka Tourist Blog Backend...
echo.

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file...
    echo GEMINI_API_KEY=your_key_here > .env
)

REM Install dependencies
echo Installing backend dependencies...
call npm install

REM Start the server
echo Starting server on http://localhost:3001
echo.
node src/index.js
