@echo off
echo ========================================
echo    Forzando IP: 192.168.1.155
echo ========================================
echo.

echo Configurando variables de entorno...
set EXPO_DEVTOOLS_LISTEN_ADDRESS=192.168.1.155
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.155
set EXPO_PACKAGER_PROXY_URL=http://192.168.1.155:8081

echo.
echo Iniciando Expo...
echo.
echo ========================================
echo   URL para Expo Go:
echo   exp://192.168.1.155:8081
echo ========================================
echo.

call npx expo start --lan --clear

pause

