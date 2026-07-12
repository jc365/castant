import User from '../../../../backend/src/domain/entities/User';
import Email from '../../../../backend/src/domain/value-objects/Email';
import FullName from '../../../../backend/src/domain/value-objects/FullName';

describe('User Entity', () => {
  const name = FullName.create('Juan Perez');
  const email = Email.create('juan@test.com');

  it('should create a user with create()', () => {
    const user = User.create(name, email, 'user-1');
    expect(user.id).toBe('user-1');
    expect(user.name.getValue()).toBe('Juan Perez');
    expect(user.email.getValue()).toBe('juan@test.com');
  });

  it('should generate an id when not provided', () => {
    const user = User.create(name, email);
    expect(user.id).toBeDefined();
    expect(user.id.startsWith('user-')).toBe(true);
  });

  it('should have empty submissions initially', () => {
    const user = User.create(name, email, 'user-1');
    expect(user.submissions).toEqual([]);
  });

  it('should add a submission immutably', () => {
    const user = User.create(name, email, 'user-1');
    const updated = user.addSubmission({ video: 'test.mp4' });
    expect(updated.submissions).toHaveLength(1);
    expect(user.submissions).toHaveLength(0);
  });
});
