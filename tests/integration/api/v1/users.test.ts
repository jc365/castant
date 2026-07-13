/**
 * @file users.test.ts
 * @module tests/integration/api/v1/users
 */

import request from 'supertest';
import app from '../../../../backend/src/index';
import prisma from '../../../../backend/src/infrastructure/persistence/prismaClient';

beforeEach(async () => {
  await prisma.bitacora.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.round.deleteMany();
  await prisma.casting.deleteMany();
  await prisma.user.deleteMany();
});

describe('POST /api/v1/users', () => {
  it('should create a user with provided id (201)', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({
        id: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('user-1');
    expect(res.body.name).toBe('Test User');
    expect(res.body.email).toBe('test@test.com');
  });

  it('should create a user without id (auto-generate) (201)', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'Test User',
        email: 'test@test.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.id.startsWith('user-')).toBe(true);
    expect(res.body.name).toBe('Test User');
    expect(res.body.email).toBe('test@test.com');
  });

  it('should return 400 when email is already registered', async () => {
    await prisma.user.create({
      data: { id: 'user-existing', name: 'Existing', email: 'test@test.com' },
    });

    const res = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'Test User',
        email: 'test@test.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already registered');
  });

  it('should return 400 when name is empty', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({
        name: '',
        email: 'test@test.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/v1/users', () => {
  it('should return empty array when no users exist (200)', async () => {
    const res = await request(app).get('/api/v1/users');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return all users (200)', async () => {
    await prisma.user.createMany({
      data: [
        { id: 'user-1', name: 'User One', email: 'one@test.com' },
        { id: 'user-2', name: 'User Two', email: 'two@test.com' },
      ],
    });

    const res = await request(app).get('/api/v1/users');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'user-1', name: 'User One', email: 'one@test.com' }),
        expect.objectContaining({ id: 'user-2', name: 'User Two', email: 'two@test.com' }),
      ]),
    );
  });
});
