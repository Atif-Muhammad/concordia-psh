import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { createMockPrismaService } from '../common/test-utils/mock-prisma';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let jwtService: { sign: jest.Mock; verify: jest.Mock; signAsync: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('signs compact tokens without password or permissions', async () => {
    const hugePermissions = {
      modules: Array.from({ length: 100 }, (_, index) => `Module-${index}`),
    };

    await service.generateTokens(
      service.buildCompactAuthPayload({
        id: 7,
        name: 'Large Staff',
        email: 'staff@example.com',
        password: 'hash-should-not-leak',
        permissions: hugePermissions,
        isTeaching: true,
      }),
    );

    const signedPayload = jwtService.signAsync.mock.calls[0][0];
    expect(signedPayload).toEqual({
      id: 7,
      email: 'staff@example.com',
      role: 'Teacher',
      isStaff: true,
      isTeaching: true,
      isNonTeaching: false,
    });
    expect(signedPayload).not.toHaveProperty('password');
    expect(signedPayload).not.toHaveProperty('permissions');
    expect(signedPayload).not.toHaveProperty('name');
  });

  it('returns safe staff login response with permissions but without password', async () => {
    const password = await bcrypt.hash('secret123', 10);
    prisma.admin.findUnique.mockResolvedValue(null);
    prisma.staff.findUnique.mockResolvedValue({
      id: 3,
      name: 'Teacher User',
      email: 'teacher@example.com',
      password,
      permissions: { modules: ['Attendance'] },
      isTeaching: true,
      isNonTeaching: false,
      specialization: 'Math',
    });

    const user = await service.login({
      email: 'teacher@example.com',
      password: 'secret123',
    });
    const safe = service.buildSafeUserResponse(user);

    expect(safe).toEqual({
      id: 3,
      name: 'Teacher User',
      role: 'Teacher',
      designation: 'Teacher - Math',
      email: 'teacher@example.com',
      permissions: { modules: ['Attendance'] },
      isStaff: true,
      isTeaching: true,
      isNonTeaching: false,
    });
    expect(safe).not.toHaveProperty('password');
  });

  it('hydrates authenticated staff with current DB permissions for RBAC', async () => {
    prisma.staff.findUnique.mockResolvedValue({
      id: 4,
      name: 'Staff User',
      email: 'staff@example.com',
      password: 'hash',
      permissions: { modules: ['Finance'], subModules: { Finance: ['expense'] } },
      isTeaching: false,
      isNonTeaching: true,
      designation: 'Accountant',
    });

    const user = await service.getAuthenticatedUser({
      id: 4,
      email: 'staff@example.com',
      role: 'Staff',
      isStaff: true,
      isTeaching: false,
      isNonTeaching: true,
    });

    expect(user?.permissions).toEqual({
      modules: ['Finance'],
      subModules: { Finance: ['expense'] },
    });
    expect(user).not.toHaveProperty('password');
  });
});
