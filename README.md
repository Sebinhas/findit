# FindIt

Plataforma web de objetos perdidos y encontrados para la universidad.
Especificación original: [`docs/FindIt_Documentacion_Proyecto.md`](docs/FindIt_Documentacion_Proyecto.md).

## Stack (versión simplificada)

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS v4 |
| Backend / API REST | **Supabase** (PostgREST + funciones SQL) |
| Base de datos | PostgreSQL (Supabase) |
| Autenticación | Supabase Auth (contraseñas con bcrypt, JWT) |
| Fotos | Supabase Storage |

> **Cambio respecto a la documentación:** en vez de NestJS + Prisma se usa Supabase para ahorrar tiempo.
> Las reglas de negocio siguen ejecutándose en el servidor: viven en **funciones SQL, triggers y
> políticas RLS** dentro de PostgreSQL, así que el frontend no puede saltárselas.

## Puesta en marcha (≈10 min)

### 1. Crear el proyecto en Supabase
1. Entra a <https://supabase.com>, crea una cuenta y luego **New project** (plan gratis). Guarda la contraseña de la BD.
2. Cuando termine de crearse, ve a **SQL Editor → New query**, pega todo [`supabase/schema.sql`](supabase/schema.sql) y dale a **Run**.
3. Ve a **Authentication → Sign In / Providers → Email** y **desactiva "Confirm email"**. Así no hace falta confirmar el correo para entrar, que es lo cómodo para desarrollo y para la demo.

### 2. Configurar y arrancar el frontend
```bash
cd frontend
cp .env.example .env     # en Windows: copy .env.example .env
# Pega en .env los valores de Supabase > Project Settings > API:
#   VITE_SUPABASE_URL      = Project URL
#   VITE_SUPABASE_ANON_KEY = anon / public key   (NUNCA la service_role)
npm install
npm run dev              # http://localhost:5173
```

### 3. Crear el administrador
Regístrate normalmente desde la app y luego ejecuta esto en el SQL Editor:
```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
```
Al recargar la página aparece **Administración** en el menú.

## Datos de demostración

`supabase/seed_demo.sql` crea 5 cuentas y 15 publicaciones con coincidencias, solicitudes (una completada, una aceptada, una pendiente) y un reporte. **Contraseña de todas: `FindIt2026!`**

| Cuenta | Para mostrar |
|---|---|
| `demo.laura@example.com` | Recuperó sus audífonos (flujo completo) y tiene una solicitud pendiente por su carné |
| `demo.andres@example.com` | Encontró los audífonos y confirmó la devolución |
| `demo.camila@example.com` | Tiene una solicitud **por revisar** (el carné) y su reloj fue aceptado |
| `demo.daniel@example.com` | Aceptó la solicitud del reloj; falta confirmar la entrega |
| `demo.admin@example.com` | Panel de administración con estadísticas y un reporte pendiente |

Para dejar la plataforma vacía: `supabase/cleanup.sql`.

## Pruebas E2E (Playwright)

34 pruebas que se ejecutan contra el **Supabase real** (las del `.env`):

```bash
cd frontend
npm run test:e2e        # arranca el servidor solo y ejecuta todo (~1.5 min)
npm run test:e2e:ui     # modo visual, para ver cada paso
npx playwright show-report
```

| Archivo | Qué comprueba |
|---|---|
| `e2e/recovery-flow.spec.ts` | **El escenario de aceptación completo** (sección 14): registro → perdido → encontrado con foto → coincidencia del 100 % con desglose → notificación → la característica privada no es visible → solicitud → aceptar → contacto → confirmar devolución → ambas resueltas |
| `e2e/api-security.spec.ts` | Llama a Supabase **saltándose la interfaz** (como un atacante desde la consola): RLS, reclamar lo propio o duplicado, autoasignarse admin, editar lo ajeno, suplantar a otro usuario, notificaciones falsas, funciones de admin, permisos de Storage |
| `e2e/auth.spec.ts` | Login, registro, cierre de sesión, rutas protegidas, bloqueo del panel admin |
| `e2e/explore.spec.ts` | Búsqueda, filtros, ocultar resueltos y detalle (usa los datos demo) |
| `e2e/admin.spec.ts` | Estadísticas, usuarios, reportes; ocultar una publicación (desaparece para otros y se notifica al dueño) |

Las pruebas crean usuarios `e2e-…@example.com` con publicaciones en *Otros / Otro*, una combinación que la demo no usa para no mezclarse con ella. Antes de cada corrida, `e2e/global-setup.ts` desactiva lo que dejaron las anteriores. Para borrarlos definitivamente, ejecuta la sección 1 de `supabase/cleanup.sql`.

## Dónde está cada cosa

```
supabase/schema.sql        Todo el backend: tablas, RLS, reglas de negocio, coincidencias, storage, datos iniciales
supabase/seed_demo.sql     Datos de demostración
supabase/cleanup.sql       Borra datos de prueba (e2e) y opcionalmente la demo
frontend/e2e/              Pruebas Playwright
frontend/src/
  lib/                     Cliente Supabase, tipos, hooks y utilidades
  contexts/AuthContext     Sesión y perfil del usuario
  layouts/AppLayout        Navegación, campana de notificaciones y protección de rutas
  components/              UI reutilizable, ItemCard, MatchCard, ClaimCard
  pages/                   Landing, Auth, Dashboard, Explore, ItemForm, ItemDetail, MyPages, Admin
```

## Cómo se cumplen las reglas de negocio

| Regla | Dónde |
|---|---|
| Contraseñas con hash, sesión JWT | Supabase Auth |
| Nadie puede auto-asignarse admin ni desbloquearse | trigger `guard_profile_update` |
| Solo editar publicaciones propias; solo admin modera | RLS en `items` + trigger `guard_item_update` |
| Características privadas nunca públicas | tabla aparte `item_private_details`, con RLS solo para el dueño |
| No reclamar lo propio, ni objetos inactivos, ni duplicar solicitud | función `create_claim` + índice único parcial |
| Solo el dueño acepta, rechaza o confirma; transiciones válidas | `respond_claim`, `cancel_claim`, `complete_claim` |
| Una sola devolución por publicación (en transacción) | `complete_claim` + índice único `claims_one_completed_per_item` |
| Al resolver, se cierran las coincidencias | trigger `items_matching` → `recompute_matches` |
| Contacto entre las partes solo tras aceptar | `get_claim_contact` |
| Fotos: solo JPG/PNG/WEBP de máx. 5 MB, cada usuario en su carpeta | configuración del bucket `item-images` + políticas de storage |

## Algoritmo de coincidencias

Se ejecuta automáticamente (trigger) cada vez que se crea o modifica una publicación. Compara solo con
publicaciones **activas del tipo opuesto y de otros usuarios**:

| Criterio | Puntos | Regla |
|---|---|---|
| Categoría | 30 | misma categoría |
| Palabras clave | 30 | 10 por palabra compartida en título y descripción (normalizadas: minúsculas, sin tildes, sin palabras vacías) |
| Ubicación | 25 | mismo lugar = 25 · mismo detalle de texto = 10 |
| Fecha | 15 | 15 el mismo día y baja de forma lineal hasta 0 a los 14 días; 0 si "se encontró" antes de perderse |

Se guarda como posible coincidencia si suma **≥ 45** (ajustable con `c_threshold` en `recompute_matches`).
Se notifica a ambos dueños, y en la interfaz se puede ver el desglose ("Ver cómo se calculó").

## Guion de demo (sección 14 de la doc)
1. Usuario A se registra y publica **"Perdí: audífonos negros Sony"** en Biblioteca, Electrónica.
2. Usuario B (en otra ventana de incógnito) publica **"Encontré: audífonos Sony negros"** en el mismo lugar y añade como característica privada "sticker de gato".
3. Los dos reciben la notificación de coincidencia (~99 %).
4. A entra a la publicación de B, pulsa **"Es mío"** y describe el sticker.
5. B acepta en **Solicitudes → Recibidas**; ambos ven el correo del otro.
6. B pulsa **Confirmar devolución** y las dos publicaciones quedan **Resueltas**.
7. El admin ve las estadísticas y el porcentaje de recuperación en **Administración**.
