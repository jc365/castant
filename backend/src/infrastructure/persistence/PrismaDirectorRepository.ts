/**
 * @file PrismaDirectorRepository.ts
 * @module infrastructure/persistence
 */

import Director from '../../domain/entities/Director';
import Email from '../../domain/value-objects/Email';
import FullName from '../../domain/value-objects/FullName';
import EntityId, { type DirectorId } from '../../domain/value-objects/TypedId';
import type IDirectorRepository from '../../application/interfaces/IDirectorRepository';
import prisma from './prismaClient';

export default class PrismaDirectorRepository implements IDirectorRepository {
  async findById(id: DirectorId): Promise<Director | null> {
    const record = await prisma.director.findUnique({
      where: { id: id.getValue() },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async save(director: Director): Promise<void> {
    await prisma.director.upsert({
      where: { id: director.id.getValue() },
      create: {
        id: director.id.getValue(),
        name: director.name.getValue(),
        email: director.email.getValue(),
      },
      update: {
        name: director.name.getValue(),
        email: director.email.getValue(),
      },
    });
  }

  async delete(id: DirectorId): Promise<void> {
    await prisma.director.delete({
      where: { id: id.getValue() },
    });
  }

  private toDomain(record: { id: string; name: string; email: string }): Director {
    const directorId = EntityId.create<'Director'>(record.id);
    const directorName = FullName.create(record.name);
    const directorEmail = Email.create(record.email);
    return Director.create(directorId, directorName, directorEmail);
  }
}
