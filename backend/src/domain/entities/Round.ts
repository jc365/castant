// domain/entities/Round.ts

/**
 * @file Round.ts
 * @module domain/entities
 */

import { ActorId, CastingId, RoundId } from '../value-objects/TypedId';

export type RoundParticipantRole = 'actor' | 'preselector';

export interface RoundParticipantEntry {
  id: ActorId;
  role: RoundParticipantRole;
}

export default class Round {
  private readonly _id: RoundId;
  private readonly _number: number;
  private readonly _castingId: CastingId;
  private readonly _participants: RoundParticipantEntry[];

  static create(id: RoundId, number: number, castingId: CastingId, participants: RoundParticipantEntry[]): Round {
    if (number <= 0) {
      throw new Error('Number must be greater than 0');
    }
    if (participants.length === 0) {
      throw new Error('Participants list cannot be empty');
    }
    return new Round(id, number, castingId, participants);
  }

  private constructor(id: RoundId, number: number, castingId: CastingId, participants: RoundParticipantEntry[]) {
    this._id = id;
    this._number = number;
    this._castingId = castingId;
    this._participants = participants;
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

  get participants(): RoundParticipantEntry[] {
    return this._participants;
  }

  get actorIds(): ActorId[] {
    return this._participants.filter(p => p.role === 'actor').map(p => p.id);
  }

  get preselectorIds(): ActorId[] {
    return this._participants.filter(p => p.role === 'preselector').map(p => p.id);
  }
}
