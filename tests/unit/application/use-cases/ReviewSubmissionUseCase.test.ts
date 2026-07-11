import { vi } from 'vitest';
import { ReviewSubmissionUseCase } from '../../../../backend/src/application/use-cases/submissions/ReviewSubmissionUseCase';
import ISubmissionRepository from '../../../../backend/src/application/interfaces/ISubmissionRepository';
import IRoundRepository from '../../../../backend/src/application/interfaces/IRoundRepository';
import ICastingRepository from '../../../../backend/src/application/interfaces/ICastingRepository';
import Submission from '../../../../backend/src/domain/entities/Submission';
import Round, { type RoundParticipantEntry } from '../../../../backend/src/domain/entities/Round';
import Casting from '../../../../backend/src/domain/entities/Casting';
import EntityId from '../../../../backend/src/domain/value-objects/TypedId';
import VideoUrl from '../../../../backend/src/domain/value-objects/VideoUrl';
import CastingTitle from '../../../../backend/src/domain/value-objects/CastingTitle';
import Description from '../../../../backend/src/domain/value-objects/Description';
import Score from '../../../../backend/src/domain/value-objects/Score';
import Feedback from '../../../../backend/src/domain/value-objects/Feedback';

describe('ReviewSubmissionUseCase', () => {
  let useCase: ReviewSubmissionUseCase;
  let submissionRepo: jest.Mocked<ISubmissionRepository>;
  let roundRepo: jest.Mocked<IRoundRepository>;
  let castingRepo: jest.Mocked<ICastingRepository>;

  const userId = EntityId.create<'User'>('user-1');
  const roundId = EntityId.create<'Round'>('round-1');
  const castingId = EntityId.create<'Casting'>('casting-1');
  const directorId = EntityId.create<'Director'>('director-1');
  const submissionId = EntityId.create<'Submission'>('submission-1');

  const participants: RoundParticipantEntry[] = [{ id: userId, role: 'actor' }];
  const round = Round.create(roundId, 1, castingId, participants);
  const casting = Casting.create(castingId, CastingTitle.create('Test Casting'), Description.create('A test'), directorId);
  const submission = Submission.create(submissionId, userId, roundId, VideoUrl.create('https://youtube.com/watch?v=abc123'));

  beforeEach(() => {
    submissionRepo = {
      findById: vi.fn(),
      findByRoundId: vi.fn(),
      findByActorId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    roundRepo = {
      findById: vi.fn(),
      findByCastingId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    castingRepo = {
      findById: vi.fn(),
      findByDirectorId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new ReviewSubmissionUseCase(submissionRepo, roundRepo, castingRepo);
  });

  it('should review a pending submission successfully', async () => {
    submissionRepo.findById.mockResolvedValue(submission);
    roundRepo.findById.mockResolvedValue(round);
    castingRepo.findById.mockResolvedValue(casting);
    submissionRepo.save.mockResolvedValue();

    const result = await useCase.execute({
      submissionId: 'submission-1',
      score: 8,
      feedback: 'Great performance!',
    });

    expect(result.status).toBe('reviewed');
    expect(result.score.getValue()).toBe(8);
    expect(result.feedback.getValue()).toBe('Great performance!');
    expect(submissionRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw when submission is not found', async () => {
    submissionRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ submissionId: 'submission-999', score: 8, feedback: 'Good' })
    ).rejects.toThrow('Submission not found');

    expect(submissionRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when submission is already reviewed', async () => {
    const reviewed = submission.review(Score.create(7), Feedback.create('Nice'));

    submissionRepo.findById.mockResolvedValue(reviewed);
    roundRepo.findById.mockResolvedValue(round);
    castingRepo.findById.mockResolvedValue(casting);

    await expect(
      useCase.execute({ submissionId: 'submission-1', score: 9, feedback: 'Updated' })
    ).rejects.toThrow('Submission already reviewed');

    expect(submissionRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when score is out of range', async () => {
    submissionRepo.findById.mockResolvedValue(submission);
    roundRepo.findById.mockResolvedValue(round);
    castingRepo.findById.mockResolvedValue(casting);

    await expect(
      useCase.execute({ submissionId: 'submission-1', score: 11, feedback: 'Good' })
    ).rejects.toThrow('Score must be between 0 and 10');

    expect(submissionRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when feedback is empty', async () => {
    submissionRepo.findById.mockResolvedValue(submission);
    roundRepo.findById.mockResolvedValue(round);
    castingRepo.findById.mockResolvedValue(casting);

    await expect(
      useCase.execute({ submissionId: 'submission-1', score: 8, feedback: '' })
    ).rejects.toThrow('Feedback cannot be empty');

    expect(submissionRepo.save).not.toHaveBeenCalled();
  });
});
