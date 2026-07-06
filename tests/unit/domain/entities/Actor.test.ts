import Actor from '../../../../backend/src/domain/entities/Actor';
import EntityId from '../../../../backend/src/domain/value-objects/TypedId';
import Email from '../../../../backend/src/domain/value-objects/Email';
import FullName from '../../../../backend/src/domain/value-objects/FullName';

describe('Actor Entity', () => {
  const id = EntityId.create<'Actor'>('actor-1');
  const name = FullName.create('Juan Perez');
  const email = Email.create('juan@test.com');

  it('should create an actor with create()', () => {
    const actor = Actor.create(id, name, email);
    expect(actor.id.getValue()).toBe('actor-1');
    expect(actor.name.getValue()).toBe('Juan Perez');
    expect(actor.email.getValue()).toBe('juan@test.com');
  });

  it('should have empty submissions initially', () => {
    const actor = Actor.create(id, name, email);
    expect(actor.submissions).toEqual([]);
  });

  it('should add a submission immutably', () => {
    const actor = Actor.create(id, name, email);
    const updated = actor.addSubmission({ video: 'test.mp4' });
    expect(updated.submissions).toHaveLength(1);
    expect(actor.submissions).toHaveLength(0);
  });
});
