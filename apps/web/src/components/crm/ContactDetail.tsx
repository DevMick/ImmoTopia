import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { getContact, convertContact, removeContactRole, updateContactRoles, CrmContact, CrmContactDetail, createDeal, CreateCrmDealRequest, createActivity, CreateCrmActivityRequest } from '../../services/crm-service';
import { ActivityTimeline } from './ActivityTimeline';
import { ConvertContactDialog } from './ConvertContactDialog';
import { ManageRolesDialog } from './ManageRolesDialog';
import { TagManager } from './TagManager';
import { AddDealDialog } from './AddDealDialog';
import { ActivityForm } from './ActivityForm';
import { User, Mail, Phone, Calendar, Tag, Briefcase, Activity, Clock, CheckCircle, XCircle, Plus, X } from 'lucide-react';

interface ContactDetailProps {
  tenantId: string;
  contactId: string;
}

export const ContactDetail: React.FC<ContactDetailProps> = ({ tenantId, contactId }) => {
  const navigate = useNavigate();
  const [contact, setContact] = useState<CrmContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showManageRolesDialog, setShowManageRolesDialog] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [dealLoading, setDealLoading] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [removingRoleId, setRemovingRoleId] = useState<string | null>(null);

  useEffect(() => {
    loadContact();
  }, [tenantId, contactId]);

  const handleConvert = async (roles: string[]) => {
    try {
      await convertContact(tenantId, contactId, roles);
      setShowConvertDialog(false);
      await loadContact();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la conversion du contact');
    }
  };

  const handleCreateDeal = async (data: CreateCrmDealRequest) => {
    setDealLoading(true);
    try {
      await createDeal(tenantId, data);
      setShowDealDialog(false);
      await loadContact();
    } catch (err: any) {
      throw err; // Let DealForm handle the error
    } finally {
      setDealLoading(false);
    }
  };

  const handleCreateActivity = async (data: CreateCrmActivityRequest) => {
    setActivityLoading(true);
    try {
      await createActivity(tenantId, data);
      setShowActivityForm(false);
      await loadContact();
    } catch (err: any) {
      throw err; // Let ActivityForm handle the error
    } finally {
      setActivityLoading(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      return;
    }
    setRemovingRoleId(roleId);
    try {
      await removeContactRole(tenantId, contactId, roleId);
      await loadContact();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression du rôle');
    } finally {
      setRemovingRoleId(null);
    }
  };

  const handleUpdateRoles = async (roles: string[]) => {
    try {
      await updateContactRoles(tenantId, contactId, roles);
      setShowManageRolesDialog(false);
      await loadContact();
    } catch (err: any) {
      throw err; // Let ManageRolesDialog handle the error
    }
  };

  const loadContact = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getContact(tenantId, contactId);
      if (response.success) {
        console.log('Contact data received:', response.data);
        setContact(response.data);
      } else {
        setError('Erreur lors du chargement du contact');
      }
    } catch (err: any) {
      console.error('Error loading contact:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement du contact');
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status: string) => {
    const styles = {
      LEAD: 'bg-blue-100 text-blue-800',
      ACTIVE_CLIENT: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
    };
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          styles[status as keyof typeof styles] || styles.ARCHIVED
        }`}
      >
        {status === 'LEAD'
          ? 'Prospect'
          : status === 'ACTIVE_CLIENT'
          ? 'Client actif'
          : 'Archivé'}
      </span>
    );
  };

  const getDealStageLabel = (stage: string): string => {
    const labels: Record<string, string> = {
      NEW: 'Nouveau',
      QUALIFIED: 'Qualifié',
      APPOINTMENT: 'Rendez-vous',
      VISIT: 'Visite',
      NEGOTIATION: 'Négociation',
      WON: 'Gagné',
      LOST: 'Perdu',
    };
    return labels[stage] || stage;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Chargement du contact...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!contact) {
    return <div>Contact non trouvé</div>;
  }

  const displayName = contact.firstName || contact.lastName 
    ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
    : contact.email || 'Contact sans nom';

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-xl font-bold text-gray-900">
                {displayName}
              </h1>
              {getStatusBadge(contact.status)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{contact.email || 'Aucun email'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{contact.phone || 'Aucun téléphone'}</span>
              </div>
              {contact.source && (
                <div className="flex items-center text-gray-600">
                  <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Source : {contact.source}</span>
                </div>
              )}
              {contact.lastInteractionAt && (
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Dernière interaction : {new Date(contact.lastInteractionAt).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Créé le {new Date(contact.createdAt).toLocaleDateString('fr-FR')} • Modifié le {new Date(contact.updatedAt).toLocaleDateString('fr-FR')}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            {(() => {
              const hasActiveRoles = contact.roles && contact.roles.some((r: any) => r.active);
              const canConvert = contact.status === 'LEAD' || (contact.status === 'ACTIVE_CLIENT' && !hasActiveRoles);
              
              return canConvert ? (
                <Button size="sm" onClick={() => setShowConvertDialog(true)}>
                  Convertir
                </Button>
              ) : null;
            })()}
            <Button size="sm" variant="outline" onClick={() => navigate(`/tenant/${tenantId}/crm/contacts/${contactId}/edit`)}>
              Modifier
            </Button>
          </div>
        </div>
      </div>

      {showConvertDialog && contact && (
        <ConvertContactDialog
          contactName={displayName}
          onSubmit={handleConvert}
          onCancel={() => setShowConvertDialog(false)}
        />
      )}

      {showManageRolesDialog && contact && (
        <ManageRolesDialog
          contactName={displayName}
          currentRoles={contact.roles?.filter((r: any) => r.active).map((r: any) => r.role) || []}
          onSubmit={handleUpdateRoles}
          onCancel={() => setShowManageRolesDialog(false)}
        />
      )}

      {/* Grid Layout - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Roles & Tags - Column 1 */}
        <div className="space-y-4">
          {/* Roles */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-semibold flex items-center">
                <User className="h-4 w-4 mr-2" />
                Rôles
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManageRolesDialog(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Ajouter
              </Button>
            </div>
            {contact.roles && contact.roles.length > 0 ? (
              <div className="space-y-2">
                {contact.roles
                  .filter((role: any) => role.active)
                  .map((role: any) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{role.role}</span>
                        <span className="ml-2 text-xs text-green-600">Actif</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">
                          {new Date(role.startedAt).toLocaleDateString('fr-FR')}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRole(role.id)}
                          disabled={removingRoleId === role.id}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Supprimer ce rôle"
                        >
                          {removingRoleId === role.id ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                {contact.roles.filter((role: any) => role.active).length === 0 && (
                  <p className="text-gray-500 text-sm">Aucun rôle actif</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucun rôle assigné</p>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-semibold flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Groupes {contact.tags && contact.tags.length > 0 && `(${contact.tags.length})`}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTagManager(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Gérer
              </Button>
            </div>
            {contact.tags && contact.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag: any) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium shadow-sm"
                    style={{
                      backgroundColor: tag.color || '#3B82F6',
                      color: '#FFFFFF',
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Tag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-xs mb-2">Aucun groupe</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTagManager(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Deals - Column 2 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold flex items-center">
              <Briefcase className="h-4 w-4 mr-2" />
              Affaires {contact.deals && contact.deals.length > 0 && `(${contact.deals.length})`}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDealDialog(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Ajouter
            </Button>
          </div>
          {contact.deals && contact.deals.length > 0 ? (
            <div className="space-y-2">
              {contact.deals.map((deal: any) => (
                <div
                  key={deal.id}
                  onClick={() => navigate(`/tenant/${tenantId}/crm/deals/${deal.id}`)}
                  className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer text-sm transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{deal.type}</span>
                      <span className="ml-2 text-xs text-gray-600">- {getDealStageLabel(deal.stage)}</span>
                    </div>
                    {deal.budgetMax && (
                      <span className="text-xs font-medium">
                        {deal.budgetMax.toLocaleString('fr-FR', { style: 'decimal' })} FCFA
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Briefcase className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-xs mb-2">Aucune affaire associée</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDealDialog(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Créer
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Activities Timeline - Full Width */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Chronologie des activités
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowActivityForm(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Ajouter
          </Button>
        </div>
        {contact.recentActivities && contact.recentActivities.length > 0 ? (
          <ActivityTimeline activities={contact.recentActivities} tenantId={tenantId} contactId={contactId} />
        ) : (
          <div className="text-center py-6">
            <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-xs mb-2">Aucune activité récente</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActivityForm(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Créer
            </Button>
          </div>
        )}
      </div>

      {/* Tag Manager Modal */}
      {showTagManager && contact && (
        <TagManager
          tenantId={tenantId}
          contactId={contactId}
          contactName={displayName}
          onClose={() => setShowTagManager(false)}
          onTagsUpdated={loadContact}
        />
      )}

      {/* Add Deal Dialog */}
      {showDealDialog && contact && (
        <AddDealDialog
          tenantId={tenantId}
          contactId={contactId}
          contactName={displayName}
          onSubmit={handleCreateDeal}
          onCancel={() => setShowDealDialog(false)}
          loading={dealLoading}
        />
      )}

      {/* Add Activity Modal */}
      {showActivityForm && contact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Nouvelle activité</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActivityForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ActivityForm
                tenantId={tenantId}
                contactId={contactId}
                onSubmit={handleCreateActivity}
                onCancel={() => setShowActivityForm(false)}
                loading={activityLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

