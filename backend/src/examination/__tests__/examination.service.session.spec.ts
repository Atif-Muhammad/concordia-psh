/**
 * Property-Based Tests: Backend session filter returns only matching exams/marks/results
 *
 * Property 8: Backend session filter returns only matching exams/marks/results
 * Validates: Requirements 7.1, 7.2, 7.4, 8.1, 8.2, 9.1, 9.2
 * Tag: Feature: session-based-examination-filters, Property 8
 */

import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { ExaminationService } from '../examination.service';
import { PrismaService } from '../../prisma/prisma.service';

// Build a minimal mock PrismaService with controllable return values
const buildMockPrisma = () => ({
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
  exam: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  marks: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  result: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  position: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  teacherClassSectionMapping: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
});

describe('ExaminationService – Property 8: Backend session filter', () => {
  let service: ExaminationService;
  let mockPrisma: ReturnType<typeof buildMockPrisma>;

  beforeEach(async () => {
    mockPrisma = buildMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExaminationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExaminationService>(ExaminationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // findAll – exams
  // ---------------------------------------------------------------------------

  describe('findAll', () => {
    /**
     * Property 8a: When sessionId is provided, findAll passes WHERE { sessionId }
     * to Prisma and returns only exams whose sessionId matches.
     *
     * Validates: Requirements 7.1, 7.2, 7.4
     */
    it('passes sessionId in WHERE clause and returns only matching exams', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1 }),
          fc.array(
            fc.record({ sessionId: fc.integer({ min: 1 }) }),
            { minLength: 0, maxLength: 20 },
          ),
          async (sessionId, examPool) => {
            mockPrisma.exam.findMany.mockClear();
            const matchingExams = examPool.filter(
              (e) => e.sessionId === sessionId,
            );

            // Prisma returns only the matching subset (simulating DB filter)
            mockPrisma.exam.findMany.mockResolvedValueOnce(matchingExams);

            const result = await service.findAll(undefined, sessionId);

            // 1. Prisma was called with the correct WHERE clause
            const callArgs = mockPrisma.exam.findMany.mock.calls[0][0];
            expect(callArgs.where).toMatchObject({ sessionId });

            // 2. Every returned exam has the correct sessionId
            expect(result.every((e: any) => e.sessionId === sessionId)).toBe(
              true,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * Property 8b: When no sessionId is provided, findAll does NOT add a
     * sessionId filter to the WHERE clause, so all exams are returned.
     *
     * Validates: Requirements 7.4
     */
    it('returns all exams when no sessionId is provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({ sessionId: fc.integer({ min: 1 }) }),
            { minLength: 0, maxLength: 20 },
          ),
          async (examPool) => {
            mockPrisma.exam.findMany.mockClear();
            mockPrisma.exam.findMany.mockResolvedValueOnce(examPool);

            const result = await service.findAll(undefined, undefined);

            // WHERE clause must NOT contain sessionId
            const callArgs = mockPrisma.exam.findMany.mock.calls[0][0];
            expect(callArgs.where).not.toHaveProperty('sessionId');

            // All exams are returned
            expect(result).toHaveLength(examPool.length);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findAllMarks – marks filtered via exam relation
  // ---------------------------------------------------------------------------

  describe('findAllMarks', () => {
    /**
     * Property 8c: When sessionId is provided (and no examId), findAllMarks
     * merges { sessionId } into WHERE.exam so only marks belonging to exams
     * with that sessionId are returned.
     *
     * Validates: Requirements 8.1, 8.2
     */
    it('filters marks via exam.sessionId when sessionId is provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1 }),
          fc.array(
            fc.record({
              sessionId: fc.integer({ min: 1 }),
              examId: fc.integer({ min: 1 }),
            }),
            { minLength: 0, maxLength: 20 },
          ),
          async (sessionId, marksPool) => {
            mockPrisma.marks.findMany.mockClear();
            const matchingMarks = marksPool.filter(
              (m) => m.sessionId === sessionId,
            );

            mockPrisma.marks.findMany.mockResolvedValueOnce(matchingMarks);

            const result = await service.findAllMarks(
              undefined,
              undefined,
              undefined,
              sessionId,
            );

            // WHERE.exam must contain sessionId
            const callArgs = mockPrisma.marks.findMany.mock.calls[0][0];
            expect(callArgs.where.exam).toMatchObject({ sessionId });

            // Every returned mark belongs to an exam with the correct sessionId
            expect(
              result.every((m: any) => m.sessionId === sessionId),
            ).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * Property 8d: When no sessionId is provided, findAllMarks does NOT add
     * a sessionId filter via the exam relation.
     *
     * Validates: Requirements 8.1
     */
    it('returns all marks when no sessionId is provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({ examId: fc.integer({ min: 1 }) }),
            { minLength: 0, maxLength: 20 },
          ),
          async (marksPool) => {
            mockPrisma.marks.findMany.mockClear();
            mockPrisma.marks.findMany.mockResolvedValueOnce(marksPool);

            await service.findAllMarks(
              undefined,
              undefined,
              undefined,
              undefined,
            );

            const callArgs = mockPrisma.marks.findMany.mock.calls[0][0];
            // exam relation filter should not carry a sessionId key
            const examFilter = callArgs.where?.exam;
            if (examFilter) {
              expect(examFilter).not.toHaveProperty('sessionId');
            } else {
              // No exam filter at all is also acceptable
              expect(examFilter).toBeUndefined();
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findAllResults – results filtered via exam relation
  // ---------------------------------------------------------------------------

  describe('findAllResults', () => {
    /**
     * Property 8e: When sessionId is provided, findAllResults merges
     * { sessionId } into WHERE.exam so only results belonging to exams
     * with that sessionId are returned.
     *
     * Validates: Requirements 9.1, 9.2
     */
    it('filters results via exam.sessionId when sessionId is provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1 }),
          fc.array(
            fc.record({
              sessionId: fc.integer({ min: 1 }),
              examId: fc.integer({ min: 1 }),
            }),
            { minLength: 0, maxLength: 20 },
          ),
          async (sessionId, resultsPool) => {
            mockPrisma.result.findMany.mockClear();
            const matchingResults = resultsPool.filter(
              (r) => r.sessionId === sessionId,
            );

            mockPrisma.result.findMany.mockResolvedValueOnce(matchingResults);

            const result = await service.findAllResults(undefined, sessionId);

            // WHERE.exam must contain sessionId
            const callArgs = mockPrisma.result.findMany.mock.calls[0][0];
            expect(callArgs.where.exam).toMatchObject({ sessionId });

            // Every returned result belongs to an exam with the correct sessionId
            expect(
              result.every((r: any) => r.sessionId === sessionId),
            ).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * Property 8f: When no sessionId is provided, findAllResults does NOT add
     * a sessionId filter via the exam relation.
     *
     * Validates: Requirements 9.1
     */
    it('returns all results when no sessionId is provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({ examId: fc.integer({ min: 1 }) }),
            { minLength: 0, maxLength: 20 },
          ),
          async (resultsPool) => {
            mockPrisma.result.findMany.mockClear();
            mockPrisma.result.findMany.mockResolvedValueOnce(resultsPool);

            await service.findAllResults(undefined, undefined);

            const callArgs = mockPrisma.result.findMany.mock.calls[0][0];
            const examFilter = callArgs.where?.exam;
            if (examFilter) {
              expect(examFilter).not.toHaveProperty('sessionId');
            } else {
              expect(examFilter).toBeUndefined();
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
