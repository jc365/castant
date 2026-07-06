import { CreateCastingUseCase } from '../../../../backend/src/application/use-cases/CreateCastingUseCase';
import ICastingRepository from '../../../../backend/src/application/interfaces/ICastingRepository';
import IDirectorRepository from '../../../../backend/src/application/interfaces/IDirectorRepository';
import Director from '../../../../backend/src/domain/entities/Director';
import EntityId from '../../../../backend/src/domain/value-objects/TypedId';
import Email from '../../../../backend/src/domain/value-objects/Email';
import FullName from '../../../../backend/src/domain/value-objects/FullName';

describe('CreateCastingUseCase', () => {
  let useCase: CreateCastingUseCase;
  let castingRepo: jest.Mocked<ICastingRepository>;
  let directorRepo: jest.Mocked<IDirectorRepository>;

  beforeEach(() => {
    castingRepo = {
      findById: jest.fn(),
      findByDirectorId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    directorRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new CreateCastingUseCase(castingRepo, directorRepo);
  });

  it('should create a casting when director exists', async () => {
    const directorId = EntityId.create<'Director'>('dir-1');
    const director = Director.create(directorId, FullName.create('Jane Doe'), Email.create('jane@test.com'));
    directorRepo.findById.mockResolvedValue(director);
    castingRepo.save.mockResolvedValue();

    const result = await useCase.execute({
      title: 'Casting Principal',
      description: 'Buscamos protagonista',
      directorId: 'dir-1',
    });

    expect(result.title).toBe('Casting Principal');
    expect(result.description).toBe('Buscamos protagonista');
    expect(result.directorId.getValue()).toBe('dir-1');
    expect(castingRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw when director is not found', async () => {
    directorRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        title: 'Casting Principal',
        description: 'Buscamos protagonista',
        directorId: 'dir-999',
      })
    ).rejects.toThrow('Director dir-999 not found');

    expect(castingRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when title is invalid', async () => {
    const directorId = EntityId.create<'Director'>('dir-1');
    const director = Director.create(directorId, FullName.create('Jane Doe'), Email.create('jane@test.com'));
    directorRepo.findById.mockResolvedValue(director);

    await expect(
      useCase.execute({
        title: '',
        description: 'Valid description',
        directorId: 'dir-1',
      })
    ).rejects.toThrow('Title cannot be empty');
  });

  it('should throw when description exceeds max length', async () => {
    const directorId = EntityId.create<'Director'>('dir-1');
    const director = Director.create(directorId, FullName.create('Jane Doe'), Email.create('jane@test.com'));
    directorRepo.findById.mockResolvedValue(director);

    await expect(
      useCase.execute({
        title: 'Valid Title',
        description: 'a'.repeat(2001),
        directorId: 'dir-1',
      })
    ).rejects.toThrow('Description must be at most 2000 characters');
  });
});
