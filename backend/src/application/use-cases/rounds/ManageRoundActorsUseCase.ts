/**
 * @file ManageRoundActorsUseCase.ts
 * @module application/use-cases/rounds
 */

import Actor from '../../../domain/entities/Actor';
import Round, { type RoundActorEntry } from '../../../domain/entities/Round';
import Email from '../../../domain/value-objects/Email';
import FullName from '../../../domain/value-objects/FullName';
import EntityId from '../../../domain/value-objects/TypedId';
import IActorRepository from '../../interfaces/IActorRepository';
import IRoundRepository from '../../interfaces/IRoundRepository';
import { ManageRoundActorsInput } from '../../dtos';
import logger from '../../../infrastructure/logging/requestContext';

export class ManageRoundActorsUseCase {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly roundRepository: IRoundRepository
  ) {}

  async execute(input: ManageRoundActorsInput): Promise<Round> {
    const { roundId, actors: actorInputs, preselectors: preselectorInputs, createNewRound = false } = input;

    logger.info({ roundId, actorCount: actorInputs.length, preselectorCount: preselectorInputs.length }, 'ManageRoundActorsUseCase: starting');

    const typedRoundId = EntityId.create<'Round'>(roundId);
    const currentRound = await this.roundRepository.findById(typedRoundId);
    if (!currentRound) {
      logger.error({ roundId }, 'ManageRoundActorsUseCase: round not found');
      throw new Error(`Round ${roundId} not found`);
    }

    if (createNewRound) {
      if (preselectorInputs.length > 0) {
        logger.error({ roundId }, 'ManageRoundActorsUseCase: preselectors not allowed with createNewRound');
        throw new Error('Preselectors are not allowed when creating a new round');
      }

      if (actorInputs.length === 0) {
        logger.error({ roundId }, 'ManageRoundActorsUseCase: empty actors list for new round');
        throw new Error('Actors list cannot be empty when creating a new round');
      }
    }

    const actorEntries: RoundActorEntry[] = [];

    for (const input of actorInputs) {
      const email = Email.create(input.email);
      let actor = await this.actorRepository.findByEmail(email.getValue());

      if (!actor) {
        const actorId = EntityId.create<'Actor'>(crypto.randomUUID());
        const name = FullName.create(input.name || input.email.split('@')[0]);
        actor = Actor.create(actorId, name, email);
        await this.actorRepository.save(actor);
        logger.info({ actorId: actorId.getValue(), email: input.email }, 'ManageRoundActorsUseCase: created new actor');
      }

      actorEntries.push({ id: actor.id, role: 'actor' });
    }

    for (const input of preselectorInputs) {
      const email = Email.create(input.email);
      let actor = await this.actorRepository.findByEmail(email.getValue());

      if (!actor) {
        const actorId = EntityId.create<'Actor'>(crypto.randomUUID());
        const name = FullName.create(input.name || input.email.split('@')[0]);
        actor = Actor.create(actorId, name, email);
        await this.actorRepository.save(actor);
        logger.info({ actorId: actorId.getValue(), email: input.email }, 'ManageRoundActorsUseCase: created new preselector');
      }

      actorEntries.push({ id: actor.id, role: 'preselector' });
    }

    if (createNewRound) {
      const newRoundId = EntityId.create<'Round'>(crypto.randomUUID());
      const newNumber = currentRound.number + 1;
      const newRound = Round.create(newRoundId, newNumber, currentRound.castingId, actorEntries);
      await this.roundRepository.save(newRound);
      logger.info({ newRoundId: newRoundId.getValue() }, 'ManageRoundActorsUseCase: created new round');
      return newRound;
    }

    const updatedActors = [...currentRound.actors, ...actorEntries];
    const updatedRound = Round.create(
      currentRound.id,
      currentRound.number,
      currentRound.castingId,
      updatedActors
    );
    await this.roundRepository.save(updatedRound);
    logger.info({ roundId }, 'ManageRoundActorsUseCase: completed');
    return updatedRound;
  }
}
