export type LineStatus = 'running' | 'warning' | 'stopped' | 'blocked' | 'changeover' | 'idle';
export type RiskLevel = 'green' | 'amber' | 'red' | 'critical' | 'high' | 'medium' | 'low' | 'not_assessed';

export const statusTone: Record<LineStatus, 'green' | 'amber' | 'red' | 'blue' | 'gray'> = {
  running: 'green',
  warning: 'amber',
  stopped: 'red',
  blocked: 'red',
  changeover: 'blue',
  idle: 'gray',
};

export const normalizeLineStatus = (status?: string | null): LineStatus => {
  if (status === 'running' || status === 'warning' || status === 'stopped' || status === 'changeover') {
    return status;
  }

  if (status === 'blocked') {
    return 'blocked';
  }

  return 'idle';
};

export const normalizeLineCode = (lineCode: string) => {
  const compact = lineCode.trim().toUpperCase();

  if (compact === 'H93/115' || compact === 'H93-115' || compact === 'H93 115') {
    return 'H93';
  }

  if (compact === 'G14') {
    return 'G-14';
  }

  return compact;
};

export const isGhostLine = (lineCode: string) => normalizeLineCode(lineCode) === 'G-11';

type GhostProductionAreaInput = {
  lineCode: string;
  groupCode?: string | null;
  groupName?: string | null;
  zone?: string | null;
  lineType?: string | null;
  isActive: boolean;
  isCoreProduction: boolean;
};

const hasGhostMarker = (value?: string | null) => {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  const compactAreaCode = normalized.replace(/[-_\s]/g, '');
  return (
    compactAreaCode === 'g11' ||
    normalized === 'ghost' ||
    normalized.includes('ghost') ||
    /non[-_\s]?working/.test(normalized)
  );
};

export const isGhostProductionArea = ({
  lineCode,
  groupCode,
  groupName,
  zone,
  lineType,
  isActive,
  isCoreProduction,
}: GhostProductionAreaInput) =>
  isGhostLine(lineCode) ||
  hasGhostMarker(groupCode) ||
  hasGhostMarker(groupName) ||
  hasGhostMarker(zone) ||
  hasGhostMarker(lineType) ||
  !isActive ||
  !isCoreProduction;

export const riskTone = (risk?: string | null) => {
  if (risk === 'critical' || risk === 'high' || risk === 'red') {
    return 'red';
  }

  if (risk === 'amber' || risk === 'medium') {
    return 'amber';
  }

  if (risk === 'green' || risk === 'low') {
    return 'green';
  }

  return 'gray';
};

export const shipmentRisk = (shipmentDate?: string | null) => {
  if (!shipmentDate) {
    return 'not_assessed' satisfies RiskLevel;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shipDate = new Date(`${shipmentDate}T00:00:00`);
  const daysRemaining = Math.ceil((shipDate.getTime() - today.getTime()) / 86_400_000);

  if (daysRemaining < 0) {
    return 'red' satisfies RiskLevel;
  }

  if (daysRemaining <= 2) {
    return 'amber' satisfies RiskLevel;
  }

  return 'green' satisfies RiskLevel;
};
