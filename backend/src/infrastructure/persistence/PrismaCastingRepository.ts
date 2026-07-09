/**
 * @file PrismaCastingRepository.ts
 * @module infrastructure/persistence
 */

import Casting from '../../domain/entities/Casting';
import CastingTitle from '../../domain/value-objects/CastingTitle';
import Description from '../../domain/value-objects/Description';
import EntityId, { type CastingId, type DirectorId } from '../../domain/value-objects/TypedId';
import type ICastingRepository from '../../application/interfaces/ICastingRepository';
import prisma from './prismaClient';

export default class PrismaCastingRepository implements ICastingRepository {
  async findById(id: CastingId): Promise<Casting | null> {
    const record = await prisma.casting.findUnique({
      where: { id: id.getValue() },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByDirectorId(directorId: DirectorId): Promise<Casting[]> {
    const records = await prisma.casting.findMany({
      where: { directorId: directorId.getValue() },
    });
    return records.map((r: { id: string; title: string; description: string; directorId: string }) => this.toDomain(r));
  }

  async save(casting: Casting): Promise<void> {
    await prisma.casting.upsert({
      where: { id: casting.id.getValue() },
      create: {
        id: casting.id.getValue(),
        title: casting.title,
        description: casting.description,
        directorId: casting.directorId.getValue(),
      },
      update: {
        title: casting.title,
        description: casting.description,
      },
    });
  }

  async delete(id: CastingId): Promise<void> {
    await prisma.casting.delete({
      where: { id: id.getValue() },
    });
  }

  private toDomain(record: { id: string; title: string; description: string; directorId: string }): Casting {
    const castingId = EntityId.create<'Casting'>(record.id);
    const castingTitle = CastingTitle.create(record.title);
    const castingDescription = Description.create(record.description);
    const directorId = EntityId.create<'Director'>(record.directorId);
    return Casting.create(castingId, castingTitle, castingDescription, directorId);
  }
}
