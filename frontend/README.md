# ViralitYT Frontend

Frontend para ViralitYT - Plataforma de automatización de videos de Roblox para YouTube.

## 🚀 Tecnologías

- **Vite** - Build tool
- **React 18** - UI Framework
- **React Router** - Routing
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **React Query** - Data fetching
- **Framer Motion** - Animations

## 📦 Instalación

```bash
npm install
```

## 🏃 Desarrollo

```bash
npm run dev
```

El servidor de desarrollo estará disponible en `http://localhost:8080`

## 🏗️ Build

```bash
npm run build
```

Los archivos estáticos se generarán en la carpeta `dist/`

## 🌐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_BASE=http://localhost:8000
```

### Para Vercel

En la configuración del proyecto en Vercel, agrega la variable de entorno:

- **Nombre**: `VITE_API_BASE`
- **Valor**: URL de tu backend (ej: `https://tu-backend.railway.app`)

## 📁 Estructura

```
src/
├── components/     # Componentes reutilizables
│   ├── layout/    # Layout components (Sidebar, Layout, etc.)
│   └── ui/         # UI components (Shadcn)
├── pages/          # Páginas de la aplicación
├── lib/            # Utilidades y API client
└── hooks/          # Custom hooks
```

## 🔌 API

El cliente API está en `src/lib/api.ts` y se conecta al backend FastAPI.

### Endpoints principales:

- `GET /dashboard/metrics` - Métricas del dashboard
- `GET /accounts` - Listar cuentas
- `PATCH /accounts/{id}/status` - Actualizar estado de cuenta
- `GET /uploads` - Listar uploads
- `POST /auth/youtube/start` - Iniciar OAuth de YouTube

## 🎨 Diseño

El diseño sigue el estilo ViralitYT con:
- Colores primarios rojos (#ff3333)
- Efectos de glow y animaciones
- Glass morphism
- Diseño responsive

## 🚢 Deploy

### Vercel

El proyecto está configurado para Vercel con `vercel.json`. Solo necesitas:

1. Conectar el repositorio de GitHub
2. Agregar la variable de entorno `VITE_API_BASE`
3. Deploy automático en cada push

### Otros servicios

Para otros servicios de hosting estático, asegúrate de:
- Configurar el build command: `npm run build`
- Configurar el output directory: `dist`
- Configurar rewrites para React Router (todas las rutas → `/index.html`)

## 📝 Notas

- No hay autenticación de usuario - el backend solo requiere OAuth de YouTube para conectar cuentas
- El login redirige directamente al dashboard
- Todas las páginas están protegidas por el Layout pero sin verificación de sesión
