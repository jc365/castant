/**
 * @file SelectActorsForNextRoundUseCase.ts
 * @module application/use-cases/rounds
 */

import Round, { type RoundParticipantEntry } from '../../domain/entities/Round';
import IRoundRepository from '../interfaces/IRoundRepository';
import ISubmissionRepository from '../interfaces/ISubmissionRepository';
import { SelectActorsInput } from '../dtos';
import logger from '../../infrastructure/logging/requestContext';

export class SelectActorsForNextRoundUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly submissionRepository: ISubmissionRepository
  ) {}

  async execute(input: SelectActorsInput): Promise<Round> {
    const { roundId, selectedActorIds } = input;

    logger.info({ roundId, selectedActorIds }, 'SelectActorsForNextRoundUseCase: starting');

    const currentRound = await this.roundRepository.findById(roundId);
    if (!currentRound) {
      logger.error({ roundId }, 'SelectActorsForNextRoundUseCase: round not found');
      throw new Error(`Round ${roundId} not found`);
    }

    const currentActorIds = currentRound.participants.map(p => p.id);
    for (const actorId of selectedActorIds) {
      if (!currentActorIds.includes(actorId)) {
        logger.error({ actorId, roundId }, 'SelectActorsForNextRoundUseCase: actor not invited');
        throw new Error(`User ${actorId} is not invited to round ${roundId}`);
      }
    }

    if (selectedActorIds.length === 0) {
      logger.error({}, 'SelectActorsForNextRoundUseCase: empty selection');
      throw new Error('Selected actors list cannot be empty');
    }

    const participants: RoundParticipantEntry[] = selectedActorIds.map(id => ({
      id,
      role: 'actor' as const,
    }));

    const nextNumber = currentRound.number + 1;
    const newRound = Round.create(nextNumber, currentRound.castingId, participants);

    await this.roundRepository.save(newRound);

    logger.info({ newRoundId: newRound.id }, 'SelectActorsForNextRoundUseCase: completed');
    return newRound;
  }
}
