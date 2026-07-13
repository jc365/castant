import { vi } from 'vitest';
import { CreateUserUseCase } from '../../../../backend/src/application/use-cases/CreateUserUseCase';
import IUserRepository from '../../../../backend/src/application/interfaces/IUserRepository';
import User from '../../../../backend/src/domain/entities/User';
import Email from '../../../../backend/src/domain/value-objects/Email';
import FullName from '../../../../backend/src/domain/value-objects/FullName';
import BitacoraService from '../../../../backend/src/infrastructure/logging/BitacoraService';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let bitacoraService: jest.Mocked<BitacoraService>;

  beforeEach(() => {
    userRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    bitacoraService = {
      log: vi.fn(),
    } as unknown as jest.Mocked<BitacoraService>;
    useCase = new CreateUserUseCase(userRepo, bitacoraService);
  });

  it('should create a user with provided id', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.save.mockResolvedValue();

    const result = await useCase.execute({
      id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@test.com',
    });

    expect(result.id).toBe('user-1');
    expect(result.name.getValue()).toBe('Jane Doe');
    expect(result.email.getValue()).toBe('jane@test.com');
    expect(userRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should create a user without id (auto-generate)', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.save.mockResolvedValue();

    const result = await useCase.execute({
      name: 'Jane Doe',
      email: 'jane@test.com',
    });

    expect(result.id).toBeDefined();
    expect(result.id.startsWith('user-')).toBe(true);
    expect(result.name.getValue()).toBe('Jane Doe');
    expect(userRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw when email is already registered', async () => {
    const existingUser = User.create(
      FullName.create('Jane Doe'),
      Email.create('jane@test.com'),
      'user-existing'
    );
    userRepo.findByEmail.mockResolvedValue(existingUser);

    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'jane@test.com',
      })
    ).rejects.toThrow('Email jane@test.com is already registered');

    expect(userRepo.save).not.toHaveBeenCalled();
    expect(bitacoraService.log).not.toHaveBeenCalled();
  });

  it('should log to bitacora when user is created', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.save.mockResolvedValue();

    await useCase.execute({
      id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@test.com',
    });

    expect(bitacoraService.log).toHaveBeenCalledTimes(1);
    expect(bitacoraService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'create_user',
      details: { email: 'jane@test.com', name: 'Jane Doe' },
    });
  });
});
