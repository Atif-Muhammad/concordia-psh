import { Test, TestingModule } from '@nestjs/testing';
import { HostelService } from './hostel.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../common/test-utils/mock-prisma';

describe('HostelService', () => {
  let service: HostelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HostelService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<HostelService>(HostelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
