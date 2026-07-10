/**
 * @file PrismaSubmissionRepository.ts
 * @module infrastructure/persistence
 */

import Submission from '../../domain/entities/Submission';
import VideoUrl from '../../domain/value-objects/VideoUrl';
import Score from '../../domain/value-objects/Score';
import Feedback from '../../domain/value-objects/Feedback';
import EntityId, { type ActorId, type RoundId, type SubmissionId } from '../../domain/value-objects/TypedId';
import type ISubmissionRepository from '../../application/interfaces/ISubmissionRepository';
import prisma from './prismaClient';

export default class PrismaSubmissionRepository implements ISubmissionRepository {
  async findById(id: SubmissionId): Promise<Submission | null> {
    const record = await prisma.submission.findUnique({
      where: { id: id.getValue() },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByRoundId(roundId: RoundId): Promise<Submission[]> {
    const records = await prisma.submission.findMany({
      where: { roundId: roundId.getValue() },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByActorId(actorId: ActorId): Promise<Submission[]> {
    const records = await prisma.submission.findMany({
      where: { actorId: actorId.getValue() },
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(submission: Submission): Promise<void> {
    await prisma.submission.upsert({
      where: { id: submission.id.getValue() },
      create: {
        id: submission.id.getValue(),
        actorId: submission.actorId.getValue(),
        roundId: submission.roundId.getValue(),
        videoUrl: submission.videoUrl.getValue(),
        status: submission.status,
        score: submission.score.getValue() ?? 0,
        feedback: submission.feedback.getValue() ?? '',
      },
      update: {
        status: submission.status,
        score: submission.score.getValue() ?? 0,
        feedback: submission.feedback.getValue() ?? '',
      },
    });
  }

  async delete(id: SubmissionId): Promise<void> {
    await prisma.submission.delete({
      where: { id: id.getValue() },
    });
  }

  private toDomain(record: { id: string; actorId: string; roundId: string; videoUrl: string; status: string; score: number; feedback: string }): Submission {
    const submissionId = EntityId.create<'Submission'>(record.id);
    const actorId = EntityId.create<'Actor'>(record.actorId);
    const roundId = EntityId.create<'Round'>(record.roundId);
    const videoUrl = VideoUrl.create(record.videoUrl);
    const submission = Submission.create(submissionId, actorId, roundId, videoUrl);

    if (record.status !== 'pending') {
      const score = Score.create(record.score);
      const feedback = Feedback.create(record.feedback || ' ');
      return submission.review(score, feedback);
    }

    return submission;
  }
}
