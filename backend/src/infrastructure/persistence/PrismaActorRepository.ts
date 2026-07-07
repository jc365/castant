/**
 * @file PrismaActorRepository.ts
 * @module infrastructure/persistence
 */

import Actor from '../../domain/entities/Actor';
import Email from '../../domain/value-objects/Email';
import FullName from '../../domain/value-objects/FullName';
import EntityId, { type ActorId } from '../../domain/value-objects/TypedId';
import type IActorRepository from '../../application/interfaces/IActorRepository';
import prisma from './prismaClient';

export default class PrismaActorRepository implements IActorRepository {
  async findById(id: ActorId): Promise<Actor | null> {
    const record = await prisma.actor.findUnique({
      where: { id: id.getValue() },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByEmail(email: string): Promise<Actor | null> {
    const record = await prisma.actor.findUnique({
      where: { email },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async save(actor: Actor): Promise<void> {
    await prisma.actor.upsert({
      where: { id: actor.id.getValue() },
      create: {
        id: actor.id.getValue(),
        name: actor.name.getValue(),
        email: actor.email.getValue(),
      },
      update: {
        name: actor.name.getValue(),
        email: actor.email.getValue(),
      },
    });
  }

  async delete(id: ActorId): Promise<void> {
    await prisma.actor.delete({
      where: { id: id.getValue() },
    });
  }

  private toDomain(record: { id: string; name: string; email: string }): Actor {
    const actorId = EntityId.create<'Actor'>(record.id);
    const actorName = FullName.create(record.name);
    const actorEmail = Email.create(record.email);
    return Actor.create(actorId, actorName, actorEmail);
  }
}
