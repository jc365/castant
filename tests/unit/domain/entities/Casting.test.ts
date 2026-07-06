import Casting from '../../../../backend/src/domain/entities/Casting';
import EntityId from '../../../../backend/src/domain/value-objects/TypedId';
import CastingTitle from '../../../../backend/src/domain/value-objects/CastingTitle';
import Description from '../../../../backend/src/domain/value-objects/Description';

describe('Casting Entity', () => {
  const id = EntityId.create<'Casting'>('casting-1');
  const title = CastingTitle.create('Casting Principal');
  const desc = Description.create('Buscamos protagonista');
  const directorId = EntityId.create<'Director'>('dir-1');

  it('should create a casting with create()', () => {
    const casting = Casting.create(id, title, desc, directorId);
    expect(casting.id.getValue()).toBe('casting-1');
    expect(casting.title).toBe('Casting Principal');
    expect(casting.description).toBe('Buscamos protagonista');
    expect(casting.directorId.getValue()).toBe('dir-1');
  });

  it('should have empty rounds initially', () => {
    const casting = Casting.create(id, title, desc, directorId);
    expect(casting.rounds).toEqual([]);
  });

  it('should add a round immutably', () => {
    const casting = Casting.create(id, title, desc, directorId);
    const updated = casting.addRound({ roundNumber: 1 });
    expect(updated.rounds).toHaveLength(1);
    expect(casting.rounds).toHaveLength(0);
  });
});
