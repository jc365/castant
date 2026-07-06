/**
 * @file ICastingRepository.ts
 * @module application/interfaces
 */

import Casting from '../../domain/entities/Casting';
import { CastingId, DirectorId } from '../../domain/value-objects/TypedId';

/**
 * Interface for the repository operations related to castings.
 */
export default interface ICastingRepository {
  /**
   * Finds a casting by its unique identifier.
   * @param id - The unique identifier of the casting.
   * @returns A Promise that resolves to the found casting or null if not found.
   */
  findById(id: CastingId): Promise<Casting | null>;

  /**
   * Finds all castings created by a specific director.
   * @param directorId - The unique identifier of the director.
   * @returns A Promise that resolves to an array of castings.
   */
  findByDirectorId(directorId: DirectorId): Promise<Casting[]>;

  /**
   * Saves a casting entity into the database.
   * @param casting - The casting entity to be saved.
   * @returns A Promise that resolves when the operation is completed.
   */
  save(casting: Casting): Promise<void>;

  /**
   * Deletes a casting by its unique identifier.
   * @param id - The unique identifier of the casting.
   * @returns A Promise that resolves when the deletion is completed.
   */
  delete(id: CastingId): Promise<void>;
}
