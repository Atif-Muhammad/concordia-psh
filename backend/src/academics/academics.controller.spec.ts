import { Test, TestingModule } from '@nestjs/testing';
import { AcademicsController } from './academics.controller';

describe('AcademicsController', () => {
  let controller: AcademicsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicsController],
    }).compile();

    controller = module.get<AcademicsController>(AcademicsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
