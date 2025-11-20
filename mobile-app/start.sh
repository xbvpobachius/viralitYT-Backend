#!/bin/bash

echo "========================================"
echo "   VIRALITYT - Iniciando App"
echo "========================================"
echo ""

echo "[1/2] Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias por primera vez..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: No se pudieron instalar las dependencias"
        exit 1
    fi
else
    echo "Dependencias ya instaladas"
fi

echo ""
echo "[2/2] Iniciando servidor Expo..."
echo ""
echo "========================================"
echo "  Abre Expo Go en tu iPhone y escanea"
echo "  el código QR que aparecerá a continuación"
echo "========================================"
echo ""

npm start

