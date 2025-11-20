@echo off
echo ========================================
echo    Forzando modo LAN con IP local
echo ========================================
echo.

echo Deteniendo procesos de Expo si existen...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *expo*" 2>nul

echo.
echo Obteniendo IP local...
node get-ip.js

echo.
echo Iniciando Expo en modo LAN...
echo.

set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
call npx expo start --lan --clear

pause

