import { Test, TestingModule } from '@nestjs/testing';
import { FeeManagementService } from './fee-management.service';

describe('FeeManagementService', () => {
  let service: FeeManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeeManagementService],
    }).compile();

    service = module.get<FeeManagementService>(FeeManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
