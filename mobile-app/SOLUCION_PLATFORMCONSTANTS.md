# 🔧 Solución: Error PlatformConstants

## Error
```
TurboModuleRegistry.getEnforcing(...):
'PlatformConstants' could not be found.
```

## ✅ Solución

### Paso 1: Instalar expo-constants
```bash
cd mobile-app
npm install expo-constants@~17.0.0
```

### Paso 2: Limpiar todo el cache
```bash
# Limpiar cache de Expo
npx expo start --clear

# O ejecutar el script automático
fix-platform-constants.bat
```

### Paso 3: Reiniciar Expo Go
1. Cierra completamente Expo Go en tu iPhone
2. Vuelve a abrirlo
3. Escanea el QR de nuevo

### Paso 4: Si persiste, reinstalar dependencias
```bash
cd mobile-app
rmdir /s /q node_modules
del package-lock.json
npm install
npm run start:tunnel
```

## 🔍 Causa del Error

Este error ocurre cuando:
- Falta `expo-constants` (proporciona PlatformConstants)
- El cache está corrupto después de actualizar SDK
- Los módulos nativos no se han vinculado correctamente

## ✅ Verificación

Después de instalar `expo-constants`, verifica que esté en `package.json`:
```json
"expo-constants": "~17.0.0"
```

