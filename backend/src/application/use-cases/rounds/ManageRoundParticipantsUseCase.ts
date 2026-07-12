/**
 * @file ManageRoundParticipantsUseCase.ts
 * @module application/use-cases/rounds
 */

import User from '../../../domain/entities/User';
import Round, { type RoundParticipantEntry, type RoundParticipantRole } from '../../../domain/entities/Round';
import Email from '../../../domain/value-objects/Email';
import FullName from '../../../domain/value-objects/FullName';
import IUserRepository from '../../interfaces/IUserRepository';
import IRoundRepository from '../../interfaces/IRoundRepository';
import { ManageRoundParticipantsInput } from '../../dtos';
import logger from '../../../infrastructure/logging/requestContext';

export class ManageRoundParticipantsUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roundRepository: IRoundRepository
  ) { }

  async execute(input: ManageRoundParticipantsInput): Promise<Round> {
    const { roundId, actors: actorInputs, preselectors: preselectorInputs, createNewRound = false } = input;

    logger.info({ roundId, actorCount: actorInputs.length, preselectorCount: preselectorInputs.length }, 'ManageRoundParticipantsUseCase: starting');

    const currentRound = await this.roundRepository.findById(roundId);
    if (!currentRound) {
      logger.error({ roundId }, 'ManageRoundParticipantsUseCase: round not found');
      throw new Error(`Round ${roundId} not found`);
    }

    if (createNewRound) {
      if (preselectorInputs.length > 0) {
        logger.error({ roundId }, 'ManageRoundParticipantsUseCase: preselectors not allowed with createNewRound');
        throw new Error('Preselectors are not allowed when creating a new round');
      }

      if (actorInputs.length === 0) {
        logger.error({ roundId }, 'ManageRoundParticipantsUseCase: empty actors list for new round');
        throw new Error('Actors list cannot be empty when creating a new round');
      }
    }

    const actorIds = await this.detectAndAddUsers(actorInputs);
    const preselectorIds = await this.detectAndAddUsers(preselectorInputs);

    const actorEntries = this.buildParticipantEntries(currentRound.participants, actorIds, 'actor');
    const preselectorEntries = this.buildParticipantEntries(currentRound.participants, preselectorIds, 'preselector');

    const updatedParticipants = [
      ...actorEntries,
      ...preselectorEntries
    ];

    if (createNewRound) {
      const newNumber = currentRound.number + 1;
      const newRound = Round.create(
        newNumber,
        currentRound.castingId,
        updatedParticipants
      );
      await this.roundRepository.save(newRound);
      logger.info({ newRoundId: newRound.id }, 'ManageRoundParticipantsUseCase: created new round');
      return newRound;
    }

    const updatedRound = Round.create(
      currentRound.number,
      currentRound.castingId,
      updatedParticipants,
      currentRound.id
    );
    await this.roundRepository.save(updatedRound);
    logger.info({ roundId }, 'ManageRoundParticipantsUseCase: completed');
    return updatedRound;
  }

  private async detectAndAddUsers(inputs: { email: string; name?: string }[]): Promise<Set<string>> {
    const ids = new Set<string>();

    for (const input of inputs) {
      const email = Email.create(input.email);
      let user = await this.userRepository.findByEmail(email.getValue());

      if (!user) {
        const name = FullName.create(input.name || input.email.split('@')[0]);
        user = User.create(name, email);
        await this.userRepository.save(user);
        logger.info({ userId: user.id, email: input.email }, 'ManageRoundParticipantsUseCase: created new participant');
      }

      ids.add(user.id);
    }

    return ids;
  }

  private buildParticipantEntries(
    currentParticipants: RoundParticipantEntry[],
    newIds: Set<string>,
    role: RoundParticipantRole
  ): RoundParticipantEntry[] {

    const combinedIds = new Set(
      [
        ...currentParticipants.filter(p => p.role === role).map(p => p.id),
        ...newIds,
      ]
    );

    return Array.from(combinedIds).map(id => ({
      id,
      role,
    }));
  }
}
