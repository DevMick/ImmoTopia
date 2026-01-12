"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = createPayment;
exports.allocatePayment = allocatePayment;
exports.updatePaymentStatus = updatePaymentStatus;
exports.getPaymentById = getPaymentById;
exports.listPayments = listPayments;
var database_1 = require("../utils/database");
var logger_1 = require("../utils/logger");
var client_1 = require("@prisma/client");
var library_1 = require("@prisma/client/runtime/library");
/**
 * Create a new payment
 * @param tenantId - Tenant ID
 * @param data - Payment data
 * @param actorUserId - User creating the payment
 * @returns Created payment
 */
function createPayment(tenantId, data, actorUserId) {
    return __awaiter(this, void 0, void 0, function () {
        var existingPayment, lease, payment, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, database_1.prisma.rentalPayment.findFirst({
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
                        })];
                case 1:
                    existingPayment = _a.sent();
                    if (existingPayment) {
                        logger_1.logger.info("Payment with idempotency key ".concat(data.idempotencyKey, " already exists"));
                        return [2 /*return*/, existingPayment];
                    }
                    if (!data.leaseId) return [3 /*break*/, 3];
                    return [4 /*yield*/, database_1.prisma.rentalLease.findFirst({
                            where: {
                                id: data.leaseId,
                                tenant_id: tenantId,
                            },
                        })];
                case 2:
                    lease = _a.sent();
                    if (!lease) {
                        throw new Error('Bail introuvable');
                    }
                    _a.label = 3;
                case 3: return [4 /*yield*/, database_1.prisma.rentalPayment.create({
                        data: {
                            tenant_id: tenantId,
                            lease_id: data.leaseId,
                            renter_client_id: data.renterClientId,
                            invoice_id: data.invoiceId,
                            method: data.method,
                            amount: new library_1.Decimal(data.amount),
                            currency: data.currency || 'FCFA',
                            mm_operator: data.mmOperator,
                            mm_phone: data.mmPhone,
                            psp_name: data.pspName,
                            psp_transaction_id: data.pspTransactionId,
                            psp_reference: data.pspReference,
                            idempotency_key: data.idempotencyKey,
                            status: client_1.RentalPaymentStatus.SUCCESS, // Auto-mark as success for manual payments
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
                    })];
                case 4:
                    payment = _a.sent();
                    logger_1.logger.info("Payment ".concat(payment.id, " created successfully for tenant ").concat(tenantId));
                    return [2 /*return*/, payment];
                case 5:
                    error_1 = _a.sent();
                    logger_1.logger.error('Error creating payment:', error_1);
                    throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Allocate payment to installments
 * @param tenantId - Tenant ID
 * @param paymentId - Payment ID
 * @param data - Allocation data
 * @param actorUserId - User allocating payment
 * @returns Allocation result
 */
function allocatePayment(tenantId, paymentId, data, actorUserId) {
    return __awaiter(this, void 0, void 0, function () {
        var payment, allocatedAmount, remainingAmount, installments_2, allocations_1, amountToAllocate, _i, installments_1, installment, existingAllocations, allocatedToInstallment, totalAmountDue, remainingDue, allocationAmount, createdAllocations, error_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    return [4 /*yield*/, database_1.prisma.rentalPayment.findFirst({
                            where: {
                                id: paymentId,
                                tenant_id: tenantId,
                            },
                            include: {
                                allocations: true,
                            },
                        })];
                case 1:
                    payment = _a.sent();
                    if (!payment) {
                        throw new Error('Paiement introuvable');
                    }
                    allocatedAmount = payment.allocations.reduce(function (sum, alloc) { return sum + Number(alloc.amount); }, 0);
                    remainingAmount = Number(payment.amount) - allocatedAmount;
                    if (remainingAmount <= 0) {
                        throw new Error('Le paiement est déjà entièrement alloué');
                    }
                    return [4 /*yield*/, database_1.prisma.rentalInstallment.findMany({
                            where: {
                                id: { in: data.installmentIds },
                                tenant_id: tenantId,
                                lease_id: payment.lease_id || undefined,
                            },
                            orderBy: [
                                { due_date: 'asc' }, // Prioritize oldest first
                            ],
                        })];
                case 2:
                    installments_2 = _a.sent();
                    if (installments_2.length === 0) {
                        throw new Error('Aucune échéance trouvée');
                    }
                    allocations_1 = [];
                    amountToAllocate = remainingAmount;
                    _i = 0, installments_1 = installments_2;
                    _a.label = 3;
                case 3:
                    if (!(_i < installments_1.length)) return [3 /*break*/, 6];
                    installment = installments_1[_i];
                    if (amountToAllocate <= 0)
                        return [3 /*break*/, 6];
                    return [4 /*yield*/, database_1.prisma.rentalPaymentAllocation.findMany({
                            where: { installment_id: installment.id },
                        })];
                case 4:
                    existingAllocations = _a.sent();
                    allocatedToInstallment = existingAllocations.reduce(function (sum, alloc) { return sum + Number(alloc.amount); }, 0);
                    totalAmountDue = Number(installment.amount_rent) +
                        Number(installment.amount_service) +
                        Number(installment.amount_other_fees) +
                        Number(installment.penalty_amount);
                    remainingDue = totalAmountDue - allocatedToInstallment;
                    if (remainingDue <= 0)
                        return [3 /*break*/, 5];
                    allocationAmount = void 0;
                    if (data.amounts && data.amounts[installment.id]) {
                        // Use manually specified amount, but don't exceed remaining due
                        allocationAmount = Math.min(data.amounts[installment.id], remainingDue, amountToAllocate);
                    }
                    else {
                        // Auto-allocate: use minimum of remaining due and remaining payment
                        allocationAmount = Math.min(remainingDue, amountToAllocate);
                    }
                    if (allocationAmount > 0) {
                        allocations_1.push({
                            tenant_id: tenantId,
                            payment_id: paymentId,
                            installment_id: installment.id,
                            amount: new library_1.Decimal(allocationAmount),
                            currency: payment.currency,
                        });
                        amountToAllocate -= allocationAmount;
                    }
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    if (allocations_1.length === 0) {
                        throw new Error('Aucune allocation possible');
                    }
                    return [4 /*yield*/, database_1.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var created, _loop_1, _i, allocations_2, allocation;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx.rentalPaymentAllocation.createMany({
                                            data: allocations_1,
                                        })];
                                    case 1:
                                        created = _a.sent();
                                        _loop_1 = function (allocation) {
                                            var installment, allAllocations, totalAllocated, totalAmountDue, newStatus;
                                            return __generator(this, function (_b) {
                                                switch (_b.label) {
                                                    case 0:
                                                        installment = installments_2.find(function (i) { return i.id === allocation.installment_id; });
                                                        if (!installment)
                                                            return [2 /*return*/, "continue"];
                                                        return [4 /*yield*/, tx.rentalPaymentAllocation.findMany({
                                                                where: { installment_id: installment.id },
                                                            })];
                                                    case 1:
                                                        allAllocations = _b.sent();
                                                        totalAllocated = allAllocations.reduce(function (sum, alloc) { return sum + Number(alloc.amount); }, 0) + Number(allocation.amount);
                                                        totalAmountDue = Number(installment.amount_rent) +
                                                            Number(installment.amount_service) +
                                                            Number(installment.amount_other_fees) +
                                                            Number(installment.penalty_amount);
                                                        newStatus = installment.status;
                                                        if (totalAllocated >= totalAmountDue) {
                                                            newStatus = client_1.RentalInstallmentStatus.PAID;
                                                        }
                                                        else if (totalAllocated > 0) {
                                                            newStatus = client_1.RentalInstallmentStatus.PARTIAL;
                                                        }
                                                        return [4 /*yield*/, tx.rentalInstallment.update({
                                                                where: { id: installment.id },
                                                                data: {
                                                                    status: newStatus,
                                                                    amount_paid: new library_1.Decimal(totalAllocated),
                                                                    paid_at: newStatus === client_1.RentalInstallmentStatus.PAID ? new Date() : undefined,
                                                                },
                                                            })];
                                                    case 2:
                                                        _b.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        };
                                        _i = 0, allocations_2 = allocations_1;
                                        _a.label = 2;
                                    case 2:
                                        if (!(_i < allocations_2.length)) return [3 /*break*/, 5];
                                        allocation = allocations_2[_i];
                                        return [5 /*yield**/, _loop_1(allocation)];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 5: return [2 /*return*/, created];
                                }
                            });
                        }); })];
                case 7:
                    createdAllocations = _a.sent();
                    logger_1.logger.info("Payment ".concat(paymentId, " allocated to ").concat(allocations_1.length, " installments"));
                    return [2 /*return*/, {
                            allocations: allocations_1,
                            totalAllocated: allocations_1.reduce(function (sum, a) { return sum + Number(a.amount); }, 0),
                        }];
                case 8:
                    error_2 = _a.sent();
                    logger_1.logger.error('Error allocating payment:', error_2);
                    throw error_2;
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Update payment status
 * @param tenantId - Tenant ID
 * @param paymentId - Payment ID
 * @param status - New status
 * @param actorUserId - User updating status
 * @returns Updated payment
 */
function updatePaymentStatus(tenantId, paymentId, status, actorUserId) {
    return __awaiter(this, void 0, void 0, function () {
        var payment, updateData, updatedPayment, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, database_1.prisma.rentalPayment.findFirst({
                            where: {
                                id: paymentId,
                                tenant_id: tenantId,
                            },
                        })];
                case 1:
                    payment = _a.sent();
                    if (!payment) {
                        throw new Error('Paiement introuvable');
                    }
                    updateData = { status: status };
                    // Set timestamp based on status
                    if (status === client_1.RentalPaymentStatus.SUCCESS && !payment.succeeded_at) {
                        updateData.succeeded_at = new Date();
                    }
                    else if (status === client_1.RentalPaymentStatus.FAILED && !payment.failed_at) {
                        updateData.failed_at = new Date();
                    }
                    else if (status === client_1.RentalPaymentStatus.CANCELED && !payment.canceled_at) {
                        updateData.canceled_at = new Date();
                    }
                    return [4 /*yield*/, database_1.prisma.rentalPayment.update({
                            where: { id: paymentId },
                            data: updateData,
                            include: {
                                allocations: {
                                    include: {
                                        installment: true,
                                    },
                                },
                            },
                        })];
                case 2:
                    updatedPayment = _a.sent();
                    logger_1.logger.info("Payment ".concat(paymentId, " status updated to ").concat(status));
                    return [2 /*return*/, updatedPayment];
                case 3:
                    error_3 = _a.sent();
                    logger_1.logger.error('Error updating payment status:', error_3);
                    throw error_3;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get payment by ID
 * @param tenantId - Tenant ID
 * @param paymentId - Payment ID
 * @returns Payment or null
 */
function getPaymentById(tenantId, paymentId) {
    return __awaiter(this, void 0, void 0, function () {
        var payment, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, database_1.prisma.rentalPayment.findFirst({
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
                        })];
                case 1:
                    payment = _a.sent();
                    return [2 /*return*/, payment];
                case 2:
                    error_4 = _a.sent();
                    logger_1.logger.error('Error getting payment:', error_4);
                    throw error_4;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * List payments with filters
 * @param tenantId - Tenant ID
 * @param filters - Filter criteria
 * @param options - Pagination options
 * @returns Paginated payment list
 */
function listPayments(tenantId_1, filters_1) {
    return __awaiter(this, arguments, void 0, function (tenantId, filters, options) {
        var _a, page, _b, limit, skip, where, _c, payments, total, error_5;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    _a = options.page, page = _a === void 0 ? 1 : _a, _b = options.limit, limit = _b === void 0 ? 50 : _b;
                    skip = (page - 1) * limit;
                    where = {
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
                    return [4 /*yield*/, Promise.all([
                            database_1.prisma.rentalPayment.findMany({
                                where: where,
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
                                skip: skip,
                                take: limit,
                            }),
                            database_1.prisma.rentalPayment.count({ where: where }),
                        ])];
                case 1:
                    _c = _d.sent(), payments = _c[0], total = _c[1];
                    return [2 /*return*/, {
                            data: payments,
                            pagination: {
                                page: page,
                                limit: limit,
                                total: total,
                                totalPages: Math.ceil(total / limit),
                            },
                        }];
                case 2:
                    error_5 = _d.sent();
                    logger_1.logger.error('Error listing payments:', error_5);
                    throw error_5;
                case 3: return [2 /*return*/];
            }
        });
    });
}
