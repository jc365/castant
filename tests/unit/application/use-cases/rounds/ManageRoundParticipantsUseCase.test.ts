/**
 * @file ManageRoundParticipantsUseCase.test.ts
 * @module tests/unit/application/use-cases/rounds
 */

import { vi } from 'vitest';
import { ManageRoundParticipantsUseCase } from '../../../../../backend/src/application/use-cases/rounds/ManageRoundParticipantsUseCase';
import IActorRepository from '../../../../../backend/src/application/interfaces/IActorRepository';
import IRoundRepository from '../../../../../backend/src/application/interfaces/IRoundRepository';
import Actor from '../../../../../backend/src/domain/entities/Actor';
import Round, { type RoundParticipantEntry } from '../../../../../backend/src/domain/entities/Round';
import Email from '../../../../../backend/src/domain/value-objects/Email';
import FullName from '../../../../../backend/src/domain/value-objects/FullName';
import EntityId from '../../../../../backend/src/domain/value-objects/TypedId';

describe('ManageRoundParticipantsUseCase', () => {
  let useCase: ManageRoundParticipantsUseCase;
  let actorRepo: jest.Mocked<IActorRepository>;
  let roundRepo: jest.Mocked<IRoundRepository>;

  beforeEach(() => {
    actorRepo = {
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
    useCase = new ManageRoundParticipantsUseCase(actorRepo, roundRepo);
  });

  function makeRound(number: number, participants: RoundParticipantEntry[]): Round {
    const id = EntityId.create<'Round'>(`round-${number}`);
    const castingId = EntityId.create<'Casting'>('casting-1');
    return Round.create(id, number, castingId, participants);
  }

  function makeActor(id: string, email: string, name: string): Actor {
    const actorId = EntityId.create<'Actor'>(id);
    const actorEmail = Email.create(email);
    const actorName = FullName.create(name);
    return Actor.create(actorId, actorName, actorEmail);
  }

  describe('add participants to existing round', () => {
    it('should add actors to an existing round', async () => {
      const currentRound = makeRound(1, [
        { id: EntityId.create<'Actor'>('actor-1'), role: 'actor' },
      ]);
      roundRepo.findById.mockResolvedValue(currentRound);
      actorRepo.findByEmail.mockResolvedValue(null);
      actorRepo.save.mockResolvedValue();
      roundRepo.save.mockResolvedValue();

      const result = await useCase.execute({
        roundId: 'round-1',
        actors: [{ email: 'new@test.com', name: 'New Actor' }],
        preselectors: [],
      });

      expect(result.participants).toHaveLength(2);
      expect(result.participants[1].role).toBe('actor');
      expect(actorRepo.save).toHaveBeenCalledTimes(1);
      expect(roundRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should add preselectors to an existing round', async () => {
      const currentRound = makeRound(1, [
        { id: EntityId.create<'Actor'>('actor-1'), role: 'actor' },
      ]);
      roundRepo.findById.mockResolvedValue(currentRound);
      actorRepo.findByEmail.mockResolvedValue(null);
      actorRepo.save.mockResolvedValue();
      roundRepo.save.mockResolvedValue();

      const result = await useCase.execute({
        roundId: 'round-1',
        actors: [],
        preselectors: [{ email: 'pre@test.com', name: 'Pre Selector' }],
      });

      expect(result.participants).toHaveLength(2);
      expect(result.participants[1].role).toBe('preselector');
      expect(actorRepo.save).toHaveBeenCalledTimes(1);
      expect(roundRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should reuse existing actors by email', async () => {
      const existingActor = makeActor('actor-1', 'existing@test.com', 'Existing Actor');
      const currentRound = makeRound(1, [
        { id: EntityId.create<'Actor'>('existing'), role: 'actor' },
      ]);
      roundRepo.findById.mockResolvedValue(currentRound);
      actorRepo.findByEmail.mockResolvedValue(existingActor);
      roundRepo.save.mockResolvedValue();

      const result = await useCase.execute({
        roundId: 'round-1',
        actors: [{ email: 'existing@test.com' }],
        preselectors: [],
      });

      expect(result.participants).toHaveLength(2);
      expect(result.participants[1].id.getValue()).toBe('actor-1');
      expect(actorRepo.save).not.toHaveBeenCalled();
    });

    it('should handle duplicate actors in the same request', async () => {
      const currentRound = makeRound(1, [
        { id: EntityId.create<'Actor'>('existing'), role: 'actor' },
      ]);
      roundRepo.findById.mockResolvedValue(currentRound);
      actorRepo.findByEmail.mockResolvedValue(null);
      actorRepo.save.mockResolvedValue();
      roundRepo.save.mockResolvedValue();

      const result = await useCase.execute({
        roundId: 'round-1',
        actors: [
          { email: 'dup@test.com', name: 'Dup Actor' },
          { email: 'dup@test.com', name: 'Dup Actor Again' },
        ],
        preselectors: [],
      });

      expect(result.participants).toHaveLength(3);
      expect(actorRepo.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('createNewRound', () => {
    it('should create a new round with actors when createNewRound is true', async () => {
      const currentRound = makeRound(1, [
        { id: EntityId.create<'Actor'>('actor-1'), role: 'actor' },
      ]);
      roundRepo.findById.mockResolvedValue(currentRound);
      actorRepo.findByEmail.mockResolvedValue(null);
      actorRepo.save.mockResolvedValue();
      roundRepo.save.mockResolvedValue();

      const result = await useCase.execute({
        roundId: 'round-1',
        actors: [{ email: 'new@test.com', name: 'New Actor' }],
        preselectors: [],
        createNewRound: true,
      });

      expect(result.number).toBe(2);
      expect(result.participants).toHaveLength(2);
      expect(result.participants.every(p => p.role === 'actor')).toBe(true);
      expect(roundRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when createNewRound is true but preselectors are provided', async () => {
      const currentRound = makeRound(1, [
        { id: EntityId.create<'Actor'>('actor-1'), role: 'actor' },
      ]);
      roundRepo.findById.mockResolvedValue(currentRound);

      await expect(
        useCase.execute({
          roundId: 'round-1',
          actors: [{ email: 'new@test.com', name: 'New Actor' }],
          preselectors: [{ email: 'pre@test.com', name: 'Pre Selector' }],
          createNewRound: true,
        })
      ).rejects.toThrow('Preselectors are not allowed when creating a new round');

      expect(roundRepo.save).not.toHaveBeenCalled();
    });

    it('should throw when createNewRound is true but actors list is empty', async () => {
      const currentRound = makeRound(1, [
        { id: EntityId.create<'Actor'>('actor-1'), role: 'actor' },
      ]);
      roundRepo.findById.mockResolvedValue(currentRound);

      await expect(
        useCase.execute({
          roundId: 'round-1',
          actors: [],
          preselectors: [],
          createNewRound: true,
        })
      ).rejects.toThrow('Actors list cannot be empty when creating a new round');

      expect(roundRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw when round is not found', async () => {
      roundRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          roundId: 'round-999',
          actors: [{ email: 'test@test.com', name: 'Test' }],
          preselectors: [],
        })
      ).rejects.toThrow('Round round-999 not found');

      expect(roundRepo.save).not.toHaveBeenCalled();
    });
  });
});
