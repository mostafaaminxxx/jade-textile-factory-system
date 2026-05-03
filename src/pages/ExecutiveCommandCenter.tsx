import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  Factory,
  Gauge,
  ListChecks,
  PackageSearch,
  ShieldAlert,
  Target,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import FactoryFlowRibbon from '../components/FactoryFlowRibbon';
import KpiCard from '../components/KpiCard';
import { productionAchievementPercent, roundMetric } from '../lib/factoryFormulas';
import { riskTone } from '../lib/riskRules';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Tables } from '../types/database';

type OrderRow = Pick<
  Tables<'orders'>,
  'id' | 'order_code' | 'status' | 'risk_level' | 'shipment_date' | 'current_stage'
>;
type MaterialRow = Pick<Tables<'material_readiness'>, 'shortage_risk' | 'readiness_percent'>;
type HourlyRow = Pick<Tables<'hourly_production'>, 'target_qty' | 'output_qty'>;
type StageRow = Pick<Tables<'production_stage_records'>, 'stage_name' | 'status' | 'risk_level'>;
type SnapshotRow = Tables<'factory_snapshots'>;
type ActionRow = Pick<
  Tables<'management_actions'>,
  'id' | 'issue' | 'risk_level' | 'responsible_team' | 'required_decision' | 'due_date' | 'status'
>;

type DashboardData = {
  orders: OrderRow[];
  materials: MaterialRow[];
  hourly: HourlyRow[];
  stages: StageRow[];
  snapshot: SnapshotRow | null;
  actions: ActionRow[];
  source: 'supabase' | 'mock';
};

const flowLabels = [
  'Order',
  'Pre-Stock',
  'Planning',
  'Cutting',
  'Printing',
  'Embroidery',
  'Sewing',
  'Finishing',
  'Packing',
  'Shipment',
];

const stageMap: Record<string, string> = {
  order_master: 'Order',
  pre_stock: 'Pre-Stock',
  planning: 'Planning',
  cutting: 'Cutting',
  printing: 'Printing',
  embroidery: 'Embroidery',
  sewing: 'Sewing',
  finishing: 'Finishing',
  packing: 'Packing',
  shipment: 'Shipment',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const mockDashboard: DashboardData = {
  source: 'mock',
  orders: [
    {
      id: 'mock-order-1',
      order_code: 'JT-260503-01',
      status: 'running',
      risk_level: 'amber',
      shipment_date: addDays(4),
      current_stage: 'sewing',
    },
    {
      id: 'mock-order-2',
      order_code: 'JT-260503-02',
      status: 'released',
      risk_level: 'red',
      shipment_date: addDays(2),
      current_stage: 'planning',
    },
    {
      id: 'mock-order-3',
      order_code: 'JT-260503-03',
      status: 'active',
      risk_level: 'green',
      shipment_date: addDays(9),
      current_stage: 'cutting',
    },
  ],
  materials: [
    { shortage_risk: 'red', readiness_percent: 72 },
    { shortage_risk: 'amber', readiness_percent: 89 },
    { shortage_risk: 'green', readiness_percent: 100 },
  ],
  hourly: [
    { target_qty: 720, output_qty: 668 },
    { target_qty: 620, output_qty: 558 },
  ],
  stages: [
    { stage_name: 'cutting', status: 'running', risk_level: 'green' },
    { stage_name: 'sewing', status: 'blocked', risk_level: 'red' },
    { stage_name: 'packing', status: 'ready', risk_level: 'amber' },
  ],
  snapshot: {
    id: 'mock-snapshot',
    snapshot_date: todayIso(),
    active_orders: 3,
    orders_at_risk: 2,
    shipments_this_week: 2,
    material_shortages: 2,
    factory_efficiency: 61.8,
    production_achievement: 91.1,
    open_management_actions: 3,
    notes: 'Mock fallback visible because Supabase env values are missing.',
    created_at: new Date().toISOString(),
  },
  actions: [
    {
      id: 'mock-action-1',
      issue: 'Fabric gate below 95% for urgent shipment',
      risk_level: 'red',
      responsible_team: 'Pre-Stock',
      required_decision: 'Approve split shipment or expedite balance',
      due_date: addDays(1),
      status: 'open',
    },
    {
      id: 'mock-action-2',
      issue: 'Sewing output behind daily target',
      risk_level: 'amber',
      responsible_team: 'Production',
      required_decision: 'Move operators after lunch balancing',
      due_date: todayIso(),
      status: 'waiting_decision',
    },
  ],
};

export default function ExecutiveCommandCenter() {
  const [data, setData] = useState<DashboardData>(mockDashboard);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!supabase) {
        setData(mockDashboard);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const [
        ordersResult,
        materialsResult,
        hourlyResult,
        stagesResult,
        snapshotResult,
        actionsResult,
      ] = await Promise.all([
        supabase.from('orders').select('id, order_code, status, risk_level, shipment_date, current_stage'),
        supabase.from('material_readiness').select('shortage_risk, readiness_percent'),
        supabase.from('hourly_production').select('target_qty, output_qty'),
        supabase.from('production_stage_records').select('stage_name, status, risk_level'),
        supabase
          .from('factory_snapshots')
          .select('*')
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('management_actions')
          .select('id, issue, risk_level, responsible_team, required_decision, due_date, status')
          .neq('status', 'closed')
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(5),
      ]);

      const firstError =
        ordersResult.error ??
        materialsResult.error ??
        hourlyResult.error ??
        stagesResult.error ??
        snapshotResult.error ??
        actionsResult.error;

      if (!isMounted) {
        return;
      }

      if (firstError) {
        setError(firstError.message);
        setData({
          source: 'supabase',
          orders: [],
          materials: [],
          hourly: [],
          stages: [],
          snapshot: null,
          actions: [],
        });
      } else {
        setData({
          source: 'supabase',
          orders: ordersResult.data ?? [],
          materials: materialsResult.data ?? [],
          hourly: hourlyResult.data ?? [],
          stages: stagesResult.data ?? [],
          snapshot: snapshotResult.data ?? null,
          actions: actionsResult.data ?? [],
        });
      }

      setLoading(false);
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const activeOrders = data.orders.filter((order) =>
      ['active', 'released', 'running'].includes(order.status),
    ).length;
    const ordersAtRisk = data.orders.filter((order) =>
      ['red', 'critical', 'high', 'amber'].includes(order.risk_level),
    ).length;
    const shipmentsNextWeek = data.orders.filter((order) => {
      if (!order.shipment_date) {
        return false;
      }

      const shipDate = new Date(`${order.shipment_date}T00:00:00`);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const days = Math.ceil((shipDate.getTime() - now.getTime()) / 86_400_000);
      return days >= 0 && days <= 7;
    }).length;
    const materialShortages = data.materials.filter((material) =>
      ['red', 'critical', 'high', 'amber'].includes(material.shortage_risk),
    ).length;
    const totalTarget = data.hourly.reduce((sum, row) => sum + row.target_qty, 0);
    const totalOutput = data.hourly.reduce((sum, row) => sum + row.output_qty, 0);

    return {
      activeOrders: data.snapshot?.active_orders ?? activeOrders,
      ordersAtRisk: data.snapshot?.orders_at_risk ?? ordersAtRisk,
      shipmentsNextWeek: data.snapshot?.shipments_this_week ?? shipmentsNextWeek,
      materialShortages: data.snapshot?.material_shortages ?? materialShortages,
      factoryEfficiency: data.snapshot?.factory_efficiency ?? 0,
      productionAchievement:
        data.snapshot?.production_achievement ?? productionAchievementPercent(totalOutput, totalTarget),
      openActions: data.snapshot?.open_management_actions ?? data.actions.length,
    };
  }, [data]);

  const flowStages = useMemo(
    () =>
      flowLabels.map((label) => {
        const activeOrders = data.orders.filter((order) => stageMap[order.current_stage] === label).length;
        const stageRows = data.stages.filter((stage) => stageMap[stage.stage_name] === label);
        const blockedOrders = stageRows.filter((stage) =>
          ['blocked', 'red', 'critical', 'high'].includes(stage.status) ||
          ['red', 'critical', 'high'].includes(stage.risk_level),
        ).length;

        return { label, activeOrders, blockedOrders };
      }),
    [data.orders, data.stages],
  );

  const criticalAlerts = [
    `${metrics.ordersAtRisk} orders need risk review`,
    `${metrics.materialShortages} material gates below threshold`,
    `${metrics.shipmentsNextWeek} shipments inside seven-day window`,
  ];

  return (
    <section className="page-stack" aria-labelledby="executive-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">One Factory - One Database - One Management View</p>
          <h2 id="executive-title">Executive Command Center</h2>
        </div>
        <div className="data-pill" data-source={data.source}>
          {loading ? 'Loading Supabase' : data.source === 'mock' ? 'Mock fallback' : 'Supabase live'}
        </div>
      </header>

      {error ? <div className="notice error">Supabase returned: {error}</div> : null}

      <div className="kpi-grid">
        <KpiCard label="Active Orders" value={String(metrics.activeOrders)} detail="Released and running" icon={<Boxes size={22} />} tone="blue" />
        <KpiCard label="Orders at Risk" value={String(metrics.ordersAtRisk)} detail="Amber, red, high, critical" icon={<ShieldAlert size={22} />} tone={metrics.ordersAtRisk > 0 ? 'red' : 'green'} />
        <KpiCard label="Shipments Next 7 Days" value={String(metrics.shipmentsNextWeek)} detail="Shipment date window" icon={<CalendarClock size={22} />} tone="amber" />
        <KpiCard label="Material Shortage Orders" value={String(metrics.materialShortages)} detail="Readiness risk gate" icon={<PackageSearch size={22} />} tone={metrics.materialShortages > 0 ? 'red' : 'green'} />
        <KpiCard label="Factory Efficiency" value={`${roundMetric(metrics.factoryEfficiency)}%`} detail="Latest factory snapshot" icon={<Gauge size={22} />} tone="green" />
        <KpiCard label="Production Achievement" value={`${roundMetric(metrics.productionAchievement)}%`} detail="Actual output vs target" icon={<Target size={22} />} tone="blue" />
        <KpiCard label="Open Management Actions" value={String(metrics.openActions)} detail="Open or waiting decision" icon={<ListChecks size={22} />} tone={metrics.openActions > 0 ? 'amber' : 'green'} />
      </div>

      <div className="command-grid">
        <section className="command-panel wide-panel">
          <div className="panel-heading">
            <h3>Factory Flow Ribbon</h3>
            <span>Order to shipment</span>
          </div>
          <FactoryFlowRibbon stages={flowStages} />
        </section>

        <section className="command-panel">
          <div className="panel-heading">
            <h3>Critical Alerts</h3>
            <AlertTriangle size={18} />
          </div>
          <div className="alert-list">
            {criticalAlerts.map((alert, index) => (
              <div key={alert} className={`alert-row tone-${index === 0 ? riskTone('red') : riskTone('amber')}`}>
                <strong>{alert}</strong>
                <span>{index === 2 ? 'Commercial visibility' : 'Factory gate'}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="command-panel">
          <div className="panel-heading">
            <h3>Management Actions</h3>
            <span>{data.actions.length} open</span>
          </div>
          <div className="action-list">
            {data.actions.length === 0 ? (
              <p className="empty-state">No open management actions.</p>
            ) : (
              data.actions.map((action) => (
                <article key={action.id} className={`action-row tone-${riskTone(action.risk_level)}`}>
                  <strong>{action.issue}</strong>
                  <span>{action.responsible_team} - due {action.due_date ?? 'not set'}</span>
                  <small>{action.required_decision ?? 'Decision not recorded'}</small>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="command-panel">
          <div className="panel-heading">
            <h3>Jade Textile Agent Daily Insight</h3>
            <Factory size={18} />
          </div>
          <p className="insight-copy">
            Focus the morning meeting on orders tied to material readiness below gate, sewing output under
            target, and shipments inside the next seven days. Keep actions connected to order, customer,
            style, PO, line, group, and shipment date before escalation.
          </p>
        </section>
      </div>
    </section>
  );
}
