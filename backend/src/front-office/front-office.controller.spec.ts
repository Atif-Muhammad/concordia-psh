import { Test, TestingModule } from '@nestjs/testing';
import { FrontOfficeController } from './front-office.controller';
import { FrontOfficeService } from './front-office.service';

describe('FrontOfficeController', () => {
  let controller: FrontOfficeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FrontOfficeController],
      providers: [
        {
          provide: FrontOfficeService,
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

    controller = module.get<FrontOfficeController>(FrontOfficeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
