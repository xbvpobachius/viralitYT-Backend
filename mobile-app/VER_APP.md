# 👀 Cómo Ver la App ViralitYT

## Método Más Rápido: Expo Go (Recomendado) 📱

### 1. Instala Expo Go en tu iPhone
- Abre App Store
- Busca "Expo Go"
- Instala la app (es gratis)

### 2. Abre la terminal y ejecuta:

```bash
# Navega a la carpeta de la app
cd mobile-app

# Instala las dependencias (solo la primera vez)
npm install

# Inicia el servidor
npm start
```

### 3. Escanea el código QR
- Se abrirá una ventana con un código QR
- Abre Expo Go en tu iPhone
- Toca "Scan QR Code"
- Apunta la cámara al código QR
- ¡La app se cargará automáticamente!

---

## Método Alternativo: Simulador de iPhone 💻

Si tienes Mac con Xcode:

```bash
cd mobile-app
npm install
npm run ios
```

Esto abrirá el simulador de iPhone automáticamente.

---

## Lo que Verás 🎨

1. **Splash Screen** (2.5 segundos)
   - Fondo negro
   - Letra "V" roja grande que aparece con animación

2. **Onboarding Screen**
   - "BIENVENIDOS!"
   - Logo "VIRALIT"
   - Checkboxes para términos
   - Botón "CONTINUAR"

3. **Login Screen**
   - Campo USER
   - Campo PASS
   - Botón Google
   - Botón GO

4. **Dashboard**
   - Métricas en cards
   - Próximos videos programados
   - Pull to refresh

5. **Calendar**
   - Calendario mensual
   - Fechas seleccionables

6. **Add Channel**
   - Formulario para añadir API
   - Conectar canal

---

## Comandos Útiles ⌨️

```bash
# Iniciar en modo desarrollo
npm start

# Limpiar caché si hay problemas
npm start -- --clear

# Ver en iOS específicamente
npm run ios

# Ver en Android
npm run android
```

---

## Solución de Problemas 🔧

### "expo: command not found"
```bash
npx expo start
```

### "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### Puerto ocupado
```bash
npx expo start --port 8082
```

### La app no carga
1. Asegúrate de que tu iPhone y tu computadora estén en la misma red WiFi
2. Si usas Expo Go, verifica que la app esté actualizada
3. Intenta cerrar y reabrir Expo Go

---

## Nota sobre Assets 🖼️

Si ves errores sobre imágenes faltantes:
- Crea la carpeta `assets/` en `mobile-app/`
- Agrega `splash.png` y `icon.png` (ver ASSETS_INSTRUCTIONS.md)
- O la app funcionará sin ellos, solo mostrará placeholders

---

## ¡Listo! 🎉

Una vez que ejecutes `npm start` y escanees el QR, verás tu app funcionando en tiempo real. Cualquier cambio que hagas en el código se reflejará automáticamente en la app (Hot Reload).

