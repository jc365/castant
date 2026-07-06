import { SelectActorsForNextRoundUseCase } from '../../../../backend/src/application/use-cases/SelectActorsForNextRoundUseCase';
import IRoundRepository from '../../../../backend/src/application/interfaces/IRoundRepository';
import ISubmissionRepository from '../../../../backend/src/application/interfaces/ISubmissionRepository';
import Round from '../../../../backend/src/domain/entities/Round';
import EntityId from '../../../../backend/src/domain/value-objects/TypedId';

describe('SelectActorsForNextRoundUseCase', () => {
  let useCase: SelectActorsForNextRoundUseCase;
  let roundRepo: jest.Mocked<IRoundRepository>;
  let submissionRepo: jest.Mocked<ISubmissionRepository>;

  beforeEach(() => {
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
    useCase = new SelectActorsForNextRoundUseCase(roundRepo, submissionRepo);
  });

  function makeRound(number: number, actorIds: string[]): Round {
    const id = EntityId.create<'Round'>(`round-${number}`);
    const castingId = EntityId.create<'Casting'>('casting-1');
    const actors = actorIds.map(a => EntityId.create<'Actor'>(a));
    return Round.create(id, number, castingId, actors);
  }

  it('should create the next round with selected actors', async () => {
    const currentRound = makeRound(1, ['actor-1', 'actor-2', 'actor-3']);
    roundRepo.findById.mockResolvedValue(currentRound);
    roundRepo.save.mockResolvedValue();

    const result = await useCase.execute({
      roundId: 'round-1',
      selectedActorIds: ['actor-1', 'actor-3'],
    });

    expect(result.number).toBe(2);
    expect(result.actorIds.map(a => a.getValue())).toEqual(['actor-1', 'actor-3']);
    expect(roundRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw when round is not found', async () => {
    roundRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ roundId: 'round-999', selectedActorIds: ['actor-1'] })
    ).rejects.toThrow('Round round-999 not found');

    expect(roundRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when actor is not invited to the round', async () => {
    const currentRound = makeRound(1, ['actor-1', 'actor-2']);
    roundRepo.findById.mockResolvedValue(currentRound);

    await expect(
      useCase.execute({ roundId: 'round-1', selectedActorIds: ['actor-1', 'actor-99'] })
    ).rejects.toThrow('Actor actor-99 is not invited to round round-1');

    expect(roundRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when selected actors list is empty', async () => {
    const currentRound = makeRound(1, ['actor-1', 'actor-2']);
    roundRepo.findById.mockResolvedValue(currentRound);

    await expect(
      useCase.execute({ roundId: 'round-1', selectedActorIds: [] })
    ).rejects.toThrow('Selected actors list cannot be empty');

    expect(roundRepo.save).not.toHaveBeenCalled();
  });
});
