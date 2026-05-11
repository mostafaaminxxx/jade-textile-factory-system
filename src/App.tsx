import {
  Activity,
  ClipboardCheck,
  Factory,
  Gauge,
  LayoutDashboard,
  ListChecks,
  PackageCheck,
  PackageSearch,
  ScrollText,
  Settings,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ExecutiveCommandCenter from './pages/ExecutiveCommandCenter';
import FactoryLayoutPage from './pages/FactoryLayoutPage';
import FoundationCheckPage from './pages/FoundationCheckPage';
import LayoutReviewPage from './pages/LayoutReviewPage';
import ComingSoonPage from './pages/ComingSoonPage';

const NAV_GROUPS = [
  {
    label: 'Command',
    items: [
      { path: '/executive-command-center', label: 'Executive Command Center', caption: 'Management view', icon: LayoutDashboard },
      { path: '/foundation-check', label: 'Foundation Check', caption: 'Supabase readiness', icon: ShieldCheck },
      { path: '/factory-layout', label: 'Live Factory Layout', caption: 'Promoted line master', icon: Factory },
      { path: '/layout-review', label: 'Layout Review', caption: '121 + 6 approval gate', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Operations',
    items: [
      { path: '/line-context', label: 'Line Context Control', caption: 'Next build pack', icon: ListChecks },
      { path: '/order-master', label: 'Order Master', caption: 'Orders and styles', icon: ScrollText },
      { path: '/planning-board', label: 'Planning Board', caption: 'Capacity gate', icon: Gauge },
      { path: '/downtime-center', label: 'Downtime Center', caption: 'Execution losses', icon: Activity },
      { path: '/manpower', label: 'Manpower', caption: 'Operators by line', icon: UsersRound },
      { path: '/quality', label: 'Quality', caption: 'DHU and holds', icon: ShieldCheck },
      { path: '/packing-shipment', label: 'Packing & Shipment', caption: 'Final gate', icon: PackageCheck },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/reports', label: 'Reports', caption: 'Analytics pack later', icon: PackageSearch },
      { path: '/settings', label: 'Settings', caption: 'Admin configuration', icon: Settings },
    ],
  },
] as const;

type RouteItem = (typeof NAV_GROUPS)[number]['items'][number];

const allItems = NAV_GROUPS.flatMap((group) => group.items);

const normalizePath = (path: string) => {
  if (path === '/' || path === '') return '/executive-command-center';
  return path.replace(/\/$/, '') || '/executive-command-center';
};

function useBrowserRoute() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((nextPath: string) => {
    const normalized = normalizePath(nextPath);
    if (normalized !== normalizePath(window.location.pathname)) {
      window.history.pushState({}, '', normalized);
    }
    setPath(normalized);
  }, []);

  return { path, navigate };
}

function SidebarNav({ activePath, onNavigate }: { activePath: string; onNavigate: (path: string) => void }) {
  return (
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

      <nav className="sidebar-nav" aria-label="Factory modules">
        {NAV_GROUPS.map((group) => (
          <section key={group.label} className="nav-group">
            <p>{group.label}</p>
            <div className="nav-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    className={isActive ? 'nav-item active' : 'nav-item'}
                    onClick={() => onNavigate(item.path)}
                  >
                    <Icon size={18} />
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.caption}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="sidebar-status">
        <span className="status-dot blue" />
        <span>
          <strong>Supabase source of truth</strong>
          <small>No mock factory data in live pages</small>
        </span>
      </div>
    </aside>
  );
}

function resolvePage(path: string, item?: RouteItem) {
  switch (path) {
    case '/executive-command-center':
      return <ExecutiveCommandCenter />;
    case '/foundation-check':
      return <FoundationCheckPage />;
    case '/factory-layout':
      return <FactoryLayoutPage />;
    case '/layout-review':
      return <LayoutReviewPage />;
    default:
      return <ComingSoonPage title={item?.label ?? 'Module'} modulePath={path} />;
  }
}

export default function App() {
  const { path, navigate } = useBrowserRoute();
  const currentItem = useMemo(() => allItems.find((item) => item.path === path), [path]);
  const page = resolvePage(path, currentItem);

  useEffect(() => {
    if (window.location.pathname === '/') {
      window.history.replaceState({}, '', '/executive-command-center');
    }
  }, []);

  return (
    <div className="app-shell" dir="ltr">
      <SidebarNav activePath={path} onNavigate={navigate} />
      <main className="workspace">{page}</main>
    </div>
  );
}
