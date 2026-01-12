import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  listPenalties,
  calculatePenalties,
  updatePenalty,
  deletePenalty,
  uploadPenaltyJustification,
  RentalPenalty,
  PenaltyFilters,
} from '../../services/rental-service';
import { RefreshCw, DollarSign, AlertTriangle, Edit, Trash2, FileText, X, Upload, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';

interface PenaltiesProps {
  leaseId?: string;
}

export const Penalties: React.FC<PenaltiesProps> = ({ leaseId: propLeaseId }) => {
  const { tenantId, leaseId: paramLeaseId } = useParams<{ tenantId: string; leaseId?: string }>();
  const leaseId = propLeaseId || paramLeaseId;
  const [penalties, setPenalties] = useState<RentalPenalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [showJustificationForm, setShowJustificationForm] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState<RentalPenalty | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<PenaltyFilters>({
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

  useEffect(() => {
    if (tenantId) {
      loadPenalties();
    }
  }, [tenantId, filters, leaseId]);

  // Auto-calculate penalties on mount
  useEffect(() => {
    if (tenantId && leaseId) {
      autoCalculatePenalties();
    }
  }, [tenantId, leaseId]);

  const loadPenalties = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listPenalties(tenantId, {
        ...filters,
        leaseId: leaseId || filters.leaseId,
      });
      if (response.success) {
        setPenalties(response.data || []);
        // Update pagination with data length since API doesn't return pagination
        setPagination({
          page: 1,
          limit: 50,
          total: (response.data || []).length,
          totalPages: 1,
        });
      } else {
        setError('Erreur lors du chargement des pénalités');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des pénalités');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!tenantId || !leaseId) return;
    setCalculating(true);
    setError(null);
    try {
      const response = await calculatePenalties(tenantId);
      if (response.success) {
        await loadPenalties();
      } else {
        setError('Erreur lors du calcul des pénalités');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du calcul des pénalités');
    } finally {
      setCalculating(false);
    }
  };

  const autoCalculatePenalties = async () => {
    if (!tenantId) return;
    try {
      // Calculate penalties silently in the background, then reload
      const response = await calculatePenalties(tenantId);
      if (response.success) {
        // Silently reload penalties after auto-calculation
        await loadPenalties();
      }
    } catch (err: any) {
      // Silently ignore errors for auto-calculation
      console.error('Auto penalty calculation failed:', err);
    }
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

  const getJustificationInfo = (penalty: RentalPenalty) => {
    // Check both override_reason (from DB) and adjustment_reason (from interface)
    const reasonText = (penalty as any).override_reason || penalty.adjustment_reason;
    if (!reasonText) return null;
    try {
      const parsed = JSON.parse(reasonText);
      return parsed.justification || null;
    } catch {
      return null;
    }
  };

  const getAdjustmentReason = (penalty: RentalPenalty) => {
    // Check both override_reason (from DB) and adjustment_reason (from interface)
    const reasonText = (penalty as any).override_reason || penalty.adjustment_reason;
    if (!reasonText) return null;
    try {
      const parsed = JSON.parse(reasonText);
      return parsed.reason || reasonText;
    } catch {
      return reasonText;
    }
  };

  const handleOpenAdjustForm = (penalty: RentalPenalty) => {
    setSelectedPenalty(penalty);
    setAdjustAmount(penalty.adjusted_amount?.toString() || penalty.amount.toString());
    setAdjustReason(getAdjustmentReason(penalty) || '');
    setShowAdjustForm(true);
  };

  const handleOpenJustificationForm = (penalty: RentalPenalty) => {
    setSelectedPenalty(penalty);
    setShowJustificationForm(true);
  };

  const handleAdjustPenalty = async () => {
    if (!tenantId || !selectedPenalty) return;
    
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Le montant doit être un nombre positif');
      return;
    }

    if (!adjustReason.trim()) {
      setError('Veuillez indiquer une raison pour l\'ajustement');
      return;
    }

    setIsAdjusting(true);
    setError(null);
    try {
      await updatePenalty(tenantId, selectedPenalty.id, amount, adjustReason);
      setShowAdjustForm(false);
      setSelectedPenalty(null);
      setAdjustAmount('');
      setAdjustReason('');
      await loadPenalties();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'ajustement de la pénalité');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleDeletePenalty = async (penaltyId: string) => {
    if (!tenantId) return;
    
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer cette pénalité ? Cette action est irréversible.'
    );
    
    if (!confirmed) return;

    setIsDeleting(penaltyId);
    setError(null);
    try {
      await deletePenalty(tenantId, penaltyId);
      await loadPenalties();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression de la pénalité');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!tenantId || !selectedPenalty || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    setIsUploading(true);
    setError(null);
    
    try {
      await uploadPenaltyJustification(tenantId, selectedPenalty.id, file);
      setShowJustificationForm(false);
      setSelectedPenalty(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadPenalties();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload du justificatif');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadJustification = (justification: any) => {
    if (justification?.fileUrl) {
      window.open(justification.fileUrl, '_blank');
    }
  };

  // If used as standalone page (not in tab)
  const isStandalone = !propLeaseId;

  const content = (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pénalités</h1>
            <p className="text-muted-foreground">
              {leaseId ? 'Pénalités du bail' : 'Gérez les pénalités de retard'}
            </p>
          </div>
          {leaseId && (
            <Button
              onClick={handleCalculate}
              disabled={calculating}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {calculating ? 'Calcul en cours...' : 'Calculer les pénalités'}
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : penalties.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {leaseId
              ? 'Aucune pénalité calculée. Cliquez sur "Calculer les pénalités" pour commencer.'
              : 'Aucune pénalité trouvée'}
          </div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date de calcul</TableHead>
                    <TableHead>Jours de retard</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Montant ajusté</TableHead>
                    <TableHead>Raison d'ajustement</TableHead>
                    <TableHead>Justificatif</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penalties.map((penalty) => {
                    const justification = getJustificationInfo(penalty);
                    const adjustmentReason = getAdjustmentReason(penalty);
                    return (
                      <TableRow key={penalty.id}>
                        <TableCell>{formatDate(penalty.calculated_at)}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{penalty.days_late} jours</Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(penalty.amount, penalty.currency)}
                        </TableCell>
                        <TableCell>
                          {penalty.adjusted_amount
                            ? formatCurrency(penalty.adjusted_amount, penalty.currency)
                            : formatCurrency(penalty.amount, penalty.currency)}
                        </TableCell>
                        <TableCell>
                          {adjustmentReason || '-'}
                        </TableCell>
                        <TableCell>
                          {justification ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadJustification(justification)}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              Voir
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAdjustForm(penalty)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Ajuster
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenJustificationForm(penalty)}
                              className="flex items-center gap-1"
                            >
                              <Upload className="h-3 w-3" />
                              Justificatif
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeletePenalty(penalty.id)}
                              disabled={isDeleting === penalty.id}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              {isDeleting === penalty.id ? '...' : 'Supprimer'}
                            </Button>
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
                  Page {pagination.page} sur {pagination.totalPages} ({pagination.total} pénalités)
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

        {/* Adjust Penalty Modal */}
        {showAdjustForm && selectedPenalty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Edit className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Ajuster la pénalité</h2>
                    <p className="text-sm text-muted-foreground">
                      Montant initial: {formatCurrency(selectedPenalty.amount, selectedPenalty.currency)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAdjustForm(false);
                    setSelectedPenalty(null);
                    setAdjustAmount('');
                    setAdjustReason('');
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="adjustAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau montant
                  </label>
                  <Input
                    id="adjustAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="adjustReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Raison de l'ajustement
                  </label>
                  <textarea
                    id="adjustReason"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Expliquez la raison de cet ajustement..."
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAdjustForm(false);
                    setSelectedPenalty(null);
                    setAdjustAmount('');
                    setAdjustReason('');
                  }}
                  disabled={isAdjusting}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleAdjustPenalty}
                  disabled={isAdjusting}
                >
                  {isAdjusting ? 'Ajustement...' : 'Ajuster la pénalité'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Justification Modal */}
        {showJustificationForm && selectedPenalty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <Upload className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Ajouter un justificatif</h2>
                    <p className="text-sm text-muted-foreground">
                      Pénalité: {formatCurrency(selectedPenalty.amount, selectedPenalty.currency)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowJustificationForm(false);
                    setSelectedPenalty(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="justificationFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Fichier justificatif
                  </label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Formats acceptés: PDF, Word, Images (JPEG, PNG)
                  </p>
                  <Input
                    id="justificationFile"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="mt-1"
                    disabled={isUploading}
                  />
                </div>
                {getJustificationInfo(selectedPenalty) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">Justificatif existant:</p>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        {getJustificationInfo(selectedPenalty)?.fileName || 'Fichier'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadJustification(getJustificationInfo(selectedPenalty))}
                        className="ml-auto"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Le nouveau fichier remplacera l'ancien.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowJustificationForm(false);
                    setSelectedPenalty(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isUploading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (isStandalone) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
};

