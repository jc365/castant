/**
 * @file IRoundRepository.ts
 * @module application/interfaces
 */

import Round from '../../domain/entities/Round';
import { CastingId, RoundId } from '../../domain/value-objects/TypedId';

/**
 * Interface for the repository operations related to rounds.
 */
export default interface IRoundRepository {
  /**
   * Finds a round by its unique identifier.
   * @param id - The unique identifier of the round.
   * @returns A Promise that resolves to the found round or null if not found.
   */
  findById(id: RoundId): Promise<Round | null>;

  /**
   * Finds all rounds belonging to a specific casting.
   * @param castingId - The unique identifier of the casting.
   * @returns A Promise that resolves to an array of rounds.
   */
  findByCastingId(castingId: CastingId): Promise<Round[]>;

  /**
   * Saves a round entity into the database.
   * @param round - The round entity to be saved.
   * @returns A Promise that resolves when the operation is completed.
   */
  save(round: Round): Promise<void>;

  /**
   * Deletes a round by its unique identifier.
   * @param id - The unique identifier of the round.
   * @returns A Promise that resolves when the deletion is completed.
   */
  delete(id: RoundId): Promise<void>;
}
