@echo off
echo ========================================
echo    Instalando babel-preset-expo
echo ========================================
echo.

echo Instalando dependencia faltante...
call npm install babel-preset-expo@~11.0.0 --save-dev

if errorlevel 1 (
    echo.
    echo ERROR: Fallo la instalacion
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Instalacion completada!
echo ========================================
echo.
echo Ahora ejecuta:
echo   npm run start:tunnel
echo.
pause

