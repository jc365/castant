// application/dtos/index.ts

/**
 * @file DTOs para la capa de aplicación
 * @module application/dtos
 */

// ============================================
// DTOs para la entidad User
// ============================================
export interface CreateUserInput {
  id?: string;
  name: string;
  email: string;
}

/**
 * @deprecated Use CreateUserInput instead. Will be removed in future versions.
 */
export const CreateActorInput = CreateUserInput;
export type CreateActorInput = CreateUserInput;

// export interface CreateActorOutput {
//   actor: Actor; // Puedes importar Actor desde domain/entities
// }

// ============================================
// DTOs para la entidad Casting
// ============================================
export interface CreateCastingInput {
  title: string;
  description: string;
  directorEmail: string;
  directorName: string;
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
export interface ManageRoundParticipantsInput {
  roundId: string;
  actors: { email: string; name?: string }[];
  preselectors: { email: string; name?: string }[];
  createNewRound?: boolean;
}

// ============================================
// DTOs para Review Submission
// ============================================
export interface ReviewSubmissionInput {
  submissionId: string;
  score: number;
  feedback: string;
  directorId?: string;
}

export interface ReviewSubmissionOutput {
  id: string;
  actorId: string;
  roundId: string;
  videoUrl: string;
  status: string;
  score: number | null;
  feedback: string | null;
}

// ============================================
// Más DTOs...
// ============================================