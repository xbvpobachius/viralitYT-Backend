# 🔧 Forzar IP Local en Expo

## ✅ Configuración Aplicada

He configurado Expo para que **siempre use tu IP local** (192.168.1.155) en lugar de 127.0.0.1.

## 🚀 Cómo Usar

### Opción 1: Script Automático (Recomendado)

```bash
cd mobile-app
start-forzar-ip.bat
```

O doble clic en: `start-forzar-ip.bat`

### Opción 2: Comando Manual

```bash
cd mobile-app
npm start
```

Ahora siempre usará `--lan --host lan` automáticamente.

### Opción 3: Forzar con Variables

```bash
cd mobile-app
npm run start:force
```

## 📱 URL para Expo Go

Después de iniciar, usa esta URL en Expo Go:

```
exp://192.168.1.155:8081
```

## 🔍 Verificar IP

Para ver tu IP actual:

```bash
npm run get-ip
```

## ⚙️ Archivos Modificados

- `.expo.json` - Configurado para usar LAN
- `.expo/settings.json` - Configuración adicional
- `package.json` - Scripts actualizados para forzar LAN
- `start-forzar-ip.bat` - Script que fuerza la IP

## 💡 Nota

Si tu IP cambia (por ejemplo, te conectas a otra WiFi), ejecuta:
```bash
npm run get-ip
```

Y actualiza la URL en Expo Go con la nueva IP.

