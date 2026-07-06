// domain/entities/Submission.ts

/**
 * @file Submission.ts
 * @module domain/entities
 */

import Feedback from '../value-objects/Feedback';
import Score from '../value-objects/Score';
import { ActorId, RoundId, SubmissionId } from '../value-objects/TypedId';
import VideoUrl from '../value-objects/VideoUrl';

export type SubmissionStatus = 'pending' | 'reviewed' | 'selected' | 'rejected';

export default class Submission {
  private readonly _id: SubmissionId;
  private readonly _actorId: ActorId;
  private readonly _roundId: RoundId;
  private readonly _videoUrl: VideoUrl;
  private readonly _status: SubmissionStatus;
  private readonly _score: Score;
  private readonly _feedback: Feedback;

  /**
   * Crea una nueva instancia de Submission (estado inicial: 'pending').
   */
  static create(id: SubmissionId, actorId: ActorId, roundId: RoundId, videoUrl: VideoUrl): Submission {
    return new Submission(id, actorId, roundId, videoUrl);
  }

  /**
   * Constructor privado. Usar `Submission.create()` para instanciar.
   * Acepta todos los atributos (los opcionales pueden ser null/undefined).
   */
  private constructor(
    id: SubmissionId,
    actorId: ActorId,
    roundId: RoundId,
    videoUrl: VideoUrl,
    status: SubmissionStatus = 'pending',
    score: Score = Score.none(),
    feedback: Feedback = Feedback.none()
  ) {
    this._id = id;
    this._actorId = actorId;
    this._roundId = roundId;
    this._videoUrl = videoUrl;
    this._status = status;
    this._score = score;
    this._feedback = feedback;
  }

  /**
   * Revisa la submission (solo si está en estado 'pending').
   */
  review(score: Score, feedback: Feedback): Submission {
    if (this._status !== 'pending') {
      throw new Error('Only pending submissions can be reviewed');
    }
    return new Submission(
      this._id,
      this._actorId,
      this._roundId,
      this._videoUrl,
      'reviewed',
      score,
      feedback
    );
  }

  /**
   * Selecciona la submission (solo si está en estado 'reviewed').
   */
  select(): Submission {
    if (this._status !== 'reviewed') {
      throw new Error('Only reviewed submissions can be selected');
    }
    return new Submission(
      this._id,
      this._actorId,
      this._roundId,
      this._videoUrl,
      'selected',
      this._score,
      this._feedback
    );
  }

  /**
   * Rechaza la submission (no puede estar 'selected').
   */
  reject(): Submission {
    if (this._status === 'selected') {
      throw new Error('Selected submissions cannot be rejected');
    }
    return new Submission(
      this._id,
      this._actorId,
      this._roundId,
      this._videoUrl,
      'rejected',
      this._score,
      this._feedback
    );
  }

  // ============================================
  // Getters
  // ============================================
  get id(): SubmissionId {
    return this._id;
  }

  get actorId(): ActorId {
    return this._actorId;
  }

  get roundId(): RoundId {
    return this._roundId;
  }

  get videoUrl(): VideoUrl {
    return this._videoUrl;
  }

  get status(): SubmissionStatus {
    return this._status;
  }

  get score(): Score {
    return this._score;
  }

  get feedback(): Feedback {
    return this._feedback;
  }
}