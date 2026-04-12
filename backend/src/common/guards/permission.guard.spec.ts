import { PermissionsGuard } from './permission.guard';
import { Reflector } from '@nestjs/core';

describe('PermissionsGuard', () => {
  it('should be defined', () => {
    const reflector = new Reflector();
    expect(new PermissionsGuard(reflector)).toBeDefined();
  });
});
