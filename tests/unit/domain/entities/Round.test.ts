import Round from '../../../../backend/src/domain/entities/Round';
import EntityId from '../../../../backend/src/domain/value-objects/TypedId';

describe('Round Entity', () => {
  const castingId = EntityId.create<'Casting'>('casting-1');
  const actorIds = [
    EntityId.create<'Actor'>('actor-1'),
    EntityId.create<'Actor'>('actor-2'),
  ];

  it('should create a round with create()', () => {
    const id = EntityId.create<'Round'>('round-1');
    const round = Round.create(id, 1, castingId, actorIds);
    expect(round.id.getValue()).toBe('round-1');
    expect(round.number).toBe(1);
    expect(round.castingId.getValue()).toBe('casting-1');
    expect(round.actorIds).toHaveLength(2);
  });

  it('should throw when number is 0', () => {
    const id = EntityId.create<'Round'>('round-1');
    expect(() => Round.create(id, 0, castingId, actorIds)).toThrow('Number must be greater than 0');
  });

  it('should throw when actorIds is empty', () => {
    const id = EntityId.create<'Round'>('round-1');
    expect(() => Round.create(id, 1, castingId, [])).toThrow('Actor IDs list cannot be empty');
  });
});
