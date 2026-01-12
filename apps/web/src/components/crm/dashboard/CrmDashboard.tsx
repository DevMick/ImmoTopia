import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Briefcase, 
  CheckCircle, 
  Calendar, 
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { getCrmDashboard } from '../../../lib/api/crmDashboard';
import { CrmDashboardData, CrmDashboardFilters } from '../../../types/crmDashboard';
import { KpiCard } from './cards/KpiCard';
import { PipelineChart } from './charts/PipelineChart';
import { FunnelChart } from './charts/FunnelChart';
import { TimeSeriesChart } from './charts/TimeSeriesChart';
import { Workbench } from './workbench/Workbench';
import { TeamPerformanceTable } from './team/TeamPerformanceTable';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';

export const CrmDashboard: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<CrmDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse filters from URL
  const getFiltersFromUrl = (): CrmDashboardFilters => {
    const start = searchParams.get('start') || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const end = searchParams.get('end') || format(new Date(), 'yyyy-MM-dd');
    const assignee = searchParams.get('assignee') || undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined;
    const stages = searchParams.get('stages')?.split(',') as any[] || undefined;
    const statuses = searchParams.get('statuses')?.split(',') as any[] || undefined;

    return {
      start,
      end,
      assignee,
      tags,
      stages,
      statuses,
    };
  };

  const [filters, setFilters] = useState<CrmDashboardFilters>(getFiltersFromUrl());

  // Update filters when URL changes
  useEffect(() => {
    setFilters(getFiltersFromUrl());
  }, [searchParams]);

  // Fetch dashboard data
  useEffect(() => {
    if (!tenantId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getCrmDashboard(tenantId, filters);
        if (response.success) {
          setData(response.data);
        } else {
          setError('Erreur lors du chargement des données');
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId, filters]);

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<CrmDashboardFilters>) => {
    const updated = { ...filters, ...newFilters };
    const params = new URLSearchParams();
    
    if (updated.start) params.set('start', updated.start);
    if (updated.end) params.set('end', updated.end);
    if (updated.assignee) params.set('assignee', updated.assignee);
    if (updated.tags && updated.tags.length > 0) params.set('tags', updated.tags.join(','));
    if (updated.stages && updated.stages.length > 0) params.set('stages', updated.stages.join(','));
    if (updated.statuses && updated.statuses.length > 0) params.set('statuses', updated.statuses.join(','));

    setSearchParams(params);
  };

  // Navigation handlers for drill-down
  const handleKpiClick = (type: string) => {
    const baseUrl = `/tenant/${tenantId}/crm`;
    const params = new URLSearchParams();
    
    if (filters.start) params.set('startDate', filters.start);
    if (filters.end) params.set('endDate', filters.end);
    if (filters.assignee) params.set('assignee', filters.assignee);
    if (filters.tags && filters.tags.length > 0) params.set('tags', filters.tags.join(','));
    if (filters.statuses && filters.statuses.length > 0) params.set('status', filters.statuses.join(','));

    switch (type) {
      case 'newLeads':
        params.set('status', 'LEAD');
        navigate(`${baseUrl}/contacts?${params.toString()}`);
        break;
      case 'convertedLeads':
        params.set('status', 'ACTIVE_CLIENT');
        navigate(`${baseUrl}/contacts?${params.toString()}`);
        break;
      case 'dealsCreated':
        navigate(`${baseUrl}/deals?${params.toString()}`);
        break;
      case 'dealsWon':
        params.set('stage', 'WON');
        navigate(`${baseUrl}/deals?${params.toString()}`);
        break;
      case 'overdueActions':
        params.set('overdue', '1');
        navigate(`${baseUrl}/activities?${params.toString()}`);
        break;
    }
  };

  const handleStageClick = (stage: string) => {
    const params = new URLSearchParams();
    params.set('stage', stage);
    if (filters.start) params.set('startDate', filters.start);
    if (filters.end) params.set('endDate', filters.end);
    navigate(`/tenant/${tenantId}/crm/deals?${params.toString()}`);
  };

  const handleWorkbenchItemClick = (item: any) => {
    if (item.contactId) {
      navigate(`/tenant/${tenantId}/crm/contacts/${item.contactId}`);
    } else if (item.dealId) {
      navigate(`/tenant/${tenantId}/crm/deals/${item.dealId}`);
    } else if (item.activityId) {
      navigate(`/tenant/${tenantId}/crm/activities?activityId=${item.activityId}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>Aucune donnée disponible</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tableau de bord CRM</h1>
          <p className="text-slate-600 mt-1">
            {filters.start && filters.end
              ? `${format(new Date(filters.start), 'dd MMM yyyy')} - ${format(new Date(filters.end), 'dd MMM yyyy')}`
              : 'Vue d\'ensemble'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const today = new Date();
              updateFilters({
                start: format(startOfMonth(today), 'yyyy-MM-dd'),
                end: format(endOfMonth(today), 'yyyy-MM-dd'),
              });
            }}
          >
            Ce mois
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              updateFilters({
                start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                end: format(new Date(), 'yyyy-MM-dd'),
              });
            }}
          >
            30 derniers jours
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <KpiCard
          title="Nouveaux leads"
          icon={Users}
          iconColor="text-blue-600"
          value={data.kpis.newLeads}
          onClick={() => handleKpiClick('newLeads')}
          delay={0.1}
        />
        <KpiCard
          title="Leads convertis"
          icon={TrendingUp}
          iconColor="text-green-600"
          value={data.kpis.convertedLeads}
          onClick={() => handleKpiClick('convertedLeads')}
          delay={0.15}
        />
        <KpiCard
          title="Affaires créées"
          icon={Briefcase}
          iconColor="text-purple-600"
          value={data.kpis.dealsCreated}
          onClick={() => handleKpiClick('dealsCreated')}
          delay={0.2}
        />
        <KpiCard
          title="Affaires gagnées"
          icon={CheckCircle}
          iconColor="text-emerald-600"
          value={data.kpis.dealsWon}
          onClick={() => handleKpiClick('dealsWon')}
          delay={0.25}
        />
        <KpiCard
          title="Actions en retard"
          icon={AlertCircle}
          iconColor="text-red-600"
          value={data.kpis.overdueActions}
          onClick={() => handleKpiClick('overdueActions')}
          delay={0.35}
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Pipeline des affaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineChart data={data.pipeline} onStageClick={handleStageClick} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Funnel Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
        >
          <FunnelChart data={data.funnel} />
        </motion.div>
      </div>

      {/* Time Series Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Évolution dans le temps</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart data={data.timeSeries} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Workbench and Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workbench */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Plan de travail</CardTitle>
            </CardHeader>
            <CardContent>
              <Workbench
                data={data.workbench}
                onItemClick={handleWorkbenchItemClick}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Performance */}
        {data.team && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Performance de l'équipe</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamPerformanceTable
                  data={data.team}
                  onMemberClick={(userId) => {
                    updateFilters({ assignee: userId });
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};
