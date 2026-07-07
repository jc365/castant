// application/use-cases/actors/CreateActorUseCase.ts
/**
 * @file CreateActorUseCase.ts
 * @module application/use-cases/actors
 */

import Actor from '../../domain/entities/Actor';
import Email from '../../domain/value-objects/Email';
import FullName from '../../domain/value-objects/FullName';
import EntityId from '../../domain/value-objects/TypedId';
import IActorRepository from '../interfaces/IActorRepository';
import { CreateActorInput } from '../dtos';
import logger from '../../infrastructure/logging/logger';

export class CreateActorUseCase {
  constructor(private readonly actorRepository: IActorRepository) {}

  async execute(input: CreateActorInput): Promise<Actor> {
    const { id, name, email } = input;

    logger.info({ id, name, email }, 'CreateActorUseCase: starting');

    const existingActor = await this.actorRepository.findByEmail(email);
    if (existingActor) {
      logger.error({ email }, 'CreateActorUseCase: email already registered');
      throw new Error(`Email ${email} is already registered`);
    }

    const actorId = EntityId.create<'Actor'>(id);
    const actorEmail = Email.create(email);
    const actorName = FullName.create(name);
    const actor = Actor.create(actorId, actorName, actorEmail);

    await this.actorRepository.save(actor);

    logger.info({ id }, 'CreateActorUseCase: completed');
    return actor;
  }
}