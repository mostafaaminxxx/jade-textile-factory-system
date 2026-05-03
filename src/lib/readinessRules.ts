import { materialReadinessPercent } from './factoryFormulas';

export type ReadinessTone = 'green' | 'amber' | 'red';

const toFiniteNumber = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

export const normalizedReadinessPercent = (
  readinessPercent: number | null | undefined,
  receivedQuantity: number,
  requiredQuantity: number,
) => {
  if (typeof readinessPercent === 'number' && Number.isFinite(readinessPercent)) {
    return readinessPercent;
  }

  return materialReadinessPercent(receivedQuantity, requiredQuantity);
};

export const materialBalanceQuantity = (
  balanceQuantity: number | null | undefined,
  requiredQuantity: number,
  receivedQuantity: number,
) => {
  if (typeof balanceQuantity === 'number' && Number.isFinite(balanceQuantity)) {
    return Math.max(0, balanceQuantity);
  }

  return Math.max(0, toFiniteNumber(requiredQuantity) - toFiniteNumber(receivedQuantity));
};

export const readinessTone = (readinessPercent: number): ReadinessTone => {
  if (readinessPercent >= 100) {
    return 'green';
  }

  if (readinessPercent >= 95) {
    return 'amber';
  }

  return 'red';
};

export const readinessLabel = (readinessPercent: number) => {
  const tone = readinessTone(readinessPercent);

  if (tone === 'green') {
    return 'Ready';
  }

  if (tone === 'amber') {
    return 'Gate watch';
  }

  return 'Planning risk';
};

export const isPlanningGateRisk = (readinessPercent: number) => readinessPercent < 95;
