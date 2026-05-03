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

export const normalizeGroupCode = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const compact = value.trim().toUpperCase().replace(/\s+/g, '');
  if (compact === 'G11') {
    return 'G-11';
  }
  if (compact === 'G14') {
    return 'G-14';
  }

  return value.trim().toUpperCase();
};

export const isGhostLine = (lineCode: string) => normalizeLineCode(lineCode) === 'G-11';

export const isGhostOrNonWorkingLine = (params: {
  lineCode?: string | null;
  groupCode?: string | null;
  zone?: string | null;
  lineType?: string | null;
  isActive?: boolean | null;
  isCoreProduction?: boolean | null;
}) => {
  const lineCode = params.lineCode ? normalizeLineCode(params.lineCode) : '';
  const groupCode = normalizeGroupCode(params.groupCode);
  const zone = normalizeGroupCode(params.zone);
  const lineType = params.lineType?.trim().toLowerCase() ?? '';

  return (
    lineCode === 'G-11' ||
    groupCode === 'G-11' ||
    zone === 'G-11' ||
    lineType === 'ghost' ||
    lineType === 'non_working' ||
    lineType === 'non-working' ||
    params.isActive === false ||
    params.isCoreProduction === false
  );
};

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
