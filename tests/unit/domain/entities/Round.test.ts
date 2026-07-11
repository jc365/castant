import Round, { type RoundParticipantEntry } from '../../../../backend/src/domain/entities/Round';
import EntityId from '../../../../backend/src/domain/value-objects/TypedId';

describe('Round Entity', () => {
  const castingId = EntityId.create<'Casting'>('casting-1');
  const participants: RoundParticipantEntry[] = [
    { id: EntityId.create<'Actor'>('actor-1'), role: 'actor' },
    { id: EntityId.create<'Actor'>('actor-2'), role: 'actor' },
  ];

  it('should create a round with create()', () => {
    const id = EntityId.create<'Round'>('round-1');
    const round = Round.create(id, 1, castingId, participants);
    expect(round.id.getValue()).toBe('round-1');
    expect(round.number).toBe(1);
    expect(round.castingId.getValue()).toBe('casting-1');
    expect(round.participants).toHaveLength(2);
    expect(round.actorIds).toHaveLength(2);
  });

  it('should throw when number is 0', () => {
    const id = EntityId.create<'Round'>('round-1');
    expect(() => Round.create(id, 0, castingId, participants)).toThrow('Number must be greater than 0');
  });

  it('should throw when participants list is empty', () => {
    const id = EntityId.create<'Round'>('round-1');
    expect(() => Round.create(id, 1, castingId, [])).toThrow('Participants list cannot be empty');
  });

  it('should return only actor IDs from actorIds getter', () => {
    const id = EntityId.create<'Round'>('round-1');
    const mixedParticipants: RoundParticipantEntry[] = [
      { id: EntityId.create<'Actor'>('actor-1'), role: 'actor' },
      { id: EntityId.create<'Actor'>('preselector-1'), role: 'preselector' },
    ];
    const round = Round.create(id, 1, castingId, mixedParticipants);
    expect(round.actorIds).toHaveLength(1);
    expect(round.actorIds[0].getValue()).toBe('actor-1');
  });

  it('should return only preselector IDs from preselectorIds getter', () => {
    const id = EntityId.create<'Round'>('round-1');
    const mixedParticipants: RoundParticipantEntry[] = [
      { id: EntityId.create<'Actor'>('actor-1'), role: 'actor' },
      { id: EntityId.create<'Actor'>('preselector-1'), role: 'preselector' },
    ];
    const round = Round.create(id, 1, castingId, mixedParticipants);
    expect(round.preselectorIds).toHaveLength(1);
    expect(round.preselectorIds[0].getValue()).toBe('preselector-1');
  });
});
