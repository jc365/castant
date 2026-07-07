/**
 * @file index.ts
 * @module backend
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import logger from './infrastructure/logging/logger';
import { CreateActorUseCase } from './application/use-cases/CreateActorUseCase';
import PrismaActorRepository from './infrastructure/persistence/PrismaActorRepository';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const actorRepository = new PrismaActorRepository();
const createActorUseCase = new CreateActorUseCase(actorRepository);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
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
    logger.error({ error: message }, 'POST /actors failed');
    res.status(400).json({ error: message });
  }
});

app.listen(port, () => {
  logger.info({ port }, 'Server started');
});
