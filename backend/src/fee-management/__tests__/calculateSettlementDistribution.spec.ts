import { Test, TestingModule } from '@nestjs/testing';
import { FeeManagementService } from '../fee-management.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FeeManagementService - calculateSettlementDistribution', () => {
  let service: FeeManagementService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeManagementService,
        {
          provide: PrismaService,
          useValue: {
            feeChallan: {},
            studentFeeInstallment: {},
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeeManagementService>(FeeManagementService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('Basic Settlement Distribution', () => {
    it('should distribute payment across single superseded challan', () => {
      // Arrange
      const supersedingChallan = {
        id: 107,
        challanNumber: 'CH-107',
        paidAmount: 5000,
        paidDate: new Date('2024-01-15'),
      };

      const supersededChallans = [
        {
          id: 106,
          challanNumber: 'CH-106',
          amount: 5000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 1,
        },
      ];

      // Act
      const result = (service as any).calculateSettlementDistribution(
        supersedingChallan,
        supersededChallans
      );

      // Assert
      expect(result.settledChallans).toHaveLength(1);
      expect(result.settledChallans[0].challanId).toBe(106);
      expect(result.settledChallans[0].challanNumber).toBe('CH-106');
      expect(result.settledChallans[0].amountSettled).toBe(5000);
      expect(result.totalSettled).toBe(5000);
    });

    it('should distribute payment across multiple superseded challans', () => {
      // Arrange
      const supersedingChallan = {
        id: 108,
        challanNumber: 'CH-108',
        paidAmount: 10000,
        paidDate: new Date('2024-01-15'),
      };

      const supersededChallans = [
        {
          id: 106,
          challanNumber: 'CH-106',
          amount: 5000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 1,
        },
        {
          id: 107,
          challanNumber: 'CH-107',
          amount: 3000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 2,
        },
      ];

      // Act
      const result = (service as any).calculateSettlementDistribution(
        supersedingChallan,
        supersededChallans
      );

      // Assert
      expect(result.settledChallans).toHaveLength(2);
      expect(result.settledChallans[0].challanId).toBe(106);
      expect(result.settledChallans[0].amountSettled).toBe(5000);
      expect(result.settledChallans[1].challanId).toBe(107);
      expect(result.settledChallans[1].amountSettled).toBe(3000);
      expect(result.totalSettled).toBe(8000);
    });
  });

  describe('Partial Settlement', () => {
    it('should handle partial settlement when payment is less than total due', () => {
      // Arrange
      const supersedingChallan = {
        id: 107,
        challanNumber: 'CH-107',
        paidAmount: 3000,
        paidDate: new Date('2024-01-15'),
      };

      const supersededChallans = [
        {
          id: 106,
          challanNumber: 'CH-106',
          amount: 5000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 1,
        },
      ];

      // Act
      const result = (service as any).calculateSettlementDistribution(
        supersedingChallan,
        supersededChallans
      );

      // Assert
      expect(result.settledChallans).toHaveLength(1);
      expect(result.settledChallans[0].amountSettled).toBe(3000);
      expect(result.totalSettled).toBe(3000);
    });

    it('should distribute partial payment across multiple challans (FIFO)', () => {
      // Arrange
      const supersedingChallan = {
        id: 108,
        challanNumber: 'CH-108',
        paidAmount: 6000,
        paidDate: new Date('2024-01-15'),
      };

      const supersededChallans = [
        {
          id: 106,
          challanNumber: 'CH-106',
          amount: 5000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 1,
        },
        {
          id: 107,
          challanNumber: 'CH-107',
          amount: 3000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 2,
        },
      ];

      // Act
      const result = (service as any).calculateSettlementDistribution(
        supersedingChallan,
        supersededChallans
      );

      // Assert
      expect(result.settledChallans).toHaveLength(2);
      expect(result.settledChallans[0].challanId).toBe(106);
      expect(result.settledChallans[0].amountSettled).toBe(5000); // Fully settled
      expect(result.settledChallans[1].challanId).toBe(107);
      expect(result.settledChallans[1].amountSettled).toBe(1000); // Partially settled
      expect(result.totalSettled).toBe(6000);
    });
  });

  describe('Over-payment', () => {
    it('should handle over-payment by settling only outstanding amounts', () => {
      // Arrange
      const supersedingChallan = {
        id: 107,
        challanNumber: 'CH-107',
        paidAmount: 8000,
        paidDate: new Date('2024-01-15'),
      };

      const supersededChallans = [
        {
          id: 106,
          challanNumber: 'CH-106',
          amount: 5000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 1,
        },
      ];

      // Act
      const result = (service as any).calculateSettlementDistribution(
        supersedingChallan,
        supersededChallans
      );

      // Assert
      expect(result.settledChallans).toHaveLength(1);
      expect(result.settledChallans[0].amountSettled).toBe(5000);
      expect(result.totalSettled).toBe(5000); // Only settled what was due
    });
  });

  describe('Zero Settlement Edge Cases', () => {
    it('should return empty settlement when payment is zero', () => {
      // Arrange
      const supersedingChallan = {
        id: 107,
        challanNumber: 'CH-107',
        paidAmount: 0,
        paidDate: new Date('2024-01-15'),
      };

      const supersededChallans = [
        {
          id: 106,
          challanNumber: 'CH-106',
          amount: 5000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 1,
        },
      ];

      // Act
      const result = (service as any).calculateSettlementDistribution(
        supersedingChallan,
        supersededChallans
      );

      // Assert
      expect(result.settledChallans).toHaveLength(0);
      expect(result.totalSettled).toBe(0);
    });

    it('should return empty settlement when no superseded challans', () => {
      // Arrange
      const supersedingChallan = {
        id: 107,
        challanNumber: 'CH-107',
        paidAmount: 5000,
        paidDate: new Date('2024-01-15'),
      };

      const supersededChallans: any[] = [];

      // Act
      const result = (service as any).calculateSettlementDistribution(
        supersedingChallan,
        supersededChallans
      );

      // Assert
      expect(result.settledChallans).toHaveLength(0);
      expect(result.totalSettled).toBe(0);
    });

    it('should skip already fully settled challans', () => {
      // Arrange
      const supersedingChallan = {
        id: 108,
        challanNumber: 'CH-108',
        paidAmount: 5000,
        paidDate: new Date('2024-01-15'),
      };

      const supersededChallans = [
        {
          id: 106,
          challanNumber: 'CH-106',
          amount: 5000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 5000, // Already fully settled
          selectedHeads: '[]',
          installmentNumber: 1,
        },
        {
          id: 107,
          challanNumber: 'CH-107',
          amount: 3000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 2,
        },
      ];

      // Act
      const result = (service as any).calculateSettlementDistribution(
        supersedingChallan,
        supersededChallans
      );

      // Assert
      expect(result.settledChallans).toHaveLength(1);
      expect(result.settledChallans[0].challanId).toBe(107);
      expect(result.settledChallans[0].amountSettled).toBe(3000);
      expect(result.totalSettled).toBe(3000);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle challans with additional fee heads', () => {
      // Arrange
      const supersedingChallan = {
        id: 107,
        challanNumber: 'CH-107',
        paidAmount: 6000,
        paidDate: new Date('2024-01-15'),
      };

      const supersededChallans = [
        {
          id: 106,
          challanNumber: 'CH-106',
          amount: 5000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: JSON.stringify([
            { type: 'additional', amount: 1000, isSelected: true, name: 'Lab Fee' },
          ]),
          installmentNumber: 1,
        },
      ];

      // Act
      const result = (service as any).calculateSettlementDistribution(
        supersedingChallan,
        supersededChallans
      );

      // Assert
      expect(result.settledChallans).toHaveLength(1);
      expect(result.settledChallans[0].amountSettled).toBe(6000); // 5000 + 1000 heads
      expect(result.totalSettled).toBe(6000);
    });

    it('should handle challans with late fees and discounts', () => {
      // Arrange
      const supersedingChallan = {
        id: 107,
        challanNumber: 'CH-107',
        paidAmount: 5500,
        paidDate: new Date('2024-01-15'),
      };

      const supersededChallans = [
        {
          id: 106,
          challanNumber: 'CH-106',
          amount: 5000,
          fineAmount: 0,
          lateFeeFine: 1000,
          discount: 500,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 1,
        },
      ];

      // Act
      const result = (service as any).calculateSettlementDistribution(
        supersedingChallan,
        supersededChallans
      );

      // Assert
      expect(result.settledChallans).toHaveLength(1);
      expect(result.settledChallans[0].amountSettled).toBe(5500); // 5000 + 1000 - 500
      expect(result.totalSettled).toBe(5500);
    });

    it('should handle partially settled challans', () => {
      // Arrange
      const supersedingChallan = {
        id: 107,
        challanNumber: 'CH-107',
        paidAmount: 3000,
        paidDate: new Date('2024-01-15'),
      };

      const supersededChallans = [
        {
          id: 106,
          challanNumber: 'CH-106',
          amount: 5000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 2000, // Already partially settled
          selectedHeads: '[]',
          installmentNumber: 1,
        },
      ];

      // Act
      const result = (service as any).calculateSettlementDistribution(
        supersedingChallan,
        supersededChallans
      );

      // Assert
      expect(result.settledChallans).toHaveLength(1);
      expect(result.settledChallans[0].amountSettled).toBe(3000); // Remaining 3000 out of 5000
      expect(result.totalSettled).toBe(3000);
    });

    it('should sort challans by installment number (FIFO)', () => {
      // Arrange
      const supersedingChallan = {
        id: 109,
        challanNumber: 'CH-109',
        paidAmount: 10000,
        paidDate: new Date('2024-01-15'),
      };

      const supersededChallans = [
        {
          id: 108,
          challanNumber: 'CH-108',
          amount: 3000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 3,
        },
        {
          id: 106,
          challanNumber: 'CH-106',
          amount: 5000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 1,
        },
        {
          id: 107,
          challanNumber: 'CH-107',
          amount: 2000,
          fineAmount: 0,
          lateFeeFine: 0,
          discount: 0,
          settledAmount: 0,
          selectedHeads: '[]',
          installmentNumber: 2,
        },
      ];

      // Act
      const result = (service as any).calculateSettlementDistribution(
        supersedingChallan,
        supersededChallans
      );

      // Assert
      expect(result.settledChallans).toHaveLength(3);
      expect(result.settledChallans[0].challanId).toBe(106); // Installment 1
      expect(result.settledChallans[1].challanId).toBe(107); // Installment 2
      expect(result.settledChallans[2].challanId).toBe(108); // Installment 3
      expect(result.totalSettled).toBe(10000);
    });
  });
});
