/**
 * @file SubmitVideoUseCase.ts
 * @module application/use-cases/submissions
 */

import Submission from '../../domain/entities/Submission';
import VideoUrl from '../../domain/value-objects/VideoUrl';
import EntityId from '../../domain/value-objects/TypedId';
import IUserRepository from '../interfaces/IUserRepository';
import IRoundRepository from '../interfaces/IRoundRepository';
import ISubmissionRepository from '../interfaces/ISubmissionRepository';
import { SubmitVideoInput } from '../dtos';
import logger from '../../infrastructure/logging/requestContext';

export class SubmitVideoUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roundRepository: IRoundRepository,
    private readonly submissionRepository: ISubmissionRepository
  ) {}

  async execute(input: SubmitVideoInput): Promise<Submission> {
    const { actorId, roundId, videoUrl } = input;

    logger.info({ actorId, roundId }, 'SubmitVideoUseCase: starting');

    const typedUserId = EntityId.create<'User'>(actorId);
    const existingUser = await this.userRepository.findById(typedUserId);
    if (!existingUser) {
      logger.error({ actorId }, 'SubmitVideoUseCase: user not found');
      throw new Error(`User ${actorId} not found`);
    }

    const typedRoundId = EntityId.create<'Round'>(roundId);
    const existingRound = await this.roundRepository.findById(typedRoundId);
    if (!existingRound) {
      logger.error({ roundId }, 'SubmitVideoUseCase: round not found');
      throw new Error(`Round ${roundId} not found`);
    }

    const isInvited = existingRound.actorIds.some(id => id.equals(typedUserId));
    if (!isInvited) {
      logger.error({ actorId, roundId }, 'SubmitVideoUseCase: user not invited');
      throw new Error(`User ${actorId} is not invited to round ${roundId}`);
    }

    const videoUrlVO = VideoUrl.create(videoUrl);
    const submissionId = EntityId.create<'Submission'>(crypto.randomUUID());

    const submission = Submission.create(submissionId, typedUserId, typedRoundId, videoUrlVO);

    await this.submissionRepository.save(submission);

    logger.info({ submissionId: submissionId.getValue() }, 'SubmitVideoUseCase: completed');
    return submission;
  }
}
