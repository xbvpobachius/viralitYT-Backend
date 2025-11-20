# ✅ Compatibilidad Backend - Frontend Roblox Simplificado

## 🔗 Confirmación: 100% Compatible

Todos los endpoints necesarios para la versión simplificada de Roblox **ya existen** en el backend. No necesitas modificar nada del backend.

---

## 📋 Endpoints Disponibles en el Backend

### ✅ Dashboard Metrics
```python
GET /dashboard/metrics
```
**Respuesta:**
```json
{
  "uploads_today": 5,
  "uploads_done": 3,
  "uploads_failed": 0,
  "uploads_scheduled": 12,
  "active_accounts": 3,
  "total_accounts": 5,
  "quota": {
    "total_quota": 10000,
    "total_used": 1500,
    "total_remaining": 8500,
    "projects_available": 2,
    "uploads_remaining": 850,
    "projects": [...]
  }
}
```
**✅ Compatible** - Usar directamente

---

### ✅ Listar Cuentas
```python
GET /accounts
```
**Respuesta:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "display_name": "Mi Canal Roblox",
      "channel_id": "UC...",
      "theme_slug": "roblox",
      "active": true,
      "upload_time_1": "18:00:00",
      "created_at": "2025-01-..."
    }
  ]
}
```
**✅ Compatible** - Filtrar por `theme_slug: "roblox"` en el frontend

---

### ✅ Actualizar Estado de Cuenta
```python
PATCH /accounts/{account_id}/status
Body: { "active": true/false }
```
**Respuesta:**
```json
{ "success": true }
```
**✅ Compatible** - Usar directamente

---

### ✅ Listar Uploads (Videos Programados)
```python
GET /uploads?account_id={uuid}&status={status}&limit={limit}
```
**Parámetros:**
- `account_id` (opcional) - Filtrar por cuenta
- `status` (opcional) - Filtrar por estado
- `limit` (opcional, default: 100) - Límite de resultados

**Respuesta:**
```json
{
  "uploads": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "status": "scheduled",
      "scheduled_for": "2025-01-20T18:00:00Z",
      "title": "Susbcribete! #pov #roblox",
      "youtube_video_id": "abc123",
      "error": null
    }
  ],
  "count": 10
}
```
**✅ Compatible** - Usar directamente

---

### ✅ Conectar Cuenta YouTube (OAuth)
```python
POST /auth/youtube/start
Body: {
  "project_id": "uuid",
  "account_name": "Mi Canal",
  "theme_slug": "roblox"
}
```
**Respuesta:**
```json
{
  "authorization_url": "https://accounts.google.com/...",
  "state": "random-state-string"
}
```
**✅ Compatible** - Usar directamente

**Callback:**
```python
GET /auth/youtube/callback?code=...&state=...
```
**✅ Compatible** - Redirige automáticamente al frontend

---

### ✅ Estado de Quota
```python
GET /quota/status
```
**Respuesta:**
```json
{
  "total_quota": 10000,
  "total_used": 1500,
  "total_remaining": 8500,
  "projects_available": 2,
  "uploads_remaining": 850,
  "projects": [...]
}
```
**✅ Compatible** - Usar directamente

---

## 🎯 Endpoints que NO necesitas (pero existen)

Estos endpoints existen en el backend pero **NO los necesitas** para Roblox simplificado:

- ❌ `POST /themes/scan` - No escaneas manualmente
- ❌ `GET /videos` - No seleccionas videos manualmente
- ❌ `POST /videos/pick` - No seleccionas videos manualmente
- ❌ `POST /uploads/schedule/bulk` - Se programa automático
- ❌ `POST /user-videos/upload` - No subes videos manuales
- ❌ `GET /themes` - Solo hay un tema: roblox
- ❌ `POST /api-projects` - Simplificar onboarding (usar existente)

---

## 🔧 Configuración del API Client Simplificado

### Estructura del Cliente API

```typescript
// lib/api.ts (simplificado)

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

class APIClient {
  // ✅ Endpoints necesarios
  async getDashboardMetrics() {
    return fetch(`${API_BASE}/dashboard/metrics`).then(r => r.json())
  }

  async listAccounts() {
    return fetch(`${API_BASE}/accounts`).then(r => r.json())
  }

  async updateAccountStatus(accountId: string, active: boolean) {
    return fetch(`${API_BASE}/accounts/${accountId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    }).then(r => r.json())
  }

  async listUploads(accountId?: string, status?: string, limit = 100) {
    const params = new URLSearchParams()
    if (accountId) params.set('account_id', accountId)
    if (status) params.set('status', status)
    params.set('limit', limit.toString())
    return fetch(`${API_BASE}/uploads?${params}`).then(r => r.json())
  }

  async startOAuth(projectId: string, accountName: string) {
    return fetch(`${API_BASE}/auth/youtube/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        account_name: accountName,
        theme_slug: 'roblox' // Fijo
      })
    }).then(r => r.json())
  }

  async getQuotaStatus() {
    return fetch(`${API_BASE}/quota/status`).then(r => r.json())
  }

  // Opcional: Para simplificar onboarding
  async listAPIProjects() {
    return fetch(`${API_BASE}/api-projects`).then(r => r.json())
  }
}

export const api = new APIClient()
```

---

## 🚀 Flujo de Conexión

### 1. Onboarding Simplificado

```typescript
// app/onboarding/page.tsx

// Paso 1: Seleccionar API Project existente (o crear uno)
const projects = await api.listAPIProjects()

// Paso 2: Conectar YouTube
const result = await api.startOAuth(projectId, accountName)
// Redirige a: result.authorization_url

// Callback automático redirige a: /dashboard?connected={account_id}
```

### 2. Dashboard

```typescript
// app/dashboard/page.tsx

const metrics = await api.getDashboardMetrics()
const accounts = await api.listAccounts()
  .then(r => r.accounts.filter(a => a.theme_slug === 'roblox'))
const uploads = await api.listUploads(undefined, undefined, 20)
```

### 3. Gestión de Cuentas

```typescript
// app/accounts/page.tsx

const accounts = await api.listAccounts()
  .then(r => r.accounts.filter(a => a.theme_slug === 'roblox'))

// Pausar/Reanudar
await api.updateAccountStatus(accountId, !currentStatus)
```

### 4. Videos Programados

```typescript
// app/scheduled/page.tsx

// Próximos 7 días
const endDate = new Date()
endDate.setDate(endDate.getDate() + 7)

const uploads = await api.listUploads(accountId, 'scheduled', 100)
  .then(r => r.uploads.filter(u => {
    const scheduled = new Date(u.scheduled_for)
    return scheduled <= endDate
  }))
```

---

## ✅ Checklist de Compatibilidad

- ✅ `/dashboard/metrics` - Existe y funciona
- ✅ `/accounts` - Existe y funciona
- ✅ `/accounts/{id}/status` - Existe y funciona
- ✅ `/uploads` - Existe y funciona (con filtros)
- ✅ `/auth/youtube/start` - Existe y funciona
- ✅ `/auth/youtube/callback` - Existe y funciona
- ✅ `/quota/status` - Existe y funciona
- ✅ `/api-projects` - Existe (para onboarding simplificado)

---

## 🎯 Conclusión

**✅ 100% Compatible** - Puedes crear el frontend simplificado y conectarlo directamente al backend existente sin modificar nada del backend.

**Lo único que necesitas hacer:**
1. Crear el frontend simplificado con los endpoints listados
2. Filtrar por `theme_slug: "roblox"` en el frontend
3. Usar `theme_slug: "roblox"` fijo en el onboarding
4. Configurar `NEXT_PUBLIC_API_BASE` apuntando a tu backend

**No necesitas:**
- ❌ Modificar el backend
- ❌ Crear nuevos endpoints
- ❌ Cambiar la estructura de datos
- ❌ Modificar la base de datos

---

## 📝 Variables de Entorno Necesarias

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
# O en producción:
NEXT_PUBLIC_API_BASE=https://viralityt-backend-production.up.railway.app
```

---

## 🔄 Ejemplo de Uso Completo

```typescript
// Ejemplo: Dashboard simplificado
import { api } from '@/lib/api'

export default async function DashboardPage() {
  // Todas estas llamadas funcionan con el backend actual
  const metrics = await api.getDashboardMetrics()
  const accountsRes = await api.listAccounts()
  const robloxAccounts = accountsRes.accounts.filter(a => a.theme_slug === 'roblox')
  const uploadsRes = await api.listUploads(undefined, undefined, 20)
  
  return (
    <div>
      <h1>Dashboard Roblox</h1>
      <p>Uploads hoy: {metrics.uploads_today}</p>
      <p>Cuentas activas: {metrics.active_accounts}</p>
      {/* ... */}
    </div>
  )
}
```

**✅ Todo esto funciona con el backend actual sin modificaciones.**

