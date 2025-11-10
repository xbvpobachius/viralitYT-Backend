-- Configuración de reintentos para videos fallidos en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Ver videos fallidos actuales
SELECT 
    u.id,
    u.status,
    u.retry_count,
    u.max_retries,
    u.error,
    u.scheduled_for,
    u.created_at,
    a.display_name as account_name,
    v.title as video_title
FROM uploads u
JOIN accounts a ON u.account_id = a.id
JOIN videos v ON u.video_id = v.id
WHERE u.status IN ('failed', 'retry')
ORDER BY u.created_at DESC;

-- 2. Reintentar videos fallidos (cambiar status a 'retry' y resetear scheduled_for)
UPDATE uploads 
SET 
    status = 'retry',
    scheduled_for = NOW() + INTERVAL '5 minutes',  -- Reintentar en 5 minutos
    error = NULL  -- Limpiar error anterior
WHERE status = 'failed' 
  AND retry_count < max_retries;

-- 3. Ver videos que se van a reintentar
SELECT 
    u.id,
    u.status,
    u.retry_count,
    u.max_retries,
    u.scheduled_for,
    a.display_name as account_name,
    v.title as video_title
FROM uploads u
JOIN accounts a ON u.account_id = a.id
JOIN videos v ON u.video_id = v.id
WHERE u.status = 'retry'
ORDER BY u.scheduled_for ASC;

-- 4. Aumentar max_retries para videos específicos (opcional)
UPDATE uploads 
SET max_retries = 5  -- Cambiar de 3 a 5 reintentos
WHERE id = 'TU_UPLOAD_ID_AQUI';

-- 5. Resetear contador de reintentos para un video específico (opcional)
UPDATE uploads 
SET 
    retry_count = 0,
    status = 'retry',
    scheduled_for = NOW() + INTERVAL '5 minutes',
    error = NULL
WHERE id = 'TU_UPLOAD_ID_AQUI';

-- 6. Ver estadísticas de reintentos
SELECT 
    status,
    COUNT(*) as count,
    AVG(retry_count) as avg_retries,
    MAX(retry_count) as max_retries_used
FROM uploads 
GROUP BY status
ORDER BY count DESC;

-- 7. Ver videos con más de X reintentos
SELECT 
    u.id,
    u.status,
    u.retry_count,
    u.max_retries,
    u.error,
    a.display_name as account_name,
    v.title as video_title,
    u.created_at
FROM uploads u
JOIN accounts a ON u.account_id = a.id
JOIN videos v ON u.video_id = v.id
WHERE u.retry_count >= 2  -- Cambiar número según necesites
ORDER BY u.retry_count DESC, u.created_at DESC;

