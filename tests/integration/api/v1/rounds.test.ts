/**
 * @file rounds.test.ts
 * @module tests/integration/api/v1/rounds
 */

import request from 'supertest';
import app from '../../../../backend/src/index';
import prisma from '../../../../backend/src/infrastructure/persistence/prismaClient';

beforeEach(async () => {
  await prisma.roundActor.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.round.deleteMany();
  await prisma.casting.deleteMany();
  await prisma.director.deleteMany();
  await prisma.actor.deleteMany();
});

describe('POST /api/v1/rounds/select', () => {
  it('should create a new round with selected actors (201)', async () => {
    await prisma.director.create({
      data: { id: 'dir-1', name: 'Test Director', email: 'dir@test.com' },
    });
    const casting = await prisma.casting.create({
      data: { id: 'casting-1', title: 'Casting Test', description: 'Desc', directorId: 'dir-1' },
    });
    await prisma.actor.create({
      data: { id: 'actor-1', name: 'Actor One', email: 'a1@test.com' },
    });
    await prisma.actor.create({
      data: { id: 'actor-2', name: 'Actor Two', email: 'a2@test.com' },
    });
    const round = await prisma.round.create({
      data: { id: 'round-1', number: 1, castingId: casting.id },
    });
    await prisma.roundActor.createMany({
      data: [
        { roundId: round.id, actorId: 'actor-1' },
        { roundId: round.id, actorId: 'actor-2' },
      ],
    });

    const res = await request(app)
      .post('/api/v1/rounds/select')
      .send({
        roundId: 'round-1',
        selectedActorIds: ['actor-1', 'actor-2'],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.number).toBe(2);
    expect(res.body.castingId).toBe('casting-1');
    expect(res.body.actorIds).toEqual(['actor-1', 'actor-2']);
  });

  it('should return 404 when round does not exist', async () => {
    const res = await request(app)
      .post('/api/v1/rounds/select')
      .send({
        roundId: 'round-nonexistent',
        selectedActorIds: ['actor-1'],
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });

  it('should return 400 when actor is not invited to the round', async () => {
    await prisma.director.create({
      data: { id: 'dir-1', name: 'Test Director', email: 'dir@test.com' },
    });
    await prisma.casting.create({
      data: { id: 'casting-1', title: 'Casting Test', description: 'Desc', directorId: 'dir-1' },
    });
    await prisma.actor.create({
      data: { id: 'actor-1', name: 'Actor One', email: 'a1@test.com' },
    });
    await prisma.actor.create({
      data: { id: 'actor-99', name: 'Actor Not Invited', email: 'a99@test.com' },
    });
    const round = await prisma.round.create({
      data: { id: 'round-1', number: 1, castingId: 'casting-1' },
    });
    await prisma.roundActor.create({
      data: { roundId: round.id, actorId: 'actor-1' },
    });

    const res = await request(app)
      .post('/api/v1/rounds/select')
      .send({
        roundId: 'round-1',
        selectedActorIds: ['actor-1', 'actor-99'],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not invited');
  });

  it('should return 400 when selected actors list is empty', async () => {
    await prisma.director.create({
      data: { id: 'dir-1', name: 'Test Director', email: 'dir@test.com' },
    });
    await prisma.casting.create({
      data: { id: 'casting-1', title: 'Casting Test', description: 'Desc', directorId: 'dir-1' },
    });
    await prisma.actor.create({
      data: { id: 'actor-1', name: 'Actor One', email: 'a1@test.com' },
    });
    const round = await prisma.round.create({
      data: { id: 'round-1', number: 1, castingId: 'casting-1' },
    });
    await prisma.roundActor.create({
      data: { roundId: round.id, actorId: 'actor-1' },
    });

    const res = await request(app)
      .post('/api/v1/rounds/select')
      .send({
        roundId: 'round-1',
        selectedActorIds: [],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
