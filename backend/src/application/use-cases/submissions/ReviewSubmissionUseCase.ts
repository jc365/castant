/**
 * @file ReviewSubmissionUseCase.ts
 * @module application/use-cases/submissions
 */

import Submission from '../../../domain/entities/Submission';
import Score from '../../../domain/value-objects/Score';
import Feedback from '../../../domain/value-objects/Feedback';
import EntityId from '../../../domain/value-objects/TypedId';
import ISubmissionRepository from '../../interfaces/ISubmissionRepository';
import IRoundRepository from '../../interfaces/IRoundRepository';
import ICastingRepository from '../../interfaces/ICastingRepository';
import { ReviewSubmissionInput } from '../../dtos';
import logger from '../../../infrastructure/logging/requestContext';

export class ReviewSubmissionUseCase {
  constructor(
    private readonly submissionRepository: ISubmissionRepository,
    private readonly roundRepository: IRoundRepository,
    private readonly castingRepository: ICastingRepository
  ) {}

  async execute(input: ReviewSubmissionInput): Promise<Submission> {
    const { submissionId, score, feedback } = input;

    logger.info({ submissionId }, 'ReviewSubmissionUseCase: starting');

    const typedSubmissionId = EntityId.create<'Submission'>(submissionId);
    const submission = await this.submissionRepository.findById(typedSubmissionId);
    if (!submission) {
      logger.error({ submissionId }, 'ReviewSubmissionUseCase: submission not found');
      throw new Error('Submission not found');
    }

    const round = await this.roundRepository.findById(submission.roundId);
    if (!round) {
      logger.error({ submissionId }, 'ReviewSubmissionUseCase: round not found');
      throw new Error('Round not found');
    }

    const casting = await this.castingRepository.findById(round.castingId);
    if (!casting) {
      logger.error({ submissionId }, 'ReviewSubmissionUseCase: casting not found');
      throw new Error('Casting not found');
    }

    // Director validation skipped in demo mode

    if (submission.status !== 'pending') {
      logger.error({ submissionId, status: submission.status }, 'ReviewSubmissionUseCase: already reviewed');
      throw new Error('Submission already reviewed');
    }

    const scoreVO = Score.create(score);
    const feedbackVO = Feedback.create(feedback);

    const updatedSubmission = submission.review(scoreVO, feedbackVO);

    await this.submissionRepository.save(updatedSubmission);

    logger.info({ submissionId }, 'ReviewSubmissionUseCase: completed');
    return updatedSubmission;
  }
}
