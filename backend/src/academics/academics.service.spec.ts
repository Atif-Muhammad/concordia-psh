import { Test, TestingModule } from '@nestjs/testing';
import { AcademicsService } from './academics.service';

describe('AcademicsService', () => {
  let service: AcademicsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcademicsService],
    }).compile();

    service = module.get<AcademicsService>(AcademicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
