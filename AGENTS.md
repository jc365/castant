# AGENTS.md — Castant

## Stack

- TypeScript 6.0 (`strict: true`, ES2020, `moduleResolution: node16`)
- ts-node para ejecución
- No hay test runner configurado aún (`npm test` es placeholder). Tests/ dirs vacíos.
- Sin Prisma, Express, Zod instalados todavía (descritos en docu/ pero no en package.json)

## Arquitectura real vs. docu/

El código existente es solo **dominio** + 1 caso de uso. Muchos archivos descritos en `docu/ESTRUCTURA.md` no existen:
- `infrastructure/` y `interfaces/` están vacíos
- Solo existe `CreateActorUseCase` en `application/`
- DTOs solo tienen `CreateActorInput`
- Value objects existentes: Email, FullName, VideoUrl, CastingTitle
- Feedback, TypedId están pendientes (`docu/PLAN.md`)

Las guías en `docu/` son aspiracionales. Preferir el código fuente como verdad.

## Convenciones de código

- Indentación 2 espacios, punto y coma obligatorio, comillas simples, máx 100 chars
- `export default` para clases principales, `export` para interfaces/tipos
- Cabecera JSDoc obligatoria en cada archivo (`@file`, `@module`)
- Comentarios JSDoc para métodos públicos

## Value Object pattern (seguir exactamente)

```typescript
export default class MiVo {
  private readonly _value: string;
  static create(value: string): MiVo { /* validación + throw */ return new MiVo(value); }
  private constructor(value: string) { this._value = value; }
  getValue(): string { return this._value; }
  equals(other: MiVo): boolean { return this._value === other._value; }
  static isValid(value: string): boolean { /* validación sin throw */ }
}
```

## Entity pattern (seguir exactamente)

- Getters con sintaxis `get` (`get id(): string`)
- Constructor privado + `static create()` factory
- Métodos que mutan estado retornan nueva instancia (inmutable)
- Entidades reciben Value Objects ya construidos; no los crean internamente

## Convención de getters: entidades vs VOs

- Entidades: `get campo(): Tipo` (sintaxis `get`)
- Value Objects: `getValue(): string` (método, no getter)

## Testing (Obligatorio)

- **Regla de oro:** Todo Value Object o caso de uso generado DEBE incluir sus tests unitarios, siguiendo el patrón definido en la Skill `testing-pattern`.

## Tests Obligatorios para Value Objects:

- **`create()`:**
  - Caso feliz: Creación con valor válido.
  - Casos borde: Lanzar error para cada validación (ej. valor vacío, fuera de rango, formato incorrecto).
- **`equals()`:**
  - Comparar dos instancias iguales → `true`.
  - Comparar dos instancias diferentes → `false`.
- **Métodos de negocio (si existen):**
  - Probar comportamiento esperado y casos límite (`isPassing`, `toGrade`, `truncate`, etc.).

## Tests Obligatorios para Casos de Uso:

- Caso feliz: Flujo principal exitoso.
- Casos de error: Validaciones de negocio (ej. email duplicado, entidad no encontrada).
- Mockear repositorios: Usar mocks para las dependencias.

## Ubicación de los Tests:

- Value Objects: tests/unit/domain/value-objects/<Nombre>.test.ts
- Entidades: tests/unit/domain/entities/<Nombre>.test.ts
- Casos de uso: tests/unit/application/use-cases/<Nombre>.test.ts

## Nota sobre el Runner:

- npm test es placeholder. Cuando se escriban tests, se usará Jest (por configurar).
- Mientras tanto, los tests se escribirán, aunque no se puedan ejecutar.

## Estado actual del proyecto

- Rama activa: `feature/nuevos-value-obj`
- package-lock.json en .gitignore (no commitear)
- Pendiente: Feedback, TypedId (ver `docu/PLAN.md` para APIs propuestas)
- Repositorios, controladores, infraestructura completa por implementar

## Comandos

- `npx tsc --noEmit` — typecheck (sin output = ok)
- `npx ts-node src/<ruta>` — ejecutar archivo
- `npm test` — placeholder, falla
