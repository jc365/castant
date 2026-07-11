import { vi } from 'vitest';
import { SelectActorsForNextRoundUseCase } from '../../../../backend/src/application/use-cases/SelectActorsForNextRoundUseCase';
import IRoundRepository from '../../../../backend/src/application/interfaces/IRoundRepository';
import ISubmissionRepository from '../../../../backend/src/application/interfaces/ISubmissionRepository';
import Round, { type RoundParticipantEntry } from '../../../../backend/src/domain/entities/Round';
import EntityId from '../../../../backend/src/domain/value-objects/TypedId';

describe('SelectActorsForNextRoundUseCase', () => {
  let useCase: SelectActorsForNextRoundUseCase;
  let roundRepo: jest.Mocked<IRoundRepository>;
  let submissionRepo: jest.Mocked<ISubmissionRepository>;

  beforeEach(() => {
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
    useCase = new SelectActorsForNextRoundUseCase(roundRepo, submissionRepo);
  });

  function makeRound(number: number, userIds: string[]): Round {
    const id = EntityId.create<'Round'>(`round-${number}`);
    const castingId = EntityId.create<'Casting'>('casting-1');
    const participants: RoundParticipantEntry[] = userIds.map(u => ({
      id: EntityId.create<'User'>(u),
      role: 'actor' as const,
    }));
    return Round.create(id, number, castingId, participants);
  }

  it('should create the next round with selected users', async () => {
    const currentRound = makeRound(1, ['user-1', 'user-2', 'user-3']);
    roundRepo.findById.mockResolvedValue(currentRound);
    roundRepo.save.mockResolvedValue();

    const result = await useCase.execute({
      roundId: 'round-1',
      selectedActorIds: ['user-1', 'user-3'],
    });

    expect(result.number).toBe(2);
    expect(result.actorIds.map(u => u.getValue())).toEqual(['user-1', 'user-3']);
    expect(roundRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw when round is not found', async () => {
    roundRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ roundId: 'round-999', selectedActorIds: ['user-1'] })
    ).rejects.toThrow('Round round-999 not found');

    expect(roundRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when user is not invited to the round', async () => {
    const currentRound = makeRound(1, ['user-1', 'user-2']);
    roundRepo.findById.mockResolvedValue(currentRound);

    await expect(
      useCase.execute({ roundId: 'round-1', selectedActorIds: ['user-1', 'user-99'] })
    ).rejects.toThrow('User user-99 is not invited to round round-1');

    expect(roundRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when selected users list is empty', async () => {
    const currentRound = makeRound(1, ['user-1', 'user-2']);
    roundRepo.findById.mockResolvedValue(currentRound);

    await expect(
      useCase.execute({ roundId: 'round-1', selectedActorIds: [] })
    ).rejects.toThrow('Selected actors list cannot be empty');

    expect(roundRepo.save).not.toHaveBeenCalled();
  });
});
