create table if not exists public.line_current_assignments (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.factory_lines(id),
  order_id uuid references public.orders(id),
  plan_id uuid references public.production_plans(id),
  customer_id uuid references public.customers(id),
  style_id uuid references public.style_master(id),
  assignment_date date not null default current_date,
  status text not null default 'idle'
    check (status in ('idle', 'running', 'warning', 'stopped', 'changeover', 'blocked')),
  current_customer_name text,
  current_style_code text,
  current_po_number text,
  target_qty integer not null default 0,
  actual_qty integer not null default 0,
  manpower integer not null default 0,
  active_downtime_type text,
  last_event_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hourly_production (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  plan_id uuid references public.production_plans(id),
  line_id uuid references public.factory_lines(id),
  production_date date not null,
  hour_slot text not null,
  manpower integer not null default 0,
  target_qty integer not null default 0,
  output_qty integer not null default 0,
  downtime_minutes integer not null default 0,
  defect_qty integer not null default 0,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.downtime_events (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.factory_lines(id),
  order_id uuid references public.orders(id),
  plan_id uuid references public.production_plans(id),
  downtime_type text not null
    check (downtime_type in ('changeover', 'maintenance', 'material', 'quality', 'factory')),
  reason text,
  phase text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer,
  operators_count integer not null default 0,
  total_lost_minutes integer,
  status text not null default 'open'
    check (status in ('open', 'waiting', 'repairing', 'resolved', 'cancelled')),
  abnormal_reason text,
  responsible_team text,
  action_taken text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.manpower_logs (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.factory_lines(id),
  order_id uuid references public.orders(id),
  log_date date not null default current_date,
  required_operators integer not null default 0,
  actual_operators integer not null default 0,
  singer_required integer not null default 0,
  singer_actual integer not null default 0,
  overlock_required integer not null default 0,
  overlock_actual integer not null default 0,
  coverstitch_required integer not null default 0,
  coverstitch_actual integer not null default 0,
  chain_required integer not null default 0,
  chain_actual integer not null default 0,
  gap integer generated always as (required_operators - actual_operators) stored,
  recommendation text,
  status text not null default 'open'
    check (status in ('open', 'balanced', 'shortage', 'surplus', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quality_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  stage_record_id uuid references public.production_stage_records(id),
  inspection_type text not null,
  defect_type text,
  checked_qty integer not null default 0,
  defect_qty integer not null default 0,
  dhu numeric generated always as (
    case when checked_qty > 0 then round((defect_qty::numeric / checked_qty::numeric) * 100, 2) else 0 end
  ) stored,
  rework_qty integer not null default 0,
  reject_qty integer not null default 0,
  corrective_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.management_actions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  issue text not null,
  risk_level text not null default 'medium'
    check (risk_level in ('low', 'medium', 'high', 'critical', 'green', 'amber', 'red')),
  responsible_team text not null,
  required_decision text,
  due_date date,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'waiting_decision', 'closed', 'cancelled')),
  expected_impact text,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_table text not null,
  entity_id uuid,
  event_type text not null,
  event_summary text not null,
  old_values jsonb,
  new_values jsonb,
  actor_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text not null,
  email text,
  department text,
  role_name text not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_name text not null,
  module_name text not null,
  can_view boolean not null default true,
  can_create boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  can_approve boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_line_assignments_line_id on public.line_current_assignments(line_id);
create index if not exists idx_line_assignments_order_id on public.line_current_assignments(order_id);
create index if not exists idx_line_assignments_plan_id on public.line_current_assignments(plan_id);
create index if not exists idx_line_assignments_customer_id on public.line_current_assignments(customer_id);
create index if not exists idx_line_assignments_style_id on public.line_current_assignments(style_id);
create index if not exists idx_hourly_production_order_id on public.hourly_production(order_id);
create index if not exists idx_hourly_production_plan_id on public.hourly_production(plan_id);
create index if not exists idx_hourly_production_line_id on public.hourly_production(line_id);
create index if not exists idx_hourly_production_date on public.hourly_production(production_date);
create index if not exists idx_downtime_events_line_id on public.downtime_events(line_id);
create index if not exists idx_downtime_events_order_id on public.downtime_events(order_id);
create index if not exists idx_downtime_events_plan_id on public.downtime_events(plan_id);
create index if not exists idx_manpower_logs_line_id on public.manpower_logs(line_id);
create index if not exists idx_manpower_logs_order_id on public.manpower_logs(order_id);
create index if not exists idx_quality_records_order_id on public.quality_records(order_id);
create index if not exists idx_quality_records_stage_record_id on public.quality_records(stage_record_id);
create index if not exists idx_management_actions_order_id on public.management_actions(order_id);
create index if not exists idx_audit_events_entity on public.audit_events(entity_table, entity_id);

alter table public.line_current_assignments enable row level security;
alter table public.hourly_production enable row level security;
alter table public.downtime_events enable row level security;
alter table public.manpower_logs enable row level security;
alter table public.quality_records enable row level security;
alter table public.management_actions enable row level security;
alter table public.audit_events enable row level security;
alter table public.user_profiles enable row level security;
alter table public.role_permissions enable row level security;
