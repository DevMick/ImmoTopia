import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/dashboard-layout';
import { useAuth } from '../context/AuthContext';
import { BarChart3, FileText, TrendingUp, DollarSign, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { tenantMembership } = useAuth();
  const tenantId = tenantMembership?.tenantId;

  if (!tenantId) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-gray-600">Aucun tenant sélectionné.</p>
        </div>
      </DashboardLayout>
    );
  }

  const reportCards = [
    {
      title: 'Rapports de ventes',
      description: 'Analysez vos transactions de vente et vos deals CRM',
      icon: <TrendingUp className="h-8 w-8" />,
      href: `/tenant/${tenantId}/crm/deals`,
      color: 'bg-blue-500'
    },
    {
      title: 'Rapports de locations',
      description: 'Consultez les statistiques de vos baux et paiements',
      icon: <DollarSign className="h-8 w-8" />,
      href: `/tenant/${tenantId}/rental/leases`,
      color: 'bg-green-500'
    },
    {
      title: 'Rapports de propriétés',
      description: 'Analysez votre portefeuille immobilier',
      icon: <Building2 className="h-8 w-8" />,
      href: `/tenant/${tenantId}/properties`,
      color: 'bg-purple-500'
    },
    {
      title: 'Documents générés',
      description: 'Consultez tous les documents générés',
      icon: <FileText className="h-8 w-8" />,
      href: `/tenant/${tenantId}/rental/documents`,
      color: 'bg-orange-500'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Rapports</h1>
            <p className="mt-2 text-sm text-slate-600">
              Analysez vos données et générez des rapports détaillés
            </p>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start space-x-4">
                <div className={`${card.color} text-white p-3 rounded-lg`}>
                  {card.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {card.description}
                  </p>
                  <Button
                    onClick={() => navigate(card.href)}
                    variant="outline"
                    className="w-full"
                  >
                    Consulter
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Section */}
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Rapports avancés à venir
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Nous travaillons sur des fonctionnalités de reporting avancées incluant des graphiques
            interactifs, des exports personnalisés et des analyses prédictives. Ces fonctionnalités
            seront disponibles prochainement.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

