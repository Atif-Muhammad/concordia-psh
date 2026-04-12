import { Test, TestingModule } from '@nestjs/testing';
import { FeeManagementController } from './fee-management.controller';
import { FeeManagementService } from './fee-management.service';

describe('FeeManagementController', () => {
  let controller: FeeManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeeManagementController],
      providers: [
        {
          provide: FeeManagementService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FeeManagementController>(FeeManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
