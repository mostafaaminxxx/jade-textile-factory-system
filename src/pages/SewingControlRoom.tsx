import { Factory, Layers3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import LineTile, { type LineTileData } from '../components/LineTile';
import { isGhostOrNonWorkingLine, normalizeLineCode } from '../lib/riskRules';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type AssignmentRow = {
  line_id: string;
  assignment_date: string;
  status: string;
  current_customer_name: string | null;
  current_style_code: string | null;
  current_po_number: string | null;
  target_qty: number;
  actual_qty: number;
  manpower: number;
  active_downtime_type: string | null;
  orders: {
    po_number: string | null;
    shipment_date: string | null;
    style_code: string;
  } | null;
};

type LineQueryRow = {
  id: string;
  line_code: string;
  zone: string | null;
  floor: string | null;
  line_type: string;
  is_active: boolean;
  is_core_production: boolean;
  notes: string | null;
  production_groups: {
    group_code: string;
    group_name: string;
  } | null;
};

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const mockLines: LineTileData[] = [
  {
    lineCode: 'H93',
    group: 'Group H',
    customer: 'Jade Export',
    style: 'JTX-2401',
    po: 'PO-8831',
    shipmentDate: addDays(5),
    status: 'running',
    target: 720,
    actual: 668,
    manpower: 31,
    activeDowntime: 'none',
    isActive: true,
    notes: 'H93/115 legacy reference normalized to H93.',
  },
  {
    lineCode: 'G-14',
    group: 'Group G',
    customer: 'North Retail',
    style: 'NR-5510',
    po: 'PO-9014',
    shipmentDate: addDays(2),
    status: 'warning',
    target: 620,
    actual: 498,
    manpower: 28,
    activeDowntime: 'material',
    isActive: true,
    notes: 'G-14 correction preserved.',
  },
  {
    lineCode: 'G-11',
    group: 'Ghost / Non-working',
    customer: 'Unassigned',
    style: 'Idle',
    po: 'N/A',
    shipmentDate: 'N/A',
    status: 'idle',
    target: 0,
    actual: 0,
    manpower: 0,
    activeDowntime: 'ghost line',
    isActive: false,
    notes: 'Ghost/non-working line.',
  },
];

const selectLatestAssignmentByLine = (assignments: AssignmentRow[]) => {
  return assignments.reduce<Record<string, AssignmentRow>>((latestByLine, assignment) => {
    const current = latestByLine[assignment.line_id];
    if (!current || assignment.assignment_date > current.assignment_date) {
      latestByLine[assignment.line_id] = assignment;
    }
    return latestByLine;
  }, {});
};

const toLineTile = (line: LineQueryRow, assignment?: AssignmentRow): LineTileData => {
  const normalizedLineCode = normalizeLineCode(line.line_code);
  const group =
    line.production_groups?.group_name ??
    line.production_groups?.group_code ??
    line.zone ??
    line.floor ??
    'Ungrouped';
  const isGhost = isGhostOrNonWorkingLine({
    lineCode: line.line_code,
    groupCode: line.production_groups?.group_code,
    zone: line.zone,
    lineType: line.line_type,
    isActive: line.is_active,
    isCoreProduction: line.is_core_production,
  });

  return {
    lineCode: normalizedLineCode,
    group,
    customer: assignment?.current_customer_name ?? 'Unassigned',
    style: assignment?.current_style_code ?? assignment?.orders?.style_code ?? 'Idle',
    po: assignment?.current_po_number ?? assignment?.orders?.po_number ?? 'N/A',
    shipmentDate: assignment?.orders?.shipment_date ?? 'N/A',
    status: isGhost ? 'idle' : assignment?.status ?? 'idle',
    target: assignment?.target_qty ?? 0,
    actual: assignment?.actual_qty ?? 0,
    manpower: assignment?.manpower ?? 0,
    activeDowntime: isGhost ? 'ghost/non-working' : assignment?.active_downtime_type ?? 'none',
    isActive: !isGhost,
    notes: line.notes ?? undefined,
  };
};

export default function SewingControlRoom() {
  const [lines, setLines] = useState<LineTileData[]>(mockLines);
  const [source, setSource] = useState<'supabase' | 'mock'>('mock');
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLines = async () => {
      if (!supabase) {
        setLines(mockLines);
        setSource('mock');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const today = todayIso();
      const [linesResult, todayAssignmentsResult] = await Promise.all([
        supabase
          .from('factory_lines')
          .select(
            `
            id,
            line_code,
            zone,
            floor,
            line_type,
            is_active,
            is_core_production,
            notes,
            production_groups(group_code, group_name)
          `,
          )
          .order('line_code', { ascending: true }),
        supabase
          .from('line_current_assignments')
          .select(
            `
            line_id,
            assignment_date,
            status,
            current_customer_name,
            current_style_code,
            current_po_number,
            target_qty,
            actual_qty,
            manpower,
            active_downtime_type,
            orders(po_number, shipment_date, style_code)
          `,
          )
          .eq('assignment_date', today)
          .order('assignment_date', { ascending: false }),
      ]);

      if (!isMounted) {
        return;
      }

      setSource('supabase');

      const firstError = linesResult.error ?? todayAssignmentsResult.error;
      if (firstError) {
        setError(firstError.message);
        setLines([]);
      } else {
        const assignmentsByLine = selectLatestAssignmentByLine(
          ((todayAssignmentsResult.data ?? []) as unknown as AssignmentRow[]),
        );
        setLines(
          ((linesResult.data ?? []) as unknown as LineQueryRow[]).map((line) =>
            toLineTile(line, assignmentsByLine[line.id]),
          ),
        );
      }

      setLoading(false);
    };

    void loadLines();

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedLines = useMemo(() => {
    return lines.reduce<Record<string, LineTileData[]>>((groups, line) => {
      const groupName = line.group || 'Ungrouped';
      groups[groupName] = [...(groups[groupName] ?? []), line];
      return groups;
    }, {});
  }, [lines]);

  const runningCount = lines.filter((line) => line.status === 'running').length;
  const riskCount = lines.filter((line) => ['warning', 'stopped', 'blocked'].includes(line.status)).length;

  return (
    <section className="page-stack" aria-labelledby="sewing-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Factory lines generated from Supabase tables</p>
          <h2 id="sewing-title">Sewing Control Room</h2>
        </div>
        <div className="data-pill" data-source={source}>
          {loading ? 'Loading lines' : source === 'mock' ? 'Mock fallback' : 'Supabase live'}
        </div>
      </header>

      {error ? <div className="notice error">Supabase returned: {error}</div> : null}

      <div className="sewing-summary">
        <div>
          <Factory size={20} />
          <span>
            <strong>{lines.length}</strong>
            <small>Total lines</small>
          </span>
        </div>
        <div>
          <Layers3 size={20} />
          <span>
            <strong>{Object.keys(groupedLines).length}</strong>
            <small>Groups / zones</small>
          </span>
        </div>
        <div>
          <span className="status-dot green" />
          <span>
            <strong>{runningCount}</strong>
            <small>Running</small>
          </span>
        </div>
        <div>
          <span className="status-dot amber" />
          <span>
            <strong>{riskCount}</strong>
            <small>Warning / stopped</small>
          </span>
        </div>
      </div>

      {lines.length === 0 ? (
        <div className="empty-state framed">
          No factory lines returned. Apply the seed file or add rows to factory_lines and
          line_current_assignments in Supabase.
        </div>
      ) : (
        <div className="line-groups">
          {Object.entries(groupedLines).map(([group, groupLines]) => (
            <section key={group} className="line-group" aria-labelledby={`group-${group}`}>
              <div className="panel-heading">
                <h3 id={`group-${group}`}>{group}</h3>
                <span>{groupLines.length} lines</span>
              </div>
              <div className="line-grid">
                {groupLines.map((line) => (
                  <LineTile key={`${group}-${line.lineCode}`} line={line} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
