import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Button } from '../../components/ui/button';
import { getPayment, RentalPayment, RentalPaymentStatus, allocatePayment, AllocatePaymentRequest } from '../../services/rental-service';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, DollarSign, CreditCard, Calendar, FileText, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { updatePaymentStatus } from '../../services/rental-service';
import { AllocatePaymentForm } from '../../components/rental/AllocatePaymentForm';

export const PaymentDetailPage: React.FC = () => {
  const { tenantId, paymentId } = useParams<{ tenantId: string; paymentId: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<RentalPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllocateForm, setShowAllocateForm] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);

  useEffect(() => {
    if (tenantId && paymentId) {
      loadPayment();
    }
  }, [tenantId, paymentId]);

  const loadPayment = async () => {
    if (!tenantId || !paymentId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getPayment(tenantId, paymentId);
      if (response.success) {
        setPayment(response.data);
      } else {
        setError('Erreur lors du chargement du paiement');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: RentalPaymentStatus) => {
    if (!tenantId || !paymentId) return;
    try {
      await updatePaymentStatus(tenantId, paymentId, newStatus);
      loadPayment();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusBadge = (status: RentalPaymentStatus) => {
    const statusMap: Record<RentalPaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'En attente', variant: 'outline' },
      SUCCESS: { label: 'Réussi', variant: 'default' },
      FAILED: { label: 'Échoué', variant: 'destructive' },
      CANCELED: { label: 'Annulé', variant: 'secondary' },
      REFUNDED: { label: 'Remboursé', variant: 'secondary' },
      PARTIALLY_REFUNDED: { label: 'Partiellement remboursé', variant: 'secondary' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      CASH: 'Espèces',
      BANK_TRANSFER: 'Virement bancaire',
      CHECK: 'Chèque',
      MOBILE_MONEY: 'Mobile Money',
      CARD: 'Carte bancaire',
      OTHER: 'Autre',
    };
    return methodMap[method] || method;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number, currency: string = 'FCFA') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === 'FCFA' ? 'XOF' : currency,
    }).format(amount);
  };

  const handleAllocatePayment = async (data: AllocatePaymentRequest) => {
    if (!tenantId || !paymentId) return;
    setIsAllocating(true);
    setError(null);
    try {
      await allocatePayment(tenantId, paymentId, data);
      setShowAllocateForm(false);
      await loadPayment();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'allocation du paiement');
      throw err;
    } finally {
      setIsAllocating(false);
    }
  };

  // Calculate allocated and available amounts
  const allocatedAmount = payment?.allocations?.reduce(
    (sum, alloc) => sum + Number(alloc.amount || 0),
    0
  ) || 0;
  const availableAmount = (payment?.amount || 0) - allocatedAmount;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">Chargement...</div>
      </DashboardLayout>
    );
  }

  if (error || !payment) {
    return (
      <DashboardLayout>
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error || 'Paiement non trouvé'}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (payment.lease_id) {
                  navigate(`/tenant/${tenantId}/rental/leases/${payment.lease_id}`);
                } else {
                  navigate(`/tenant/${tenantId}/rental/payments`);
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Paiement #{payment.id.slice(0, 8)}</h1>
              <p className="text-muted-foreground">Détails du paiement</p>
            </div>
          </div>
          <Select
            value={payment.status}
            onValueChange={(value) => handleStatusChange(value as RentalPaymentStatus)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="SUCCESS">Réussi</SelectItem>
              <SelectItem value="FAILED">Échoué</SelectItem>
              <SelectItem value="CANCELED">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Informations financières
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Montant</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatCurrency(payment.amount, payment.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Montant alloué</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatCurrency(allocatedAmount, payment.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Montant disponible</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrency(availableAmount, payment.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Méthode de paiement</dt>
                <dd className="mt-1 text-sm text-gray-900">{getMethodLabel(payment.method)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Statut</dt>
                <dd className="mt-1">{getStatusBadge(payment.status)}</dd>
              </div>
              {payment.mm_operator && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Opérateur Mobile Money</dt>
                  <dd className="mt-1 text-sm text-gray-900">{payment.mm_operator}</dd>
                </div>
              )}
              {payment.mm_phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Numéro de téléphone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{payment.mm_phone}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Date d'initiation</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(payment.initiated_at)}</dd>
              </div>
              {payment.succeeded_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date de succès</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(payment.succeeded_at)}</dd>
                </div>
              )}
              {payment.failed_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date d'échec</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(payment.failed_at)}</dd>
                </div>
              )}
              {payment.canceled_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date d'annulation</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(payment.canceled_at)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Allocations Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Allocations aux échéances
            </h2>
            {payment.lease_id && availableAmount > 0 && payment.status === 'SUCCESS' && (
              <Button onClick={() => setShowAllocateForm(true)}>
                Allouer le paiement
              </Button>
            )}
          </div>

          {payment.allocations && payment.allocations.length > 0 ? (
            <div className="space-y-3">
              {payment.allocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    {allocation.installment ? (
                      <>
                        <p className="font-medium">
                          Échéance {allocation.installment.period_month}/{allocation.installment.period_year} - 
                          {' '}Échéance du {formatDate(allocation.installment.due_date)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Montant alloué: {formatCurrency(allocation.amount, allocation.currency)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">Échéance ID: {allocation.installment_id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Montant alloué: {formatCurrency(allocation.amount, allocation.currency)}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(allocation.created_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune allocation effectuée</p>
              {payment.lease_id && availableAmount > 0 && payment.status === 'SUCCESS' && (
                <p className="mt-2 text-sm">
                  Cliquez sur "Allouer le paiement" pour allouer ce paiement à une ou plusieurs échéances.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Allocation Modal */}
        {showAllocateForm && payment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Allouer le paiement aux échéances</h2>
                    <p className="text-sm text-gray-600">
                      Montant disponible: {formatCurrency(availableAmount, payment.currency)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllocateForm(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Form Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <AllocatePaymentForm
                  tenantId={tenantId!}
                  payment={payment}
                  onSubmit={handleAllocatePayment}
                  onCancel={() => setShowAllocateForm(false)}
                  loading={isAllocating}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};





