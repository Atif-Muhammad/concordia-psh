import { Test, TestingModule } from '@nestjs/testing';
import { FrontOfficeController } from './front-office.controller';

describe('FrontOfficeController', () => {
  let controller: FrontOfficeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FrontOfficeController],
    }).compile();

    controller = module.get<FrontOfficeController>(FrontOfficeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
