# Plan de Value Objects pendientes

> Value Objects del dominio identificados pero aún no implementados.

## Estado actual

| Value Object | Estado |
|-------------|--------|
| Email | ✅ Implementado |
| FullName | ✅ Implementado |
| VideoUrl | ✅ Implementado |
| Score | 🔴 Pendiente |
| Feedback | 🟡 Pendiente |
| CastingTitle | 🟡 Pendiente |
| Description | 🟡 Pendiente |
| TypedId | 🟢 Pendiente |

---

## 1. Score

**Entidad objetivo:** `Submission`

**Responsabilidad:** Encapsular la puntuación (0-10) de una submission.

**API propuesta:**
```typescript
static create(value: number): Score
static none(): Score                  // para cuando aún no se ha evaluado
getValue(): number | null
isPresent(): boolean
isHigherThan(other: Score): boolean
isPassing(threshold?: number): boolean
toGrade(): string                     // ej. 0-5 → "F", 6-7 → "C", 8-9 → "B", 10 → "A"
equals(other: Score): boolean
```

**Impacto:**
- `Submission._score: number | null` → `Score`
- Método `review()` recibe `Score` en vez de `number`
- Validación de rango se mueve de `Submission.review()` a `Score.create()`

---

## 2. Feedback

**Entidad objetivo:** `Submission`

**Responsabilidad:** Texto de retroalimentación con límites y sanitización.

**API propuesta:**
```typescript
static create(value: string): Feedback
static none(): Feedback               // para cuando no hay feedback
getValue(): string | null
isPresent(): boolean
wordCount(): number
truncate(maxLength: number): Feedback
equals(other: Feedback): boolean
```

**Validaciones:**
- Longitud máxima (ej. 500 caracteres)
- Sin HTML/etiquetas peligrosas (XSS)
- Normalización de espacios

**Impacto:**
- `Submission._feedback: string | null` → `Feedback`
- Método `review()` recibe `Feedback` en vez de `string`

---

## 3. CastingTitle

**Entidad objetivo:** `Casting`

**Responsabilidad:** Título del casting con formato y restricciones.

**API propuesta:**
```typescript
static create(value: string): CastingTitle
getValue(): string
equals(other: CastingTitle): boolean
```

**Validaciones:**
- No vacío (hoy está en `Casting` constructor)
- Longitud máxima (ej. 200 caracteres)
- Caracteres permitidos (alfanumérico, espacios, signos básicos)

**Impacto:**
- `Casting._title: string` → `CastingTitle`
- Validación se mueve de `Casting` a `CastingTitle`

---

## 4. Description

**Entidad objetivo:** `Casting`

**Responsabilidad:** Descripción del casting con límites de texto.

**API propuesta:**
```typescript
static create(value: string): Description
static empty(): Description
getValue(): string
isEmpty(): boolean
equals(other: Description): boolean
```

**Validaciones:**
- Longitud máxima (ej. 2000 caracteres)

**Impacto:**
- `Casting._description: string` → `Description`

---

## 5. TypedId

**Responsabilidad:** IDs tipados para prevenir confusiones entre tipos de entidad (pasar `ActorId` donde va `CastingId`).

**API propuesta:**
```typescript
// Id base genérica
class EntityId<T extends string> {
  static create<T>(value: string): EntityId<T>
  getValue(): string
  equals(other: EntityId<T>): boolean
}

// Ids específicos
type ActorId = EntityId<'Actor'>
type DirectorId = EntityId<'Director'>
type CastingId = EntityId<'Casting'>
type RoundId = EntityId<'Round'>
type SubmissionId = EntityId<'Submission'>
```

**Impacto:**
- Afecta a todas las entidades (`_id: string` → `ActorId`, etc.)
- Afecta referencias entre entidades (`_directorId: string` → `DirectorId`, etc.)

---

## Prioridad de implementación

1. **Score** — el más urgente, tiene lógica de negocio (nota de corte)
2. **Feedback** — necesario junto con Score para completar `review()`
3. **CastingTitle** — extraer validación ya existente en `Casting`
4. **Description** — simple, rápida implementación
5. **TypedId** — bajo impacto inmediato, alta seguridad a largo plazo
