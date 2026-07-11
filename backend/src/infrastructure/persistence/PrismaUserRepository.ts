/**
 * @file PrismaUserRepository.ts
 * @module infrastructure/persistence
 */

import User from '../../domain/entities/User';
import Email from '../../domain/value-objects/Email';
import FullName from '../../domain/value-objects/FullName';
import EntityId, { type UserId } from '../../domain/value-objects/TypedId';
import type IUserRepository from '../../application/interfaces/IUserRepository';
import prisma from './prismaClient';

export default class PrismaUserRepository implements IUserRepository {
  async findById(id: UserId): Promise<User | null> {
    const record = await prisma.user.findUnique({
      where: { id: id.getValue() },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await prisma.user.findUnique({
      where: { email },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async save(user: User): Promise<void> {
    await prisma.user.upsert({
      where: { id: user.id.getValue() },
      create: {
        id: user.id.getValue(),
        name: user.name.getValue(),
        email: user.email.getValue(),
      },
      update: {
        name: user.name.getValue(),
        email: user.email.getValue(),
      },
    });
  }

  async delete(id: UserId): Promise<void> {
    await prisma.user.delete({
      where: { id: id.getValue() },
    });
  }

  private toDomain(record: { id: string; name: string; email: string }): User {
    const userId = EntityId.create<'User'>(record.id);
    const userName = FullName.create(record.name);
    const userEmail = Email.create(record.email);
    return User.create(userId, userName, userEmail);
  }
}

/**
 * @deprecated Use PrismaUserRepository instead. Will be removed in future versions.
 */
export const PrismaActorRepository = PrismaUserRepository;
export type PrismaActorRepository = PrismaUserRepository;
