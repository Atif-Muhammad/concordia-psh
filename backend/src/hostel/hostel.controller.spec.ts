import { Test, TestingModule } from '@nestjs/testing';
import { HostelController } from './hostel.controller';
import { HostelService } from './hostel.service';

describe('HostelController', () => {
  let controller: HostelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HostelController],
      providers: [
        {
          provide: HostelService,
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

    controller = module.get<HostelController>(HostelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
