import { Clock3, Users } from 'lucide-react';
import { productionAchievementPercent, roundMetric } from '../lib/factoryFormulas';
import { isGhostLine, normalizeLineStatus, statusTone } from '../lib/riskRules';

export type LineTileData = {
  lineCode: string;
  group: string;
  customer: string;
  style: string;
  po: string;
  shipmentDate: string;
  status: string;
  target: number;
  actual: number;
  manpower: number;
  activeDowntime: string;
  isActive: boolean;
  notes?: string;
};

type LineTileProps = {
  line: LineTileData;
};

export default function LineTile({ line }: LineTileProps) {
  const normalizedStatus = normalizeLineStatus(line.status);
  const tone = isGhostLine(line.lineCode) || !line.isActive ? 'gray' : statusTone[normalizedStatus];
  const achievement = productionAchievementPercent(line.actual, line.target);

  return (
    <article className={`line-tile tone-${tone}`}>
      <header>
        <div>
          <strong>{line.lineCode}</strong>
          <span>{line.group}</span>
        </div>
        <em>{isGhostLine(line.lineCode) ? 'ghost' : normalizedStatus}</em>
      </header>

      <div className="line-order">
        <span>{line.customer}</span>
        <strong>{line.style}</strong>
        <small>PO {line.po} - Ship {line.shipmentDate}</small>
      </div>

      <div className="line-meter" aria-label={`Production achievement ${roundMetric(achievement)} percent`}>
        <span style={{ inlineSize: `${Math.min(100, achievement)}%` }} />
      </div>

      <footer>
        <span>
          <Clock3 size={15} />
          {line.actual}/{line.target}
        </span>
        <span>
          <Users size={15} />
          {line.manpower}
        </span>
        <span>{line.activeDowntime}</span>
      </footer>
    </article>
  );
}
