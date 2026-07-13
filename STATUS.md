# STATUS.md — Castant

> **Propósito:** Este documento resume el estado actual del proyecto, el modelo de datos, los endpoints y los próximos pasos. Sirve como punto de partida para nuevas sesiones y como referencia rápida para el desarrollador y el agente.

---

## 1. Estado General

| Aspecto | Estado |
|---------|--------|
| **Capa de Dominio** | ✅ Completada |
| **Capa de Aplicación** | ✅ 6 casos de uso implementados |
| **API (Escritura)** | ✅ 5 endpoints de escritura |
| **API (Lectura)** | ✅ 4 endpoints de consulta |
| **Tests** | ✅ 198 tests pasando |
| **Cobertura** | ✅ ≈99% |
| **Base de Datos** | ✅ Prisma con SQLite (`dev.db` / `test.db`) |
| **Logging** | ✅ `pino` + `pino-http` + `requestId` |
| **Bitácora** | ✅ Sistema de auditoría con `BitacoraService` |
| **Documentación** | ✅ `AGENTS.md` actualizado |

---

## 2. Modelo de Datos (Resumen)

### 2.1. Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `User` | Usuarios del sistema (actores, preselectores, directores). |
| `Casting` | Castings (eventos de selección). |
| `Round` | Rondas de un casting. |
| `Submission` | Envíos de videos de actores. |
| `Participant` | Relación de usuarios con castings o rondas, con un `role`. |
| `Bitacora` | Registro de eventos de auditoría (acciones de negocio). |

### 2.2. Roles en `Participant`

| Nivel | Tabla | Campo `role` |
|-------|-------|--------------|
| Casting | `Participant` (con `castingId`) | `'director'`, `'reviewer'` |
| Ronda | `Participant` (con `roundId`) | `'actor'`, `'preselector'` |

### 2.3. Campos de Auditoría

Todas las tablas tienen `createdAt` y `updatedAt`.

---

## 3. Casos de Uso

| Caso de Uso | Propósito |
|-------------|-----------|
| `CreateUserUseCase` | Crear un usuario (ID opcional, auto-generado). |
| `GetAllUsersUseCase` | Listar todos los usuarios. |
| `CreateCastingUseCase` | Crear un casting y su ronda inicial (Ronda 1). |
| `ManageRoundParticipantsUseCase` | Gestionar participantes en una ronda (añadir actores/preselectores, crear nueva ronda). |
| `SubmitVideoUseCase` | Enviar un video a una ronda (actor invitado). |
| `ReviewSubmissionUseCase` | Revisar un video (score + feedback). |

Todos los casos de uso registran eventos en la Bitácora via `BitacoraService`.

---

## 4. API (Rutas Existentes)

### 4.1. Rutas de Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/users` | Crear usuario (`id` opcional). |
| `GET` | `/api/v1/users/:id` | Obtener usuario. |
| `DELETE` | `/api/v1/users/:id` | Eliminar usuario. |

### 4.2. Rutas de Castings

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/castings` | Crear casting (con ronda inicial). |
| `GET` | `/api/v1/castings` | Listar castings (con participantes). |
| `GET` | `/api/v1/castings/:id` | Obtener casting (con rondas y participantes). |

### 4.3. Rutas de Rondas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/rounds/participants` | Gestionar participantes (añadir, crear nueva ronda). |
| `GET` | `/api/v1/rounds/:id` | Obtener ronda (con participantes). |
| `GET` | `/api/v1/rounds/:id/submissions` | Listar submissions de una ronda. |

### 4.4. Rutas de Submissions

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/submissions` | Enviar video. |
| `PATCH` | `/api/v1/submissions/:id/review` | Revisar video (score + feedback). |

---

## 5. Flujo de Trabajo (Completo)

1. **Crear usuarios** (`POST /api/v1/users`).
2. **Crear casting** (`POST /api/v1/castings`) → Ronda 1 creada automáticamente.
3. **Añadir participantes a la Ronda 1** (`POST /api/v1/rounds/participants` con `createNewRound: false`).
4. **Enviar videos** (`POST /api/v1/submissions`).
5. **Revisar videos** (`PATCH /api/v1/submissions/:id/review`).
6. **Crear nueva ronda con actores seleccionados** (`POST /api/v1/rounds/participants` con `createNewRound: true` y solo `actors`).
7. **Repetir pasos 4-6** para cada ronda.

---

## 6. Próximos Pasos (Opcionales)

| Tarea | Prioridad |
|-------|-----------|
| **Paginación en `GET /castings`** | Media |
| **Filtros en `GET /castings`** | Media |
| **Modo demo** (sin autenticación) | Baja |
| **Mejora de logs** (más detalles en errores) | Baja |

---

## 7. Reglas de Actuación (Obligatorias)

> Estas reglas se aplican en TODAS las interacciones con el agente.

1. **NO modifiques las importaciones** de ningún archivo. No añadas extensiones `.js`.
2. **SIEMPRE que modifiques `AGENTS.md`**, crea una copia de seguridad con el formato `AGENTS_<timestamp>.md`.
3. **Los IDs son strings planos** con prefijos (ej. `user-...`). No uses `TypedId`.
4. **El director es un `Participant`** con `role: 'director'`.

---

## 8. Comandos Útiles

```bash
# Typecheck
cd backend && npx tsc --noEmit

# Tests unitarios
npm test

# Tests de integración
npm run test:integration

# Cobertura
npm run test:coverage

# Servidor dev
cd backend && npm run dev

# Regenerar cliente Prisma
cd backend && npx prisma generate

# Sincronizar BD
cd backend && npx prisma db push
```


## 9. Referencias

    AGENTS.md — Guía completa del proyecto.

    pr1.http — Pruebas manuales con Rest Client.

    docu/PLAN.md — Plan inicial de Value Objects.

    docu/DIRECTRICES.md — Directrices de Clean Architecture.