@echo off
echo ========================================
echo    Forzando IP Local: 192.168.1.155
echo ========================================
echo.

echo [1/3] Obteniendo IP local...
node get-ip.js

echo.
echo [2/3] Configurando variables de entorno...
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.155

echo.
echo [3/3] Iniciando Expo con IP forzada...
echo.
echo ========================================
echo   Usa esta URL en Expo Go:
echo   exp://192.168.1.155:8081
echo ========================================
echo.

call npx expo start --lan --clear

pause

