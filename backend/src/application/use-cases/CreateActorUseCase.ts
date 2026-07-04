// application/use-cases/actors/CreateActorUseCase.ts
/**
 * @file CreateActorUseCase.ts
 * @module application/use-cases/actors
 */

import Actor from '../../domain/entities/Actor';
import Email from '../../domain/value-objects/Email';
import FullName from '../../domain/value-objects/FullName';
import IActorRepository from '../interfaces/IActorRepository';
import { CreateActorInput } from '../dtos';

export class CreateActorUseCase {
  constructor(private readonly actorRepository: IActorRepository) {}

  async execute(input: CreateActorInput): Promise<Actor> {
    const { id, name, email } = input;

    const existingActor = await this.actorRepository.findByEmail(email);
    if (existingActor) {
      throw new Error(`Email ${email} is already registered`);
    }

    const actorEmail = Email.create(email);
    const actorName = FullName.create(name);
    const actor = Actor.create(id, actorName, actorEmail);

    await this.actorRepository.save(actor);

    return actor;
  }
}