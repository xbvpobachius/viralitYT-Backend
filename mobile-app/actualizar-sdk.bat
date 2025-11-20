@echo off
echo ========================================
echo    Actualizando a SDK 54
echo ========================================
echo.

echo [1/4] Deteniendo procesos...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Eliminando node_modules...
if exist "node_modules" (
    rmdir /s /q node_modules
    echo node_modules eliminado
) else (
    echo node_modules no existe
)

echo.
echo [3/4] Eliminando package-lock.json...
if exist "package-lock.json" (
    del /q package-lock.json
    echo package-lock.json eliminado
)

echo.
echo [4/4] Instalando dependencias actualizadas...
call npm install

if errorlevel 1 (
    echo.
    echo ERROR: Fallo la instalacion
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Actualizacion completada!
echo ========================================
echo.
echo Ahora ejecuta:
echo   npm run start:tunnel
echo.
pause

