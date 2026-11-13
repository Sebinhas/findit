# FindIt --- Documentación funcional y técnica

**Plataforma web de objetos perdidos y encontrados**\
**Versión:** 1.0\
**Tipo de proyecto:** Universitario --- aplicación web full-stack\
**Estado:** Especificación para desarrollo con Claude Code

------------------------------------------------------------------------

## 1. Descripción general

FindIt es una plataforma web que facilita la identificación, búsqueda y
recuperación de objetos perdidos dentro de una institución educativa.
Centraliza en un solo lugar los reportes de objetos perdidos y
encontrados, las búsquedas, las posibles coincidencias y las solicitudes
de recuperación.

Actualmente, cuando un estudiante pierde un objeto, suele preguntar en
distintos lugares, publicar mensajes en grupos de WhatsApp o redes
sociales, o acudir a oficinas administrativas. Esto puede generar
desorganización, poca visibilidad de los objetos encontrados y
dificultades para comprobar quién es el verdadero propietario.

FindIt busca resolver este problema mediante un catálogo consultable,
publicaciones estructuradas y un proceso controlado de reclamación y
devolución.

Aunque la primera versión estará enfocada en universidades, la
arquitectura debe permitir que en el futuro pueda adaptarse a colegios,
empresas, centros comerciales y otros espacios.

### 1.1. Propuesta de valor

-   Centralizar los reportes de objetos perdidos y encontrados.
-   Facilitar búsquedas mediante filtros.
-   Detectar posibles coincidencias entre reportes.
-   Gestionar solicitudes de recuperación.
-   Proteger a los usuarios frente a reclamaciones fraudulentas.
-   Ofrecer herramientas administrativas y estadísticas.

### 1.2. Objetivo general

Desarrollar una plataforma web que facilite la identificación, búsqueda
y recuperación de objetos perdidos mediante un sistema centralizado de
publicaciones y gestión de solicitudes.

### 1.3. Objetivos específicos

1.  Permitir a los usuarios reportar objetos perdidos y encontrados.
2.  Facilitar la búsqueda mediante categorías, palabras clave, fechas y
    ubicaciones.
3.  Implementar un sistema de solicitudes de recuperación.
4.  Proteger la información de los usuarios y reducir las reclamaciones
    fraudulentas.
5.  Proporcionar herramientas administrativas para gestionar
    publicaciones, usuarios y reportes.
6.  Incorporar un mecanismo de coincidencias entre objetos perdidos y
    encontrados.

------------------------------------------------------------------------

## 2. Alcance del producto

FindIt se desarrollará como una aplicación web responsive, con frontend
y backend independientes que se comunican mediante una API REST.

La primera versión (MVP) incluirá:

-   Registro e inicio de sesión.
-   Roles y permisos.
-   Perfil de usuario.
-   Publicaciones de objetos perdidos y encontrados.
-   Carga opcional de fotografías.
-   Catálogo, búsqueda y filtros.
-   Algoritmo de posibles coincidencias basado en reglas.
-   Solicitudes de recuperación.
-   Notificaciones dentro de la plataforma.
-   Panel administrativo.
-   Estadísticas básicas.

### 2.1. Fuera del alcance inicial

Para mantener el proyecto realizable, no se implementarán inicialmente:

-   Aplicación móvil nativa.
-   Reconocimiento de imágenes mediante inteligencia artificial.
-   Chat en tiempo real.
-   Geolocalización avanzada o mapas interactivos.
-   Integración con WhatsApp.
-   Inicio de sesión con Google.
-   Pasarelas de pago.
-   Sistema complejo de reputación.
-   Envío de correos transaccionales.

Estas funciones podrán evaluarse para versiones posteriores.

------------------------------------------------------------------------

## 3. Tipos de usuarios y permisos

### 3.1. Usuario / estudiante

Es el usuario principal de la plataforma.

Puede:

-   Crear una cuenta e iniciar sesión.
-   Consultar y filtrar publicaciones.
-   Publicar objetos perdidos.
-   Publicar objetos encontrados.
-   Editar y eliminar sus propias publicaciones, según las reglas de
    estado.
-   Enviar solicitudes para reclamar objetos.
-   Consultar el estado de sus solicitudes.
-   Aceptar o rechazar solicitudes sobre objetos que publicó como
    encontrados.
-   Recibir notificaciones.
-   Gestionar su perfil.

### 3.2. Administrador

Supervisa el funcionamiento de la plataforma.

Puede:

-   Consultar estadísticas generales.
-   Consultar, activar o bloquear usuarios.
-   Ocultar o moderar publicaciones.
-   Revisar reportes de contenido.
-   Gestionar categorías.
-   Consultar solicitudes y su estado.
-   Revisar actividad sospechosa.

Las acciones administrativas deben quedar protegidas en el backend
mediante autorización por rol.

### 3.3. Responsable institucional (opcional / futura versión)

Personal autorizado para administrar objetos entregados físicamente en
una oficina de objetos perdidos.

Podría:

-   Registrar objetos recibidos presencialmente.
-   Actualizar la ubicación física de almacenamiento.
-   Validar entregas.
-   Confirmar devoluciones.

Este rol no es obligatorio para el MVP.

------------------------------------------------------------------------

## 4. Funcionamiento principal

La plataforma tendrá dos tipos de publicaciones.

### 4.1. Objeto perdido

Un usuario perdió una pertenencia y necesita encontrarla.

Ejemplo: un estudiante perdió su celular en la biblioteca.

La publicación registra:

-   Nombre del objeto.
-   Descripción.
-   Categoría.
-   Fotografía opcional.
-   Fecha aproximada de pérdida.
-   Lugar aproximado de pérdida.
-   Características adicionales.

### 4.2. Objeto encontrado

Un usuario encontró un objeto y desea localizar a su propietario.

Ejemplo: alguien encontró un celular en la cafetería.

La publicación registra:

-   Nombre del objeto.
-   Descripción pública.
-   Categoría.
-   Fotografía opcional.
-   Fecha en que fue encontrado.
-   Lugar aproximado donde fue encontrado.
-   Información sobre dónde se encuentra o cómo coordinar su entrega.

**Privacidad:** no se deben publicar números completos de documentos,
contraseñas, datos bancarios ni detalles privados que permitan a
cualquier persona reclamar el objeto. El usuario que encontró el objeto
debe conservar alguna característica no pública para verificar al
propietario.

### 4.3. Flujo general de recuperación

1.  Un usuario pierde o encuentra un objeto.
2.  Publica el reporte en FindIt.
3.  El sistema almacena la publicación.
4.  El sistema compara el nuevo reporte con publicaciones activas del
    tipo opuesto.
5.  Si encuentra posibles coincidencias, las muestra y genera
    notificaciones.
6.  El usuario interesado envía una solicitud de recuperación.
7.  La persona que publicó el objeto encontrado revisa la solicitud.
8.  Puede aceptarla o rechazarla.
9.  Si se acepta, las partes coordinan la entrega por un medio seguro.
10. Una vez realizada la devolución, se confirma la recuperación.
11. La publicación queda resuelta y deja de aparecer como disponible.

La detección de coincidencias es una sugerencia, no una confirmación
automática de que dos publicaciones representan el mismo objeto.

------------------------------------------------------------------------

## 5. Módulos funcionales

### 5.1. Autenticación y registro

Funciones:

-   Registro con nombre, apellido, correo electrónico y contraseña.
-   Inicio y cierre de sesión.
-   Recuperación de contraseña (puede implementarse en una fase
    posterior si requiere correo).
-   Consulta de sesión actual.
-   Edición del perfil.
-   Cambio de contraseña.
-   Autorización según rol.

Reglas:

-   El correo debe ser único.
-   Las contraseñas deben almacenarse mediante hashing seguro.
-   El usuario no puede asignarse el rol de administrador.
-   Las rutas privadas deben protegerse en frontend y backend.
-   La autenticación debe manejarse con mecanismos seguros.

### 5.2. Dashboard del usuario

La pantalla inicial debe mostrar:

-   Mensaje de bienvenida.
-   Buscador principal.
-   Acción destacada para reportar un objeto.
-   Objetos encontrados recientemente.
-   Objetos perdidos recientemente.
-   Categorías populares.
-   Posibles coincidencias del usuario.
-   Resumen de publicaciones propias.
-   Solicitudes pendientes.

La interfaz debe ser clara y no sobrecargada.

### 5.3. Publicación de objetos

Formulario compartido para reportar objetos perdidos o encontrados.

  Campo                                  Tipo                Obligatorio
  -------------------------------------- ------------------- -------------
  Nombre del objeto                      Texto               Sí
  Tipo de publicación                    LOST / FOUND        Sí
  Categoría                              Selección           Sí
  Descripción pública                    Texto largo         Sí
  Fotografía                             Imagen              No
  Fecha del incidente                    Fecha               Sí
  Lugar aproximado                       Texto o selección   Sí
  Características adicionales privadas   Texto               No

Categorías iniciales:

-   Electrónica.
-   Documentos y carnés.
-   Accesorios personales.
-   Ropa y calzado.
-   Libros y materiales académicos.
-   Llaves.
-   Bolsos y mochilas.
-   Otros.

Reglas de publicación:

1.  Un usuario solo puede editar sus propias publicaciones.
2.  Las publicaciones deben tener un estado.
3.  El administrador puede ocultar publicaciones inapropiadas.
4.  Las fotografías deben validar formato y tamaño.
5.  Una publicación puede marcarse como resuelta cuando el objeto ha
    sido recuperado.
6.  No se debe mostrar públicamente información sensible.
7.  El contenido debe validarse tanto en frontend como en backend.

### 5.4. Catálogo y buscador

El catálogo mostrará las publicaciones disponibles.

Filtros:

-   Tipo: perdido o encontrado.
-   Categoría.
-   Fecha o rango de fechas.
-   Lugar.
-   Palabras clave.

Ordenamiento:

-   Más recientes.
-   Más antiguos.
-   Coincidencias más relevantes (cuando aplique).

Cada tarjeta de publicación mostrará:

-   Fotografía o imagen predeterminada.
-   Nombre del objeto.
-   Categoría.
-   Tipo de publicación.
-   Fecha.
-   Ubicación aproximada.
-   Estado.

El catálogo debe incluir paginación o carga progresiva para evitar
consultar todos los registros de una sola vez.

### 5.5. Sistema de coincidencias

Esta es la funcionalidad diferenciadora de FindIt.

La plataforma intentará relacionar publicaciones de objetos perdidos con
publicaciones de objetos encontrados.

Ejemplo:

-   Usuario A: perdió unos audífonos negros en la biblioteca.
-   Usuario B: encontró unos audífonos negros cerca de la biblioteca.

El sistema detecta que podrían corresponder al mismo objeto.

#### Primera versión: algoritmo basado en reglas

No se requiere inteligencia artificial ni servicios de pago.

Puntuación inicial sugerida:

  Criterio                           Puntuación máxima
  -------------------------------- -------------------
  Misma categoría                                   30
  Coincidencia de palabras clave                    30
  Ubicación similar                                 25
  Fecha cercana                                     15
  **Total**                                    **100**

La puntuación debe calcularse de forma consistente y documentada. Si un
criterio no tiene datos suficientes, su puntuación será cero o se
ajustará mediante una regla definida; no se debe inventar información.

Reglas:

-   Comparar únicamente publicaciones de tipos opuestos (LOST contra
    FOUND).
-   No comparar una publicación consigo misma.
-   Ignorar publicaciones cerradas, resueltas, ocultas o eliminadas.
-   Normalizar texto: minúsculas, espacios y caracteres comunes.
-   Comparar palabras clave del título y descripción pública.
-   Evaluar cercanía temporal con una ventana configurable.
-   Evaluar ubicación mediante igualdad o similitud de texto en el MVP.
-   Evitar duplicar pares de coincidencias.
-   Recalcular coincidencias cuando se crea o actualiza una publicación
    relevante.
-   No cerrar ni aceptar reclamaciones automáticamente.

Los resultados se presentarán como "posibles coincidencias", no como
certeza.

### 5.6. Solicitudes de recuperación

Cuando una persona considere que un objeto encontrado le pertenece,
podrá enviar una solicitud.

Formulario:

-   Explicación de por qué considera que es su objeto.
-   Lugar donde lo perdió.
-   Fecha aproximada.
-   Características particulares que permitan comprobar la propiedad.

La información se enviará al usuario que publicó el objeto encontrado.

Estados:

  Estado      Descripción
  ----------- -----------------------------------
  PENDING     Esperando respuesta
  ACCEPTED    Reclamación aceptada
  REJECTED    Reclamación rechazada
  COMPLETED   Devolución confirmada
  CANCELLED   Solicitante retiró la reclamación

Reglas:

-   Un usuario no puede reclamar su propia publicación.
-   No se puede reclamar una publicación que no esté activa.
-   No se deben permitir solicitudes duplicadas activas del mismo
    usuario para el mismo objeto.
-   Solo el propietario de la publicación puede aceptar o rechazar la
    solicitud.
-   El solicitante puede cancelar su solicitud mientras sea válido
    hacerlo.
-   La aceptación no cierra automáticamente la publicación.
-   La devolución debe confirmarse expresamente.
-   La verificación de propiedad debe apoyarse en características
    privadas que no aparezcan en el anuncio público.

### 5.7. Notificaciones

Notificaciones internas almacenadas en PostgreSQL.

Eventos:

-   Nueva solicitud sobre una publicación propia.
-   Solicitud aceptada o rechazada.
-   Posible coincidencia detectada.
-   Cambio importante en una solicitud.
-   Confirmación de devolución.

La interfaz tendrá un icono de campana, contador de no leídas y vista de
notificaciones.

Para el MVP no es necesario usar correo electrónico ni servicios
externos. Las notificaciones se consultarán mediante la API.

### 5.8. Perfil del usuario

Cada usuario tendrá:

-   Nombre y apellido.
-   Fotografía de perfil opcional.
-   Correo electrónico.
-   Fecha de registro.
-   Publicaciones realizadas.
-   Objetos recuperados.
-   Solicitudes pendientes.

Podrá actualizar su información personal permitida y consultar sus
publicaciones y solicitudes.

### 5.9. Panel administrativo

Interfaz independiente para administradores.

Secciones:

1.  Dashboard general.
2.  Gestión de usuarios.
3.  Gestión de publicaciones.
4.  Gestión de categorías.
5.  Gestión de solicitudes.
6.  Reportes de contenido.
7.  Estadísticas.

Estadísticas sugeridas:

-   Total de usuarios registrados.
-   Total de objetos publicados.
-   Objetos perdidos.
-   Objetos encontrados.
-   Objetos recuperados.
-   Solicitudes pendientes.
-   Porcentaje de recuperación.

Acciones:

-   Bloquear o reactivar usuarios.
-   Ocultar publicaciones.
-   Revisar reportes.
-   Gestionar categorías.
-   Consultar información agregada.

Las operaciones administrativas deben estar protegidas en el backend y
registrar quién realizó acciones sensibles.

------------------------------------------------------------------------

## 6. Diseño y experiencia de usuario (UI/UX)

FindIt debe tener una apariencia moderna, profesional y sencilla. No
debe parecer una plantilla administrativa genérica ni una tienda
electrónica tradicional.

### 6.1. Dirección visual

-   Diseño minimalista.
-   Interfaz limpia.
-   Bordes ligeramente redondeados.
-   Sombras suaves y discretas.
-   Buena separación entre componentes.
-   Tipografía moderna y legible.
-   Iconografía consistente.
-   Animaciones pequeñas y discretas.
-   Diseño responsive para móviles, tablets y computadores.
-   Estados vacíos, de carga y de error bien diseñados.

### 6.2. Paleta sugerida

  Elemento           Color
  ------------------ -----------
  Principal          `#2563EB`
  Secundario         `#1E3A8A`
  Fondo              `#F8FAFC`
  Superficies        `#FFFFFF`
  Texto principal    `#0F172A`
  Texto secundario   `#64748B`
  Éxito              `#16A34A`
  Advertencia        `#F59E0B`
  Error              `#DC2626`

### 6.3. Navegación del usuario

-   Inicio.
-   Explorar objetos.
-   Reportar objeto.
-   Mis publicaciones.
-   Mis solicitudes.
-   Notificaciones.
-   Mi perfil.

El panel administrativo tendrá navegación independiente.

### 6.4. Páginas principales

1.  Landing page pública.
2.  Registro.
3.  Inicio de sesión.
4.  Dashboard del usuario.
5.  Catálogo de publicaciones.
6.  Detalle de publicación.
7.  Formulario para reportar objeto.
8.  Mis publicaciones.
9.  Mis solicitudes.
10. Notificaciones.
11. Perfil.
12. Dashboard administrativo.
13. Gestión administrativa de usuarios, publicaciones y reportes.

------------------------------------------------------------------------

## 7. Arquitectura tecnológica

Se recomienda un monorepositorio con dos aplicaciones independientes.

### 7.1. Stack

  -----------------------------------------------------------------------
  Capa                    Tecnología              Responsabilidad
  ----------------------- ----------------------- -----------------------
  Frontend                React + Vite +          Interfaz de usuario
                          TypeScript              

  Estilos                 Tailwind CSS            Diseño y responsive

  Componentes             shadcn/ui               Componentes visuales
                                                  reutilizables

  Backend                 NestJS + TypeScript     API y lógica de negocio

  Base de datos           PostgreSQL              Persistencia

  ORM                     Prisma                  Modelado y consultas

  Autenticación           JWT                     Identidad y
                                                  autorización

  Validación              class-validator /       Validación de DTOs
                          class-transformer       

  Pruebas API             Jest / Supertest        Pruebas del backend
  -----------------------------------------------------------------------

Las versiones de dependencias deben elegirse compatibles entre sí y
mantenerse documentadas.

### 7.2. Estructura de carpetas sugerida

``` text
findit/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── items/
│   │   ├── categories/
│   │   ├── matches/
│   │   ├── claims/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── admin/
│   │   ├── common/
│   │   └── main.ts
│   └── package.json
│
├── docs/
│   ├── REQUIREMENTS.md
│   ├── DATABASE.md
│   └── API.md
│
├── docker-compose.yml
├── PROJECT_SPEC.md
├── DEVELOPMENT.md
└── README.md
```

### 7.3. Responsabilidades de frontend y backend

**Frontend:**

-   Renderizar páginas y componentes.
-   Gestionar formularios y validaciones de experiencia de usuario.
-   Consumir la API.
-   Mantener el estado de autenticación de forma segura.
-   Mostrar estados de carga, errores y confirmaciones.
-   Restringir visualmente el acceso a secciones según el rol, sin
    sustituir la autorización del backend.

**Backend:**

-   Autenticar usuarios.
-   Autorizar operaciones y roles.
-   Validar datos.
-   Ejecutar reglas de negocio.
-   Gestionar publicaciones, solicitudes y coincidencias.
-   Persistir información.
-   Generar notificaciones.
-   Exponer endpoints REST documentados.

------------------------------------------------------------------------

## 8. Modelo de datos

Entidades principales:

  Tabla           Responsabilidad
  --------------- --------------------------------
  users           Usuarios, credenciales y roles
  items           Publicaciones de objetos
  categories      Categorías
  claims          Solicitudes de recuperación
  matches         Coincidencias detectadas
  notifications   Notificaciones
  reports         Reportes de contenido

### 8.1. Relaciones

-   Un usuario puede tener muchas publicaciones.
-   Una categoría puede estar asociada a muchas publicaciones.
-   Una publicación puede recibir varias solicitudes.
-   Una solicitud pertenece a un usuario solicitante y a una
    publicación.
-   Una publicación puede tener múltiples coincidencias.
-   Una coincidencia relaciona una publicación LOST con una FOUND.
-   Un usuario puede recibir muchas notificaciones.
-   Un usuario puede crear varios reportes.
-   Un administrador puede revisar reportes y moderar publicaciones.

### 8.2. Campos principales

#### Users

``` text
id
firstName
lastName
email
passwordHash
role
avatarUrl
isActive
createdAt
updatedAt
```

#### Items

``` text
id
userId
categoryId
title
description
type
incidentDate
location
latitude (opcional)
longitude (opcional)
imageUrl (opcional)
status
createdAt
updatedAt
```

`type` tendrá los valores `LOST` y `FOUND`.

`status` podrá tener `ACTIVE`, `RESOLVED`, `HIDDEN` y `CLOSED`. Las
transiciones deben controlarse mediante reglas de negocio.

Se recomienda añadir un campo privado separado para características de
verificación que no se devuelvan en los endpoints públicos.

#### Claims

``` text
id
itemId
requesterId
message
status
reviewedAt
createdAt
updatedAt
```

#### Matches

``` text
id
lostItemId
foundItemId
score
status
createdAt
updatedAt
```

Debe existir una restricción única para evitar registrar dos veces el
mismo par de publicaciones.

#### Notifications

``` text
id
userId
title
message
type
isRead
createdAt
```

#### Reports

``` text
id
reporterId
itemId
reason
description
status
createdAt
updatedAt
```

Los identificadores deben utilizar UUID. Todas las relaciones deben
tener claves foráneas y restricciones de integridad. Se deben definir
índices para campos usados frecuentemente en filtros, como tipo, estado,
categoría, fecha y usuario.

------------------------------------------------------------------------

## 9. API REST

El backend expondrá una API organizada por módulos. Los nombres y
respuestas definitivos deben documentarse en `API.md`.

### 9.1. Autenticación

  Método   Endpoint           Función
  -------- ------------------ --------------------------------------------
  POST     `/auth/register`   Registrar usuario
  POST     `/auth/login`      Iniciar sesión
  POST     `/auth/logout`     Cerrar sesión, si se implementa revocación
  GET      `/auth/me`         Consultar sesión actual

### 9.2. Usuarios

  Método   Endpoint            Función
  -------- ------------------- --------------------
  GET      `/users/profile`    Consultar perfil
  PATCH    `/users/profile`    Actualizar perfil
  PATCH    `/users/password`   Cambiar contraseña

### 9.3. Publicaciones

  Método   Endpoint        Función
  -------- --------------- ----------------------------------------
  GET      `/items`        Consultar publicaciones
  POST     `/items`        Crear publicación
  GET      `/items/:id`    Ver publicación
  PATCH    `/items/:id`    Actualizar publicación propia
  DELETE   `/items/:id`    Eliminar o archivar publicación propia
  GET      `/items/mine`   Consultar publicaciones propias

### 9.4. Categorías

  Método   Endpoint        Función
  -------- --------------- ----------------------
  GET      `/categories`   Consultar categorías

La creación, edición y eliminación de categorías será administrativa.

### 9.5. Solicitudes

  Método   Endpoint                 Función
  -------- ------------------------ ---------------------------------
  POST     `/claims`                Crear solicitud
  GET      `/claims/mine`           Consultar solicitudes propias
  GET      `/claims/received`       Consultar solicitudes recibidas
  PATCH    `/claims/:id/status`     Aceptar o rechazar solicitud
  PATCH    `/claims/:id/cancel`     Cancelar solicitud propia
  PATCH    `/claims/:id/complete`   Confirmar devolución

### 9.6. Coincidencias

  -----------------------------------------------------------------------
  Método                  Endpoint                Función
  ----------------------- ----------------------- -----------------------
  GET                     `/matches`              Consultar coincidencias
                                                  relevantes del usuario

  GET                     `/items/:id/matches`    Consultar coincidencias
                                                  de una publicación
  -----------------------------------------------------------------------

### 9.7. Notificaciones

  Método   Endpoint                    Función
  -------- --------------------------- --------------------------
  GET      `/notifications`            Consultar notificaciones
  PATCH    `/notifications/:id/read`   Marcar como leída
  PATCH    `/notifications/read-all`   Marcar todas como leídas

### 9.8. Administración

``` text
GET    /admin/dashboard
GET    /admin/users
PATCH  /admin/users/:id/status
GET    /admin/items
PATCH  /admin/items/:id/moderation
GET    /admin/reports
PATCH  /admin/reports/:id/status
GET    /admin/categories
POST   /admin/categories
PATCH  /admin/categories/:id
DELETE /admin/categories/:id
```

Todos los endpoints deben validar permisos, datos recibidos y propiedad
de los recursos. Las respuestas deben usar códigos HTTP apropiados y un
formato de error consistente.

------------------------------------------------------------------------

## 10. Reglas de negocio

1.  Un usuario no puede reclamar su propia publicación.
2.  Un usuario no puede modificar publicaciones ajenas.
3.  Una publicación resuelta, cerrada u oculta no puede recibir nuevas
    reclamaciones.
4.  Una solicitud no puede aceptarse si ya fue rechazada, cancelada o
    completada.
5.  Solo el propietario de la publicación encontrada puede aceptar o
    rechazar una solicitud.
6.  Una publicación solo puede tener una devolución confirmada.
7.  Una coincidencia no implica que dos objetos sean iguales.
8.  Los usuarios no pueden acceder a funcionalidades administrativas.
9.  Cuando una publicación se resuelva, sus coincidencias deben dejar de
    aparecer como activas.
10. Las acciones importantes deben validar permisos en el backend.
11. Los cambios de estado deben seguir transiciones válidas.
12. Las operaciones sensibles deben quedar registradas cuando
    corresponda.
13. La información privada de verificación nunca debe incluirse en
    respuestas públicas.
14. Las operaciones que cambien simultáneamente varios registros deben
    utilizar transacciones cuando sea necesario.

------------------------------------------------------------------------

## 11. Seguridad y validaciones

-   Almacenar contraseñas con Argon2id o bcrypt.
-   Usar JWT con estrategia de almacenamiento segura. Preferir cookies
    `HttpOnly`, `Secure` y `SameSite` cuando la arquitectura lo permita;
    evitar guardar tokens sensibles en `localStorage`.
-   Validar DTOs con reglas estrictas.
-   Proteger rutas con Guards y autorización por roles.
-   Validar propiedad del recurso en cada operación.
-   Usar Prisma para consultas parametrizadas.
-   Validar MIME type, extensión y tamaño de imágenes.
-   Limitar intentos de inicio de sesión y operaciones susceptibles a
    spam.
-   Configurar CORS para los orígenes autorizados.
-   Guardar secretos únicamente en variables de entorno.
-   No devolver hashes de contraseñas ni datos privados.
-   Implementar manejo centralizado de excepciones.
-   Evitar revelar si una cuenta existe durante procesos sensibles de
    autenticación.
-   Registrar eventos administrativos importantes.
-   Considerar protección CSRF si se utiliza autenticación basada en
    cookies.

Las imágenes pueden almacenarse localmente durante desarrollo. La
solución de almacenamiento debe abstraerse para permitir migrar a un
servicio de objetos en el futuro.

------------------------------------------------------------------------

## 12. Requisitos del sistema

### 12.1. Requisitos funcionales

  Código   Requisito
  -------- ----------------------------------------------------------
  RF01     El sistema permite registrar usuarios.
  RF02     El sistema permite iniciar y cerrar sesión.
  RF03     El sistema permite publicar objetos perdidos.
  RF04     El sistema permite publicar objetos encontrados.
  RF05     El sistema permite consultar y filtrar objetos.
  RF06     El sistema genera posibles coincidencias.
  RF07     El sistema permite reclamar objetos.
  RF08     El sistema permite aceptar o rechazar solicitudes.
  RF09     El sistema genera notificaciones.
  RF10     El sistema permite administrar usuarios y publicaciones.
  RF11     El sistema permite confirmar devoluciones.
  RF12     El sistema permite consultar estadísticas.

### 12.2. Requisitos no funcionales

-   Interfaz adaptable a dispositivos móviles.
-   Arquitectura modular.
-   Código mantenible y documentado.
-   Tiempos de respuesta razonables.
-   Base de datos relacional.
-   Protección de información personal.
-   Validación de entradas.
-   Manejo consistente de errores.
-   Separación entre frontend y backend.
-   Pruebas de las operaciones críticas.
-   Configuración reproducible del entorno de desarrollo.

------------------------------------------------------------------------

## 13. Plan de desarrollo por fases

### Fase 1 --- Estructura y autenticación

-   Crear frontend y backend.
-   Configurar PostgreSQL y Prisma.
-   Configurar variables de entorno.
-   Crear modelo inicial de usuarios.
-   Implementar registro e inicio de sesión.
-   Implementar roles y permisos.
-   Crear layouts y navegación principal.
-   Configurar manejo de errores.

**Criterio de salida:** un usuario puede registrarse, iniciar sesión y
acceder a las rutas autorizadas según su rol.

### Fase 2 --- Publicaciones

-   Crear modelo de categorías y objetos.
-   Implementar CRUD de publicaciones.
-   Implementar carga y validación de fotografías.
-   Crear catálogo.
-   Implementar búsqueda y filtros.
-   Implementar detalle de publicación.
-   Implementar "mis publicaciones".

**Criterio de salida:** un usuario puede crear, consultar, editar y
administrar sus propias publicaciones.

### Fase 3 --- Coincidencias

-   Implementar algoritmo de puntuación.
-   Comparar publicaciones LOST y FOUND.
-   Guardar coincidencias sin duplicados.
-   Mostrar posibles coincidencias.
-   Generar notificaciones por coincidencias.

**Criterio de salida:** al crear reportes compatibles, el sistema
identifica y muestra posibles relaciones con una puntuación explicable.

### Fase 4 --- Recuperación

-   Implementar solicitudes de recuperación.
-   Implementar aceptación y rechazo.
-   Implementar cancelación.
-   Implementar confirmación de devolución.
-   Implementar historial de solicitudes.
-   Actualizar estados de publicaciones.

**Criterio de salida:** dos usuarios pueden completar el flujo de
reclamación y devolución con validaciones correctas.

### Fase 5 --- Administración

-   Crear panel administrativo.
-   Implementar gestión de usuarios.
-   Implementar moderación de publicaciones.
-   Implementar gestión de categorías.
-   Implementar revisión de reportes.
-   Crear estadísticas generales.

**Criterio de salida:** el administrador puede supervisar y moderar la
plataforma desde una interfaz protegida.

### Fase 6 --- Pruebas y entrega

-   Probar endpoints.
-   Probar autenticación y autorización.
-   Probar permisos y propiedad de recursos.
-   Probar algoritmo de coincidencias.
-   Probar transiciones de estados.
-   Corregir errores.
-   Completar documentación técnica.
-   Preparar datos de demostración.
-   Preparar presentación universitaria.

**Criterio de salida:** el flujo principal funciona de extremo a extremo
y no existen errores críticos conocidos.

------------------------------------------------------------------------

## 14. Criterios de aceptación del MVP

El MVP se considerará funcional cuando se pueda completar este
escenario:

1.  Un estudiante se registra.
2.  Inicia sesión.
3.  Publica que perdió un objeto.
4.  Otro estudiante se registra y publica un objeto encontrado.
5.  El sistema detecta una posible coincidencia.
6.  El usuario interesado recibe una notificación.
7.  Envía una solicitud de recuperación.
8.  El usuario que encontró el objeto revisa la solicitud.
9.  Acepta la reclamación.
10. Ambos coordinan la devolución.
11. Se confirma la recuperación.
12. El objeto queda marcado como resuelto.
13. El administrador puede consultar el historial y las estadísticas.

También deben probarse los casos negativos: usuario sin permisos,
reclamación propia, publicación cerrada, solicitud duplicada y cambios
de estado inválidos.

------------------------------------------------------------------------

## 15. Instrucciones para desarrollar con Claude Code

El archivo `PROJECT_SPEC.md` será la fuente principal de requisitos del
proyecto.

Claude Code debe trabajar de forma incremental, no generar toda la
plataforma en un solo intento.

### 15.1. Prompt inicial para Claude Code

``` text
Actúa como un ingeniero de software senior especializado en arquitectura
full-stack, React, TypeScript, NestJS, PostgreSQL y Prisma.

Vamos a desarrollar un proyecto universitario llamado FindIt, una
plataforma web para reportar, buscar y recuperar objetos perdidos
y encontrados.

## 1. Documentación obligatoria

Antes de escribir código, lee completamente el archivo PROJECT_SPEC.md.

Este archivo contiene la documentación funcional y técnica del proyecto.
Debes utilizarlo como fuente principal de requisitos.

No inventes funcionalidades que contradigan la documentación.

## 2. Arquitectura obligatoria

El proyecto debe tener dos aplicaciones independientes:

- Frontend: React + Vite + TypeScript.
- Backend: NestJS + TypeScript.
- Base de datos: PostgreSQL.
- ORM: Prisma.
- Estilos: Tailwind CSS.
- Componentes UI: shadcn/ui.
- Autenticación: JWT.

La comunicación entre frontend y backend debe realizarse mediante una API REST.

No mezcles la lógica de negocio del backend con el frontend.

## 3. Reglas de desarrollo

- Utiliza TypeScript de manera estricta.
- Mantén una arquitectura modular.
- Evita duplicación de código.
- Crea componentes reutilizables.
- Implementa validaciones en frontend y backend.
- Utiliza DTOs en NestJS.
- Protege las rutas mediante Guards y roles.
- Utiliza Prisma para las consultas a PostgreSQL.
- Implementa manejo centralizado de errores.
- No utilices datos ficticios como sustituto de funcionalidades reales.
- No dejes botones sin funcionalidad.
- No almacenes contraseñas ni tokens sensibles en localStorage.
- No implementes funcionalidades fuera del alcance sin justificarlo primero.

## 4. Metodología de trabajo

Trabaja por fases y módulos.

Antes de implementar una fase:

1. Analiza los requisitos.
2. Identifica dependencias.
3. Define los archivos que necesitas crear o modificar.
4. Explica brevemente qué vas a implementar.
5. Implementa la funcionalidad.
6. Ejecuta las comprobaciones y pruebas correspondientes.
7. Corrige los errores.
8. Actualiza la documentación.

No avances a la siguiente fase si la actual tiene errores importantes.

## 5. Gestión del proyecto

Mantén los siguientes archivos actualizados:

- README.md: instrucciones generales.
- PROJECT_SPEC.md: requisitos originales.
- DEVELOPMENT.md: progreso del desarrollo.
- API.md: documentación de endpoints.
- DATABASE.md: estructura y relaciones.

Actualiza DEVELOPMENT.md cada vez que termines una fase.

## 6. Calidad del producto

La interfaz debe tener apariencia de un producto SaaS moderno y profesional.

Prioriza:

- Diseño responsive.
- Buena experiencia de usuario.
- Jerarquía visual.
- Componentes consistentes.
- Estados de carga.
- Estados vacíos.
- Mensajes de error claros.
- Confirmaciones para acciones destructivas.
- Accesibilidad básica.

## 7. Primera tarea

Por ahora NO desarrolles toda la plataforma.

Primero analiza PROJECT_SPEC.md y presenta:

1. Resumen de la arquitectura.
2. Estructura de carpetas propuesta.
3. Modelo de datos y relaciones.
4. Módulos del backend.
5. Páginas y componentes del frontend.
6. Dependencias necesarias.
7. Plan de implementación por fases.
8. Riesgos técnicos y posibles conflictos.

Identifica cualquier inconsistencia en la documentación y propón
soluciones antes de comenzar a programar.

Espera mi aprobación antes de implementar la primera fase.

Tu objetivo es construir un producto funcional, mantenible y coherente
con los requisitos, no simplemente generar código rápidamente.
```

### 15.2. Forma recomendada de trabajo

Después de aprobar el análisis inicial, solicitar a Claude Code una fase
a la vez.

Ejemplo:

``` text
Implementa únicamente la Fase 1 de PROJECT_SPEC.md.

Antes de modificar archivos, revisa el estado actual del repositorio.
No sobrescribas configuraciones existentes sin analizarlas.

Al terminar:
- Ejecuta las pruebas disponibles.
- Ejecuta el build del frontend y backend.
- Corrige los errores.
- Documenta las variables de entorno necesarias.
- Actualiza DEVELOPMENT.md.
- Resume los archivos creados y las decisiones técnicas.

No comiences la Fase 2 hasta que te lo indique.
```

------------------------------------------------------------------------

## 16. Recomendaciones para la presentación universitaria

FindIt puede destacar por tres aspectos:

### 16.1. El algoritmo de coincidencias

Es la funcionalidad que diferencia el proyecto de un CRUD convencional.
Se puede explicar cómo se comparan dos publicaciones y cómo se obtiene
una puntuación de similitud.

### 16.2. La arquitectura independiente

Permite demostrar que el frontend consume una API REST, el backend está
organizado por módulos y la base de datos relacional tiene relaciones
reales.

### 16.3. El problema que soluciona

FindIt atiende una situación cotidiana dentro de una institución
educativa y propone un proceso centralizado para mejorar la recuperación
de pertenencias.

### 16.4. Demostración sugerida

Para la exposición, preparar dos cuentas de prueba:

-   Estudiante A: publica un objeto perdido.
-   Estudiante B: publica un objeto encontrado.

Después, mostrar la coincidencia, la solicitud de recuperación, la
aceptación y la confirmación de devolución. Finalmente, mostrar el panel
administrativo con las estadísticas.

------------------------------------------------------------------------

## 17. Definición final del producto

**Nombre:** FindIt\
**Descripción corta:** Plataforma web para reportar, buscar y recuperar
objetos perdidos y encontrados dentro de instituciones educativas.

**Problema:** la información sobre objetos perdidos y encontrados suele
estar dispersa en grupos, redes sociales y oficinas físicas.

**Solución:** centralizar reportes, búsquedas, coincidencias y
solicitudes de recuperación en una sola plataforma.

**Elemento diferenciador:** algoritmo de coincidencias basado en
categoría, palabras clave, ubicación y fecha.

**Usuarios principales:** estudiantes y administradores institucionales.

**Arquitectura:** React + Vite, NestJS, PostgreSQL y Prisma.

**Alcance:** MVP universitario funcional, modular y preparado para
ampliaciones futuras.

**Principio de desarrollo:** priorizar un flujo completo y funcional
antes de agregar características adicionales.
