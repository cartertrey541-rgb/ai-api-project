@echo off
title Neon Rush - Setup & Launch
color 0B

echo.
echo  ================================
echo   NEON RUSH - Setup and Launch
echo  ================================
echo.

:: Fix PowerShell execution policy
powershell -Command "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force" >nul 2>&1

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js is not installed.
    echo.
    echo  Please install it first:
    echo  1. Open your browser
    echo  2. Go to https://nodejs.org
    echo  3. Download and install the LTS version
    echo  4. Re-run this file after installing
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found:
node --version

:: Check if npm works
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] npm not found. Please reinstall Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] npm found:
npm --version
echo.

:: Navigate to neon-rush folder
cd /d "%~dp0neon-rush"
if %errorlevel% neq 0 (
    echo [!] Could not find the neon-rush folder.
    echo     Make sure this setup.bat file is inside the ai-api-project folder.
    pause
    exit /b 1
)

echo [OK] Found neon-rush folder
echo.

:: Install dependencies
echo [>>] Installing dependencies (this may take 2-3 minutes)...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [!] npm install failed. Check the errors above.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed!
echo.

:: Install Expo CLI globally if not present
where npx >nul 2>&1
if %errorlevel% neq 0 (
    echo [>>] Installing Expo CLI...
    call npm install -g expo-cli
)

echo.
echo  ================================
echo   Starting Neon Rush...
echo  ================================
echo.
echo  A QR code will appear below.
echo  Scan it with the Expo Go app on
echo  your Android phone to play!
echo.
echo  Install Expo Go from Google Play:
echo  Search "Expo Go" on the Play Store
echo.

call npx expo start

pause
