-- Script para borrar todos los datos excepto api_projects
-- ⚠️ ADVERTENCIA: Esto borrará TODOS los datos excepto los planes de API
-- Ejecuta esto con cuidado, no se puede deshacer

-- Borrar en orden para respetar foreign keys

-- 1. Borrar historial de uploads (referencia uploads)
DELETE FROM upload_history;

-- 2. Borrar proyectos de Roblox (referencia accounts, videos, uploads)
DELETE FROM roblox_projects;

-- 3. Borrar uploads programados (referencia accounts, videos)
DELETE FROM uploads;

-- 4. Borrar videos (referencia themes)
DELETE FROM videos;

-- 5. Borrar cuentas (referencia themes, api_projects - pero mantenemos api_projects)
DELETE FROM accounts;

-- 6. Borrar temas (opcional, pero si quieres limpiar todo)
DELETE FROM themes;

-- 7. Borrar historial de cuotas (referencia api_projects - pero mantenemos api_projects)
DELETE FROM quota_history;

-- Verificar que solo quedan api_projects
-- SELECT 'accounts' as tabla, COUNT(*) as registros FROM accounts
-- UNION ALL
-- SELECT 'api_projects', COUNT(*) FROM api_projects
-- UNION ALL
-- SELECT 'quota_history', COUNT(*) FROM quota_history
-- UNION ALL
-- SELECT 'roblox_projects', COUNT(*) FROM roblox_projects
-- UNION ALL
-- SELECT 'themes', COUNT(*) FROM themes
-- UNION ALL
-- SELECT 'upload_history', COUNT(*) FROM upload_history
-- UNION ALL
-- SELECT 'uploads', COUNT(*) FROM uploads
-- UNION ALL
-- SELECT 'videos', COUNT(*) FROM videos;



