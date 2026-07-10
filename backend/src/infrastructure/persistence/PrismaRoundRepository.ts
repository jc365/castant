/**
 * @file PrismaRoundRepository.ts
 * @module infrastructure/persistence
 */

import Round from '../../domain/entities/Round';
import EntityId, { type CastingId, type RoundId, type ActorId } from '../../domain/value-objects/TypedId';
import type IRoundRepository from '../../application/interfaces/IRoundRepository';
import prisma from './prismaClient';

export default class PrismaRoundRepository implements IRoundRepository {
  async findById(id: RoundId): Promise<Round | null> {
    const record = await prisma.round.findUnique({
      where: { id: id.getValue() },
      include: { actors: true },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByCastingId(castingId: CastingId): Promise<Round[]> {
    const records = await prisma.round.findMany({
      where: { castingId: castingId.getValue() },
      include: { actors: true },
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(round: Round): Promise<void> {
    await prisma.round.upsert({
      where: { id: round.id.getValue() },
      create: {
        id: round.id.getValue(),
        number: round.number,
        castingId: round.castingId.getValue(),
        actors: {
          create: round.actorIds.map((actorId) => ({
            actorId: actorId.getValue(),
          })),
        },
      },
      update: {
        number: round.number,
      },
    });
  }

  async delete(id: RoundId): Promise<void> {
    await prisma.roundActor.deleteMany({
      where: { roundId: id.getValue() },
    });
    await prisma.round.delete({
      where: { id: id.getValue() },
    });
  }

  private toDomain(record: { id: string; number: number; castingId: string; actors: { actorId: string }[] }): Round {
    const roundId = EntityId.create<'Round'>(record.id);
    const castingId = EntityId.create<'Casting'>(record.castingId);
    const actorIds = record.actors.map((a) => EntityId.create<'Actor'>(a.actorId));
    return Round.create(roundId, record.number, castingId, actorIds);
  }
}
