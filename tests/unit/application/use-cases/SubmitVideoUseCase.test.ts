import { SubmitVideoUseCase } from '../../../../backend/src/application/use-cases/SubmitVideoUseCase';
import IActorRepository from '../../../../backend/src/application/interfaces/IActorRepository';
import IRoundRepository from '../../../../backend/src/application/interfaces/IRoundRepository';
import ISubmissionRepository from '../../../../backend/src/application/interfaces/ISubmissionRepository';
import { Actor } from '../../../../backend/src/domain/entities/Actor';
import Round from '../../../../backend/src/domain/entities/Round';
import EntityId from '../../../../backend/src/domain/value-objects/TypedId';
import Email from '../../../../backend/src/domain/value-objects/Email';
import FullName from '../../../../backend/src/domain/value-objects/FullName';

describe('SubmitVideoUseCase', () => {
  let useCase: SubmitVideoUseCase;
  let actorRepo: jest.Mocked<IActorRepository>;
  let roundRepo: jest.Mocked<IRoundRepository>;
  let submissionRepo: jest.Mocked<ISubmissionRepository>;

  const actorId = EntityId.create<'Actor'>('actor-1');
  const roundId = EntityId.create<'Round'>('round-1');
  const castingId = EntityId.create<'Casting'>('casting-1');

  beforeEach(() => {
    actorRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    roundRepo = {
      findById: jest.fn(),
      findByCastingId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    submissionRepo = {
      findById: jest.fn(),
      findByRoundId: jest.fn(),
      findByActorId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new SubmitVideoUseCase(actorRepo, roundRepo, submissionRepo);
  });

  it('should create a submission when actor is invited to round', async () => {
    const actor = Actor.create(actorId, FullName.create('John Doe'), Email.create('john@test.com'));
    const round = Round.create(roundId, 1, castingId, [actorId]);

    actorRepo.findById.mockResolvedValue(actor);
    roundRepo.findById.mockResolvedValue(round);
    submissionRepo.save.mockResolvedValue();

    const result = await useCase.execute({
      actorId: 'actor-1',
      roundId: 'round-1',
      videoUrl: 'https://youtube.com/watch?v=abc123',
    });

    expect(result.actorId.getValue()).toBe('actor-1');
    expect(result.roundId.getValue()).toBe('round-1');
    expect(result.videoUrl.getValue()).toBe('https://youtube.com/watch?v=abc123');
    expect(result.status).toBe('pending');
    expect(submissionRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw when actor is not found', async () => {
    actorRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        actorId: 'actor-999',
        roundId: 'round-1',
        videoUrl: 'https://youtube.com/watch?v=abc123',
      })
    ).rejects.toThrow('Actor actor-999 not found');

    expect(submissionRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when round is not found', async () => {
    const actor = Actor.create(actorId, FullName.create('John Doe'), Email.create('john@test.com'));
    actorRepo.findById.mockResolvedValue(actor);
    roundRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        actorId: 'actor-1',
        roundId: 'round-999',
        videoUrl: 'https://youtube.com/watch?v=abc123',
      })
    ).rejects.toThrow('Round round-999 not found');

    expect(submissionRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when actor is not invited to round', async () => {
    const otherActorId = EntityId.create<'Actor'>('actor-other');
    const actor = Actor.create(actorId, FullName.create('John Doe'), Email.create('john@test.com'));
    const round = Round.create(roundId, 1, castingId, [otherActorId]);

    actorRepo.findById.mockResolvedValue(actor);
    roundRepo.findById.mockResolvedValue(round);

    await expect(
      useCase.execute({
        actorId: 'actor-1',
        roundId: 'round-1',
        videoUrl: 'https://youtube.com/watch?v=abc123',
      })
    ).rejects.toThrow('Actor actor-1 is not invited to round round-1');

    expect(submissionRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when video URL is invalid', async () => {
    const actor = Actor.create(actorId, FullName.create('John Doe'), Email.create('john@test.com'));
    const round = Round.create(roundId, 1, castingId, [actorId]);

    actorRepo.findById.mockResolvedValue(actor);
    roundRepo.findById.mockResolvedValue(round);

    await expect(
      useCase.execute({
        actorId: 'actor-1',
        roundId: 'round-1',
        videoUrl: 'not-a-url',
      })
    ).rejects.toThrow('Invalid video URL');

    expect(submissionRepo.save).not.toHaveBeenCalled();
  });
});
