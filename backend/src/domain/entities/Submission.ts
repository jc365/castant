// domain/entities/Submission.ts

/**
 * @file Submission.ts
 * @module domain/entities
 */

export type SubmissionStatus = 'pending' | 'reviewed' | 'selected' | 'rejected';

export default class Submission {
  private readonly _id: string;
  private readonly _actorId: string;
  private readonly _roundId: string;
  private readonly _videoUrl: string;
  private readonly _status: SubmissionStatus;
  private readonly _score: number | null;
  private readonly _feedback: string | null;

  /**
   * Crea una nueva instancia de Submission (estado inicial: 'pending').
   */
  static create(id: string, actorId: string, roundId: string, videoUrl: string): Submission {
    if (!videoUrl || videoUrl.trim().length === 0) {
      throw new Error('Video URL cannot be empty');
    }
    return new Submission(id, actorId, roundId, videoUrl.trim());
  }

  /**
   * Constructor privado. Usar `Submission.create()` para instanciar.
   * Acepta todos los atributos (los opcionales pueden ser null/undefined).
   */
  private constructor(
    id: string,
    actorId: string,
    roundId: string,
    videoUrl: string,
    status: SubmissionStatus = 'pending',
    score: number | null = null,
    feedback: string | null = null
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
  review(score: number, feedback: string): Submission {
    if (this._status !== 'pending') {
      throw new Error('Only pending submissions can be reviewed');
    }
    if (score < 0 || score > 10) {
      throw new Error('Score must be between 0 and 10');
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
  get id(): string {
    return this._id;
  }

  get actorId(): string {
    return this._actorId;
  }

  get roundId(): string {
    return this._roundId;
  }

  get videoUrl(): string {
    return this._videoUrl;
  }

  get status(): SubmissionStatus {
    return this._status;
  }

  get score(): number | null {
    return this._score;
  }

  get feedback(): string | null {
    return this._feedback;
  }
}