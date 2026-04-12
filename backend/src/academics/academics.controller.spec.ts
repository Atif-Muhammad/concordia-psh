import { Test, TestingModule } from '@nestjs/testing';
import { AcademicsController } from './academics.controller';
import { AcademicsService } from './academics.service';

describe('AcademicsController', () => {
  let controller: AcademicsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicsController],
      providers: [
        {
          provide: AcademicsService,
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

    controller = module.get<AcademicsController>(AcademicsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
