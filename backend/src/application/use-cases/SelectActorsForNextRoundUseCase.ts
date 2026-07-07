/**
 * @file SelectActorsForNextRoundUseCase.ts
 * @module application/use-cases/rounds
 */

import Round from '../../domain/entities/Round';
import EntityId from '../../domain/value-objects/TypedId';
import IRoundRepository from '../interfaces/IRoundRepository';
import ISubmissionRepository from '../interfaces/ISubmissionRepository';
import { SelectActorsInput } from '../dtos';
import logger from '../../infrastructure/logging/logger';

export class SelectActorsForNextRoundUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly submissionRepository: ISubmissionRepository
  ) {}

  async execute(input: SelectActorsInput): Promise<Round> {
    const { roundId, selectedActorIds } = input;

    logger.info({ roundId, selectedActorIds }, 'SelectActorsForNextRoundUseCase: starting');

    const typedRoundId = EntityId.create<'Round'>(roundId);
    const currentRound = await this.roundRepository.findById(typedRoundId);
    if (!currentRound) {
      logger.error({ roundId }, 'SelectActorsForNextRoundUseCase: round not found');
      throw new Error(`Round ${roundId} not found`);
    }

    const currentActorIds = currentRound.actorIds.map(a => a.getValue());
    for (const actorId of selectedActorIds) {
      if (!currentActorIds.includes(actorId)) {
        logger.error({ actorId, roundId }, 'SelectActorsForNextRoundUseCase: actor not invited');
        throw new Error(`Actor ${actorId} is not invited to round ${roundId}`);
      }
    }

    const typedActorIds = selectedActorIds.map(id => EntityId.create<'Actor'>(id));
    if (typedActorIds.length === 0) {
      logger.error({}, 'SelectActorsForNextRoundUseCase: empty selection');
      throw new Error('Selected actors list cannot be empty');
    }

    const newRoundId = EntityId.create<'Round'>(crypto.randomUUID());
    const nextNumber = currentRound.number + 1;
    const newRound = Round.create(newRoundId, nextNumber, currentRound.castingId, typedActorIds);

    await this.roundRepository.save(newRound);

    logger.info({ newRoundId: newRoundId.getValue() }, 'SelectActorsForNextRoundUseCase: completed');
    return newRound;
  }
}
