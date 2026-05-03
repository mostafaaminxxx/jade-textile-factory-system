const toFiniteNumber = (value: number) => (Number.isFinite(value) ? value : 0);

export const normalizeEfficiency = (efficiency: number) => {
  const value = toFiniteNumber(efficiency);
  return value > 1 ? value / 100 : value;
};

export const availableMinutes = (operators: number, workingMinutes: number) =>
  Math.max(0, toFiniteNumber(operators)) * Math.max(0, toFiniteNumber(workingMinutes));

export const earnedMinutes = (outputQuantity: number, smv: number) =>
  Math.max(0, toFiniteNumber(outputQuantity)) * Math.max(0, toFiniteNumber(smv));

export const efficiencyPercent = (earned: number, available: number) => {
  const safeAvailable = Math.max(0, toFiniteNumber(available));
  if (safeAvailable === 0) {
    return 0;
  }

  return (Math.max(0, toFiniteNumber(earned)) / safeAvailable) * 100;
};

export const dailyLineCapacity = (
  operators: number,
  workingMinutes: number,
  efficiency: number,
  smv: number,
) => {
  const safeSmv = Math.max(0, toFiniteNumber(smv));
  if (safeSmv === 0) {
    return 0;
  }

  return (availableMinutes(operators, workingMinutes) * normalizeEfficiency(efficiency)) / safeSmv;
};

export const requiredProductionDays = (balanceQuantity: number, dailyCapacity: number) => {
  const safeCapacity = Math.max(0, toFiniteNumber(dailyCapacity));
  if (safeCapacity === 0) {
    return 0;
  }

  return Math.max(0, toFiniteNumber(balanceQuantity)) / safeCapacity;
};

export const requiredOperators = (
  targetQuantity: number,
  smv: number,
  workingMinutes: number,
  efficiency: number,
) => {
  const safeWorkingMinutes = Math.max(0, toFiniteNumber(workingMinutes));
  const safeEfficiency = normalizeEfficiency(efficiency);
  if (safeWorkingMinutes === 0 || safeEfficiency === 0) {
    return 0;
  }

  return (
    (Math.max(0, toFiniteNumber(targetQuantity)) * Math.max(0, toFiniteNumber(smv))) /
    safeWorkingMinutes /
    safeEfficiency
  );
};

export const materialReadinessPercent = (receivedQuantity: number, requiredQuantity: number) => {
  const safeRequired = Math.max(0, toFiniteNumber(requiredQuantity));
  if (safeRequired === 0) {
    return 0;
  }

  return (Math.max(0, toFiniteNumber(receivedQuantity)) / safeRequired) * 100;
};

export const dhu = (defectQuantity: number, checkedQuantity: number) => {
  const safeChecked = Math.max(0, toFiniteNumber(checkedQuantity));
  if (safeChecked === 0) {
    return 0;
  }

  return (Math.max(0, toFiniteNumber(defectQuantity)) / safeChecked) * 100;
};

export const productionAchievementPercent = (actualQuantity: number, targetQuantity: number) => {
  const safeTarget = Math.max(0, toFiniteNumber(targetQuantity));
  if (safeTarget === 0) {
    return 0;
  }

  return (Math.max(0, toFiniteNumber(actualQuantity)) / safeTarget) * 100;
};

export const roundMetric = (value: number, digits = 1) => {
  const multiplier = 10 ** digits;
  return Math.round(toFiniteNumber(value) * multiplier) / multiplier;
};
