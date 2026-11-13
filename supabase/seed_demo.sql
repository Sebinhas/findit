-- =====================================================================
-- FindIt — Datos de demostración
-- Crea 5 cuentas demo (contraseña de todas: FindIt2026!) y ~15 publicaciones.
-- Las coincidencias y notificaciones las generan los triggers automáticamente.
-- Las solicitudes se crean llamando a las funciones reales (create_claim, etc.)
-- impersonando a cada usuario, así que pasan por las mismas validaciones que la app.
--
-- NOTA: la combinación categoría "Otros" + lugar "Otro" queda reservada para
-- las pruebas E2E (Playwright), para que no generen coincidencias con la demo.
-- Para borrar la demo: supabase/cleanup.sql
-- =====================================================================

-- 1. Usuarios demo (insertados directamente en auth, ya confirmados)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, recovery_token, email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
       extensions.crypt('FindIt2026!', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('first_name', u.fn, 'last_name', u.ln),
       now() - (u.days || ' days')::interval, now(), '', '', '', ''
from (values
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'demo.laura@example.com',  'Laura',  'Gómez',     20),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'demo.andres@example.com', 'Andrés', 'Martínez',  18),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'demo.camila@example.com', 'Camila', 'Rojas',     15),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'demo.daniel@example.com', 'Daniel', 'Pérez',     12),
  ('d0000000-0000-4000-8000-000000000005'::uuid, 'demo.admin@example.com',  'Admin',  'Demo',      25)
) as u(id, email, fn, ln, days)
on conflict (id) do nothing;

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id::text, u.id, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u where u.email like 'demo.%@example.com'
on conflict do nothing;

update public.profiles set role = 'admin' where id = 'd0000000-0000-4000-8000-000000000005';

-- 2. Publicaciones
insert into public.items (id, user_id, type, category_id, location_id, title, description, incident_date,
                          location_detail, custody_info, created_at)
select i.id, i.uid, i.type::item_type,
       (select id from categories where slug = i.cat), (select id from locations where name = i.loc),
       i.title, i.descr, current_date - i.days, i.detail, i.custody,
       now() - (i.days || ' days')::interval + interval '3 hours'
from (values
  -- id, usuario, tipo, categoría, lugar, título, descripción, días atrás, detalle lugar, custodia
  ('e0000000-0000-4000-8000-000000000001'::uuid, 'd0000000-0000-4000-8000-000000000001'::uuid, 'LOST', 'electronica', 'Biblioteca',
   'Audífonos inalámbricos JBL negros', 'Los dejé en una mesa del segundo piso de la biblioteca. Vienen en un estuche negro con un rayón en la tapa.', 2, 'Segundo piso, mesas junto a la ventana', null),
  ('e0000000-0000-4000-8000-000000000002'::uuid, 'd0000000-0000-4000-8000-000000000001'::uuid, 'LOST', 'documentos', 'Cafetería',
   'Carné estudiantil con cordón azul', 'Se me cayó el carné de la universidad en la fila de la cafetería. Tiene un cordón azul.', 5, null, null),
  ('e0000000-0000-4000-8000-000000000003'::uuid, 'd0000000-0000-4000-8000-000000000002'::uuid, 'FOUND', 'electronica', 'Biblioteca',
   'Audífonos JBL negros en estuche', 'Encontré unos audífonos inalámbricos JBL negros dentro de su estuche en las mesas del segundo piso.', 1, 'Segundo piso', 'Los entregué en la portería de la biblioteca'),
  ('e0000000-0000-4000-8000-000000000004'::uuid, 'd0000000-0000-4000-8000-000000000002'::uuid, 'FOUND', 'llaves', 'Parqueadero',
   'Llavero rojo con tres llaves', 'Llavero rojo con tres llaves y un control de carro. Estaba en el parqueadero de motos.', 3, 'Zona de motos', 'Lo tengo yo, escríbeme para coordinar'),
  ('e0000000-0000-4000-8000-000000000005'::uuid, 'd0000000-0000-4000-8000-000000000002'::uuid, 'LOST', 'bolsos', 'Bloque B',
   'Morral gris Totto', 'Morral gris marca Totto con cuadernos de cálculo y una cartuchera. Lo olvidé en un salón del bloque B.', 7, 'Salón 204', null),
  ('e0000000-0000-4000-8000-000000000006'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'FOUND', 'documentos', 'Cafetería',
   'Carné universitario con cordón azul', 'Encontré un carné estudiantil con cordón azul cerca de las mesas de la cafetería.', 4, null, 'Está en la oficina de bienestar'),
  ('e0000000-0000-4000-8000-000000000007'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'LOST', 'accesorios', 'Gimnasio / Coliseo',
   'Reloj Casio plateado', 'Reloj Casio plateado de correa metálica. Me lo quité en los camerinos del coliseo y no lo volví a ver.', 6, 'Camerinos', null),
  ('e0000000-0000-4000-8000-000000000008'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'FOUND', 'libros', 'Bloque A',
   'Libro Cálculo de Stewart', 'Libro "Cálculo de una variable" de Stewart, octava edición. Quedó olvidado en un salón del bloque A.', 2, 'Salón 105', 'Lo dejé en la coordinación de ciencias básicas'),
  ('e0000000-0000-4000-8000-000000000009'::uuid, 'd0000000-0000-4000-8000-000000000003'::uuid, 'LOST', 'ropa', 'Zonas verdes',
   'Chaqueta negra impermeable', 'Chaqueta negra impermeable talla M. La dejé sobre el césped frente a la biblioteca.', 9, null, null),
  ('e0000000-0000-4000-8000-000000000010'::uuid, 'd0000000-0000-4000-8000-000000000004'::uuid, 'FOUND', 'accesorios', 'Gimnasio / Coliseo',
   'Reloj plateado Casio', 'Encontré un reloj Casio plateado en los camerinos del coliseo.', 5, 'Camerinos de hombres', 'En la recepción del coliseo'),
  ('e0000000-0000-4000-8000-000000000011'::uuid, 'd0000000-0000-4000-8000-000000000004'::uuid, 'FOUND', 'electronica', 'Laboratorios',
   'Cargador de portátil Lenovo', 'Cargador Lenovo de punta rectangular amarilla. Quedó conectado en el laboratorio 3.', 1, 'Laboratorio 3', 'Lo tiene el monitor del laboratorio'),
  ('e0000000-0000-4000-8000-000000000012'::uuid, 'd0000000-0000-4000-8000-000000000004'::uuid, 'LOST', 'electronica', 'Auditorio',
   'Calculadora Casio fx-991', 'Calculadora científica Casio fx-991LA. La perdí después del parcial de física en el auditorio.', 3, null, null),
  ('e0000000-0000-4000-8000-000000000013'::uuid, 'd0000000-0000-4000-8000-000000000004'::uuid, 'FOUND', 'bolsos', 'Bloque B',
   'Morral gris con cuadernos', 'Morral gris con cuadernos de cálculo, encontrado en el salón 204 del bloque B.', 6, 'Salón 204', 'Lo entregué en portería'),
  ('e0000000-0000-4000-8000-000000000014'::uuid, 'd0000000-0000-4000-8000-000000000001'::uuid, 'FOUND', 'ropa', 'Cafetería',
   'Gorra azul New Era', 'Gorra azul oscura marca New Era, estaba en una silla de la cafetería.', 1, null, 'La tengo yo'),
  ('e0000000-0000-4000-8000-000000000015'::uuid, 'd0000000-0000-4000-8000-000000000001'::uuid, 'FOUND', 'otros', 'Portería',
   'Termo metálico verde', 'Termo metálico verde con stickers, alguien lo dejó en la portería principal.', 8, null, 'En la portería principal')
) as i(id, uid, type, cat, loc, title, descr, days, detail, custody)
on conflict (id) do nothing;

insert into public.item_private_details (item_id, details) values
  ('e0000000-0000-4000-8000-000000000003', 'El estuche tiene una calcomanía de Star Wars por dentro.'),
  ('e0000000-0000-4000-8000-000000000006', 'El cordón tiene un pin de un gato y el carné es de ingeniería.'),
  ('e0000000-0000-4000-8000-000000000010', 'Tiene grabadas las iniciales "C.R." en la parte de atrás.'),
  ('e0000000-0000-4000-8000-000000000013', 'Dentro hay una cartuchera morada.')
on conflict do nothing;

-- 3. Solicitudes, usando las funciones reales e impersonando al usuario
do $$
declare v_claim uuid;
begin
  -- Laura reclama los audífonos → Andrés acepta → confirma devolución (flujo completo)
  perform set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000001', true);
  v_claim := create_claim('e0000000-0000-4000-8000-000000000003',
    'Son mis audífonos, los dejé en la biblioteca hace dos días.', 'El estuche tiene una calcomanía de Star Wars adentro.',
    current_date - 2, (select id from locations where name = 'Biblioteca'), 'Segundo piso', 'e0000000-0000-4000-8000-000000000001');
  perform set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000002', true);
  perform respond_claim(v_claim, true, 'Coincide la calcomanía, ¡son tuyos!');
  perform complete_claim(v_claim);

  -- Laura reclama el carné → queda PENDIENTE para que Camila lo revise
  perform set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000001', true);
  perform create_claim('e0000000-0000-4000-8000-000000000006',
    'Es mi carné, se me cayó en la fila de la cafetería.', 'El cordón tiene un pin de un gato.',
    current_date - 5, (select id from locations where name = 'Cafetería'), null, 'e0000000-0000-4000-8000-000000000002');

  -- Camila reclama el reloj → Daniel lo ACEPTA (falta coordinar la entrega)
  perform set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000003', true);
  v_claim := create_claim('e0000000-0000-4000-8000-000000000010',
    'Es mi reloj, me lo quité en los camerinos del coliseo.', 'Tiene grabadas mis iniciales C.R. atrás.',
    current_date - 6, (select id from locations where name = 'Gimnasio / Coliseo'), 'Camerinos', 'e0000000-0000-4000-8000-000000000007');
  perform set_config('request.jwt.claim.sub', 'd0000000-0000-4000-8000-000000000004', true);
  perform respond_claim(v_claim, true, 'Sí, tiene las iniciales. Pásate por la recepción del coliseo.');

  perform set_config('request.jwt.claim.sub', '', true);
end $$;

-- 4. Un reporte pendiente para que el panel admin tenga algo que revisar
insert into public.reports (reporter_id, item_id, reason, description)
values ('d0000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000015', 'SPAM',
        'Esta publicación parece repetida.');
