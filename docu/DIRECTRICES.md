# DIRECTRICES DEL PROYECTO: SISTEMA DE CASTING

## 1. Arquitectura
- **Clean Architecture** estricta con 4 capas:
  - **Entities** (`/packages/backend/src/entities`): Objetos de negocio puros (Actor, Director, Casting, Submission, Round).
  - **Use Cases** (`/packages/backend/src/use-cases`): Lógica de negocio. Cada caso de uso es una clase con un método `execute()`.
  - **Repositories** (`/packages/backend/src/repositories`): Interfaces que definen cómo se accede a los datos. **No implementaciones.**
  - **Adapters** (`/packages/backend/src/adapters`): Implementaciones concretas (Express controllers, Prisma repositories, etc.).

## 2. Tecnologías
- **Lenguaje:** TypeScript (estricto, `strict: true`).
- **Backend:** Node.js + Express.
- **ORM:** Prisma (con PostgreSQL en Neon.tech).
- **Validación:** Zod (para DTOs y validación de entrada).
- **Tests:** Jest (unit tests) + Supertest (integration tests).

## 3. Convenciones de Código
- **Nomenclatura:**
  - Entidades: `Actor`, `Director`, `Casting`, `Submission`, `Round`.
  - Casos de uso: `SubmitVideoUseCase`, `SelectActorsForNextRoundUseCase`, `CreateCastingUseCase`.
  - Repositorios: `IActorRepository`, `ICastingRepository`.
  - Adaptadores (Controllers): `CastingController`, `AuthController`.
  - DTOs: `CreateCastingDTO`, `SubmitVideoDTO`.
- **Estructura de archivos:** Cada entidad, caso de uso, repositorio y adaptador en su propio archivo.
- **Exportaciones:** Usar `export default` para clases principales y `export` para interfaces/tipos.
- **Cabecera de archivo:** Todo archivo nuevo debe incluir un bloque JSDoc con `@file` y `@module`:
  ```typescript
  /**
   * @file NombreDelArchivo.ts
   * @module ruta/del/modulo
   */
  ```

## 4. Reglas de Negocio (Core)
- Un **Casting** tiene múltiples **Rounds** (rondas).
- Cada **Round** tiene múltiples **Submissions** (entregas de actores).
- Un **Actor** puede participar en un Round si está invitado.
- Un **Director** puede seleccionar actores de un Round para pasar al siguiente.
- Los **Submissions** contienen un `videoUrl` y un `status` (pending, reviewed, selected, rejected).
- Al seleccionar actores, se crea automáticamente el siguiente Round.

## 5. Estilo y Formato
- **Indentación:** 2 espacios.
- **Punto y coma:** Obligatorio.
- **Comillas:** Simples (`'`) para strings.
- **Líneas:** Máximo 100 caracteres.
- **Comentarios:** JSDoc para funciones públicas.