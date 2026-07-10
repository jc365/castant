// domain/entities/Round.ts

/**
 * @file Round.ts
 * @module domain/entities
 */

import { ActorId, CastingId, RoundId } from '../value-objects/TypedId';

export type RoundActorRole = 'actor' | 'preselector';

export interface RoundActorEntry {
  id: ActorId;
  role: RoundActorRole;
}

export default class Round {
  private readonly _id: RoundId;
  private readonly _number: number;
  private readonly _castingId: CastingId;
  private readonly _actors: RoundActorEntry[];

  static create(id: RoundId, number: number, castingId: CastingId, actors: RoundActorEntry[]): Round {
    if (number <= 0) {
      throw new Error('Number must be greater than 0');
    }
    if (actors.length === 0) {
      throw new Error('Actors list cannot be empty');
    }
    return new Round(id, number, castingId, actors);
  }

  private constructor(id: RoundId, number: number, castingId: CastingId, actors: RoundActorEntry[]) {
    this._id = id;
    this._number = number;
    this._castingId = castingId;
    this._actors = actors;
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

  get actors(): RoundActorEntry[] {
    return this._actors;
  }

  get actorIds(): ActorId[] {
    return this._actors.filter(a => a.role === 'actor').map(a => a.id);
  }

  get preselectorIds(): ActorId[] {
    return this._actors.filter(a => a.role === 'preselector').map(a => a.id);
  }
}
