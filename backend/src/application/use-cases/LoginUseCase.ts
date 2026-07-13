/**
 * @file LoginUseCase.ts
 * @module application/use-cases/auth
 */

import IUserRepository from '../interfaces/IUserRepository';
import { LoginInput, LoginOutput } from '../dtos';
import { generateToken } from '../../infrastructure/middleware/auth';
import logger from '../../infrastructure/logging/requestContext';

export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const { email } = input;

    logger.info({ email }, 'LoginUseCase: starting');

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      logger.error({ email }, 'LoginUseCase: user not found');
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user.id);

    logger.info({ userId: user.id }, 'LoginUseCase: completed');
    return { token, userId: user.id };
  }
}
