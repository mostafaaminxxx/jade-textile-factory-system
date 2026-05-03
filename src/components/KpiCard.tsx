import type { ReactNode } from 'react';

type KpiCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'gray';
  icon: ReactNode;
};

export default function KpiCard({ label, value, detail, tone = 'gray', icon }: KpiCardProps) {
  return (
    <article className={`kpi-card tone-${tone}`}>
      <div className="kpi-icon" aria-hidden="true">
        {icon}
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}
