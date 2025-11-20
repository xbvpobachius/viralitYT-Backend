@echo off
echo ========================================
echo    VIRALITYT - Iniciando en LAN
echo ========================================
echo.

echo [1/3] Obteniendo tu IP local...
node get-ip.js

echo.
echo [2/3] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

echo.
echo [3/3] Iniciando servidor Expo...
echo.
echo ========================================
echo   IMPORTANTE:
echo   - Tu iPhone y PC deben estar en la
echo     misma red WiFi
echo   - Escanea el codigo QR con Expo Go
echo   - Si no funciona, usa start-tunnel.bat
echo ========================================
echo.

call npm start

pause

