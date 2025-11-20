# 🔧 Solución: Error de Conexión Expo Go

## Problema: "Could not connect to server exp://127.0.0.1:8081"

Este error significa que tu iPhone no puede conectarse al servidor de desarrollo.

## ✅ Soluciones (Prueba en este orden):

### 1. Verificar que estén en la misma red WiFi
- Tu iPhone y tu computadora DEBEN estar en la misma red WiFi
- No uses datos móviles en el iPhone
- No uses VPN (desactívala temporalmente)

### 2. Usar Tunnel en lugar de LAN
Cuando ejecutes `npm start`, presiona:
- `s` para cambiar a modo "Tunnel"
- Esto creará una conexión a través de internet (más lento pero más confiable)

### 3. Verificar la IP de tu computadora
```bash
# Windows (PowerShell)
ipconfig

# Busca "IPv4 Address" y anótala (ej: 192.168.1.100)
```

Luego en Expo Go, en lugar de escanear el QR, toca "Enter URL manually" y escribe:
```
exp://TU_IP:8081
```
Reemplaza TU_IP con la IP que encontraste.

### 4. Desactivar Firewall temporalmente
- Windows: Configuración > Firewall > Desactivar temporalmente
- O agrega una excepción para Node.js/Expo

### 5. Usar modo Tunnel desde el inicio
Crea un archivo `.expo.json` en la carpeta mobile-app:

```json
{
  "hostType": "tunnel"
}
```

### 6. Reiniciar todo
```bash
# Cierra Expo completamente (Ctrl+C)
# Luego:
npm start -- --clear
```

### 7. Verificar que el puerto 8081 esté libre
```bash
# Windows PowerShell
netstat -ano | findstr :8081
```

Si algo está usando el puerto, cierra ese proceso.

## 🚀 Solución Rápida Recomendada:

1. Cierra Expo (Ctrl+C en la terminal)
2. Ejecuta: `npm start`
3. Cuando aparezca el menú, presiona `s` para cambiar a Tunnel
4. Escanea el nuevo código QR que aparece
5. Debería funcionar ahora

## 📱 Alternativa: Usar Expo Dev Tools

Si nada funciona, puedes usar Expo Dev Tools en el navegador:
1. Abre http://localhost:19002 en tu navegador
2. Desde ahí puedes generar un nuevo QR con Tunnel

## ⚠️ Nota sobre Tunnel:

- Es más lento que LAN pero funciona desde cualquier red
- Requiere conexión a internet en ambos dispositivos
- Puede tener límites de uso gratuito

