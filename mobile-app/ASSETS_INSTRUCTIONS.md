# Instrucciones para Assets de la App

## Splash Screen

Necesitas crear un archivo `assets/splash.png` con las siguientes características:

- **Dimensiones**: 2048x2048px (o más grande, se escalará)
- **Fondo**: Negro puro (#000000)
- **Logo**: Letra "V" grande en rojo (#E50914)
- **Estilo**: Similar a Netflix - letra grande, centrada, bold
- **Formato**: PNG con transparencia (aunque el fondo es negro)

### Diseño sugerido:
```
┌─────────────────┐
│                 │
│                 │
│        V        │  ← Letra V grande, roja, centrada
│                 │
│                 │
└─────────────────┘
```

## App Icon

Necesitas crear `assets/icon.png`:

- **Dimensiones**: 1024x1024px
- **Fondo**: Puede ser transparente o negro
- **Logo**: "V" roja (#E50914) o logo completo de ViralitYT
- **Formato**: PNG

## Cómo crear los assets

### Opción 1: Usando Figma/Sketch
1. Crea un canvas de 2048x2048px
2. Fondo negro (#000000)
3. Agrega texto "V" en rojo (#E50914)
4. Fuente: SF Pro Black o similar, tamaño ~800px
5. Exporta como PNG

### Opción 2: Usando herramientas online
- Canva
- Adobe Express
- Remove.bg (para transparencias)

### Opción 3: Generar con código
Puedes usar un script simple para generar el splash:

```javascript
// generate-splash.js (Node.js con canvas)
const { createCanvas } = require('canvas');
const fs = require('fs');

const size = 2048;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Fondo negro
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, size, size);

// Letra V roja
ctx.fillStyle = '#E50914';
ctx.font = 'bold 1200px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('V', size / 2, size / 2);

// Guardar
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('assets/splash.png', buffer);
```

## Estructura de carpetas

```
mobile-app/
├── assets/
│   ├── icon.png          (1024x1024)
│   ├── splash.png        (2048x2048)
│   ├── adaptive-icon.png (1024x1024, Android)
│   └── favicon.png       (48x48, Web)
```

## Notas

- El splash screen se mostrará automáticamente al iniciar la app
- La animación del splash está implementada en `SplashScreen.tsx`
- Los assets se cargan desde `app.json`

