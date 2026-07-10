# Capítulo 7: Implementación de la Capa de API (Endpoints de Escritura)

## 7.1. Introducción

Con la arquitectura de la aplicación estable y la capa de dominio consolidada, el siguiente paso fue exponer la lógica de negocio a través de una API REST. Esta fase se centró en la implementación de los **endpoints de escritura**, que permiten a los usuarios interactuar con el sistema de casting (crear actores, castings, enviar videos y seleccionar actores para rondas posteriores).

Un aspecto clave de esta implementación fue el **versionado de la API**, que permite evolucionar los endpoints sin romper la compatibilidad con versiones anteriores.

## 7.2. Versionado de la API

Se implementó un sistema de versionado basado en el prefijo de la URL (`/api/v1`, `/api/v2`, etc.), siguiendo las mejores prácticas de diseño de APIs REST.

**Estructura de archivos:**

infrastructure/api/
├── v1/routes.ts ← rutas de la versión 1
└── v2/routes.ts ← rutas de la versión 2 (placeholder)


**Reglas de versionado:**
- Cada versión se monta en `index.ts` con `app.use('/api/vX', vXRouter)`.
- Cada versión es independiente y puede tener sus propias rutas y lógica.
- El endpoint `/health` se mantiene fuera del versionado (es un endpoint de sistema).

## 7.3. Implementación de Endpoints

Se implementaron cuatro endpoints de escritura, cubriendo el ciclo completo del sistema de casting:

| Método | Endpoint | Caso de Uso | Descripción |
|--------|----------|-------------|-------------|
| `POST` | `/api/v1/actors` | `CreateActorUseCase` | Crea un nuevo actor en el sistema. |
| `POST` | `/api/v1/castings` | `CreateCastingUseCase` | Crea un nuevo casting con su ronda inicial. |
| `POST` | `/api/v1/submissions` | `SubmitVideoUseCase` | Permite a un actor enviar un video para una ronda. |
| `POST` | `/api/v1/rounds/select` | `SelectActorsForNextRoundUseCase` | Permite al director seleccionar actores para la siguiente ronda. |

### 7.3.1. Endpoint de Actores (`POST /api/v1/actors`)

El endpoint de creación de actores valida que el email no esté duplicado, crea los Value Objects correspondientes (`Email`, `FullName`) y persiste el actor en la base de datos.

### 7.3.2. Endpoint de Castings (`POST /api/v1/castings`)

El endpoint de creación de castings valida que el director existe, crea los Value Objects (`CastingTitle`, `Description`) y genera la primera ronda automáticamente.

### 7.3.3. Endpoint de Envío de Videos (`POST /api/v1/submissions`)

El endpoint de envío de videos valida que el actor y la ronda existen, que el actor está invitado a la ronda, crea el Value Object `VideoUrl` y persiste la `Submission`.

### 7.3.4. Endpoint de Selección de Actores (`POST /api/v1/rounds/select`)

El endpoint de selección permite al director elegir actores de una ronda para pasar a la siguiente. Valida que la ronda existe y que los actores seleccionados están en la lista de invitados, y crea automáticamente la siguiente ronda con los seleccionados.

## 7.4. Repositorios Prisma

Para cada entidad, se implementó un repositorio con Prisma que traduce entre el dominio y la base de datos:

| Repositorio | Entidad |
|-------------|---------|
| `PrismaActorRepository` | `Actor` |
| `PrismaDirectorRepository` | `Director` |
| `PrismaCastingRepository` | `Casting` |
| `PrismaRoundRepository` | `Round` |
| `PrismaSubmissionRepository` | `Submission` |

Cada repositorio sigue el patrón de `toDomain()` para mapear registros de Prisma a entidades de dominio, y `save()` con `upsert` para persistir.

## 7.5. Tests de Integración

Se generaron tests de integración con **Supertest** para verificar el comportamiento de los endpoints:

| Archivo de Tests | Endpoints Testeados | Nº de Tests |
|------------------|---------------------|-------------|
| `castings.test.ts` | `POST /api/v1/castings` | 3 |
| `rounds.test.ts` | `POST /api/v1/rounds/select` | 4 |

**Cobertura de tests:** 159 unitarios + 7 de integración = 166 tests pasando.

## 7.6. Gestión de Logs y Correlación

Todos los endpoints integran el sistema de logs con **correlación por `requestId`**, lo que permite seguir el rastro de una petición desde que entra hasta que sale.

## 7.7. Evolución del Agente

Durante esta sesión, se observó un comportamiento avanzado del agente de IA (OpenCode):
- **Actualización autónoma de `AGENTS.md`:** El agente actualizó la documentación del proyecto por iniciativa propia, sin necesidad de solicitarlo.
- **Identificación de problemas:** El agente detectó un problema de concurrencia en SQLite (bloqueo de base de datos) y añadió `fileParallelism: false` en `vitest.config.ts` para resolverlo, documentando el "gotcha" en `AGENTS.md`.

Este comportamiento indica una madurez en el flujo de trabajo asistido por IA, donde el agente no solo genera código, sino que también preserva la coherencia de las directrices del proyecto y aplica soluciones a problemas detectados.

## 7.8. Conclusión

La implementación de los endpoints de escritura completa el ciclo de negocio principal del sistema de casting. La combinación de Clean Architecture, logs correlacionados, tests de integración y un agente de IA maduro ha permitido construir un sistema robusto y mantenible.