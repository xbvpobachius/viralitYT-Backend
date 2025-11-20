# 🔧 Solución: IP Local (192.168.x.x)

## ✅ El Problema

`127.0.0.1` es **localhost** - solo funciona en la misma máquina.  
Tu iPhone necesita la **IP local de tu red** (192.168.x.x).

## 🚀 Solución Rápida

### Opción 1: Usar modo LAN automático (Recomendado)

```bash
cd mobile-app
npm run start:lan
```

O doble clic en: `start-lan.bat`

Esto automáticamente usará tu IP local (192.168.x.x) en lugar de 127.0.0.1

### Opción 2: Ver tu IP manualmente

```bash
# En PowerShell
ipconfig

# Busca "IPv4 Address" bajo tu adaptador WiFi
# Ejemplo: 192.168.1.100
```

Luego en Expo Go:
1. Toca "Enter URL manually"
2. Escribe: `exp://TU_IP:8081`
   - Ejemplo: `exp://192.168.1.100:8081`

### Opción 3: Script para ver tu IP

```bash
npm run get-ip
```

Te mostrará tu IP local y la URL completa para Expo Go.

## 📋 Requisitos

✅ **Misma red WiFi**: Tu iPhone y PC deben estar en la misma red  
✅ **Sin VPN**: Desactiva VPN si está activa  
✅ **Firewall**: Permite Node.js/Expo en el firewall

## 🔄 Comparación de Modos

| Modo | IP | Velocidad | Requisitos |
|------|----|-----------|------------|
| **LAN** | 192.168.x.x | ⚡ Rápido | Misma WiFi |
| **Tunnel** | Internet | 🐌 Lento | Internet en ambos |
| **localhost** | 127.0.0.1 | ❌ No funciona | Solo mismo dispositivo |

## 💡 Recomendación

1. **Primero prueba LAN** (`npm run start:lan`)
2. Si no funciona, usa **Tunnel** (`npm run start:tunnel`)
3. Tunnel funciona desde cualquier red pero es más lento

## 🛠️ Si LAN no funciona

1. Verifica que ambos estén en la misma WiFi
2. Desactiva firewall temporalmente
3. Reinicia el router WiFi
4. Usa Tunnel como alternativa

