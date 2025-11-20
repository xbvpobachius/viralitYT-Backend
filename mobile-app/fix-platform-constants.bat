@echo off
echo ========================================
echo    Solucionando error PlatformConstants
echo ========================================
echo.

echo [1/4] Instalando expo-constants...
call npm install expo-constants@~17.0.0

echo.
echo [2/4] Limpiando cache de Expo...
call npx expo start --clear

echo.
echo [3/4] Limpiando cache de Metro...
if exist "%TEMP%\metro-*" (
    del /q /s "%TEMP%\metro-*" 2>nul
)
if exist "%TEMP%\haste-map-*" (
    del /q /s "%TEMP%\haste-map-*" 2>nul
)

echo.
echo [4/4] Limpiando watchman (si existe)...
where watchman >nul 2>&1
if %errorlevel% == 0 (
    watchman watch-del-all 2>nul
)

echo.
echo ========================================
echo   Limpieza completada!
echo ========================================
echo.
echo Ahora ejecuta:
echo   npm run start:tunnel
echo.
echo Si el error persiste, reinicia Expo Go en tu iPhone
echo.
pause

