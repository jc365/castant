import Director from '../../../../backend/src/domain/entities/Director';
import EntityId from '../../../../backend/src/domain/value-objects/TypedId';
import Email from '../../../../backend/src/domain/value-objects/Email';
import FullName from '../../../../backend/src/domain/value-objects/FullName';

describe('Director Entity', () => {
  const id = EntityId.create<'Director'>('dir-1');
  const name = FullName.create('Maria Lopez');
  const email = Email.create('maria@test.com');

  it('should create a director with create()', () => {
    const director = Director.create(id, name, email);
    expect(director.id.getValue()).toBe('dir-1');
    expect(director.name.getValue()).toBe('Maria Lopez');
    expect(director.email.getValue()).toBe('maria@test.com');
  });
});
