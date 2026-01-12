import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Settings, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getTenant, updateTenantSelf, Tenant, UpdateTenantRequest } from '../../services/tenant-service';

export const TenantSettings: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    country: '',
    website: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tenantId) {
      loadTenant();
    }
  }, [tenantId]);

  const loadTenant = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getTenant(tenantId);
      if (response.success && response.data) {
        const tenantData = response.data;
        setTenant(tenantData);
        setFormData({
          name: tenantData.name || '',
          legalName: tenantData.legalName || '',
          contactEmail: tenantData.contactEmail || '',
          contactPhone: tenantData.contactPhone || '',
          address: tenantData.address || '',
          city: tenantData.city || '',
          country: tenantData.country || '',
          website: tenantData.website || '',
        });
      } else {
        setError('Erreur lors du chargement des informations');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des informations');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setSuccess(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Email invalide';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'URL invalide (doit commencer par http:// ou https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);

    if (!validate()) {
      return;
    }

    if (!tenantId) return;

    setSaving(true);
    try {
      const updateData: Omit<UpdateTenantRequest, 'status' | 'subdomain' | 'customDomain'> = {
        name: formData.name,
        legalName: formData.legalName || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        website: formData.website || undefined,
      };

      const response = await updateTenantSelf(tenantId, updateData);
      if (response.success) {
        setSuccess(true);
        setTenant(response.data);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Erreur lors de la sauvegarde');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !tenant) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadTenant} variant="outline">
            Réessayer
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Paramètres de l'Agence</h1>
          <p className="mt-2 text-sm text-slate-600">
            Gérez les informations de votre agence. Ces informations seront utilisées dans les documents générés.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800">Informations mises à jour avec succès !</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Informations Générales */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Informations Générales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'agence <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Nom de l'agence"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="legalName" className="block text-sm font-medium text-gray-700 mb-1">
                  Dénomination légale
                </label>
                <Input
                  id="legalName"
                  value={formData.legalName}
                  onChange={(e) => handleChange('legalName', e.target.value)}
                  placeholder="Dénomination légale (optionnel)"
                />
              </div>
            </div>
          </div>

          {/* Informations de Contact */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Informations de Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email de contact
                </label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  placeholder="contact@agence.com"
                  className={errors.contactEmail ? 'border-red-500' : ''}
                />
                {errors.contactEmail && (
                  <p className="text-sm text-red-600 mt-1">{errors.contactEmail}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Utilisé dans les documents générés (AGENCE_EMAIL)
                </p>
              </div>

              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone de contact
                </label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  placeholder="+225 XX XX XX XX XX"
                  className={errors.contactPhone ? 'border-red-500' : ''}
                />
                {errors.contactPhone && (
                  <p className="text-sm text-red-600 mt-1">{errors.contactPhone}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Utilisé dans les documents générés (AGENCE_TELEPHONE)
                </p>
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Adresse</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse complète
                </label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Adresse complète de l'agence"
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
                <p className="text-xs text-slate-500 mt-1">
                  Utilisé dans les documents générés (AGENCE_ADRESSE)
                </p>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Ville"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Pays
                </label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="Pays"
                />
              </div>
            </div>
          </div>

          {/* Informations Supplémentaires */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Informations Supplémentaires</h2>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Site web
              </label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://www.agence.com"
                className={errors.website ? 'border-red-500' : ''}
              />
              {errors.website && <p className="text-sm text-red-600 mt-1">{errors.website}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button type="submit" disabled={saving} className="min-w-[120px]">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Information importante</h3>
              <p className="text-sm text-blue-800">
                Les informations renseignées ici seront utilisées automatiquement dans tous les documents
                générés (contrats de bail, reçus, etc.). Assurez-vous que les informations sont complètes
                et à jour.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
