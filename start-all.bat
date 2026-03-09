@echo off
REM VigilAI - Start All Services Script (Windows)
REM Starts PostgreSQL (Docker), Next.js backend, and HTML frontend server

echo.
echo ========================================
echo    VigilAI - Starting All Services
echo ========================================
echo.

REM ── 1. PostgreSQL via Docker ──────────────────────────────────────────────
echo [1/5] Starting PostgreSQL database (Docker)...
docker info >nul 2>&1
if errorlevel 1 (
    echo WARNING: Docker is not running. Please start Docker Desktop first.
    echo          PostgreSQL must be available on port 5432.
    echo          Continuing without starting Docker...
) else (
    docker start vigilai-postgres 2>nul || (
        echo Creating new PostgreSQL container...
        docker run -d --name vigilai-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=vigilai -p 5432:5432 postgres:16-alpine
    )
    echo Waiting for database to be ready...
    timeout /t 5 /nobreak >nul
)

REM ── 2. Platform dependencies ──────────────────────────────────────────────
echo.
echo [2/5] Installing platform (Next.js) dependencies...
cd /d "%~dp0platform"
if not exist "node_modules" (
    call npm install
)

REM ── 3. Prisma client + migrations ─────────────────────────────────────────
echo.
echo [3/5] Generating Prisma client and running migrations...
cd /d "%~dp0platform"
call npx prisma generate
call npx prisma migrate deploy 2>nul
if errorlevel 1 (
    echo NOTE: migrate deploy failed, trying db push...
    call npx prisma db push --accept-data-loss
)

REM ── 4. Frontend dependencies ───────────────────────────────────────────────
echo.
echo [4/5] Installing frontend dependencies...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    call npm install
)

REM ── 5. Launch both servers in separate windows ─────────────────────────────
echo.
echo [5/5] Launching servers...
echo.

REM Start Next.js backend in a new terminal window
echo Starting Backend  -> http://localhost:3000
start "VigilAI Backend" cmd /c "cd /d ""%~dp0platform"" && npm run dev"

REM Wait a moment, then start the frontend server
timeout /t 2 /nobreak >nul

REM Start HTML frontend server in a new terminal window
echo Starting Frontend -> http://localhost:8080
start "VigilAI Frontend" cmd /c "cd /d ""%~dp0frontend"" && npx http-server -p 8080 -c-1 --cors"

echo.
echo ========================================
echo   Both servers are starting up!
echo ========================================
echo.
echo   Frontend : http://localhost:8080/login.html
echo   Backend  : http://localhost:3000
echo   DB Studio: cd platform ^&^& npx prisma studio
echo.
echo   Open http://localhost:8080/login.html in your browser
echo   to access the VigilAI application.
echo.
echo   Login credentials:
echo     Email   : admin@vigilai.com
echo     Password: TestPass123!
echo.
pause
