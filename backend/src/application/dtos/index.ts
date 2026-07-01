// application/dtos/index.ts

/**
 * @file DTOs para la capa de aplicación
 * @module application/dtos
 */

// ============================================
// DTOs para la entidad Actor
// ============================================
export interface CreateActorInput {
  id: string;
  name: string;
  email: string;
}

// export interface CreateActorOutput {
//   actor: Actor; // Puedes importar Actor desde domain/entities
// }

// // ============================================
// // DTOs para la entidad Casting
// // ============================================
// export interface CreateCastingInput {
//   title: string;
//   description: string;
//   directorId: string;
// }

// export interface CreateCastingOutput {
//   casting: Casting;
// }

// ============================================
// Más DTOs...
// ============================================