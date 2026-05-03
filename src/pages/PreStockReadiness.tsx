import {
  AlertTriangle,
  ClipboardCheck,
  Edit3,
  PackageSearch,
  Scale,
  ShieldAlert,
  Truck,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import KpiCard from '../components/KpiCard';
import { dateSortValue } from '../lib/dateHelpers';
import { mockMaterialReadinessRows } from '../lib/operationsMockData';
import {
  isPlanningGateRisk,
  materialBalanceQuantity,
  normalizedReadinessPercent,
  readinessLabel,
  readinessTone,
} from '../lib/readinessRules';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Tables } from '../types/database';

type ReadinessQueryRow = Pick<
  Tables<'material_readiness'>,
  | 'id'
  | 'order_id'
  | 'material_type'
  | 'required_qty'
  | 'received_qty'
  | 'balance_qty'
  | 'readiness_percent'
  | 'expected_inhouse_date'
  | 'inspection_status'
  | 'approval_status'
  | 'shortage_risk'
> & {
  orders: (Pick<
    Tables<'orders'>,
    'id' | 'order_code' | 'po_number' | 'style_code' | 'shipment_date' | 'current_stage'
  > & {
    customers: Pick<Tables<'customers'>, 'customer_name'> | null;
    style_master: Pick<Tables<'style_master'>, 'style_code' | 'style_description'> | null;
  }) | null;
};

type ReadinessRow = {
  id: string;
  order_id: string;
  order_code: string;
  customer: string;
  style_code: string;
  po_number: string;
  shipment_date: string;
  current_stage: string;
  material_type: string;
  required_qty: number;
  received_qty: number;
  balance_qty: number;
  readiness_percent: number;
  expected_inhouse_date: string;
  inspection_status: string;
  approval_status: string;
  shortage_risk: string;
};

const mapReadiness = (row: ReadinessQueryRow): ReadinessRow => {
  const requiredQty = Number(row.required_qty);
  const receivedQty = Number(row.received_qty);
  const readinessPercent = normalizedReadinessPercent(row.readiness_percent, receivedQty, requiredQty);

  return {
    id: row.id,
    order_id: row.order_id,
    order_code: row.orders?.order_code ?? 'Unlinked order',
    customer: row.orders?.customers?.customer_name ?? 'Unassigned customer',
    style_code: row.orders?.style_code ?? row.orders?.style_master?.style_code ?? 'N/A',
    po_number: row.orders?.po_number ?? 'N/A',
    shipment_date: row.orders?.shipment_date ?? 'N/A',
    current_stage: row.orders?.current_stage ?? 'pre_stock',
    material_type: row.material_type,
    required_qty: requiredQty,
    received_qty: receivedQty,
    balance_qty: materialBalanceQuantity(row.balance_qty, requiredQty, receivedQty),
    readiness_percent: readinessPercent,
    expected_inhouse_date: row.expected_inhouse_date ?? 'N/A',
    inspection_status: row.inspection_status,
    approval_status: row.approval_status,
    shortage_risk: row.shortage_risk,
  };
};

const groupByOrder = (rows: ReadinessRow[]) =>
  rows.reduce<Record<string, ReadinessRow[]>>((groups, row) => {
    groups[row.order_id] = [...(groups[row.order_id] ?? []), row];
    return groups;
  }, {});

export default function PreStockReadiness() {
  const [materials, setMaterials] = useState<ReadinessRow[]>(mockMaterialReadinessRows);
  const [source, setSource] = useState<'supabase' | 'mock'>('mock');
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [actionRow, setActionRow] = useState<ReadinessRow | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadReadiness = async () => {
      if (!supabase) {
        setMaterials(mockMaterialReadinessRows);
        setSource('mock');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: readinessError } = await supabase
        .from('material_readiness')
        .select(
          `
          id,
          order_id,
          material_type,
          required_qty,
          received_qty,
          balance_qty,
          readiness_percent,
          expected_inhouse_date,
          inspection_status,
          approval_status,
          shortage_risk,
          orders(
            id,
            order_code,
            po_number,
            style_code,
            shipment_date,
            current_stage,
            customers(customer_name),
            style_master(style_code, style_description)
          )
        `,
        )
        .order('expected_inhouse_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (!isMounted) {
        return;
      }

      setSource('supabase');

      if (readinessError) {
        setError(readinessError.message);
        setMaterials([]);
      } else {
        const readinessRows = ((data ?? []) as unknown as ReadinessQueryRow[])
          .map(mapReadiness)
          .sort((left, right) => dateSortValue(left.shipment_date) - dateSortValue(right.shipment_date));
        setMaterials(readinessRows);
      }

      setLoading(false);
    };

    void loadReadiness();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const grouped = Object.values(groupByOrder(materials));
    const readyOrders = grouped.filter((rows) =>
      rows.length > 0 && rows.every((row) => row.readiness_percent >= 100),
    ).length;
    const partialRisk = materials.filter((row) => {
      const tone = readinessTone(row.readiness_percent);
      return tone === 'amber';
    }).length;
    const shortageRisk = materials.filter((row) => readinessTone(row.readiness_percent) === 'red').length;
    const totalBalance = materials.reduce((sum, row) => sum + row.balance_qty, 0);

    return {
      readyOrders,
      partialRisk,
      shortageRisk,
      totalBalance,
    };
  }, [materials]);

  const suggestedActions = useMemo(
    () => materials.filter((row) => isPlanningGateRisk(row.readiness_percent)),
    [materials],
  );

  const openActionShell = (row: ReadinessRow) => {
    setActionRow(row);
    setActionMessage(null);
  };

  const closeActionShell = () => {
    setActionRow(null);
    setActionMessage(null);
  };

  const handleActionSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionMessage(
      'MVP row action captured. A later authenticated workflow can update received_qty, expected_inhouse_date, and approval_status on material_readiness.',
    );
  };

  return (
    <section className="page-stack" aria-labelledby="pre-stock-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Material gate connected to order, PO, style, shipment, and stage</p>
          <h2 id="pre-stock-title">Pre-Stock Readiness</h2>
        </div>
        <div className="data-pill" data-source={source}>
          {loading ? 'Loading readiness' : source === 'mock' ? 'Mock fallback' : 'Supabase live'}
        </div>
      </header>

      {error ? <div className="notice error">Supabase returned: {error}</div> : null}

      <div className="module-summary">
        <KpiCard label="Ready Orders" value={String(summary.readyOrders)} detail="All materials at 100%" icon={<ClipboardCheck size={22} />} tone="green" />
        <KpiCard label="Partial Risk" value={String(summary.partialRisk)} detail="95% to below 100%" icon={<Truck size={22} />} tone="amber" />
        <KpiCard label="Shortage Risk" value={String(summary.shortageRisk)} detail="Below 95% planning gate" icon={<ShieldAlert size={22} />} tone={summary.shortageRisk > 0 ? 'red' : 'green'} />
        <KpiCard label="Total Balance" value={summary.totalBalance.toLocaleString()} detail="Open material quantity" icon={<Scale size={22} />} tone="blue" />
      </div>

      <section className="command-panel">
        <div className="panel-heading">
          <h3>Material Readiness Register</h3>
          <span>{materials.length} rows</span>
        </div>

        {materials.length === 0 ? (
          <div className="empty-state framed">
            No material_readiness rows returned. Add records linked to orders to activate Pre-Stock gate
            control.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="industrial-table readiness-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Style / PO</th>
                  <th>Shipment</th>
                  <th>Material</th>
                  <th>Required</th>
                  <th>Received</th>
                  <th>Balance</th>
                  <th>Readiness</th>
                  <th>Expected In-House</th>
                  <th>Inspection</th>
                  <th>Approval</th>
                  <th>Shortage</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((row) => {
                  const tone = readinessTone(row.readiness_percent);
                  const gateRisk = isPlanningGateRisk(row.readiness_percent);

                  return (
                    <tr key={row.id}>
                      <td>
                        <span className="stacked-cell">
                          <strong>{row.order_code}</strong>
                          <small>{row.current_stage}</small>
                        </span>
                      </td>
                      <td>{row.customer}</td>
                      <td>
                        <span className="stacked-cell">
                          <strong>{row.style_code}</strong>
                          <small>{row.po_number}</small>
                        </span>
                      </td>
                      <td>{row.shipment_date}</td>
                      <td>{row.material_type}</td>
                      <td>{row.required_qty.toLocaleString()}</td>
                      <td>{row.received_qty.toLocaleString()}</td>
                      <td>{row.balance_qty.toLocaleString()}</td>
                      <td>
                        <span className={`badge tone-${tone}`}>
                          {row.readiness_percent.toFixed(1)}% {readinessLabel(row.readiness_percent)}
                        </span>
                        {gateRisk ? (
                          <span className="gate-warning">Planning / line loading risky below 95%</span>
                        ) : null}
                      </td>
                      <td>{row.expected_inhouse_date}</td>
                      <td>{row.inspection_status}</td>
                      <td>{row.approval_status}</td>
                      <td>
                        <span className={`badge tone-${tone}`}>{row.shortage_risk}</span>
                      </td>
                      <td>
                        <button className="row-action" type="button" onClick={() => openActionShell(row)}>
                          <Edit3 size={15} />
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="command-panel">
        <div className="panel-heading">
          <h3>Suggested Management Actions</h3>
          <span>No automatic duplicate inserts</span>
        </div>
        <div className="action-list">
          {suggestedActions.length === 0 ? (
            <p className="empty-state">No material readiness rows are below the 95% planning gate.</p>
          ) : (
            suggestedActions.map((row) => (
              <article key={`${row.id}-suggestion`} className="action-row tone-red">
                <strong>{row.order_code} - {row.material_type}</strong>
                <span>Pre-Stock / Warehouse / Planning - risk red</span>
                <small>Issue: Material readiness below planning gate</small>
                <small>Required decision: Expedite balance, approve partial loading, or re-plan line</small>
              </article>
            ))
          )}
        </div>
      </section>

      {actionRow ? (
        <aside className="drawer-shell" aria-label="Material readiness action shell">
          <div className="drawer-card">
            <div className="panel-heading">
              <h3>{actionRow.order_code} Material Action</h3>
              <button className="icon-only" type="button" onClick={closeActionShell} aria-label="Close action shell">
                <X size={17} />
              </button>
            </div>

            <div className="notice gate-note">
              <AlertTriangle size={17} />
              <span>
                Keep planning decisions tied to order {actionRow.order_code}, PO {actionRow.po_number}, style{' '}
                {actionRow.style_code}, shipment {actionRow.shipment_date}.
              </span>
            </div>

            <form className="shell-form" onSubmit={handleActionSubmit}>
              <label>
                Received Qty
                <input type="number" min="0" defaultValue={actionRow.received_qty} />
              </label>
              <label>
                Expected In-House Date
                <input
                  type="date"
                  defaultValue={actionRow.expected_inhouse_date === 'N/A' ? '' : actionRow.expected_inhouse_date}
                />
              </label>
              <label>
                Approval Status
                <select defaultValue={actionRow.approval_status}>
                  <option value="waiting">waiting</option>
                  <option value="approved_partial">approved_partial</option>
                  <option value="approved">approved</option>
                  <option value="blocked">blocked</option>
                </select>
              </label>
              <button className="primary-action" type="submit">
                Capture row action
              </button>
            </form>

            {actionMessage ? <div className="notice">{actionMessage}</div> : null}
          </div>
        </aside>
      ) : null}

      <section className="command-panel wide-panel">
        <div className="panel-heading">
          <h3>Planning Gate Rule</h3>
          <PackageSearch size={18} />
        </div>
        <p className="insight-copy">
          Green means readiness is at least 100%. Amber means 95% to below 100%. Red means below 95% and
          planning or line loading should be treated as risky until Pre-Stock, Warehouse, and Planning agree
          on the decision.
        </p>
      </section>
    </section>
  );
}
