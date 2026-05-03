const MS_PER_DAY = 86_400_000;

const startOfLocalDay = (date: Date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const addDaysIso = (days: number, from = new Date()) => {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const daysUntil = (date?: string | null) => {
  if (!date) {
    return null;
  }

  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  return Math.ceil((startOfLocalDay(target).getTime() - startOfLocalDay(new Date()).getTime()) / MS_PER_DAY);
};

export const isWithinNextDays = (date?: string | null, days = 7) => {
  const remainingDays = daysUntil(date);
  return remainingDays !== null && remainingDays >= 0 && remainingDays <= days;
};

export const dateSortValue = (date?: string | null) => {
  if (!date) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsedDate = new Date(`${date}T00:00:00`).getTime();
  return Number.isNaN(parsedDate) ? Number.MAX_SAFE_INTEGER : parsedDate;
};
