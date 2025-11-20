@echo off
echo ========================================
echo    VIRALITYT - Iniciando App
echo ========================================
echo.

echo [1/2] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias por primera vez...
    call npm install
    if errorlevel 1 (
        echo ERROR: No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
) else (
    echo Dependencias ya instaladas
)

echo.
echo [2/2] Iniciando servidor Expo...
echo.
echo ========================================
echo   Abre Expo Go en tu iPhone y escanea
echo   el codigo QR que aparecera a continuacion
echo ========================================
echo.

call npm start

pause

