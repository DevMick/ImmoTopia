import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { RentalPaymentStatus, RentalPaymentMethod, RentalInstallmentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface CreatePaymentData {
  leaseId?: string;
  renterClientId?: string;
  invoiceId?: string;
  method: RentalPaymentMethod;
  amount: number;
  currency?: string;
  mmOperator?: string;
  mmPhone?: string;
  pspName?: string;
  pspTransactionId?: string;
  pspReference?: string;
  idempotencyKey: string;
}

interface AllocatePaymentData {
  installmentIds: string[];
  amounts?: Record<string, number>;
}

interface PaymentFilters {
  leaseId?: string;
  renterClientId?: string;
  status?: RentalPaymentStatus;
  method?: RentalPaymentMethod;
  startDate?: Date;
  endDate?: Date;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Create a new payment
 * @param tenantId - Tenant ID
 * @param data - Payment data
 * @param actorUserId - User creating the payment
 * @returns Created payment
 */
export async function createPayment(
  tenantId: string,
  data: CreatePaymentData,
  actorUserId?: string
): Promise<any> {
  try {
    // Check for idempotency - if payment with this key exists, return it
    const existingPayment = await prisma.rentalPayment.findFirst({
      where: {
        tenant_id: tenantId,
        idempotency_key: data.idempotencyKey,
      },
      include: {
        allocations: {
          include: {
            installment: true,
          },
        },
      },
    });

    if (existingPayment) {
      logger.info(`Payment with idempotency key ${data.idempotencyKey} already exists`);
      return existingPayment;
    }

    // Validate lease exists if provided
    if (data.leaseId) {
      const lease = await prisma.rentalLease.findFirst({
        where: {
          id: data.leaseId,
          tenant_id: tenantId,
        },
      });

      if (!lease) {
        throw new Error('Bail introuvable');
      }
    }

    // Create the payment
    const payment = await prisma.rentalPayment.create({
      data: {
        tenant_id: tenantId,
        lease_id: data.leaseId,
        renter_client_id: data.renterClientId,
        invoice_id: data.invoiceId,
        method: data.method,
        amount: new Decimal(data.amount),
        currency: data.currency || 'FCFA',
        mm_operator: data.mmOperator as any,
        mm_phone: data.mmPhone,
        psp_name: data.pspName,
        psp_transaction_id: data.pspTransactionId,
        psp_reference: data.pspReference,
        idempotency_key: data.idempotencyKey,
        status: RentalPaymentStatus.SUCCESS, // Auto-mark as success for manual payments
        succeeded_at: new Date(),
        created_by_user_id: actorUserId,
      },
      include: {
        allocations: {
          include: {
            installment: true,
          },
        },
      },
    });

    logger.info(`Payment ${payment.id} created successfully for tenant ${tenantId}`);
    return payment;
  } catch (error) {
    logger.error('Error creating payment:', error);
    throw error;
  }
}

/**
 * Allocate payment to installments
 * @param tenantId - Tenant ID
 * @param paymentId - Payment ID
 * @param data - Allocation data
 * @param actorUserId - User allocating payment
 * @returns Allocation result
 */
export async function allocatePayment(
  tenantId: string,
  paymentId: string,
  data: AllocatePaymentData,
  actorUserId: string
): Promise<any> {
  try {
    // Get payment with allocations
    const payment = await prisma.rentalPayment.findFirst({
      where: {
        id: paymentId,
        tenant_id: tenantId,
      },
      include: {
        allocations: true,
      },
    });

    if (!payment) {
      throw new Error('Paiement introuvable');
    }

    // Check if payment is already fully allocated
    const allocatedAmount = payment.allocations.reduce(
      (sum, alloc) => sum + Number(alloc.amount),
      0
    );
    const remainingAmount = Number(payment.amount) - allocatedAmount;

    if (remainingAmount <= 0) {
      throw new Error('Le paiement est déjà entièrement alloué');
    }

    // Get installments to allocate to
    const installments = await prisma.rentalInstallment.findMany({
      where: {
        id: { in: data.installmentIds },
        tenant_id: tenantId,
        lease_id: payment.lease_id || undefined,
      },
      orderBy: [
        { due_date: 'asc' }, // Prioritize oldest first
      ],
    });

    if (installments.length === 0) {
      throw new Error('Aucune échéance trouvée');
    }

    // Calculate allocations
    const allocations: any[] = [];
    let amountToAllocate = remainingAmount;

    for (const installment of installments) {
      if (amountToAllocate <= 0) break;

      // Calculate remaining amount due for this installment
      // Get existing allocations for this installment
      const existingAllocations = await prisma.rentalPaymentAllocation.findMany({
        where: { installment_id: installment.id },
      });

      const allocatedToInstallment = existingAllocations.reduce(
        (sum, alloc) => sum + Number(alloc.amount),
        0
      );

      // Calculate total amount due (rent + service + other fees + penalties)
      const totalAmountDue = Number(installment.amount_rent) +
                            Number(installment.amount_service) +
                            Number(installment.amount_other_fees) +
                            Number(installment.penalty_amount);

      const remainingDue = totalAmountDue - allocatedToInstallment;

      if (remainingDue <= 0) continue;

      // Determine allocation amount
      let allocationAmount: number;
      if (data.amounts && data.amounts[installment.id]) {
        // Use manually specified amount, but don't exceed remaining due
        allocationAmount = Math.min(data.amounts[installment.id], remainingDue, amountToAllocate);
      } else {
        // Auto-allocate: use minimum of remaining due and remaining payment
        allocationAmount = Math.min(remainingDue, amountToAllocate);
      }

      if (allocationAmount > 0) {
        allocations.push({
          tenant_id: tenantId,
          payment_id: paymentId,
          installment_id: installment.id,
          amount: new Decimal(allocationAmount),
          currency: payment.currency,
        });

        amountToAllocate -= allocationAmount;
      }
    }

    if (allocations.length === 0) {
      throw new Error('Aucune allocation possible');
    }

    // Create allocations and update installment statuses
    const createdAllocations = await prisma.$transaction(async (tx) => {
      const created = await tx.rentalPaymentAllocation.createMany({
        data: allocations,
      });

      // Update installment statuses
      for (const allocation of allocations) {
        const installment = installments.find(i => i.id === allocation.installment_id);
        if (!installment) continue;

        // Get all allocations for this installment including the new one
        const allAllocations = await tx.rentalPaymentAllocation.findMany({
          where: { installment_id: installment.id },
        });

        // Calculate total allocated - allAllocations already includes the newly created allocation
        const totalAllocated = allAllocations.reduce(
          (sum, alloc) => sum + Number(alloc.amount),
          0
        );

        // Calculate total amount due
        const totalAmountDue = Number(installment.amount_rent) +
                              Number(installment.amount_service) +
                              Number(installment.amount_other_fees) +
                              Number(installment.penalty_amount);

        let newStatus = installment.status;
        if (totalAllocated >= totalAmountDue) {
          newStatus = RentalInstallmentStatus.PAID;
        } else if (totalAllocated > 0) {
          newStatus = RentalInstallmentStatus.PARTIAL;
        }

        await tx.rentalInstallment.update({
          where: { id: installment.id },
          data: {
            status: newStatus,
            amount_paid: new Decimal(totalAllocated),
            paid_at: newStatus === RentalInstallmentStatus.PAID ? new Date() : undefined,
          },
        });
      }

      return created;
    });

    logger.info(`Payment ${paymentId} allocated to ${allocations.length} installments`);

    return {
      allocations: allocations,
      totalAllocated: allocations.reduce((sum, a) => sum + Number(a.amount), 0),
    };
  } catch (error) {
    logger.error('Error allocating payment:', error);
    throw error;
  }
}

/**
 * Update payment status
 * @param tenantId - Tenant ID
 * @param paymentId - Payment ID
 * @param status - New status
 * @param actorUserId - User updating status
 * @returns Updated payment
 */
export async function updatePaymentStatus(
  tenantId: string,
  paymentId: string,
  status: RentalPaymentStatus,
  actorUserId: string
): Promise<any> {
  try {
    const payment = await prisma.rentalPayment.findFirst({
      where: {
        id: paymentId,
        tenant_id: tenantId,
      },
    });

    if (!payment) {
      throw new Error('Paiement introuvable');
    }

    const updateData: any = { status };

    // Set timestamp based on status
    if (status === RentalPaymentStatus.SUCCESS && !payment.succeeded_at) {
      updateData.succeeded_at = new Date();
    } else if (status === RentalPaymentStatus.FAILED && !payment.failed_at) {
      updateData.failed_at = new Date();
    } else if (status === RentalPaymentStatus.CANCELED && !payment.canceled_at) {
      updateData.canceled_at = new Date();
    }

    const updatedPayment = await prisma.rentalPayment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        allocations: {
          include: {
            installment: true,
          },
        },
      },
    });

    logger.info(`Payment ${paymentId} status updated to ${status}`);
    return updatedPayment;
  } catch (error) {
    logger.error('Error updating payment status:', error);
    throw error;
  }
}

/**
 * Get payment by ID
 * @param tenantId - Tenant ID
 * @param paymentId - Payment ID
 * @returns Payment or null
 */
export async function getPaymentById(tenantId: string, paymentId: string): Promise<any> {
  try {
    const payment = await prisma.rentalPayment.findFirst({
      where: {
        id: paymentId,
        tenant_id: tenantId,
      },
      include: {
        allocations: {
          include: {
            installment: true,
          },
        },
        lease: {
          include: {
            property: true,
          },
        },
        renterClient: true,
      },
    });

    return payment;
  } catch (error) {
    logger.error('Error getting payment:', error);
    throw error;
  }
}

/**
 * List payments with filters
 * @param tenantId - Tenant ID
 * @param filters - Filter criteria
 * @param options - Pagination options
 * @returns Paginated payment list
 */
export async function listPayments(
  tenantId: string,
  filters: PaymentFilters,
  options: PaginationOptions = {}
): Promise<any> {
  try {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      tenant_id: tenantId,
    };

    if (filters.leaseId) {
      where.lease_id = filters.leaseId;
    }

    if (filters.renterClientId) {
      where.renter_client_id = filters.renterClientId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.method) {
      where.method = filters.method;
    }

    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        where.created_at.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.created_at.lte = filters.endDate;
      }
    }

    const [payments, total] = await Promise.all([
      prisma.rentalPayment.findMany({
        where,
        include: {
          allocations: {
            include: {
              installment: true,
            },
          },
          lease: {
            include: {
              property: true,
            },
          },
          renterClient: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rentalPayment.count({ where }),
    ]);

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error listing payments:', error);
    throw error;
  }
}
