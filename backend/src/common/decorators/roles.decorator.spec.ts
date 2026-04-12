import { Roles } from './roles.decorator';

describe('Roles Decorator', () => {
  it('should be defined', () => {
    expect(Roles).toBeDefined();
  });

  it('should return a decorator function', () => {
    const decorator = Roles('admin', 'user');
    expect(typeof decorator).toBe('function');
  });
});
