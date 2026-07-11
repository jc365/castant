// application/use-cases/users/CreateUserUseCase.ts
/**
 * @file CreateUserUseCase.ts
 * @module application/use-cases/users
 */

import User from '../../domain/entities/User';
import Email from '../../domain/value-objects/Email';
import FullName from '../../domain/value-objects/FullName';
import EntityId from '../../domain/value-objects/TypedId';
import IUserRepository from '../interfaces/IUserRepository';
import { CreateUserInput } from '../dtos';
import logger from '../../infrastructure/logging/requestContext';

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const { id, name, email } = input;

    logger.info({ id, name, email }, 'CreateUserUseCase: starting');

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      logger.error({ email }, 'CreateUserUseCase: email already registered');
      throw new Error(`Email ${email} is already registered`);
    }

    const userId = EntityId.create<'User'>(id);
    const userEmail = Email.create(email);
    const userName = FullName.create(name);
    const user = User.create(userId, userName, userEmail);

    await this.userRepository.save(user);

    logger.info({ id }, 'CreateUserUseCase: completed');
    return user;
  }
}

/**
 * @deprecated Use CreateUserUseCase instead. Will be removed in future versions.
 */
export const CreateActorUseCase = CreateUserUseCase;
export type CreateActorUseCase = CreateUserUseCase;
