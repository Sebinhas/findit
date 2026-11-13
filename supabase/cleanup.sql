-- =====================================================================
-- FindIt — Limpieza de datos de prueba
-- Ejecutar en Supabase > SQL Editor (o pedírselo a Claude por MCP).
-- Borrar un usuario de auth borra en cascada su perfil, publicaciones,
-- solicitudes, coincidencias y notificaciones.
-- =====================================================================

-- 1. Usuarios creados por las pruebas E2E (Playwright): e2e-<id>-x@example.com
delete from auth.users where email like 'e2e-%@example.com';

-- 2. (OPCIONAL) Quitar también la demo. Descomentar para dejar la plataforma vacía.
-- delete from auth.users where email like 'demo.%@example.com';

-- Nota: las fotos subidas quedan en Storage (bucket item-images). Si quieres borrarlas,
-- hazlo desde Supabase > Storage; Supabase no permite borrarlas con SQL.
