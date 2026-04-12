import { Test, TestingModule } from '@nestjs/testing';
import { AcademicsService } from './academics.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../common/test-utils/mock-prisma';

describe('AcademicsService', () => {
  let service: AcademicsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicsService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<AcademicsService>(AcademicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
