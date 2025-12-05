import { Test, TestingModule } from '@nestjs/testing';
import { FeeManagementController } from './fee-management.controller';

describe('FeeManagementController', () => {
  let controller: FeeManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeeManagementController],
    }).compile();

    controller = module.get<FeeManagementController>(FeeManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
