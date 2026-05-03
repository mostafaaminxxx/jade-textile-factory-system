import { Activity, ClipboardList, Factory, LayoutDashboard, PackageSearch, RadioTower } from 'lucide-react';
import type { ComponentType } from 'react';
import { useState } from 'react';
import ExecutiveCommandCenter from './pages/ExecutiveCommandCenter';
import OrderMaster from './pages/OrderMaster';
import PreStockReadiness from './pages/PreStockReadiness';
import SewingControlRoom from './pages/SewingControlRoom';

type ViewKey = 'executive' | 'sewing' | 'orders' | 'pre-stock';

const views: Array<{
  key: ViewKey;
  label: string;
  caption: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    key: 'executive',
    label: 'Executive Command Center',
    caption: 'Orders, risk, flow, and management actions',
    icon: LayoutDashboard,
  },
  {
    key: 'sewing',
    label: 'Sewing Control Room',
    caption: 'Live line layout from factory assignments',
    icon: Factory,
  },
  {
    key: 'orders',
    label: 'Order Master',
    caption: 'Order, PO, style, shipment, and stage',
    icon: ClipboardList,
  },
  {
    key: 'pre-stock',
    label: 'Pre-Stock Readiness',
    caption: 'Material gate before planning',
    icon: PackageSearch,
  },
];

const pageByView: Record<ViewKey, ComponentType> = {
  executive: ExecutiveCommandCenter,
  sewing: SewingControlRoom,
  orders: OrderMaster,
  'pre-stock': PreStockReadiness,
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewKey>('executive');
  const ActivePage = pageByView[activeView];

  return (
    <div className="app-shell" dir="rtl">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-block">
          <div className="brand-mark">
            <Activity size={22} strokeWidth={2.4} />
          </div>
          <div>
            <p className="eyebrow">Jade Textile</p>
            <h1>Factory System</h1>
          </div>
        </div>

        <nav className="view-tabs" role="tablist" aria-label="Factory modules">
          {views.map((view) => {
            const Icon = view.icon;
            const isActive = activeView === view.key;

            return (
              <button
                key={view.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? 'view-tab active' : 'view-tab'}
                onClick={() => setActiveView(view.key)}
              >
                <Icon size={18} />
                <span>
                  <strong>{view.label}</strong>
                  <small>{view.caption}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-status">
          <RadioTower size={18} />
          <span>
            <strong>Arabic-first workflow</strong>
            <small>AR now - EN/TR ready</small>
          </span>
        </div>
      </aside>

      <main className="workspace">
        <ActivePage />
      </main>
    </div>
  );
}
