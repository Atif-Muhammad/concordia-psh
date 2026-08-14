import { Test, TestingModule } from '@nestjs/testing';
import { StudentService } from './student.service';
import { PrismaService } from '../prisma/prisma.service';
import { FeeManagementService } from '../fee-management/fee-management.service';
import { createMockPrismaService } from '../common/test-utils/mock-prisma';

describe('StudentService', () => {
  let service: StudentService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: FeeManagementService,
          useValue: {
            createChallan: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('gets latest roll number only for the requested prefix', async () => {
    prisma.student.findMany.mockResolvedValue([
      { rollNumber: 'BSCS-26-002' },
      { rollNumber: 'BSCS-26-005' },
    ]);

    await expect(service.getLatestRollNumber('BSCS-26-')).resolves.toBe('BSCS-26-005');
    expect(prisma.student.findMany).toHaveBeenCalledWith({
      where: { rollNumber: { startsWith: 'BSCS-26-' } },
      select: { rollNumber: true },
    });
  });

  describe('getLatestRollNumbersBatch', () => {
    beforeEach(() => {
      prisma.academicSession.findUnique.mockResolvedValue({ name: '2026-2027' });
    });

    it('returns 001 when no existing students match a prefix', async () => {
      prisma.program.findMany.mockResolvedValue([
        { rollPrefix: 'BS', classes: [{ rollPrefix: 'CS-' }] },
      ]);
      prisma.student.findMany.mockResolvedValue([]);

      await expect(service.getLatestRollNumbersBatch(1)).resolves.toEqual({
        'BSCS-': {
          latestRollNumber: null,
          nextSuffix: '26-001',
          nextRollNumber: 'BSCS-26-001',
        },
      });
      expect(prisma.student.findMany).toHaveBeenCalledWith({
        where: { rollNumber: { startsWith: 'BSCS-26-' } },
        select: { rollNumber: true },
      });
    });

    it('increments only the matching prefix and year', async () => {
      prisma.program.findMany.mockResolvedValue([
        { rollPrefix: 'BS', classes: [{ rollPrefix: 'CS-' }] },
      ]);
      prisma.student.findMany.mockResolvedValue([
        { rollNumber: 'BSCS-26-001' },
        { rollNumber: 'BSCS-26-003' },
      ]);

      await expect(service.getLatestRollNumbersBatch(1)).resolves.toEqual({
        'BSCS-': {
          latestRollNumber: 'BSCS-26-003',
          nextSuffix: '26-004',
          nextRollNumber: 'BSCS-26-004',
        },
      });
    });

    it('does not let another prefix from the same year affect the result', async () => {
      prisma.program.findMany.mockResolvedValue([
        { rollPrefix: 'BS', classes: [{ rollPrefix: 'CS-' }] },
      ]);
      prisma.student.findMany.mockImplementation(({ where }) => {
        if (where.rollNumber.startsWith === 'BSCS-26-') {
          return Promise.resolve([{ rollNumber: 'BSCS-26-002' }]);
        }
        return Promise.resolve([{ rollNumber: 'BSEE-26-999' }]);
      });

      const result = await service.getLatestRollNumbersBatch(1);

      expect(result['BSCS-'].nextRollNumber).toBe('BSCS-26-003');
      expect(prisma.student.findMany).toHaveBeenCalledWith({
        where: { rollNumber: { startsWith: 'BSCS-26-' } },
        select: { rollNumber: true },
      });
    });

    it('uses class prefix directly when class prefix already contains program prefix', async () => {
      prisma.program.findMany.mockResolvedValue([
        { rollPrefix: 'BS', classes: [{ rollPrefix: 'BSCS-' }] },
      ]);
      prisma.student.findMany.mockResolvedValue([{ rollNumber: 'BSCS-26-009' }]);

      const result = await service.getLatestRollNumbersBatch(1);

      expect(result).toEqual({
        'BSCS-': {
          latestRollNumber: 'BSCS-26-009',
          nextSuffix: '26-010',
          nextRollNumber: 'BSCS-26-010',
        },
      });
    });
  });
});
