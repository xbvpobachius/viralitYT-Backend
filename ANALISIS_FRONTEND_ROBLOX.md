# 📋 Análisis: Frontend ViralitYT para Versión Roblox Simplificada

## 🎯 Lo ESENCIAL para Roblox (Mantener)

### 1. **Dashboard** (`/dashboard`)
**¿Qué tiene?**
- Métricas principales (uploads hoy, programados, cuentas activas, quota)
- Lista de cuentas conectadas con estado (activo/pausado)
- Uploads recientes con estado
- Barra de progreso de quota por proyecto API

**Para Roblox simplificado:**
- ✅ **MANTENER** - Dashboard simplificado con:
  - Uploads hoy (solo Roblox)
  - Videos programados para hoy/mañana
  - Cuentas Roblox activas
  - Quota restante
- ❌ **ELIMINAR** - Tabla completa de cuentas (solo lista simple)
- ❌ **ELIMINAR** - Historial completo de uploads (solo últimos 5-10)

---

### 2. **Gestión de Cuentas** (Nueva sección simplificada)
**¿Qué tiene actualmente?**
- Onboarding completo con API Projects y OAuth
- Lista de cuentas en Dashboard
- Pausar/Reanudar cuentas

**Para Roblox simplificado:**
- ✅ **CREAR** - Página `/accounts` simple con:
  - Lista de cuentas Roblox
  - Botón "Conectar Nueva Cuenta" (onboarding simplificado)
  - Toggle Activo/Pausado
  - Ver configuración (hora de upload: 6 PM)
- ✅ **MANTENER** - Onboarding pero simplificado:
  - Solo paso 1: Conectar YouTube (sin API Projects manual)
  - Tema fijo: "roblox"
  - Configuración automática

---

### 3. **Vista de Videos Programados** (`/scheduled` o `/videos`)
**¿Qué tiene actualmente?**
- Calendar completo con vista mensual
- Themes page con scan y selección de videos
- My Videos para subir videos propios

**Para Roblox simplificado:**
- ✅ **CREAR** - Página `/scheduled` simple con:
  - Lista de próximos videos programados (próximos 7 días)
  - Filtro por cuenta
  - Estado de cada video (scheduled/uploading/done/failed)
  - Ver video en YouTube si está publicado
- ❌ **ELIMINAR** - Calendar complejo (no necesario, Roblox es automático)
- ❌ **ELIMINAR** - Themes page (no hay que escanear, se genera automático)
- ❌ **ELIMINAR** - My Videos (Roblox usa generador automático)

---

### 4. **API Client** (`lib/api.ts`)
**Endpoints ESENCIALES para Roblox:**

```typescript
// ✅ MANTENER estos endpoints:
- getDashboardMetrics()          // Métricas del dashboard
- listAccounts()                  // Listar cuentas
- updateAccountStatus()           // Pausar/Reanudar cuenta
- listUploads()                   // Ver videos programados
- startOAuth()                    // Conectar cuenta YouTube
- getQuotaStatus()                // Estado de quota

// ❌ ELIMINAR estos (no necesarios para Roblox):
- scanTheme()                     // No se escanea, se genera automático
- listVideos()                    // No hay selección manual
- pickVideo()                     // No hay selección manual
- scheduleBulkUploads()           // Se programa automático
- uploadUserVideo()               // No se suben videos manuales
- uploadUserVideosBatch()         // No se suben videos manuales
- scheduleUserBulk()              // No se programa manual
- listThemes()                    // Solo hay un tema: roblox
- createAPIProject()              // Simplificar onboarding
```

---

## 🗑️ Lo que NO necesitas para Roblox (Eliminar)

### 1. **Themes Page** (`/themes`)
- ❌ Scan de temas (Roblox se genera automáticamente)
- ❌ Selección manual de videos (no aplica)
- ❌ Auto-schedule manual (ya está automatizado)

### 2. **Calendar Completo** (`/calendar`)
- ❌ Vista mensual compleja (no necesario)
- ❌ Re-programar uploads manualmente (ya está automatizado)
- ✅ **REEMPLAZAR CON** - Lista simple de próximos videos

### 3. **My Videos** (`/my-videos`)
- ❌ Subir videos propios (Roblox usa generador)
- ❌ Editar títulos/descripciones manualmente (ya está configurado)

### 4. **Settings Completo** (`/settings`)
- ❌ Configuración de múltiples temas (solo hay roblox)
- ✅ **MANTENER SIMPLIFICADO** - Solo configuración básica:
  - Ver hora de upload (6 PM)
  - Ver estado de quota
  - Ver proyectos API (solo lectura)

---

## 📱 Estructura Simplificada Propuesta

```
frontend-roblox/
├── app/
│   ├── page.tsx              # Landing/Redirect a dashboard
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard simplificado
│   ├── accounts/
│   │   └── page.tsx          # Gestión de cuentas Roblox
│   ├── scheduled/
│   │   └── page.tsx          # Videos programados (próximos días)
│   ├── onboarding/
│   │   └── page.tsx          # Conectar cuenta (simplificado)
│   └── settings/
│       └── page.tsx          # Configuración básica
├── lib/
│   └── api.ts                # API client simplificado (solo endpoints necesarios)
└── components/
    └── ui/                    # Componentes básicos (Card, Button, Badge)
```

---

## 🎨 Componentes UI Necesarios

### Básicos (Mantener):
- ✅ `Button` - Botones de acción
- ✅ `Card` - Contenedores de información
- ✅ `Badge` - Estados y etiquetas
- ✅ `Input` - Campos de formulario (solo onboarding)
- ✅ `Label` - Etiquetas de formulario

### Eliminar:
- ❌ Componentes complejos de calendar
- ❌ Grid de videos con thumbnails grandes
- ❌ Selectores múltiples de temas

---

## 🔑 Funcionalidades Clave para Roblox

### 1. **Dashboard Simplificado**
```typescript
- Uploads hoy: X completados
- Próximos videos: Lista de próximos 5-7 videos
- Cuentas activas: X de Y cuentas
- Quota: X restante
```

### 2. **Gestión de Cuentas**
```typescript
- Lista de cuentas Roblox
- Estado: Activo/Pausado (toggle)
- Hora de upload: 6 PM (solo lectura)
- Botón: "Conectar Nueva Cuenta"
```

### 3. **Videos Programados**
```typescript
- Lista de próximos videos (próximos 7 días)
- Filtro por cuenta
- Estado: scheduled/uploading/done/failed
- Link a YouTube si está publicado
- Fecha y hora programada
```

### 4. **Onboarding Simplificado**
```typescript
- Paso 1: Conectar YouTube (OAuth)
- Tema: "roblox" (fijo, no seleccionable)
- Configuración automática:
  - Hora: 6 PM
  - 1 video por día
  - Generación automática
```

---

## 📊 Resumen: Qué Mantener vs Eliminar

| Funcionalidad | Actual | Roblox Simplificado |
|--------------|--------|---------------------|
| Dashboard | Completo | ✅ Simplificado (solo métricas esenciales) |
| Gestión Cuentas | En Dashboard | ✅ Página dedicada `/accounts` |
| Videos Programados | Calendar complejo | ✅ Lista simple `/scheduled` |
| Conectar Cuenta | Onboarding completo | ✅ Simplificado (solo OAuth) |
| Scan Videos | Themes page | ❌ Eliminar (automático) |
| Seleccionar Videos | Themes page | ❌ Eliminar (automático) |
| Calendar Mensual | Calendar page | ❌ Eliminar |
| Subir Videos | My Videos | ❌ Eliminar |
| Settings | Completo | ✅ Simplificado (solo lectura) |

---

## 🚀 API Endpoints Necesarios (Simplificado)

```typescript
// Solo estos endpoints:
GET  /dashboard/metrics          // Métricas
GET  /accounts                   // Listar cuentas
PATCH /accounts/:id/status       // Pausar/Reanudar
GET  /uploads                    // Listar programados
POST /auth/youtube/start         // Conectar cuenta
GET  /quota/status               // Estado quota
```

---

## 💡 Recomendaciones

1. **Simplificar Dashboard**: Solo métricas esenciales, sin tablas complejas
2. **Eliminar Themes**: No hay selección manual, todo es automático
3. **Reemplazar Calendar**: Por lista simple de próximos videos
4. **Onboarding Simplificado**: Solo conectar YouTube, sin configuración manual
5. **Enfoque en Monitoreo**: La app es para ver qué está pasando, no para configurar

---

## 🎯 Flujo de Usuario Simplificado

1. **Primera vez**: Conectar cuenta YouTube → Automático (genera videos, programa a 6 PM)
2. **Uso diario**: Ver dashboard → Ver próximos videos → Pausar/Reanudar cuenta si necesario
3. **Monitoreo**: Ver estado de uploads, quota, cuentas activas

**Todo lo demás es automático en el backend.**

