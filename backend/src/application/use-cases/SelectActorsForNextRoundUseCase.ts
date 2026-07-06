/**
 * @file SelectActorsForNextRoundUseCase.ts
 * @module application/use-cases/rounds
 */

import Round from '../../domain/entities/Round';
import EntityId from '../../domain/value-objects/TypedId';
import IRoundRepository from '../interfaces/IRoundRepository';
import ISubmissionRepository from '../interfaces/ISubmissionRepository';
import { SelectActorsInput } from '../dtos';

export class SelectActorsForNextRoundUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly submissionRepository: ISubmissionRepository
  ) {}

  async execute(input: SelectActorsInput): Promise<Round> {
    const { roundId, selectedActorIds } = input;

    const typedRoundId = EntityId.create<'Round'>(roundId);
    const currentRound = await this.roundRepository.findById(typedRoundId);
    if (!currentRound) {
      throw new Error(`Round ${roundId} not found`);
    }

    const currentActorIds = currentRound.actorIds.map(a => a.getValue());
    for (const actorId of selectedActorIds) {
      if (!currentActorIds.includes(actorId)) {
        throw new Error(`Actor ${actorId} is not invited to round ${roundId}`);
      }
    }

    const typedActorIds = selectedActorIds.map(id => EntityId.create<'Actor'>(id));
    if (typedActorIds.length === 0) {
      throw new Error('Selected actors list cannot be empty');
    }

    const newRoundId = EntityId.create<'Round'>(crypto.randomUUID());
    const nextNumber = currentRound.number + 1;
    const newRound = Round.create(newRoundId, nextNumber, currentRound.castingId, typedActorIds);

    await this.roundRepository.save(newRound);

    return newRound;
  }
}
