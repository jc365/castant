/**
 * @file routes.ts
 * @module infrastructure/api/v1/routes
 */

import { Router } from 'express';
import { CreateActorUseCase } from '../../../application/use-cases/CreateActorUseCase';
import { CreateCastingUseCase } from '../../../application/use-cases/CreateCastingUseCase';
import PrismaActorRepository from '../../persistence/PrismaActorRepository';
import PrismaCastingRepository from '../../persistence/PrismaCastingRepository';
import PrismaDirectorRepository from '../../persistence/PrismaDirectorRepository';
import EntityId from '../../../domain/value-objects/TypedId';
import requestLogger from '../../logging/requestContext';

const router = Router();

const actorRepository = new PrismaActorRepository();
const createActorUseCase = new CreateActorUseCase(actorRepository);

const castingRepository = new PrismaCastingRepository();
const directorRepository = new PrismaDirectorRepository();
const createCastingUseCase = new CreateCastingUseCase(castingRepository, directorRepository);

router.get('/actors/:id', async (req, res) => {
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

router.post('/actors', async (req, res) => {
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

router.post('/castings', async (req, res) => {
  requestLogger.info({}, 'POST /castings');

  try {
    const { title, description, directorId } = req.body;
    const casting = await createCastingUseCase.execute({ title, description, directorId });
    res.status(201).json({
      id: casting.id.getValue(),
      title: casting.title,
      description: casting.description,
      directorId: casting.directorId.getValue(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('not found')) {
      requestLogger.error({ error: message }, 'POST /castings: director not found');
      res.status(404).json({ error: message });
      return;
    }
    requestLogger.error({ error: message }, 'POST /castings failed');
    res.status(400).json({ error: message });
  }
});

router.delete('/actors/:id', async (req, res) => {
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

export default router;
