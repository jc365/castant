/**
 * @file CreateCastingUseCase.ts
 * @module application/use-cases/castings
 */

import Casting from '../../domain/entities/Casting';
import User from '../../domain/entities/User';
import CastingTitle from '../../domain/value-objects/CastingTitle';
import Description from '../../domain/value-objects/Description';
import Email from '../../domain/value-objects/Email';
import FullName from '../../domain/value-objects/FullName';
import ICastingRepository from '../interfaces/ICastingRepository';
import IUserRepository from '../interfaces/IUserRepository';
import { CreateCastingInput } from '../dtos';
import logger from '../../infrastructure/logging/requestContext';

export class CreateCastingUseCase {
  constructor(
    private readonly castingRepository: ICastingRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: CreateCastingInput): Promise<Casting> {
    const { title, description, directorEmail, directorName } = input;

    logger.info({ title, directorEmail }, 'CreateCastingUseCase: starting');

    const email = Email.create(directorEmail);
    let directorUser = await this.userRepository.findByEmail(email.getValue());

    if (!directorUser) {
      const name = FullName.create(directorName);
      directorUser = User.create(name, email);
      await this.userRepository.save(directorUser);
    }

    const castingTitle = CastingTitle.create(title);
    const castingDescription = Description.create(description);

    const casting = Casting.create(castingTitle, castingDescription, [
      { userId: directorUser.id, role: 'director' },
    ]);

    await this.castingRepository.save(casting);

    logger.info({ castingId: casting.id }, 'CreateCastingUseCase: completed');
    return casting;
  }
}
