@echo off
echo ========================================
echo    Solucion Completa PlatformConstants
echo ========================================
echo.

echo [1/6] Deteniendo procesos...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/6] Eliminando node_modules...
if exist "node_modules" (
    rmdir /s /q node_modules
    echo ✓ node_modules eliminado
)

echo [3/6] Eliminando package-lock.json...
if exist "package-lock.json" (
    del /q package-lock.json
    echo ✓ package-lock.json eliminado
)

echo [4/6] Eliminando .expo cache...
if exist ".expo" (
    rmdir /s /q .expo
    echo ✓ .expo eliminado
)

echo [5/6] Limpiando cache de Metro...
if exist "%TEMP%\metro-*" (
    del /q /s "%TEMP%\metro-*" 2>nul
)
if exist "%TEMP%\haste-map-*" (
    del /q /s "%TEMP%\haste-map-*" 2>nul
)

echo [6/6] Reinstalando dependencias...
call npm install

if errorlevel 1 (
    echo.
    echo ERROR: Fallo la instalacion
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Limpieza y reinstalacion completada!
echo ========================================
echo.
echo IMPORTANTE:
echo 1. Cierra completamente Expo Go en tu iPhone
echo 2. Vuelve a abrir Expo Go
echo 3. Ejecuta: npm run start:tunnel
echo 4. Escanea el QR de nuevo
echo.
pause

