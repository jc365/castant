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

// ============================================
// DTOs para la entidad Casting
// ============================================
export interface CreateCastingInput {
  title: string;
  description: string;
  directorId: string;
}

// ============================================
// DTOs para la entidad Submission
// ============================================
export interface SubmitVideoInput {
  actorId: string;
  roundId: string;
  videoUrl: string;
}

// ============================================
// DTOs para la entidad Round
// ============================================
export interface SelectActorsInput {
  roundId: string;
  selectedActorIds: string[];
}

// ============================================
// Más DTOs...
// ============================================