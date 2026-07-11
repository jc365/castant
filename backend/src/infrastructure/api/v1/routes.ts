/**
 * @file routes.ts
 * @module infrastructure/api/v1/routes
 */

import { Router } from 'express';
import { CreateUserUseCase } from '../../../application/use-cases/CreateUserUseCase';
import { CreateCastingUseCase } from '../../../application/use-cases/CreateCastingUseCase';
import { SubmitVideoUseCase } from '../../../application/use-cases/SubmitVideoUseCase';
import { SelectActorsForNextRoundUseCase } from '../../../application/use-cases/SelectActorsForNextRoundUseCase';
import { ManageRoundParticipantsUseCase } from '../../../application/use-cases/rounds/ManageRoundParticipantsUseCase';
import PrismaUserRepository from '../../persistence/PrismaUserRepository';
import PrismaCastingRepository from '../../persistence/PrismaCastingRepository';
import PrismaDirectorRepository from '../../persistence/PrismaDirectorRepository';
import PrismaRoundRepository from '../../persistence/PrismaRoundRepository';
import PrismaSubmissionRepository from '../../persistence/PrismaSubmissionRepository';
import EntityId from '../../../domain/value-objects/TypedId';
import requestLogger from '../../logging/requestContext';

const router = Router();

const userRepository = new PrismaUserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository);

const castingRepository = new PrismaCastingRepository();
const directorRepository = new PrismaDirectorRepository();
const createCastingUseCase = new CreateCastingUseCase(castingRepository, directorRepository);

const roundRepository = new PrismaRoundRepository();
const submissionRepository = new PrismaSubmissionRepository();
const submitVideoUseCase = new SubmitVideoUseCase(userRepository, roundRepository, submissionRepository);

const selectActorsUseCase = new SelectActorsForNextRoundUseCase(roundRepository, submissionRepository);
const manageParticipantsUseCase = new ManageRoundParticipantsUseCase(userRepository, roundRepository);

router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  requestLogger.info({ id }, 'GET /users/:id');

  try {
    const userId = EntityId.create<'User'>(id);
    const user = await userRepository.findById(userId);

    if (!user) {
      requestLogger.warn({ id }, 'GET /users/:id: not found');
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id.getValue(),
      name: user.name.getValue(),
      email: user.email.getValue(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    requestLogger.error({ error: message, id }, 'GET /users/:id failed');
    res.status(400).json({ error: message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { id, name, email } = req.body;
    const user = await createUserUseCase.execute({ id, name, email });
    res.status(201).json({
      id: user.id.getValue(),
      name: user.name.getValue(),
      email: user.email.getValue(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    requestLogger.error({ error: message }, 'POST /users failed');
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

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  requestLogger.info({ id }, 'DELETE /users/:id');

  try {
    const userId = EntityId.create<'User'>(id);
    const existing = await userRepository.findById(userId);

    if (!existing) {
      requestLogger.warn({ id }, 'DELETE /users/:id: not found');
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await userRepository.delete(userId);

    requestLogger.info({ id }, 'DELETE /users/:id: completed');
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    requestLogger.error({ error: message, id }, 'DELETE /users/:id failed');
    res.status(400).json({ error: message });
  }
});

router.post('/submissions', async (req, res) => {
  requestLogger.info({}, 'POST /submissions');

  try {
    const { actorId, roundId, videoUrl } = req.body;
    const submission = await submitVideoUseCase.execute({ actorId, roundId, videoUrl });
    res.status(201).json({
      id: submission.id.getValue(),
      actorId: submission.actorId.getValue(),
      roundId: submission.roundId.getValue(),
      videoUrl: submission.videoUrl.getValue(),
      status: submission.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('not found')) {
      requestLogger.error({ error: message }, 'POST /submissions: not found');
      res.status(404).json({ error: message });
      return;
    }
    if (message.includes('not invited')) {
      requestLogger.error({ error: message }, 'POST /submissions: user not invited');
      res.status(400).json({ error: message });
      return;
    }
    if (message.includes('Invalid video URL') || message.includes('Video URL')) {
      requestLogger.error({ error: message }, 'POST /submissions: invalid video URL');
      res.status(400).json({ error: message });
      return;
    }
    requestLogger.error({ error: message }, 'POST /submissions failed');
    res.status(400).json({ error: message });
  }
});

router.post('/rounds/select', async (req, res) => {
  requestLogger.info({}, 'POST /rounds/select');

  try {
    const { roundId, selectedActorIds } = req.body;
    const round = await selectActorsUseCase.execute({ roundId, selectedActorIds });
    res.status(201).json({
      id: round.id.getValue(),
      number: round.number,
      castingId: round.castingId.getValue(),
      actorIds: round.actorIds.map((a) => a.getValue()),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('not found')) {
      requestLogger.error({ error: message }, 'POST /rounds/select: round not found');
      res.status(404).json({ error: message });
      return;
    }
    if (message.includes('not invited')) {
      requestLogger.error({ error: message }, 'POST /rounds/select: user not invited');
      res.status(400).json({ error: message });
      return;
    }
    if (message.includes('empty') || message.includes('Empty')) {
      requestLogger.error({ error: message }, 'POST /rounds/select: empty selection');
      res.status(400).json({ error: message });
      return;
    }
    requestLogger.error({ error: message }, 'POST /rounds/select failed');
    res.status(400).json({ error: message });
  }
});

router.post('/rounds/participants', async (req, res) => {
  requestLogger.info({}, 'POST /rounds/participants');

  try {
    const { roundId, actors, preselectors, createNewRound } = req.body;
    const round = await manageParticipantsUseCase.execute({ roundId, actors: actors || [], preselectors: preselectors || [], createNewRound });
    res.status(201).json({
      id: round.id.getValue(),
      number: round.number,
      castingId: round.castingId.getValue(),
      participants: round.participants.map((p) => ({
        actorId: p.id.getValue(),
        role: p.role,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('not found')) {
      requestLogger.error({ error: message }, 'POST /rounds/participants: round not found');
      res.status(404).json({ error: message });
      return;
    }
    if (message.includes('empty') || message.includes('Empty')) {
      requestLogger.error({ error: message }, 'POST /rounds/participants: empty participants');
      res.status(400).json({ error: message });
      return;
    }
    requestLogger.error({ error: message }, 'POST /rounds/participants failed');
    res.status(400).json({ error: message });
  }
});

export default router;
