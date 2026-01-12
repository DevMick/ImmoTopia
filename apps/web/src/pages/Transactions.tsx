import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/dashboard-layout';
import { useAuth } from '../context/AuthContext';
import { FileText, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantMembership } = useAuth();
  const tenantId = tenantMembership?.tenantId;

  // Determine active tab from URL
  const getActiveTab = (): 'all' | 'sales' | 'rentals' => {
    if (location.pathname.includes('/sales')) return 'sales';
    if (location.pathname.includes('/rentals')) return 'rentals';
    return 'all';
  };

  const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'rentals'>(getActiveTab());

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  if (!tenantId) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-gray-600">Aucun tenant sélectionné.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
            <p className="mt-2 text-sm text-slate-600">
              Gérez vos transactions immobilières (ventes et locations)
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => navigate('/transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Toutes les transactions
            </button>
            <button
              onClick={() => navigate('/transactions/sales')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ventes
            </button>
            <button
              onClick={() => navigate('/transactions/rentals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rentals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Locations
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'all' && 'Toutes les transactions'}
              {activeTab === 'sales' && 'Ventes'}
              {activeTab === 'rentals' && 'Locations'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'all' &&
                'Consultez vos deals CRM pour les ventes et vos baux pour les locations.'}
              {activeTab === 'sales' &&
                'Gérez vos transactions de vente depuis le module CRM.'}
              {activeTab === 'rentals' &&
                'Gérez vos baux et locations depuis le module Location.'}
            </p>
            <div className="flex gap-4 justify-center">
              {activeTab === 'all' || activeTab === 'sales' ? (
                <Button
                  onClick={() => navigate(`/tenant/${tenantId}/crm/deals`)}
                  className="inline-flex items-center gap-2"
                >
                  Voir les deals CRM
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
              {activeTab === 'all' || activeTab === 'rentals' ? (
                <Button
                  onClick={() => navigate(`/tenant/${tenantId}/rental/leases`)}
                  variant="outline"
                  className="inline-flex items-center gap-2"
                >
                  Voir les baux
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

