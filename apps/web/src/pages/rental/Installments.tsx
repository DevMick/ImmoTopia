import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  listInstallments,
  generateInstallments,
  recalculateInstallmentStatuses,
  deleteAllInstallments,
  createPayment,
  allocatePayment,
  calculatePenalties,
  RentalInstallment,
  RentalInstallmentStatus,
  InstallmentFilters,
  RentalPaymentMethod,
  CreatePaymentRequest,
} from '../../services/rental-service';
import { Calendar, RefreshCw, Plus, Eye, DollarSign, CreditCard, Zap, Trash2, X } from 'lucide-react';
import { PaymentForm } from '../../components/rental/PaymentForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';

interface InstallmentsProps {
  leaseId?: string;
}

export const Installments: React.FC<InstallmentsProps> = ({ leaseId: propLeaseId }) => {
  const { tenantId, leaseId: paramLeaseId } = useParams<{ tenantId: string; leaseId?: string }>();
  const leaseId = propLeaseId || paramLeaseId;
  const navigate = useNavigate();
  const [installments, setInstallments] = useState<RentalInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<RentalInstallment | null>(null);
  const [processingQuickPayment, setProcessingQuickPayment] = useState<string | null>(null);
  const [filters, setFilters] = useState<InstallmentFilters>({
    leaseId: leaseId,
    page: 1,
    limit: 50,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Update filters when leaseId changes
  useEffect(() => {
    if (leaseId) {
      setFilters(prev => ({
        ...prev,
        leaseId: leaseId,
        page: 1, // Reset to first page when leaseId changes
      }));
    }
  }, [leaseId]);

  useEffect(() => {
    if (tenantId) {
      loadInstallments();
    }
  }, [tenantId, filters]);

  // Auto-recalculate installment statuses on mount
  useEffect(() => {
    if (tenantId && leaseId) {
      autoRecalculate();
    }
  }, [tenantId, leaseId]);

  const loadInstallments = async () => {
    if (!tenantId) return;

    // If we're in the context of a specific lease (propLeaseId or paramLeaseId exists),
    // we MUST have a leaseId to filter by. Don't load all installments.
    if (propLeaseId || paramLeaseId) {
      if (!leaseId) {
        // Don't load if we're in lease context but no leaseId
        setInstallments([]);
        setPagination({
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        });
        setLoading(false);
        return;
      }
    }

    // Use leaseId from props/params if available, otherwise use from filters
    const effectiveLeaseId = leaseId || filters.leaseId;

    setLoading(true);
    setError(null);
    try {
      const response = await listInstallments(tenantId, {
        ...filters,
        leaseId: effectiveLeaseId,
      });
      if (response.success) {
        setInstallments(response.data);
        setPagination(response.pagination);
      } else {
        setError('Erreur lors du chargement des échéances');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des échéances');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!tenantId || !leaseId) return;
    setGenerating(true);
    setError(null);
    try {
      const response = await generateInstallments(tenantId, leaseId);
      if (response.success) {
        await loadInstallments();
      } else {
        setError('Erreur lors de la génération des échéances');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la génération des échéances');
    } finally {
      setGenerating(false);
    }
  };

  const handleRecalculate = async () => {
    if (!tenantId || !leaseId) return;
    setLoading(true);
    try {
      // First, recalculate installment statuses
      await recalculateInstallmentStatuses(tenantId, leaseId);
      // Then, calculate penalties for overdue installments
      await calculatePenalties(tenantId);
      // Finally, reload installments
      await loadInstallments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du recalcul');
    } finally {
      setLoading(false);
    }
  };

  const autoRecalculate = async () => {
    if (!tenantId || !leaseId) return;
    try {
      // First, recalculate installment statuses
      await recalculateInstallmentStatuses(tenantId, leaseId);
      // Then, calculate penalties for overdue installments
      await calculatePenalties(tenantId);
      // Finally, reload installments to show updated data
      await loadInstallments();
    } catch (err: any) {
      // Silently ignore errors for auto-recalculation
      console.error('Auto recalculation failed:', err);
    }
  };

  const handleDeleteAll = async () => {
    if (!tenantId || !leaseId) return;
    
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer toutes les échéances de ce bail ? Cette action est irréversible.'
    );
    
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      const response = await deleteAllInstallments(tenantId, leaseId);
      if (response.success) {
        await loadInstallments();
      } else {
        setError('Erreur lors de la suppression des échéances');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression des échéances');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: RentalInstallmentStatus) => {
    const statusMap: Partial<Record<RentalInstallmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }>> = {
      DUE: { label: 'Échéance', variant: 'default' },
      PARTIAL: { label: 'Partiel', variant: 'secondary' },
      PAID: { label: 'Payé', variant: 'default' },
      OVERDUE: { label: 'En retard', variant: 'destructive' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number, currency: string = 'FCFA') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === 'FCFA' ? 'XOF' : currency,
    }).format(amount);
  };

  const calculateTotalDue = (installment: RentalInstallment) => {
    return (
      Number(installment.amount_rent || 0) +
      Number(installment.amount_service || 0) +
      Number(installment.amount_other_fees || 0) +
      Number(installment.penalty_amount || 0)
    );
  };

  const handleQuickPayment = async (installment: RentalInstallment) => {
    if (!tenantId) return;
    
    const totalDue = calculateTotalDue(installment);
    const remaining = totalDue - Number(installment.amount_paid || 0);
    
    if (remaining <= 0) {
      setError('Cette échéance est déjà payée');
      return;
    }

    setProcessingQuickPayment(installment.id);
    setError(null);
    
    try {
      // Create payment with CASH method and current date
      const paymentData: CreatePaymentRequest = {
        leaseId: installment.lease_id,
        method: RentalPaymentMethod.CASH,
        amount: remaining,
        currency: installment.currency,
        idempotencyKey: `quick-payment-${installment.id}-${Date.now()}`,
      };
      
      const paymentResponse = await createPayment(tenantId, paymentData);
      
      if (paymentResponse.success && paymentResponse.data) {
        // Allocate payment to the installment
        await allocatePayment(tenantId, paymentResponse.data.id, {
          installmentIds: [installment.id],
        });
        
        // Reload installments to show updated status
        await loadInstallments();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du paiement rapide');
    } finally {
      setProcessingQuickPayment(null);
    }
  };

  const handleOpenPaymentForm = (installment: RentalInstallment) => {
    console.log('Opening payment form for installment:', installment.id);
    setSelectedInstallment(installment);
    setShowPaymentForm(true);
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreatePayment = async (data: CreatePaymentRequest) => {
    if (!tenantId || !selectedInstallment) return;
    
    setError(null);
    
    try {
      const paymentData: CreatePaymentRequest = {
        ...data,
        leaseId: selectedInstallment.lease_id,
        idempotencyKey: data.idempotencyKey || `payment-${selectedInstallment.id}-${Date.now()}`,
      };
      
      const paymentResponse = await createPayment(tenantId, paymentData);
      
      if (paymentResponse.success && paymentResponse.data) {
        // Allocate payment to the selected installment
        await allocatePayment(tenantId, paymentResponse.data.id, {
          installmentIds: [selectedInstallment.id],
        });
        
        setShowPaymentForm(false);
        setSelectedInstallment(null);
        await loadInstallments();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement';
      setError(errorMessage);
      throw err;
    }
  };

  // If used as standalone page (not in tab)
  const isStandalone = !propLeaseId;

  const content = (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Échéances</h1>
            <p className="text-muted-foreground">
              {leaseId ? 'Échéances du bail' : 'Gérez les échéances de location'}
            </p>
          </div>
          <div className="flex gap-2">
            {leaseId && (
              <>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {generating ? 'Génération...' : 'Générer les échéances'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRecalculate}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recalculer
                </Button>
                {installments.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAll}
                    disabled={deleting || loading}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? 'Suppression...' : 'Supprimer toutes les échéances'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {showPaymentForm && selectedInstallment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Nouveau paiement</h2>
                    <p className="text-sm text-muted-foreground">
                      Échéance {selectedInstallment.period_month}/{selectedInstallment.period_year} - 
                      Date d'échéance: {formatDate(selectedInstallment.due_date)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setSelectedInstallment(null);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Form Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <PaymentForm
                  tenantId={tenantId!}
                  leaseId={selectedInstallment.lease_id}
                  defaultAmount={
                    (() => {
                      const totalDue = calculateTotalDue(selectedInstallment);
                      const remaining = totalDue - Number(selectedInstallment.amount_paid || 0);
                      return remaining > 0 ? remaining : undefined;
                    })()
                  }
                  defaultCurrency={selectedInstallment.currency}
                  onSubmit={handleCreatePayment}
                  onCancel={() => {
                    setShowPaymentForm(false);
                    setSelectedInstallment(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                status: value === 'all' ? undefined : (value as RentalInstallmentStatus),
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="DUE">Échéance</SelectItem>
              <SelectItem value="PARTIAL">Partiel</SelectItem>
              <SelectItem value="PAID">Payé</SelectItem>
              <SelectItem value="OVERDUE">En retard</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.overdue ? 'true' : 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                overdue: value === 'true',
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="true">En retard uniquement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : installments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {leaseId
              ? 'Aucune échéance générée. Cliquez sur "Générer les échéances" pour commencer.'
              : 'Aucune échéance trouvée'}
          </div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Période</TableHead>
                    <TableHead>Date d'échéance</TableHead>
                    <TableHead>Montant dû</TableHead>
                    <TableHead>Payé</TableHead>
                    <TableHead>Reste à payer</TableHead>
                    <TableHead>Pénalités</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((installment) => {
                    const totalDue = calculateTotalDue(installment);
                    const remaining = totalDue - Number(installment.amount_paid || 0);
                    return (
                      <TableRow key={installment.id}>
                        <TableCell>
                          {installment.period_month}/{installment.period_year}
                        </TableCell>
                        <TableCell>{formatDate(installment.due_date)}</TableCell>
                        <TableCell>
                          {formatCurrency(totalDue, installment.currency)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(installment.amount_paid, installment.currency)}
                        </TableCell>
                        <TableCell>
                          <span className={remaining > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                            {formatCurrency(remaining, installment.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {installment.penalty_amount > 0
                            ? formatCurrency(installment.penalty_amount, installment.currency)
                            : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(installment.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/tenant/${tenantId}/rental/installments/${installment.id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {remaining > 0 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickPayment(installment)}
                                  disabled={processingQuickPayment === installment.id}
                                  className="flex items-center gap-1"
                                >
                                  <Zap className="h-3 w-3" />
                                  {processingQuickPayment === installment.id ? '...' : 'Paiement rapide'}
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleOpenPaymentForm(installment)}
                                  className="flex items-center gap-1"
                                >
                                  <CreditCard className="h-3 w-3" />
                                  Paiement
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} sur {pagination.totalPages} ({pagination.total} échéances)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  if (isStandalone) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
};
