@echo off
chcp 65001 >nul

echo ========================================
echo    OMAR CAR Server
echo ========================================
echo.
echo Starting server with administrator privileges...
echo.

REM Run PowerShell as Administrator
powershell -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0server.ps1\"' -Verb RunAs"

echo.
echo Server window will open separately.
echo Look for the IP address in the new window.
echo.
pause
