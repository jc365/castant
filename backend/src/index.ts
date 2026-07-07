/**
 * @file index.ts
 * @module backend
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import logger from './infrastructure/logging/logger';
import requestLogger, { requestContextMiddleware, getRequestId } from './infrastructure/logging/requestContext';
import { CreateActorUseCase } from './application/use-cases/CreateActorUseCase';
import PrismaActorRepository from './infrastructure/persistence/PrismaActorRepository';
import EntityId from './domain/value-objects/TypedId';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(requestContextMiddleware);

import pinoHttp from 'pino-http';

const httpLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} → ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} → ${res.statusCode} ${err.message}`,
  customProps: () => {
    const requestId = getRequestId();
    return requestId ? { requestId } : {};
  },
  customAttributeKeys: { req: 'request', res: 'response' },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      ...(req.body ? { body: req.body } : {}),
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
});

app.use(httpLogger);

const actorRepository = new PrismaActorRepository();
const createActorUseCase = new CreateActorUseCase(actorRepository);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/actors/:id', async (req, res) => {
  const { id } = req.params;
  requestLogger.info({ id }, 'GET /actors/:id');

  try {
    const actorId = EntityId.create<'Actor'>(id);
    const actor = await actorRepository.findById(actorId);

    if (!actor) {
      requestLogger.warn({ id }, 'GET /actors/:id: not found');
      res.status(404).json({ error: 'Actor not found' });
      return;
    }

    res.json({
      id: actor.id.getValue(),
      name: actor.name.getValue(),
      email: actor.email.getValue(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    requestLogger.error({ error: message, id }, 'GET /actors/:id failed');
    res.status(400).json({ error: message });
  }
});

app.post('/actors', async (req, res) => {
  try {
    const { id, name, email } = req.body;
    const actor = await createActorUseCase.execute({ id, name, email });
    res.status(201).json({
      id: actor.id.getValue(),
      name: actor.name.getValue(),
      email: actor.email.getValue(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    requestLogger.error({ error: message }, 'POST /actors failed');
    res.status(400).json({ error: message });
  }
});

app.delete('/actors/:id', async (req, res) => {
  const { id } = req.params;
  requestLogger.info({ id }, 'DELETE /actors/:id');

  try {
    const actorId = EntityId.create<'Actor'>(id);
    const existing = await actorRepository.findById(actorId);

    if (!existing) {
      requestLogger.warn({ id }, 'DELETE /actors/:id: not found');
      res.status(404).json({ error: 'Actor not found' });
      return;
    }

    await actorRepository.delete(actorId);

    requestLogger.info({ id }, 'DELETE /actors/:id: completed');
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    requestLogger.error({ error: message, id }, 'DELETE /actors/:id failed');
    res.status(400).json({ error: message });
  }
});

app.listen(port, () => {
  logger.info({ port }, 'Server started');
});
