/**
 * @file PrismaRoundRepository.ts
 * @module infrastructure/persistence
 */

import Round, { type RoundParticipantEntry, type RoundParticipantRole } from '../../domain/entities/Round';
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
          create: round.participants.map((entry) => ({
            actorId: entry.id.getValue(),
            role: entry.role,
          })),
        },
      },
      update: {
        number: round.number,
        actors: {
          deleteMany: {},
          create: round.participants.map((entry) => ({
            actorId: entry.id.getValue(),
            role: entry.role,
          })),
        },
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

  private toDomain(record: { id: string; number: number; castingId: string; actors: { actorId: string; role: string }[] }): Round {
    const roundId = EntityId.create<'Round'>(record.id);
    const castingId = EntityId.create<'Casting'>(record.castingId);
    const participants: RoundParticipantEntry[] = record.actors.map((a) => ({
      id: EntityId.create<'Actor'>(a.actorId),
      role: a.role as RoundParticipantRole,
    }));
    return Round.create(roundId, record.number, castingId, participants);
  }
}
