/**
 * @file castings.test.ts
 * @module tests/integration/api/v1/castings
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

describe('POST /api/v1/castings', () => {
  it('should create a casting when director exists (201)', async () => {
    await prisma.director.create({
      data: { id: 'dir-1', name: 'Test Director', email: 'dir@test.com' },
    });

    const res = await request(app)
      .post('/api/v1/castings')
      .send({
        title: 'Casting Principal',
        description: 'Buscamos protagonista',
        directorId: 'dir-1',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Casting Principal');
    expect(res.body.description).toBe('Buscamos protagonista');
    expect(res.body.directorId).toBe('dir-1');
  });

  it('should return 404 when director does not exist', async () => {
    const res = await request(app)
      .post('/api/v1/castings')
      .send({
        title: 'Casting Principal',
        description: 'Buscamos protagonista',
        directorId: 'dir-nonexistent',
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });

  it('should return 400 when title is empty', async () => {
    await prisma.director.create({
      data: { id: 'dir-1', name: 'Test Director', email: 'dir@test.com' },
    });

    const res = await request(app)
      .post('/api/v1/castings')
      .send({
        title: '',
        description: 'Buscamos protagonista',
        directorId: 'dir-1',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
