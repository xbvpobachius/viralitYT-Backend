# 🚀 Inicio Rápido - Ver la App

## Opción 1: Expo Go (Más Rápido - Recomendado)

### Paso 1: Instalar Expo Go en tu iPhone
1. Abre la App Store
2. Busca "Expo Go"
3. Instala la app

### Paso 2: Instalar dependencias
```bash
cd mobile-app
npm install
```

### Paso 3: Iniciar el servidor
```bash
npm start
# o
npx expo start
```

### Paso 4: Escanear QR
1. Se abrirá una ventana con un código QR
2. Abre Expo Go en tu iPhone
3. Escanea el código QR con la cámara
4. La app se cargará automáticamente

## Opción 2: Simulador de iPhone (Requiere Xcode)

### Requisitos
- macOS
- Xcode instalado
- Xcode Command Line Tools

### Pasos
```bash
cd mobile-app
npm install
npm run ios
```

Esto abrirá el simulador de iPhone automáticamente.

## Opción 3: Ver en Web (Limitado)

```bash
cd mobile-app
npm install
npx expo start --web
```

Nota: Algunas funcionalidades pueden no funcionar en web.

## Solución de Problemas

### Error: "expo: command not found"
```bash
npm install -g expo-cli
# o
npx expo start
```

### Error: "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### Puerto ocupado
```bash
npx expo start --port 8082
```

## Verificación Rápida

Después de `npm start`, deberías ver:
- ✅ Código QR en la terminal
- ✅ Opción de presionar 'i' para iOS
- ✅ Opción de presionar 'a' para Android
- ✅ Opción de presionar 'w' para web

