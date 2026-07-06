// domain/entities/Round.ts

/**
 * @file Round.ts
 * @module domain/entities
 */

import { ActorId, CastingId, RoundId } from '../value-objects/TypedId';

export default class Round {
  private readonly _id: RoundId;
  private readonly _number: number;
  private readonly _castingId: CastingId;
  private readonly _actorIds: ActorId[];

  static create(id: RoundId, number: number, castingId: CastingId, actorIds: ActorId[]): Round {
    if (number <= 0) {
      throw new Error('Number must be greater than 0');
    }
    if (actorIds.length === 0) {
      throw new Error('Actor IDs list cannot be empty');
    }
    return new Round(id, number, castingId, actorIds);
  }

  private constructor(id: RoundId, number: number, castingId: CastingId, actorIds: ActorId[]) {
    this._id = id;
    this._number = number;
    this._castingId = castingId;
    this._actorIds = actorIds;
  }

  get id(): RoundId {
    return this._id;
  }

  get number(): number {
    return this._number;
  }

  get castingId(): CastingId {
    return this._castingId;
  }

  get actorIds(): ActorId[] {
    return this._actorIds;
  }
}
