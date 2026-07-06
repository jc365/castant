/**
 * @file SubmitVideoUseCase.ts
 * @module application/use-cases/submissions
 */

import Submission from '../../domain/entities/Submission';
import VideoUrl from '../../domain/value-objects/VideoUrl';
import EntityId from '../../domain/value-objects/TypedId';
import IActorRepository from '../interfaces/IActorRepository';
import IRoundRepository from '../interfaces/IRoundRepository';
import ISubmissionRepository from '../interfaces/ISubmissionRepository';
import { SubmitVideoInput } from '../dtos';

export class SubmitVideoUseCase {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly roundRepository: IRoundRepository,
    private readonly submissionRepository: ISubmissionRepository
  ) {}

  async execute(input: SubmitVideoInput): Promise<Submission> {
    const { actorId, roundId, videoUrl } = input;

    const typedActorId = EntityId.create<'Actor'>(actorId);
    const existingActor = await this.actorRepository.findById(typedActorId);
    if (!existingActor) {
      throw new Error(`Actor ${actorId} not found`);
    }

    const typedRoundId = EntityId.create<'Round'>(roundId);
    const existingRound = await this.roundRepository.findById(typedRoundId);
    if (!existingRound) {
      throw new Error(`Round ${roundId} not found`);
    }

    const isInvited = existingRound.actorIds.some(id => id.equals(typedActorId));
    if (!isInvited) {
      throw new Error(`Actor ${actorId} is not invited to round ${roundId}`);
    }

    const videoUrlVO = VideoUrl.create(videoUrl);
    const submissionId = EntityId.create<'Submission'>(crypto.randomUUID());

    const submission = Submission.create(submissionId, typedActorId, typedRoundId, videoUrlVO);

    await this.submissionRepository.save(submission);

    return submission;
  }
}
