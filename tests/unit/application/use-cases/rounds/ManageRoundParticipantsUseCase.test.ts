/**
 * @file ManageRoundParticipantsUseCase.test.ts
 * @module tests/unit/application/use-cases/rounds
 */

import { vi } from 'vitest';
import { ManageRoundParticipantsUseCase } from '../../../../../backend/src/application/use-cases/rounds/ManageRoundParticipantsUseCase';
import IUserRepository from '../../../../../backend/src/application/interfaces/IUserRepository';
import IRoundRepository from '../../../../../backend/src/application/interfaces/IRoundRepository';
import User from '../../../../../backend/src/domain/entities/User';
import Round, { type RoundParticipantEntry } from '../../../../../backend/src/domain/entities/Round';
import Email from '../../../../../backend/src/domain/value-objects/Email';
import FullName from '../../../../../backend/src/domain/value-objects/FullName';

describe('ManageRoundParticipantsUseCase', () => {
  let useCase: ManageRoundParticipantsUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let roundRepo: jest.Mocked<IRoundRepository>;

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
    useCase = new ManageRoundParticipantsUseCase(userRepo, roundRepo);
  });

  function makeRound(number: number, participants: RoundParticipantEntry[]): Round {
    return Round.create(number, 'casting-1', participants, `round-${number}`);
  }

  function makeUser(id: string, email: string, name: string): User {
    const userEmail = Email.create(email);
    const userName = FullName.create(name);
    return User.create(userName, userEmail, id);
  }

  describe('add participants to existing round', () => {
    it('should add actors to an existing round', async () => {
      const currentRound = makeRound(1, [
        { id: 'user-1', role: 'actor' },
      ]);
      roundRepo.findById.mockResolvedValue(currentRound);
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.save.mockResolvedValue();
      roundRepo.save.mockResolvedValue();

      const result = await useCase.execute({
        roundId: 'round-1',
        actors: [{ email: 'new@test.com', name: 'New Actor' }],
        preselectors: [],
      });

      expect(result.participants).toHaveLength(2);
      expect(result.participants[1].role).toBe('actor');
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(roundRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should add preselectors to an existing round', async () => {
      const currentRound = makeRound(1, [
        { id: 'user-1', role: 'actor' },
      ]);
      roundRepo.findById.mockResolvedValue(currentRound);
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.save.mockResolvedValue();
      roundRepo.save.mockResolvedValue();

      const result = await useCase.execute({
        roundId: 'round-1',
        actors: [],
        preselectors: [{ email: 'pre@test.com', name: 'Pre Selector' }],
      });

      expect(result.participants).toHaveLength(2);
      expect(result.participants[1].role).toBe('preselector');
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(roundRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should reuse existing users by email', async () => {
      const existingUser = makeUser('user-1', 'existing@test.com', 'Existing User');
      const currentRound = makeRound(1, [
        { id: 'existing', role: 'actor' },
      ]);
      roundRepo.findById.mockResolvedValue(currentRound);
      userRepo.findByEmail.mockResolvedValue(existingUser);
      roundRepo.save.mockResolvedValue();

      const result = await useCase.execute({
        roundId: 'round-1',
        actors: [{ email: 'existing@test.com' }],
        preselectors: [],
      });

      expect(result.participants).toHaveLength(2);
      expect(result.participants[1].id).toBe('user-1');
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('should handle duplicate users in the same request', async () => {
      const currentRound = makeRound(1, [
        { id: 'existing', role: 'actor' },
      ]);
      roundRepo.findById.mockResolvedValue(currentRound);
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.save.mockResolvedValue();
      roundRepo.save.mockResolvedValue();

      const result = await useCase.execute({
        roundId: 'round-1',
        actors: [
          { email: 'dup@test.com', name: 'Dup User' },
          { email: 'dup@test.com', name: 'Dup User Again' },
        ],
        preselectors: [],
      });

      expect(result.participants).toHaveLength(3);
      expect(userRepo.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('createNewRound', () => {
    it('should create a new round with actors when createNewRound is true', async () => {
      const currentRound = makeRound(1, [
        { id: 'user-1', role: 'actor' },
      ]);
      roundRepo.findById.mockResolvedValue(currentRound);
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.save.mockResolvedValue();
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
        { id: 'user-1', role: 'actor' },
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
        { id: 'user-1', role: 'actor' },
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
