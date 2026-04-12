import { Test, TestingModule } from '@nestjs/testing';
import { FeeManagementService } from './fee-management.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../common/test-utils/mock-prisma';

describe('FeeManagementService', () => {
  let service: FeeManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeManagementService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<FeeManagementService>(FeeManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
