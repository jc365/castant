// application/use-cases/users/CreateUserUseCase.ts
/**
 * @file CreateUserUseCase.ts
 * @module application/use-cases/users
 */

import User from '../../domain/entities/User';
import Email from '../../domain/value-objects/Email';
import FullName from '../../domain/value-objects/FullName';
import IUserRepository from '../interfaces/IUserRepository';
import { CreateUserInput } from '../dtos';
import logger from '../../infrastructure/logging/requestContext';
import BitacoraService from '../../infrastructure/logging/BitacoraService';

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly bitacoraService: BitacoraService
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const { id, name, email } = input;

    logger.info({ name, email }, 'CreateUserUseCase: starting');

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      logger.error({ email }, 'CreateUserUseCase: email already registered');
      throw new Error(`Email ${email} is already registered`);
    }

    const userEmail = Email.create(email);
    const userName = FullName.create(name);
    const user = User.create(userName, userEmail, id);

    await this.userRepository.save(user);

    await this.bitacoraService.log({
      userId: user.id,
      action: 'create_user',
      details: { email, name },
    });

    logger.info({ userId: user.id }, 'CreateUserUseCase: completed');
    return user;
  }
}

/**
 * @deprecated Use CreateUserUseCase instead. Will be removed in future versions.
 */
export const CreateActorUseCase = CreateUserUseCase;
export type CreateActorUseCase = CreateUserUseCase;
