/**
 * @file PrismaSubmissionRepository.ts
 * @module infrastructure/persistence
 */

import Submission from '../../domain/entities/Submission';
import VideoUrl from '../../domain/value-objects/VideoUrl';
import Score from '../../domain/value-objects/Score';
import Feedback from '../../domain/value-objects/Feedback';
import type ISubmissionRepository from '../../application/interfaces/ISubmissionRepository';
import prisma from './prismaClient';

export default class PrismaSubmissionRepository implements ISubmissionRepository {
  async findById(id: string): Promise<Submission | null> {
    const record = await prisma.submission.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByRoundId(roundId: string): Promise<Submission[]> {
    const records = await prisma.submission.findMany({
      where: { roundId },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByActorId(actorId: string): Promise<Submission[]> {
    const records = await prisma.submission.findMany({
      where: { actorId },
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(submission: Submission): Promise<void> {
    await prisma.submission.upsert({
      where: { id: submission.id },
      create: {
        id: submission.id,
        actorId: submission.actorId,
        roundId: submission.roundId,
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

  async delete(id: string): Promise<void> {
    await prisma.submission.delete({
      where: { id },
    });
  }

  private toDomain(record: { id: string; actorId: string; roundId: string; videoUrl: string; status: string; score: number; feedback: string }): Submission {
    const videoUrl = VideoUrl.create(record.videoUrl);
    const submission = Submission.create(record.actorId, record.roundId, videoUrl, record.id);

    if (record.status !== 'pending') {
      const score = Score.create(record.score);
      const feedback = Feedback.create(record.feedback || ' ');
      return submission.review(score, feedback);
    }

    return submission;
  }
}
