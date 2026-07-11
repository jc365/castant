/**
 * @file ManageRoundParticipantsUseCase.ts
 * @module application/use-cases/rounds
 */

import User from '../../../domain/entities/User';
import Round, { type RoundParticipantEntry, type RoundParticipantRole } from '../../../domain/entities/Round';
import Email from '../../../domain/value-objects/Email';
import FullName from '../../../domain/value-objects/FullName';
import EntityId from '../../../domain/value-objects/TypedId';
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

    const typedRoundId = EntityId.create<'Round'>(roundId);
    const currentRound = await this.roundRepository.findById(typedRoundId);
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
      const newRoundId = EntityId.create<'Round'>(crypto.randomUUID());
      const newNumber = currentRound.number + 1;
      const newRound = Round.create(
        newRoundId,
        newNumber,
        currentRound.castingId,
        updatedParticipants
      );
      await this.roundRepository.save(newRound);
      logger.info({ newRoundId: newRoundId.getValue() }, 'ManageRoundParticipantsUseCase: created new round');
      return newRound;
    }

    const updatedRound = Round.create(
      currentRound.id,
      currentRound.number,
      currentRound.castingId,
      updatedParticipants
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
        const userId = EntityId.create<'User'>(crypto.randomUUID());
        const name = FullName.create(input.name || input.email.split('@')[0]);
        user = User.create(userId, name, email);
        await this.userRepository.save(user);
        logger.info({ userId: userId.getValue(), email: input.email }, 'ManageRoundParticipantsUseCase: created new participant');
      }

      ids.add(user.id.getValue());
    }

    return ids;
  }

  private buildParticipantEntries(
    currentParticipants: RoundParticipantEntry[],
    newIds: Set<string>,
    role: RoundParticipantRole
  ): RoundParticipantEntry[] {

    const combinedIds = new Set([
      ...currentParticipants.filter(p => p.role === role).map(p => p.id.getValue()),
      ...newIds,
    ]);

    return Array.from(combinedIds).map(id => ({
      id: EntityId.create<'User'>(id),
      role,
    }));
  }
}
