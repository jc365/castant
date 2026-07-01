// domain/entities/Round.ts

/**
 * @file Round.ts
 * @module domain/entities
 */

export default class Round {
  private readonly _id: string;
  private readonly _number: number;
  private readonly _castingId: string;
  private readonly _actorIds: string[];

  static create(id: string, number: number, castingId: string, actorIds: string[]): Round {
    if (number <= 0) {
      throw new Error('Number must be greater than 0');
    }
    if (actorIds.length === 0) {
      throw new Error('Actor IDs list cannot be empty');
    }
    return new Round(id, number, castingId, actorIds);
  }

  private constructor(id: string, number: number, castingId: string, actorIds: string[]) {
    this._id = id;
    this._number = number;
    this._castingId = castingId;
    this._actorIds = actorIds;
  }

  get id(): string {
    return this._id;
  }

  get number(): number {
    return this._number;
  }

  get castingId(): string {
    return this._castingId;
  }

  get actorIds(): string[] {
    return this._actorIds;
  }
}

