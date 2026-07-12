import { vi } from 'vitest';
import { CreateCastingUseCase } from '../../../../backend/src/application/use-cases/CreateCastingUseCase';
import ICastingRepository from '../../../../backend/src/application/interfaces/ICastingRepository';
import IUserRepository from '../../../../backend/src/application/interfaces/IUserRepository';
import User from '../../../../backend/src/domain/entities/User';
import Email from '../../../../backend/src/domain/value-objects/Email';
import FullName from '../../../../backend/src/domain/value-objects/FullName';

describe('CreateCastingUseCase', () => {
  let useCase: CreateCastingUseCase;
  let castingRepo: jest.Mocked<ICastingRepository>;
  let userRepo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    castingRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    userRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new CreateCastingUseCase(castingRepo, userRepo);
  });

  it('should create a casting when director user exists', async () => {
    const user = User.create(FullName.create('Jane Doe'), Email.create('jane@test.com'), 'user-1');
    userRepo.findByEmail.mockResolvedValue(user);
    castingRepo.save.mockResolvedValue();

    const result = await useCase.execute({
      title: 'Casting Principal',
      description: 'Buscamos protagonista',
      directorEmail: 'jane@test.com',
      directorName: 'Jane Doe',
    });

    expect(result.title).toBe('Casting Principal');
    expect(result.description).toBe('Buscamos protagonista');
    expect(result.participants).toHaveLength(1);
    expect(result.participants[0].role).toBe('director');
    expect(castingRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should create a new user when director does not exist', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.save.mockResolvedValue();
    castingRepo.save.mockResolvedValue();

    const result = await useCase.execute({
      title: 'Casting Principal',
      description: 'Buscamos protagonista',
      directorEmail: 'new@test.com',
      directorName: 'New Director',
    });

    expect(result.title).toBe('Casting Principal');
    expect(result.participants).toHaveLength(1);
    expect(result.participants[0].role).toBe('director');
    expect(userRepo.save).toHaveBeenCalledTimes(1);
    expect(castingRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw when title is invalid', async () => {
    const user = User.create(FullName.create('Jane Doe'), Email.create('jane@test.com'), 'user-1');
    userRepo.findByEmail.mockResolvedValue(user);

    await expect(
      useCase.execute({
        title: '',
        description: 'Valid description',
        directorEmail: 'jane@test.com',
        directorName: 'Jane Doe',
      })
    ).rejects.toThrow('Title cannot be empty');
  });

  it('should throw when description exceeds max length', async () => {
    const user = User.create(FullName.create('Jane Doe'), Email.create('jane@test.com'), 'user-1');
    userRepo.findByEmail.mockResolvedValue(user);

    await expect(
      useCase.execute({
        title: 'Valid Title',
        description: 'a'.repeat(2001),
        directorEmail: 'jane@test.com',
        directorName: 'Jane Doe',
      })
    ).rejects.toThrow('Description must be at most 2000 characters');
  });
});
