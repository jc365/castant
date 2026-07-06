import EntityId from '../../../../backend/src/domain/value-objects/TypedId';

describe('EntityId Value Object', () => {
  describe('create()', () => {
    it('should create a valid EntityId with a string value', () => {
      const id = EntityId.create<'Actor'>('actor-123');
      expect(id.getValue()).toBe('actor-123');
    });

    it('should trim whitespace from the value', () => {
      const id = EntityId.create<'Actor'>('  actor-123  ');
      expect(id.getValue()).toBe('actor-123');
    });

    it('should throw error for empty string', () => {
      expect(() => EntityId.create<'Actor'>('')).toThrow('Id cannot be empty');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => EntityId.create<'Actor'>('   ')).toThrow('Id cannot be empty');
    });
  });

  describe('equals()', () => {
    it('should return true for equal ids', () => {
      const id1 = EntityId.create<'Actor'>('actor-123');
      const id2 = EntityId.create<'Actor'>('actor-123');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different ids', () => {
      const id1 = EntityId.create<'Actor'>('actor-123');
      const id2 = EntityId.create<'Actor'>('actor-456');
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('isValid()', () => {
    it('should return true for non-empty string', () => {
      expect(EntityId.isValid('valid-id')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(EntityId.isValid('')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(EntityId.isValid('   ')).toBe(false);
    });
  });
});

describe('Typed IDs', () => {
  it('should create ActorId', () => {
    const id = EntityId.create<'Actor'>('a1');
    expect(id.getValue()).toBe('a1');
  });

  it('should create DirectorId', () => {
    const id = EntityId.create<'Director'>('d1');
    expect(id.getValue()).toBe('d1');
  });

  it('should create CastingId', () => {
    const id = EntityId.create<'Casting'>('c1');
    expect(id.getValue()).toBe('c1');
  });

  it('should create RoundId', () => {
    const id = EntityId.create<'Round'>('r1');
    expect(id.getValue()).toBe('r1');
  });

  it('should create SubmissionId', () => {
    const id = EntityId.create<'Submission'>('s1');
    expect(id.getValue()).toBe('s1');
  });
});
