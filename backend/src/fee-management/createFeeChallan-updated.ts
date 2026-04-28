  async createFeeChallan(payload: CreateFeeChallanDto) {
    const {
      isArrearsPayment,
      arrearsInstallments,
      arrearsSessionClassId,
      arrearsSessionProgramId,
      arrearsSessionFeeStructureId,
      studentClassId: _,
      studentProgramId: __,
      ...restPayload
    } = payload as any;
    const student = await this.prisma.student.findUnique({
      where: { id: payload.studentId },
      include: { class: true, program: true },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    let feeStructureId = payload.feeStructureId;
    let amount = payload.amount;
    let installmentNumber = payload.installmentNumber || 1;
    let classId = student.classId;
    let programId = student.programId;

    console.log('ðŸ·ï¸ CreateFeeChallan - isArrearsPayment:', isArrearsPayment);
    console.log('ðŸ·ï¸ Initial classId:', classId, 'programId:', programId);

    // Sequential generation validation: Ensure all prior installments have challans
    // Skip validation for arrears payments as they follow different logic
    if (!isArrearsPayment && installmentNumber > 1) {
      // Query all installments for the student ordered by installmentNumber
      const allInstallments = await this.prisma.studentFeeInstallment.findMany({
        where: {
          studentId: payload.studentId,
          classId: classId,
        },
        orderBy: {
          installmentNumber: 'asc',
        },
      });

      // Check each installment before the target installment
      for (const installment of allInstallments) {
        if (installment.installmentNumber < installmentNumber) {
          // Check if at least one non-VOID challan exists for this installment
          const existingChallans = await this.prisma.feeChallan.count({
            where: {
              studentId: payload.studentId,
              installmentNumber: installment.installmentNumber,
              status: {
                not: 'VOID',
              },
            },
          });

          if (existingChallans === 0) {
            throw new BadRequestException(
              `Challan for ${installment.month || 'installment #' + installment.installmentNumber} (installment #${installment.installmentNumber}) has not been generated yet. Please generate it before proceeding with installment #${installmentNumber}.`
            );
          }
        }
      }
    }

    // If arrears payment, use studentArrearId
    if (isArrearsPayment) {
      const studentArrearId = (payload as any).studentArrearId;

      if (!studentArrearId) {
        throw new BadRequestException(
          'Student arrear ID is required for arrears payment',
        );
      }

      // Get arrear record
      const arrearRecord = await this.prisma.studentArrear.findUnique({
        where: { id: studentArrearId },
      });

      if (!arrearRecord) {
        throw new NotFoundException('Arrear record not found');
      }

      // Validate amount
      if (amount > arrearRecord.arrearAmount) {
        throw new BadRequestException(
          `Amount (${amount}) exceeds arrears (${arrearRecord.arrearAmount})`,
        );
      }

      // Use session details from arrear record
      classId = arrearRecord.classId;
      programId = arrearRecord.programId;

      console.log(
        'ðŸŽ¯ Arrears Payment - Using arrear classId:',
        classId,
        'programId:',
        programId,
      );

      // CRITICAL: Fetch fee structure from the ORIGINAL class (where arrear originated)
      const arrearFeeStructure = await this.prisma.feeStructure.findUnique({
        where: {
          programId_classId: {
            programId: arrearRecord.programId,
            classId: arrearRecord.classId,
          },
        },
      });

      if (arrearFeeStructure) {
        feeStructureId = arrearFeeStructure.id;
        console.log(
          'âœ… Using fee structure from original class:',
          feeStructureId,
        );
      }

      // Next installment = last installment + 1
      installmentNumber = arrearRecord.lastInstallmentNumber + 1;
    }
    // Auto-fetch fee structure if not provided and not arrears
    if (!feeStructureId && student.programId && student.classId) {
      const structure = await this.prisma.feeStructure.findUnique({
        where: {
          programId_classId: {
            programId: student.programId,
            classId: student.classId,
          },
        },
      });
      if (structure) {
        feeStructureId = structure.id;
        // If amount is not manually overridden, calculate based on installments
        if (amount === undefined || amount === null) {
          amount = Math.round(
            ((student as any).tuitionFee || structure.totalAmount) / structure.installments,
          );
        }
        // Calculate installment number only if tuition is being paid
        if (amount > 0) {
          const prevChallans = await this.prisma.feeChallan.count({
            where: {
              studentId: student.id,
              feeStructureId: structure.id,
              amount: { gt: 0 }, // Only count challans that had tuition
            },
          });
          installmentNumber = prevChallans + 1;
        } else {
          installmentNumber = 0;
        }
      }
    }

    console.log(
      'ðŸ'¾ Creating challan with studentClassId:',
      classId,
      'studentProgramId:',
      programId,
    );

    // Step 1: Build arrearsBreakdown array
    // Fetch all unpaid/partially paid installments for this student
    const unpaidInstallments = await this.prisma.studentFeeInstallment.findMany({
      where: {
        studentId: payload.studentId,
        outstandingPrincipal: { gt: 0 },
        installmentNumber: { lt: installmentNumber }, // Only prior installments
      },
      orderBy: {
        installmentNumber: 'asc',
      },
    });

    const arrearsBreakdown: Array<{
      installmentId: number;
      installmentNumber: number;
      month: string;
      principalOwed: number;
      lateFeeOwed: number;
      challanId: number | null;
      challanNumber: string | null;
    }> = [];

    let frozenArrearsAmount = 0;
    let frozenArrearsFine = 0;
    const coveredInstallmentIds: number[] = [];

    for (const installment of unpaidInstallments) {
      // Find the most recent non-VOID challan for this installment
      const sourceChallan = await this.prisma.feeChallan.findFirst({
        where: {
          studentFeeInstallmentId: installment.id,
          status: { not: 'VOID' },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const principalOwed = Number(installment.outstandingPrincipal);
      const lateFeeOwed = Number(installment.lateFeeAccrued || 0);

      arrearsBreakdown.push({
        installmentId: installment.id,
        installmentNumber: installment.installmentNumber,
        month: installment.month || `Installment ${installment.installmentNumber}`,
        principalOwed,
        lateFeeOwed,
        challanId: sourceChallan?.id || null,
        challanNumber: sourceChallan?.challanNumber || null,
      });

      frozenArrearsAmount += principalOwed;
      frozenArrearsFine += lateFeeOwed;
      coveredInstallmentIds.push(installment.id);
    }

    // Step 2: Compute frozen amounts from breakdown (frozenArrearsAmount, frozenArrearsFine computed above)
    
    // Step 3: Sort array by installmentId ascending
    arrearsBreakdown.sort((a, b) => a.installmentId - b.installmentId);

    // Step 4: Compute SHA-256 hash
    const crypto = require('crypto');
    const arrearsFingerprint = arrearsBreakdown.length > 0
      ? crypto.createHash('sha256').update(JSON.stringify(arrearsBreakdown)).digest('hex')
      : null;

    // Step 5: MANDATORY INTEGRITY VALIDATION - For each arrears entry
    for (const arrears of arrearsBreakdown) {
      if (arrears.challanId) {
        // Fetch the source challan by challanId
        const sourceChallan = await this.prisma.feeChallan.findUnique({
          where: { id: arrears.challanId },
        });

        if (sourceChallan) {
          // Recompute source challan's outstanding
          const sourceOutstanding = Number(sourceChallan.computedTotalDue || sourceChallan.totalAmount || 0) 
            - Number(sourceChallan.amountReceived || sourceChallan.paidAmount || 0);

          // Compare with principalOwed in breakdown
          if (Math.abs(sourceOutstanding - arrears.principalOwed) > 0.01) {
            throw new BadRequestException(
              `Integrity mismatch: Challan #${arrears.challanNumber} for ${arrears.month} shows outstanding amount ${sourceOutstanding.toFixed(2)} but arrears calculation used ${arrears.principalOwed.toFixed(2)}. The challan may have been modified externally. Please refresh and retry.`
            );
          }
        }
      }
    }

    // Compute base amount from selected heads
    const baseAmount = amount || 0;

    // Compute frozen base fine (late fee on current installment)
    const frozenBaseFine = payload.fineAmount || 0;

    // Compute total discount
    const totalDiscount = payload.discount || 0;

    // Step 6 & 7: Compute computedTotalDue and store all frozen amounts
    const computedTotalDue = baseAmount + frozenArrearsAmount + frozenArrearsFine + frozenBaseFine - totalDiscount;
    const amountReceived = payload.paidAmount || 0;
    const outstandingAmount = computedTotalDue - amountReceived;

    // Step 8: Write all frozen amounts, fingerprint, and breakdown to DB atomically
    return await this.prisma.feeChallan.create({
      data: {
        studentId: payload.studentId,
        selectedHeads: payload.selectedHeads
          ? JSON.stringify(payload.selectedHeads)
          : null,
        dueDate: new Date(payload.dueDate),
        amount,
        discount: totalDiscount,
        paidAmount: amountReceived,
        remarks: payload.remarks || null,
        coveredInstallments: payload.coveredInstallments || null,
        feeStructureId,
        installmentNumber,
        studentClassId: classId, // Use calculated classId - NOT from payload
        studentProgramId: programId, // Use calculated programId - NOT from payload
        studentSectionId: student.sectionId, // Snapshot current section
        fineAmount: payload.fineAmount || 0,
        challanNumber: await this.generateChallanNumber(),
        remainingAmount: outstandingAmount,
        status: amountReceived >= computedTotalDue ? 'PAID' : (amountReceived > 0 ? 'PARTIAL' : 'PENDING'),
        challanType: isArrearsPayment ? 'ARREARS_ONLY' : 'INSTALLMENT',
        studentArrearId: (payload as any).studentArrearId
          ? Number((payload as any).studentArrearId)
          : null,
        // Frozen amount fields
        baseAmount,
        frozenArrearsAmount,
        frozenArrearsFine,
        frozenBaseFine,
        totalDiscount,
        computedTotalDue,
        amountReceived,
        outstandingAmount,
        // Arrears tracking fields
        arrearsBreakdown: arrearsBreakdown.length > 0 ? JSON.stringify(arrearsBreakdown) : null,
        arrearsFingerprint,
        coveredInstallmentIds: coveredInstallmentIds.length > 0 ? JSON.stringify(coveredInstallmentIds) : null,
        isLocked: true, // Lock the challan after generation
      },
      include: {
        student: true,
        feeStructure: true,
        studentClass: true,
        studentProgram: true,
        previousChallans: true,
      },
    });
  }
