/**
 * Feature: staff-form-ux-leave-config
 * Backend unit tests for HrService leave settings persistence
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HrService } from './hr.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// Minimal mock staff record returned by prisma.staff.update / prisma.staff.create
const mockStaffRecord = {
  id: 1,
  name: 'Test Staff',
  email: 'test@example.com',
  password: '',
  isTeaching: true,
  isNonTeaching: false,
  status: 'ACTIVE',
  staffType: 'PERMANENT',
  basicPay: null,
  joinDate: null,
  leaveDate: null,
  contractStart: null,
  contractEnd: null,
  fatherName: null,
  phone: null,
  cnic: null,
  address: null,
  religion: null,
  photo_url: null,
  photo_public_id: null,
  specialization: null,
  highestDegree: null,
  departmentId: null,
  documents: null,
  designation: null,
  empDepartment: null,
  permissions: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildPrismaMock(overrides: Record<string, any> = {}) {
  return {
    staff: {
      findUnique: jest.fn().mockResolvedValue(mockStaffRecord),
      update: jest.fn().mockResolvedValue(mockStaffRecord),
      create: jest.fn().mockResolvedValue(mockStaffRecord),
    },
    staffLeaveSettings: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    ...overrides,
  };
}

describe('HrService', () => {
  let service: HrService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Property 9: updateStaff persists leave settings when leave fields provided
  // Validates: Requirements 6.1, 6.4
  // ─────────────────────────────────────────────────────────────────────────
  describe('updateStaff — leave settings persistence (Property 9)', () => {
    const basePayload = {
      name: 'Test Staff',
      isTeaching: true,
      isNonTeaching: false,
    };

    it('calls staffLeaveSettings.upsert with correct staffId and values when sickAllowed is provided', async () => {
      const payload = { ...basePayload, sickAllowed: '10' };
      await service.updateStaff(1, payload);

      expect(prismaMock.staffLeaveSettings.upsert).toHaveBeenCalledTimes(1);
      const call = prismaMock.staffLeaveSettings.upsert.mock.calls[0][0];
      expect(call.where).toEqual({ staffId: 1 });
      expect(call.create).toMatchObject({ staffId: 1, sickAllowed: 10 });
      expect(call.update).toMatchObject({ sickAllowed: 10 });
    });

    it('calls staffLeaveSettings.upsert with correct staffId and values when annualAllowed is provided', async () => {
      const payload = { ...basePayload, annualAllowed: '15' };
      await service.updateStaff(1, payload);

      expect(prismaMock.staffLeaveSettings.upsert).toHaveBeenCalledTimes(1);
      const call = prismaMock.staffLeaveSettings.upsert.mock.calls[0][0];
      expect(call.where).toEqual({ staffId: 1 });
      expect(call.create).toMatchObject({ staffId: 1, annualAllowed: 15 });
      expect(call.update).toMatchObject({ annualAllowed: 15 });
    });

    it('calls staffLeaveSettings.upsert with correct staffId and values when casualDeduction is provided', async () => {
      const payload = { ...basePayload, casualDeduction: '0.5' };
      await service.updateStaff(1, payload);

      expect(prismaMock.staffLeaveSettings.upsert).toHaveBeenCalledTimes(1);
      const call = prismaMock.staffLeaveSettings.upsert.mock.calls[0][0];
      expect(call.where).toEqual({ staffId: 1 });
      expect(call.create).toMatchObject({ staffId: 1, casualDeduction: 0.5 });
      expect(call.update).toMatchObject({ casualDeduction: 0.5 });
    });

    it('calls staffLeaveSettings.upsert when multiple leave fields are provided', async () => {
      const payload = {
        ...basePayload,
        sickAllowed: '5',
        sickDeduction: '1.5',
        annualAllowed: '12',
        annualDeduction: '2.0',
        casualAllowed: '6',
        casualDeduction: '1.0',
      };
      await service.updateStaff(1, payload);

      expect(prismaMock.staffLeaveSettings.upsert).toHaveBeenCalledTimes(1);
      const call = prismaMock.staffLeaveSettings.upsert.mock.calls[0][0];
      expect(call.create).toMatchObject({
        staffId: 1,
        sickAllowed: 5,
        sickDeduction: 1.5,
        annualAllowed: 12,
        annualDeduction: 2.0,
        casualAllowed: 6,
        casualDeduction: 1.0,
      });
    });

    it('does NOT call staffLeaveSettings.upsert when no leave fields are provided', async () => {
      await service.updateStaff(1, basePayload);

      expect(prismaMock.staffLeaveSettings.upsert).not.toHaveBeenCalled();
    });

    it('returns the updated staff record', async () => {
      const payload = { ...basePayload, sickAllowed: '3' };
      const result = await service.updateStaff(1, payload);

      expect(result).toEqual(mockStaffRecord);
    });

    it('does NOT call staffLeaveSettings.upsert and propagates error when staff.update throws (Req 6.4)', async () => {
      const dbError = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });
      prismaMock.staff.update.mockRejectedValue(dbError);

      await expect(service.updateStaff(1, { ...basePayload, sickAllowed: '5' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.staffLeaveSettings.upsert).not.toHaveBeenCalled();
    });

    it('propagates P2002 error as BadRequestException when staff.update throws unique constraint violation', async () => {
      const dbError = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      prismaMock.staff.update.mockRejectedValue(dbError);

      await expect(service.updateStaff(1, basePayload)).rejects.toThrow(BadRequestException);
      expect(prismaMock.staffLeaveSettings.upsert).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Property 10: createStaff always persists leave settings
  // Validates: Requirements 7.1, 7.2
  // ─────────────────────────────────────────────────────────────────────────
  describe('createStaff — leave settings persistence (Property 10)', () => {
    const baseCreatePayload = {
      name: 'New Staff',
      email: 'new@example.com',
      password: 'secret123',
      isTeaching: true,
      isNonTeaching: false,
      staffType: 'PERMANENT',
      status: 'ACTIVE',
    };

    it('always calls staffLeaveSettings.upsert after staff.create', async () => {
      await service.createStaff(baseCreatePayload as any);

      expect(prismaMock.staffLeaveSettings.upsert).toHaveBeenCalledTimes(1);
      const call = prismaMock.staffLeaveSettings.upsert.mock.calls[0][0];
      expect(call.where).toEqual({ staffId: mockStaffRecord.id });
      expect(call.create).toMatchObject({ staffId: mockStaffRecord.id });
    });

    it('defaults all leave values to 0 when no leave fields are provided', async () => {
      await service.createStaff(baseCreatePayload as any);

      const call = prismaMock.staffLeaveSettings.upsert.mock.calls[0][0];
      expect(call.create).toMatchObject({
        staffId: mockStaffRecord.id,
        sickAllowed: 0,
        sickDeduction: 0,
        annualAllowed: 0,
        annualDeduction: 0,
        casualAllowed: 0,
        casualDeduction: 0,
      });
      expect(call.update).toMatchObject({
        sickAllowed: 0,
        sickDeduction: 0,
        annualAllowed: 0,
        annualDeduction: 0,
        casualAllowed: 0,
        casualDeduction: 0,
      });
    });

    it('uses provided leave field values when they are given', async () => {
      const payload = {
        ...baseCreatePayload,
        sickAllowed: '8',
        sickDeduction: '1.0',
        annualAllowed: '14',
        annualDeduction: '1.5',
        casualAllowed: '7',
        casualDeduction: '0.5',
      };
      await service.createStaff(payload as any);

      const call = prismaMock.staffLeaveSettings.upsert.mock.calls[0][0];
      expect(call.create).toMatchObject({
        staffId: mockStaffRecord.id,
        sickAllowed: 8,
        sickDeduction: 1.0,
        annualAllowed: 14,
        annualDeduction: 1.5,
        casualAllowed: 7,
        casualDeduction: 0.5,
      });
    });

    it('returns the created staff record', async () => {
      const result = await service.createStaff(baseCreatePayload as any);
      expect(result).toEqual(mockStaffRecord);
    });
  });
});
