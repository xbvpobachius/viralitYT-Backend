@echo off
echo ========================================
echo    VIRALITYT - Modo TUNNEL
echo ========================================
echo.
echo Modo Tunnel funciona desde cualquier red WiFi
echo pero puede ser mas lento (30-60 segundos para iniciar)
echo.

if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

echo.
echo Iniciando en modo TUNNEL...
echo Espera 30-60 segundos para que genere el QR...
echo.

call npm run start:tunnel

pause

