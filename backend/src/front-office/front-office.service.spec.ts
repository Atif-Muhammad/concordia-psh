import { Test, TestingModule } from '@nestjs/testing';
import { FrontOfficeService } from './front-office.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../common/test-utils/mock-prisma';

describe('FrontOfficeService', () => {
  let service: FrontOfficeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrontOfficeService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<FrontOfficeService>(FrontOfficeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
