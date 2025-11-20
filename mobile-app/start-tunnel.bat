@echo off
echo ========================================
echo    VIRALITYT - Iniciando con TUNNEL
echo ========================================
echo.
echo Este modo funciona desde cualquier red WiFi
echo pero puede ser mas lento.
echo.

if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

echo.
echo Iniciando en modo TUNNEL...
echo Escanea el codigo QR con Expo Go
echo.

call npm run start:tunnel

pause

