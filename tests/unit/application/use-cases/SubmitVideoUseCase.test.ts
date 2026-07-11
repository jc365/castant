import { vi } from 'vitest';
import { SubmitVideoUseCase } from '../../../../backend/src/application/use-cases/SubmitVideoUseCase';
import IUserRepository from '../../../../backend/src/application/interfaces/IUserRepository';
import IRoundRepository from '../../../../backend/src/application/interfaces/IRoundRepository';
import ISubmissionRepository from '../../../../backend/src/application/interfaces/ISubmissionRepository';
import User from '../../../../backend/src/domain/entities/User';
import Round, { type RoundParticipantEntry } from '../../../../backend/src/domain/entities/Round';
import EntityId from '../../../../backend/src/domain/value-objects/TypedId';
import Email from '../../../../backend/src/domain/value-objects/Email';
import FullName from '../../../../backend/src/domain/value-objects/FullName';

describe('SubmitVideoUseCase', () => {
  let useCase: SubmitVideoUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let roundRepo: jest.Mocked<IRoundRepository>;
  let submissionRepo: jest.Mocked<ISubmissionRepository>;

  const userId = EntityId.create<'User'>('user-1');
  const roundId = EntityId.create<'Round'>('round-1');
  const castingId = EntityId.create<'Casting'>('casting-1');

  beforeEach(() => {
    userRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    roundRepo = {
      findById: vi.fn(),
      findByCastingId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    submissionRepo = {
      findById: vi.fn(),
      findByRoundId: vi.fn(),
      findByActorId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new SubmitVideoUseCase(userRepo, roundRepo, submissionRepo);
  });

  it('should create a submission when user is invited to round', async () => {
    const user = User.create(userId, FullName.create('John Doe'), Email.create('john@test.com'));
    const participants: RoundParticipantEntry[] = [{ id: userId, role: 'actor' }];
    const round = Round.create(roundId, 1, castingId, participants);

    userRepo.findById.mockResolvedValue(user);
    roundRepo.findById.mockResolvedValue(round);
    submissionRepo.save.mockResolvedValue();

    const result = await useCase.execute({
      actorId: 'user-1',
      roundId: 'round-1',
      videoUrl: 'https://youtube.com/watch?v=abc123',
    });

    expect(result.actorId.getValue()).toBe('user-1');
    expect(result.roundId.getValue()).toBe('round-1');
    expect(result.videoUrl.getValue()).toBe('https://youtube.com/watch?v=abc123');
    expect(result.status).toBe('pending');
    expect(submissionRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw when user is not found', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        actorId: 'user-999',
        roundId: 'round-1',
        videoUrl: 'https://youtube.com/watch?v=abc123',
      })
    ).rejects.toThrow('User user-999 not found');

    expect(submissionRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when round is not found', async () => {
    const user = User.create(userId, FullName.create('John Doe'), Email.create('john@test.com'));
    userRepo.findById.mockResolvedValue(user);
    roundRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        actorId: 'user-1',
        roundId: 'round-999',
        videoUrl: 'https://youtube.com/watch?v=abc123',
      })
    ).rejects.toThrow('Round round-999 not found');

    expect(submissionRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when user is not invited to round', async () => {
    const otherUserId = EntityId.create<'User'>('user-other');
    const user = User.create(userId, FullName.create('John Doe'), Email.create('john@test.com'));
    const participants: RoundParticipantEntry[] = [{ id: otherUserId, role: 'actor' }];
    const round = Round.create(roundId, 1, castingId, participants);

    userRepo.findById.mockResolvedValue(user);
    roundRepo.findById.mockResolvedValue(round);

    await expect(
      useCase.execute({
        actorId: 'user-1',
        roundId: 'round-1',
        videoUrl: 'https://youtube.com/watch?v=abc123',
      })
    ).rejects.toThrow('User user-1 is not invited to round round-1');

    expect(submissionRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when video URL is invalid', async () => {
    const user = User.create(userId, FullName.create('John Doe'), Email.create('john@test.com'));
    const participants: RoundParticipantEntry[] = [{ id: userId, role: 'actor' }];
    const round = Round.create(roundId, 1, castingId, participants);

    userRepo.findById.mockResolvedValue(user);
    roundRepo.findById.mockResolvedValue(round);

    await expect(
      useCase.execute({
        actorId: 'user-1',
        roundId: 'round-1',
        videoUrl: 'not-a-url',
      })
    ).rejects.toThrow('Invalid video URL');

    expect(submissionRepo.save).not.toHaveBeenCalled();
  });
});
