// application/interfaces/IActorRepository.ts

/**
 * @file IActorRepository interface file for the Actor domain entities.
 * @module application/interfaces
 */

import  Actor  from '../../domain/entities/Actor';

/**
 * Interface for the repository operations related to actors.
 */
export default interface IActorRepository {
    /**
     * Finds an actor by its unique identifier.
     * @param id - The unique identifier of the actor.
     * @returns A Promise that resolves to the found actor or null if not found.
     */
    findById(id: string): Promise<Actor | null>;

    /**
     * Finds an actor by email address.
     * @param email - The email address of the actor.
     * @returns A Promise that resolves to the found actor or null if not found.
     */
    findByEmail(email: string): Promise<Actor | null>;

    /**
     * Saves an actor entity into the database.
     * @param actor - The actor entity to be saved.
     * @returns A Promise that resolves when the operation is completed.
     */
    save(actor: Actor): Promise<void>;

    /**
     * Deletes an actor by its unique identifier.
     * @param id - The unique identifier of the actor.
     * @returns A Promise that resolves when the deletion is completed.
     */
    delete(id: string): Promise<void>;
}