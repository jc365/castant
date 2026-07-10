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



