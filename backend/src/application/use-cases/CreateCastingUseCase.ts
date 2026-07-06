/**
 * @file CreateCastingUseCase.ts
 * @module application/use-cases/castings
 */

import Casting from '../../domain/entities/Casting';
import CastingTitle from '../../domain/value-objects/CastingTitle';
import Description from '../../domain/value-objects/Description';
import EntityId from '../../domain/value-objects/TypedId';
import ICastingRepository from '../interfaces/ICastingRepository';
import IDirectorRepository from '../interfaces/IDirectorRepository';
import { CreateCastingInput } from '../dtos';

export class CreateCastingUseCase {
  constructor(
    private readonly castingRepository: ICastingRepository,
    private readonly directorRepository: IDirectorRepository
  ) {}

  async execute(input: CreateCastingInput): Promise<Casting> {
    const { title, description, directorId } = input;

    const typedDirectorId = EntityId.create<'Director'>(directorId);
    const existingDirector = await this.directorRepository.findById(typedDirectorId);
    if (!existingDirector) {
      throw new Error(`Director ${directorId} not found`);
    }

    const castingTitle = CastingTitle.create(title);
    const castingDescription = Description.create(description);
    const castingId = EntityId.create<'Casting'>(crypto.randomUUID());

    const casting = Casting.create(castingId, castingTitle, castingDescription, typedDirectorId);

    await this.castingRepository.save(casting);

    return casting;
  }
}
