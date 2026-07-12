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
import { ReviewSubmissionUseCase } from '../../../application/use-cases/submissions/ReviewSubmissionUseCase';
import PrismaUserRepository from '../../persistence/PrismaUserRepository';
import PrismaCastingRepository from '../../persistence/PrismaCastingRepository';
import PrismaRoundRepository from '../../persistence/PrismaRoundRepository';
import PrismaSubmissionRepository from '../../persistence/PrismaSubmissionRepository';
import requestLogger from '../../logging/requestContext';

const router = Router();

const userRepository = new PrismaUserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository);

const castingRepository = new PrismaCastingRepository();
const createCastingUseCase = new CreateCastingUseCase(castingRepository, userRepository);

const roundRepository = new PrismaRoundRepository();
const submissionRepository = new PrismaSubmissionRepository();
const submitVideoUseCase = new SubmitVideoUseCase(userRepository, roundRepository, submissionRepository);

const selectActorsUseCase = new SelectActorsForNextRoundUseCase(roundRepository, submissionRepository);
const manageParticipantsUseCase = new ManageRoundParticipantsUseCase(userRepository, roundRepository);
const reviewSubmissionUseCase = new ReviewSubmissionUseCase(submissionRepository, roundRepository, castingRepository);

router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  requestLogger.info({ id }, 'GET /users/:id');

  try {
    const user = await userRepository.findById(id);

    if (!user) {
      requestLogger.warn({ id }, 'GET /users/:id: not found');
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
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
      id: user.id,
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
    const { title, description, directorEmail, directorName } = req.body;
    const casting = await createCastingUseCase.execute({ title, description, directorEmail, directorName });
    res.status(201).json({
      id: casting.id,
      title: casting.title,
      description: casting.description,
      participants: casting.participants.map((p) => ({
        userId: p.userId,
        role: p.role,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    requestLogger.error({ error: message }, 'POST /castings failed');
    res.status(400).json({ error: message });
  }
});

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  requestLogger.info({ id }, 'DELETE /users/:id');

  try {
    const existing = await userRepository.findById(id);

    if (!existing) {
      requestLogger.warn({ id }, 'DELETE /users/:id: not found');
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await userRepository.delete(id);

    requestLogger.info({ id }, 'DELETE /users/:id: completed');
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    requestLogger.error({ error: message, id }, 'DELETE /users/:id failed');
    res.status(400).json({ error: message });
  }
});

router.get('/castings', async (_req, res) => {
  requestLogger.info({}, 'GET /castings');

  try {
    const castings = await castingRepository.findAll();
    res.json(castings.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      participants: c.participants.map((p) => ({
        userId: p.userId,
        role: p.role,
      })),
    })));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    requestLogger.error({ error: message }, 'GET /castings failed');
    res.status(500).json({ error: message });
  }
});

router.get('/castings/:id', async (req, res) => {
  const { id } = req.params;
  requestLogger.info({ id }, 'GET /castings/:id');

  try {
    const casting = await castingRepository.findById(id);

    if (!casting) {
      requestLogger.warn({ id }, 'GET /castings/:id: not found');
      res.status(404).json({ error: 'Casting not found' });
      return;
    }

    const rounds = await roundRepository.findByCastingId(casting.id);
    const roundsData = rounds.map((r) => ({
      id: r.id,
      number: r.number,
      participants: r.participants.map((p) => ({
        actorId: p.id,
        role: p.role,
      })),
    }));

    res.json({
      id: casting.id,
      title: casting.title,
      description: casting.description,
      participants: casting.participants.map((p) => ({
        userId: p.userId,
        role: p.role,
      })),
      rounds: roundsData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    requestLogger.error({ error: message, id }, 'GET /castings/:id failed');
    res.status(400).json({ error: message });
  }
});

router.get('/rounds/:id', async (req, res) => {
  const { id } = req.params;
  requestLogger.info({ id }, 'GET /rounds/:id');

  try {
    const round = await roundRepository.findById(id);

    if (!round) {
      requestLogger.warn({ id }, 'GET /rounds/:id: not found');
      res.status(404).json({ error: 'Round not found' });
      return;
    }

    res.json({
      id: round.id,
      number: round.number,
      castingId: round.castingId,
      participants: round.participants.map((p) => ({
        actorId: p.id,
        role: p.role,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    requestLogger.error({ error: message, id }, 'GET /rounds/:id failed');
    res.status(400).json({ error: message });
  }
});

router.get('/rounds/:id/submissions', async (req, res) => {
  const { id } = req.params;
  requestLogger.info({ id }, 'GET /rounds/:id/submissions');

  try {
    const round = await roundRepository.findById(id);

    if (!round) {
      requestLogger.warn({ id }, 'GET /rounds/:id/submissions: round not found');
      res.status(404).json({ error: 'Round not found' });
      return;
    }

    const submissions = await submissionRepository.findByRoundId(round.id);
    res.json(submissions.map((s) => ({
      id: s.id,
      actorId: s.actorId,
      roundId: s.roundId,
      videoUrl: s.videoUrl.getValue(),
      status: s.status,
      score: s.score.getValue(),
      feedback: s.feedback.getValue(),
    })));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    requestLogger.error({ error: message, id }, 'GET /rounds/:id/submissions failed');
    res.status(400).json({ error: message });
  }
});

router.post('/submissions', async (req, res) => {
  requestLogger.info({}, 'POST /submissions');

  try {
    const { actorId, roundId, videoUrl } = req.body;
    const submission = await submitVideoUseCase.execute({ actorId, roundId, videoUrl });
    res.status(201).json({
      id: submission.id,
      actorId: submission.actorId,
      roundId: submission.roundId,
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
      id: round.id,
      number: round.number,
      castingId: round.castingId,
      actorIds: round.actorIds,
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
      id: round.id,
      number: round.number,
      castingId: round.castingId,
      participants: round.participants.map((p) => ({
        actorId: p.id,
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

router.patch('/submissions/:id/review', async (req, res) => {
  const { id } = req.params;
  requestLogger.info({ id }, 'PATCH /submissions/:id/review');

  try {
    const { score, feedback, directorId } = req.body;
    const submission = await reviewSubmissionUseCase.execute({
      submissionId: id,
      score,
      feedback,
      directorId,
    });
    res.json({
      id: submission.id,
      actorId: submission.actorId,
      roundId: submission.roundId,
      videoUrl: submission.videoUrl.getValue(),
      status: submission.status,
      score: submission.score.getValue(),
      feedback: submission.feedback.getValue(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('not found')) {
      requestLogger.error({ error: message }, 'PATCH /submissions/:id/review: not found');
      res.status(404).json({ error: message });
      return;
    }
    if (message.includes('already reviewed')) {
      requestLogger.error({ error: message }, 'PATCH /submissions/:id/review: already reviewed');
      res.status(400).json({ error: message });
      return;
    }
    if (message.includes('not the director')) {
      requestLogger.error({ error: message }, 'PATCH /submissions/:id/review: not authorized');
      res.status(403).json({ error: message });
      return;
    }
    if (message.includes('Score must be') || message.includes('Feedback')) {
      requestLogger.error({ error: message }, 'PATCH /submissions/:id/review: invalid input');
      res.status(400).json({ error: message });
      return;
    }
    requestLogger.error({ error: message }, 'PATCH /submissions/:id/review failed');
    res.status(400).json({ error: message });
  }
});

export default router;
