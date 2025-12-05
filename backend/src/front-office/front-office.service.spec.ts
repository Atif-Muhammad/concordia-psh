import { Test, TestingModule } from '@nestjs/testing';
import { FrontOfficeService } from './front-office.service';

describe('FrontOfficeService', () => {
  let service: FrontOfficeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FrontOfficeService],
    }).compile();

    service = module.get<FrontOfficeService>(FrontOfficeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
