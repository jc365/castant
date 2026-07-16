prompts usados en las features:

mio:
    quiero que implementes versionado (empezando por v1) en los endpoints para que cuando sea necesario poder crear nuevas versiones de cualquier endpoint sin que dejen de funcionar las anteriores. Insicame cual es la guia para implementar una nueva version en un endpoint

apaptado por DS:
    "Implementa versionado de API en el servidor Express, empezando por la versión v1. La estructura debe permitir añadir nuevas versiones en el futuro sin afectar a las anteriores.

    Estructura deseada:

        Crea un archivo backend/src/infrastructure/api/v1/routes.ts que agrupe todas las rutas de la versión 1.

        En backend/src/index.ts, monta estas rutas bajo el prefijo /api/v1 (ej. app.use('/api/v1', v1Router)).

        Los endpoints actuales deben moverse a este nuevo sistema:

            GET /health → GET /api/v1/health (o mantenlo fuera del versionado si es un endpoint de sistema).

            GET /actors/:id → GET /api/v1/actors/:id

            POST /actors → POST /api/v1/actors

            DELETE /actors/:id → DELETE /api/v1/actors/:id

        Guía para añadir nuevas versiones: Crea un archivo backend/src/infrastructure/api/v2/routes.ts (cuando sea necesario) y móntalo en index.ts con app.use('/api/v2', v2Router). Cada versión es independiente y puede tener sus propias rutas y lógica.

        Mantén retrocompatibilidad: Los endpoints antiguos sin versión (ej. POST /actors) deben redirigir o devolver un error 301/410 indicando que usen la versión /api/v1/actors.

        Actualiza AGENTS.md para reflejar el nuevo sistema de versionado y la guía para añadir nuevas versiones.

    IMPORTANTE: NO modifiques las importaciones de ningún archivo. No añadas extensiones .js."



"Crea el caso de uso CreateCastingUseCase en backend/src/application/use-cases/castings/CreateCastingUseCase.ts.

Debe:
    Importar Casting, CastingTitle, Description, ICastingRepository, IDirectorRepository (aunque no exista, usa IActorRepository como referencia) y los DTOs necesarios.
    Tener un constructor que reciba un repositorio de casting (y, opcionalmente, un repositorio de directores para validar que existe).
    El método execute debe recibir un DTO CreateCastingInput que contenga title, description y directorId.
    Validar que el director existe (si tienes repositorio de directores, si no, simplifica y solo valida que el ID no esté vacío por ahora).
    Crear los Value Objects CastingTitle y Description.
    Crear la entidad Casting con un ID generado (puedes usar EntityId.create<'Casting'>(crypto.randomUUID())).
    Guardar el casting usando el repositorio.
    Devolver el casting creado.

Genera también los tests unitarios para el caso de uso en tests/unit/application/use-cases/CreateCastingUseCase.test.ts. Los tests deben cubrir el caso feliz y el caso de error (ej. director no encontrado).

Sigue los patrones de CreateActorUseCase y las directrices de AGENTS.md." 



generado por DS:
"Añade el endpoint POST /api/v1/castings en backend/src/infrastructure/api/v1/routes.ts para crear un nuevo casting.

Requisitos:

    Usa CreateCastingUseCase (que ya está implementado en la capa de aplicación).

    Crea una instancia de CreateCastingUseCase con los repositorios necesarios:

        PrismaCastingRepository (nuevo, en infrastructure/persistence/)

        PrismaDirectorRepository (nuevo, en infrastructure/persistence/)

    El body de la petición debe ser:
    json

    {
      "title": "Casting para película",
      "description": "Buscamos protagonista",
      "directorId": "director-123"
    }

    Valida que el director existe (el caso de uso ya lo hace).

    Devuelve el casting creado con código 201.

    Añade logs con requestLogger.info y requestLogger.error.

    Maneja errores: si el director no existe, devuelve 404.

    IMPORTANTE: NO modifiques las importaciones. No añadas extensiones .js.

Nota: Necesitarás crear los repositorios PrismaCastingRepository y PrismaDirectorRepository en infrastructure/persistence/ antes de poder usarlos."


generado por DS:
"Ahora que el endpoint POST /api/v1/castings está funcionando, quiero que generes los tests de integración para él en tests/integration/api/v1/castings.test.ts. Usa Supertest y Jest.

Los tests deben cubrir:

    Caso feliz: Creación exitosa con director existente (código 201).

    Caso de error 404: Director no encontrado.

    Caso de error 400: Datos inválidos (ej. título vacío).

Requisitos técnicos:

    Antes de cada test, limpia la base de datos (usa prisma para borrar los registros de Casting y Director).

    Usa request(app) de Supertest para hacer las peticiones.

    Los tests deben ser independientes entre sí.

Además, actualiza AGENTS.md para incluir una nueva sección:
markdown

## Testing de Endpoints

Para cada nuevo endpoint añadido a la API, se deben generar tests de integración en `tests/integration/api/v1/<nombre>.test.ts`. Los tests deben cubrir:
- Caso feliz (200/201).
- Casos de error comunes (404, 400, 401, etc.).
- Validaciones de entrada (campos obligatorios, formatos, etc.).

IMPORTANTE: NO modifiques las importaciones de ningún archivo. No añadas extensiones .js."



hacer un EP
"Añade el endpoint POST /api/v1/submissions en backend/src/infrastructure/api/v1/routes.ts usando SubmitVideoUseCase.

Requisitos:

    Importa SubmitVideoUseCase desde ../../../application/use-cases/SubmitVideoUseCase.

    Importa PrismaActorRepository, PrismaRoundRepository y PrismaSubmissionRepository desde ../../persistence/.

    Crea las instancias de los repositorios y del caso de uso.

    El body de la petición debe ser:
    json

    {
      "actorId": "actor-123",
      "roundId": "round-456",
      "videoUrl": "https://www.youtube.com/watch?v=..."
    }

    Ejecuta el caso de uso con los datos del body.

    Devuelve la Submission creada con código 201.

    Maneja los errores:

        Actor no encontrado → 404.

        Ronda no encontrada → 404.

        Actor no invitado → 400.

        URL de video inválida → 400.

    Añade logs con requestLogger.info y requestLogger.error.

    IMPORTANTE: NO modifiques las importaciones de ningún archivo. No añadas extensiones .js.

Nota: Si PrismaRoundRepository o PrismaSubmissionRepository no existen, créalos en infrastructure/persistence/ siguiendo el patrón de PrismaActorRepository."



para refactorizar:
"Refactoriza el sistema para que la generación de IDs sea responsabilidad de las entidades (o de una función centralizada) y no de los casos de uso. El ID se generará en el create de cada entidad.

Cambios:

    Eliminar genUUID de los casos de uso. Cada entidad generará su propio ID en el método create.

    Modificar todas las entidades para que el método create no requiera un ID (o lo reciba como opcional para tests).

    Actualizar todos los casos de uso para que no pasen ID al crear entidades.

    Actualizar tests para reflejar el cambio.

    Eliminar TypedId y toda su lógica.

    Actualizar AGENTS.md.

Ejemplo de entidad (User.ts):
typescript

export class User {
  private constructor(
    private readonly _id: string,
    private readonly _name: FullName,
    private readonly _email: Email
  ) {}

  static create(name: FullName, email: Email, id?: string): User {
    const finalId = id || genUUID('user');
    return new User(finalId, name, email);
  }
}

IMPORTANTE: No modifiques las importaciones de ningún archivo. No añadas extensiones .js."




"Vamos a implementar la gestión de contraseñas en el sistema.

1. Añadir campo password a la entidad User (domain/entities/User.ts):

    Añadir propiedad privada _password: string.

    Modificar el constructor para que reciba password.

    Modificar create() para que reciba password (obligatorio).

    Añadir getter get password(): string.

2. Añadir campo password al modelo Prisma:

    En schema.prisma, añadir password String al modelo User.

    Ejecutar npx prisma db push para actualizar la BD de desarrollo.

    Actualizar tests/globalSetup.ts para que la BD de tests también se actualice.

3. Crear el servicio HashService (infrastructure/security/HashService.ts):

    Usar bcrypt para hashear contraseñas (npm install bcrypt).

    Método hash(password: string): Promise<string>.

    Método compare(password: string, hash: string): Promise<boolean>.

4. Modificar CreateUserUseCase:

    Inyectar HashService como dependencia.

    Hashear la contraseña antes de crear el usuario.

    Guardar el hash en la base de datos.

5. Modificar LoginUseCase:

    Inyectar HashService como dependencia.

    Buscar el usuario por email.

    Comparar la contraseña proporcionada con el hash almacenado.

    Si no coincide, lanzar error 401.

6. Actualizar routes.ts:

    POST /users debe recibir password en el body.

    POST /auth/login debe comparar la contraseña.

7. Actualizar tests:

    Añadir password en la creación de usuarios en todos los tests.

    Mockear HashService en los tests de casos de uso.

8. Actualizar AGENTS.md:

    Documentar el nuevo campo password y el servicio HashService.

IMPORTANTE: No modifiques las importaciones de ningún archivo. No añadas extensiones .js. Crea el backup de AGENTS.md antes de modificarlo."




"Refactoriza backend/src/infrastructure/api/v1/routes.ts para agrupar las rutas por middleware de autenticación, siguiendo el patrón de Laravel.

Cambios necesarios:

    Mover router.post('/auth/login', ...) al principio (antes de cualquier middleware).

    Añadir router.use(authMiddleware) inmediatamente después de las rutas públicas.

    Todas las rutas protegidas (POST, PATCH, DELETE, etc.) deben ir después de router.use(authMiddleware).

    Las rutas GET pueden ir después de router.use(authMiddleware) si requieren autenticación (o antes si son públicas).

    Eliminar authMiddleware de index.ts (ya no se pasa como argumento a app.use).

    Asegurar que authMiddleware se importa en routes.ts.

    Actualizar AGENTS.md para reflejar el nuevo patrón.

IMPORTANTE: No modifiques las importaciones de ningún archivo. No añadas extensiones .js. Crea el backup de AGENTS.md antes de modificarlo."



prompt para stitch
"Genera un prototipo de alta fidelidad para una aplicación web de gestión de casting para directores. El estilo debe ser minimalista, elegante y profesional, con soporte para modo claro y oscuro. La aplicación consta de tres pantallas principales:

1. Dashboard / Home:

    Esta es la pantalla principal. Muestra una vista general de todos los castings que tiene el director.

    Cada casting se presenta como una tarjeta con su título, la fecha de creación, un contador de rondas y el número total de submissions (videos) recibidos.

    Cada tarjeta de casting debe tener dos áreas clicables:

        Al hacer clic en el área principal de la tarjeta, se navega a la pantalla de detalle de ese casting.

        Dentro de la tarjeta, debe haber un acceso directo a la pantalla de la ronda activa de ese casting.

    Debe incluir un botón destacado para "Crear Nuevo Casting", que navega a la pantalla de detalle de casting en modo de creación.

2. Pantalla de Detalle del Casting:

    Esta pantalla se usa tanto para ver/editar un casting existente como para crear uno nuevo.

    Debe mostrar un formulario con los campos: Título y Descripción.

    Debe tener una sección para gestionar los participantes a nivel de casting (ej. para añadir otros directores o roles que solo tienen sentido a este nivel).

3. Pantalla de Detalle de una Ronda:

    Esta es la pantalla más compleja. Muestra el contenido de una ronda específica.

    El área principal debe ser un grid de tarjetas, donde cada tarjeta representa un video enviado por un actor. Cada tarjeta debe mostrar:

        Un icono o "thumbnail" representando el video.

        El nombre del actor.

        La puntuación (score) y un breve resumen del comentario.

    La pantalla debe tener dos secciones para gestionar participantes a nivel de ronda: una para actores (lista de invitados) y otra para preselectores (invitados con capacidad de invitar a otros).

Navegación y Acciones Generales:

    Incluye una barra lateral que esté presente en todas las pantallas. Debe contener el logo de la aplicación y enlaces para navegar al Dashboard y, en el futuro, a otras secciones (ej. Mi Perfil).

    Las acciones de crear, editar o seleccionar deben ser siempre claras con botones primarios de un color distintivo."