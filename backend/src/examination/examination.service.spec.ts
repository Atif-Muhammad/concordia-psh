import { Test, TestingModule } from '@nestjs/testing';
import { ExaminationService } from './examination.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../common/test-utils/mock-prisma';

describe('ExaminationService', () => {
  let service: ExaminationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExaminationService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<ExaminationService>(ExaminationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
