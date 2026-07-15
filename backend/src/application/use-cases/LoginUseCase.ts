/**
 * @file LoginUseCase.ts
 * @module application/use-cases/auth
 */

import IUserRepository from '../interfaces/IUserRepository';
import { LoginInput, LoginOutput } from '../dtos';
import { generateToken } from '../../infrastructure/middleware/auth';
import logger from '../../infrastructure/logging/requestContext';
import HashService from '../../infrastructure/security/HashService';

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: HashService
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const { email, password } = input;

    logger.info({ email }, 'LoginUseCase: starting');

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      logger.error({ email }, 'LoginUseCase: user not found');
      throw new Error('Invalid credentials');
    }

    const passwordMatch = await this.hashService.compare(password, user.password);
    if (!passwordMatch) {
      logger.error({ email }, 'LoginUseCase: invalid password');
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user.id);

    logger.info({ userId: user.id }, 'LoginUseCase: completed');
    return { token, userId: user.id };
  }
}
