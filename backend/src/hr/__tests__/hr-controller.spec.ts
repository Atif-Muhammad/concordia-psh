import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { HrModule } from '../hr.module';
import { PrismaService } from '../../prisma/prisma.service';

// Feature: hr-staff-leave-payroll-overhaul, Property 6
describe('HrController — POST /hr/staff-leaves invalid leaveType rejection', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HrModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        staffLeave: {
          create: jest.fn(),
          findMany: jest.fn(),
        },
        staff: {
          findUnique: jest.fn(),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same validation pipe as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  // Validates: Requirements 2.5
  it('returns HTTP 400 for any string not in StaffLeaveType enum', async () => {
    const validLeaveTypes = [
      'CASUAL',
      'SICK',
      'ANNUAL',
      'MATERNITY',
      'PATERNITY',
      'UNPAID',
      'OTHER',
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (s) => !validLeaveTypes.includes(s),
        ),
        async (invalidLeaveType) => {
          const payload = {
            staffId: 1,
            leaveType: invalidLeaveType,
            startDate: '2025-06-01',
            endDate: '2025-06-05',
            reason: 'Test leave request',
          };

          const response = await request(app.getHttpServer())
            .post('/hr/staff-leaves')
            .send(payload);

          // Should return 400 Bad Request
          expect(response.status).toBe(400);
          
          // Should contain validation error message about leaveType
          expect(response.body.message).toBeDefined();
        },
      ),
      { numRuns: 20 },
    );
  });
});
