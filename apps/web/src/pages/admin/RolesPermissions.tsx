import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import {
  listRoles,
  getRole,
  listPermissions,
  updateRolePermissions,
  Role,
  Permission
} from '../../services/role-service';
import { Shield, Check, Loader2, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const RolesPermissions: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions();
    }
  }, [selectedRole]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        listRoles(),
        listPermissions()
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
      if (rolesData.length > 0 && !selectedRole) {
        setSelectedRole(rolesData[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      const role = await getRole(selectedRole.id);
      setRolePermissions(new Set(role.permissions?.map(p => p.id) || []));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des permissions du rôle');
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setSuccess(null);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setRolePermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateRolePermissions(selectedRole.id, Array.from(rolePermissions));
      setSuccess('Permissions mises à jour avec succès');
      // Reload role to get updated data
      const updatedRole = await getRole(selectedRole.id);
      setSelectedRole(updatedRole);
      setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour des permissions');
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by prefix (e.g., CRM_, PROPERTIES_, etc.)
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const prefix = perm.key.split('_')[0];
    if (!acc[prefix]) {
      acc[prefix] = [];
    }
    acc[prefix].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Rôles et Permissions</h1>
          <p className="mt-2 text-sm text-slate-600">
            Configurez les permissions pour chaque rôle
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Roles List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Rôles</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                      selectedRole?.id === role.id
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{role.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {role.scope === 'PLATFORM' ? 'Plateforme' : 'Tenant'}
                        </p>
                      </div>
                      <Shield
                        className={`h-5 w-5 ${
                          selectedRole?.id === role.id ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="lg:col-span-3">
            {selectedRole ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Permissions - {selectedRole.name}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedRole.description || 'Aucune description'}
                    </p>
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-6">
                  {Object.entries(groupedPermissions).length === 0 ? (
                    <p className="text-sm text-slate-500">Aucune permission disponible</p>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedPermissions).map(([prefix, perms]) => (
                        <div key={prefix}>
                          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase">
                            {prefix}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {perms.map((permission) => {
                              const isChecked = rolePermissions.has(permission.id);
                              return (
                                <label
                                  key={permission.id}
                                  className="flex items-start p-3 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center h-5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handlePermissionToggle(permission.id)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                    />
                                  </div>
                                  <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-slate-900">
                                      {permission.key}
                                    </p>
                                    {permission.description && (
                                      <p className="text-xs text-slate-500 mt-1">
                                        {permission.description}
                                      </p>
                                    )}
                                  </div>
                                  {isChecked && (
                                    <Check className="h-5 w-5 text-green-600 ml-2" />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">Sélectionnez un rôle pour gérer ses permissions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

