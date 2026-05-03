import {
  CalendarClock,
  ClipboardList,
  Edit3,
  PackageCheck,
  Plus,
  ShieldAlert,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import KpiCard from '../components/KpiCard';
import { isWithinNextDays } from '../lib/dateHelpers';
import { mockOrderMasterRows } from '../lib/operationsMockData';
import { riskTone } from '../lib/riskRules';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Tables } from '../types/database';

type OrderQueryRow = Pick<
  Tables<'orders'>,
  | 'id'
  | 'order_code'
  | 'po_number'
  | 'style_code'
  | 'color'
  | 'order_quantity'
  | 'delivery_date'
  | 'shipment_date'
  | 'priority'
  | 'current_stage'
  | 'risk_level'
  | 'status'
> & {
  customers: Pick<Tables<'customers'>, 'customer_name' | 'customer_code'> | null;
  style_master:
    | Pick<
        Tables<'style_master'>,
        'style_code' | 'style_description' | 'product_category' | 'default_smv'
      >
    | null;
};

type OrderMasterRow = {
  id: string;
  order_code: string;
  customer: string;
  po_number: string;
  style_code: string;
  style_reference: string;
  color: string;
  order_quantity: number;
  delivery_date: string;
  shipment_date: string;
  priority: string;
  current_stage: string;
  risk_level: string;
  status: string;
};

const blankOrder: OrderMasterRow = {
  id: 'new-order-shell',
  order_code: '',
  customer: '',
  po_number: '',
  style_code: '',
  style_reference: '',
  color: '',
  order_quantity: 0,
  delivery_date: '',
  shipment_date: '',
  priority: 'normal',
  current_stage: 'order_master',
  risk_level: 'green',
  status: 'draft',
};

const mapOrder = (order: OrderQueryRow): OrderMasterRow => ({
  id: order.id,
  order_code: order.order_code,
  customer: order.customers?.customer_name ?? 'Unassigned customer',
  po_number: order.po_number ?? 'N/A',
  style_code: order.style_code,
  style_reference:
    order.style_master?.style_description ??
    order.style_master?.product_category ??
    order.style_master?.style_code ??
    'Style reference not linked',
  color: order.color ?? 'N/A',
  order_quantity: order.order_quantity,
  delivery_date: order.delivery_date ?? 'N/A',
  shipment_date: order.shipment_date ?? 'N/A',
  priority: order.priority,
  current_stage: order.current_stage,
  risk_level: order.risk_level,
  status: order.status,
});

export default function OrderMaster() {
  const [orders, setOrders] = useState<OrderMasterRow[]>(mockOrderMasterRows);
  const [source, setSource] = useState<'supabase' | 'mock'>('mock');
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [drawerOrder, setDrawerOrder] = useState<OrderMasterRow | null>(null);
  const [drawerMessage, setDrawerMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      if (!supabase) {
        setOrders(mockOrderMasterRows);
        setSource('mock');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: ordersError } = await supabase
        .from('orders')
        .select(
          `
          id,
          order_code,
          po_number,
          style_code,
          color,
          order_quantity,
          delivery_date,
          shipment_date,
          priority,
          current_stage,
          risk_level,
          status,
          customers(customer_name, customer_code),
          style_master(style_code, style_description, product_category, default_smv)
        `,
        )
        .order('shipment_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (!isMounted) {
        return;
      }

      setSource('supabase');

      if (ordersError) {
        setError(ordersError.message);
        setOrders([]);
      } else {
        setOrders(((data ?? []) as unknown as OrderQueryRow[]).map(mapOrder));
      }

      setLoading(false);
    };

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const activeStatuses = ['active', 'released', 'running'];
    const riskLevels = ['red', 'critical', 'high', 'amber'];

    return {
      totalOrders: orders.length,
      activeOrders: orders.filter((order) => activeStatuses.includes(order.status)).length,
      ordersAtRisk: orders.filter((order) => riskLevels.includes(order.risk_level)).length,
      shipmentsNextWeek: orders.filter((order) => isWithinNextDays(order.shipment_date)).length,
    };
  }, [orders]);

  const openNewOrderShell = () => {
    setDrawerOrder(blankOrder);
    setDrawerMessage(null);
  };

  const openEditOrderShell = (order: OrderMasterRow) => {
    setDrawerOrder(order);
    setDrawerMessage(null);
  };

  const handleShellSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDrawerMessage(
      'MVP shell captured the connected order fields. Persisting will write to the existing orders table after auth workflow is finalized.',
    );
  };

  const closeDrawer = () => {
    setDrawerOrder(null);
    setDrawerMessage(null);
  };

  return (
    <section className="page-stack" aria-labelledby="order-master-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Order, customer, style, PO, shipment, and stage control</p>
          <h2 id="order-master-title">Order Master</h2>
        </div>
        <div className="header-actions">
          <div className="data-pill" data-source={source}>
            {loading ? 'Loading orders' : source === 'mock' ? 'Mock fallback' : 'Supabase live'}
          </div>
          <button className="icon-command" type="button" onClick={openNewOrderShell}>
            <Plus size={16} />
            New order shell
          </button>
        </div>
      </header>

      {error ? <div className="notice error">Supabase returned: {error}</div> : null}

      <div className="module-summary">
        <KpiCard label="Total Orders" value={String(summary.totalOrders)} detail="Orders in master" icon={<ClipboardList size={22} />} tone="blue" />
        <KpiCard label="Active / Released / Running" value={String(summary.activeOrders)} detail="Orders moving through factory" icon={<PackageCheck size={22} />} tone="green" />
        <KpiCard label="Orders at Risk" value={String(summary.ordersAtRisk)} detail="Amber, red, high, critical" icon={<ShieldAlert size={22} />} tone={summary.ordersAtRisk > 0 ? 'red' : 'green'} />
        <KpiCard label="Shipments Next 7 Days" value={String(summary.shipmentsNextWeek)} detail="Shipment gate window" icon={<CalendarClock size={22} />} tone="amber" />
      </div>

      <section className="command-panel">
        <div className="panel-heading">
          <h3>Connected Order Register</h3>
          <span>{orders.length} rows</span>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state framed">
            No orders returned from Supabase. Add rows to orders with linked customers and style_master records
            to activate Order Master.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="industrial-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>PO</th>
                  <th>Style</th>
                  <th>Color</th>
                  <th>Qty</th>
                  <th>Delivery</th>
                  <th>Shipment</th>
                  <th>Priority</th>
                  <th>Stage</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.order_code}</strong>
                    </td>
                    <td>{order.customer}</td>
                    <td>{order.po_number}</td>
                    <td>
                      <span className="stacked-cell">
                        <strong>{order.style_code}</strong>
                        <small>{order.style_reference}</small>
                      </span>
                    </td>
                    <td>{order.color}</td>
                    <td>{order.order_quantity.toLocaleString()}</td>
                    <td>{order.delivery_date}</td>
                    <td>{order.shipment_date}</td>
                    <td>
                      <span className="badge tone-blue">{order.priority}</span>
                    </td>
                    <td>{order.current_stage}</td>
                    <td>
                      <span className={`badge tone-${riskTone(order.risk_level)}`}>{order.risk_level}</span>
                    </td>
                    <td>{order.status}</td>
                    <td>
                      <button className="row-action" type="button" onClick={() => openEditOrderShell(order)}>
                        <Edit3 size={15} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {drawerOrder ? (
        <aside className="drawer-shell" aria-label="Order form shell">
          <div className="drawer-card">
            <div className="panel-heading">
              <h3>{drawerOrder.id === blankOrder.id ? 'Create Order Shell' : 'Edit Order Shell'}</h3>
              <button className="icon-only" type="button" onClick={closeDrawer} aria-label="Close form shell">
                <X size={17} />
              </button>
            </div>

            <form className="shell-form" onSubmit={handleShellSubmit}>
              <label>
                Order Code
                <input defaultValue={drawerOrder.order_code} placeholder="order_code" />
              </label>
              <label>
                Customer
                <input defaultValue={drawerOrder.customer} placeholder="customer from customers" />
              </label>
              <label>
                PO Number
                <input defaultValue={drawerOrder.po_number} placeholder="po_number" />
              </label>
              <label>
                Style Code
                <input defaultValue={drawerOrder.style_code} placeholder="style_code" />
              </label>
              <label>
                Quantity
                <input type="number" min="0" defaultValue={drawerOrder.order_quantity} />
              </label>
              <label>
                Shipment Date
                <input type="date" defaultValue={drawerOrder.shipment_date === 'N/A' ? '' : drawerOrder.shipment_date} />
              </label>
              <label>
                Current Stage
                <select defaultValue={drawerOrder.current_stage}>
                  <option value="order_master">order_master</option>
                  <option value="pre_stock">pre_stock</option>
                  <option value="planning">planning</option>
                  <option value="cutting">cutting</option>
                  <option value="sewing">sewing</option>
                  <option value="packing">packing</option>
                </select>
              </label>
              <button className="primary-action" type="submit">
                Capture shell
              </button>
            </form>

            {drawerMessage ? <div className="notice">{drawerMessage}</div> : null}
          </div>
        </aside>
      ) : null}
    </section>
  );
}
