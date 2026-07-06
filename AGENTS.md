# AGENTS.md — Castant

## Stack

- TypeScript 6.0 (`strict: true`, ES2020, `moduleResolution: node16`)
- Jest 30 con `ts-jest` (ESM preset) — configurado en raíz
- Sin Prisma, Express, Zod instalados (descritos en `docu/` pero no en `package.json`)

## Estructura del proyecto

```
castant/
├── backend/src/          ← código fuente (tsconfig propio)
│   ├── domain/
│   │   ├── entities/     ← Actor, Director, Casting, Round, Submission
│   │   └── value-objects/← Email, FullName, VideoUrl, CastingTitle, Score, Feedback, Description, TypedId
│   └── application/      ← CreateActorUseCase, IActorRepository, dtos
├── tests/                ← tests unitarios (tsconfig.tests.json, raíz)
│   └── unit/domain/value-objects/
├── docu/                 ← documentación aspiracional (no es fuente de verdad)
```

El código existente es solo **dominio** + 1 caso de uso. `docu/ESTRUCTURA.md` describe arquitectura ideal que aún no existe.

## Comandos

```bash
# Typecheck (sin output = ok)
cd backend && npx tsc --noEmit

# Tests (desde la raíz)
npm test

# Tests con cobertura
npm test -- --coverage

# Ejecutar un archivo
npx ts-node src/<ruta>
```

**Ordén correcto:** `typecheck → test`

## TypedId — Gotcha importante

`EntityId<T>` es genérica. Los type aliases (`ActorId = EntityId<'Actor'>`) NO se usan como parámetro genérico:

```typescript
// ❌ INCORRECTO — crea EntityId<EntityId<'Actor'>>
const id = EntityId.create<ActorId>('123');

// ✅ CORRECTO — usa string literal type
const id = EntityId.create<'Actor'>('123');
```

## Patrones de código

**Value Objects:**
- Constructor privado + `static create()` factory + `static isValid()` (sin throw)
- `getValue()` para acceder al valor (no getter)
- Inmutables: métodos que modifican retornan nueva instancia

**Entidades:**
- Constructor privado + `static create()` factory
- Getters con sintaxis `get` (`get id(): ActorId`)
- Reciben Value Objects ya construidos; no los crean internamente
- Métodos que mutan estado retornan nueva instancia

**Convenciones:**
- 2 espacios, punto y coma, comillas simples, máx 100 chars
- `export default` para clases, `export` para interfaces/tipos
- Cabecera JSDoc obligatoria (`@file`, `@module`) en cada archivo

## Testing

- Ubicación: `tests/unit/domain/value-objects/<Nombre>.test.ts`
- Imports: `import X from '../../../../backend/src/domain/value-objects/X'`
- Patrón en Skill: `.opencode/skills/testing-pattern/SKILL.md`

**Tests obligatorios para VOs:**
- `create()`: caso feliz + casos de error (vacío, rango, formato)
- `equals()`: iguales → `true`, diferentes → `false`
- Métodos de negocio: comportamiento esperado + casos límite

## Estado actual

- Rama: `feature/nuevos-value-obj`
- Value Objects: Email, FullName, VideoUrl, CastingTitle, Score, Feedback, Description, TypedId
- Repositorios: Pendiente (solo interfaz IActorRepository)
- Casos de uso: Solo CreateActorUseCase
