create extension if not exists pgcrypto with schema extensions;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null unique,
  customer_name text not null,
  customer_group text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_groups (
  id uuid primary key default gen_random_uuid(),
  group_code text not null unique,
  group_name text not null,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.factory_lines (
  id uuid primary key default gen_random_uuid(),
  line_code text not null unique,
  zone text,
  floor text,
  line_type text not null default 'production',
  is_active boolean not null default true,
  is_core_production boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  group_id uuid references public.production_groups(id)
);

create table if not exists public.style_master (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id),
  customer_name text,
  style_code text not null,
  style_description text,
  product_category text,
  fabric_family text,
  default_smv numeric,
  special_process_required boolean not null default false,
  print_required boolean not null default false,
  embroidery_required boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_id uuid references public.customers(id),
  style_id uuid references public.style_master(id),
  po_number text,
  style_code text not null,
  color text,
  size_breakdown jsonb not null default '{}'::jsonb,
  order_quantity integer not null check (order_quantity >= 0),
  delivery_date date,
  shipment_date date,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  special_process_required boolean not null default false,
  current_stage text not null default 'order_master',
  risk_level text not null default 'not_assessed'
    check (risk_level in ('not_assessed', 'green', 'amber', 'red', 'critical', 'high')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'released', 'running', 'completed', 'cancelled', 'on_hold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.material_readiness (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  material_type text not null
    check (material_type in ('fabric', 'trims', 'accessories', 'packing_material', 'printing_material', 'embroidery_material')),
  required_qty numeric not null default 0,
  received_qty numeric not null default 0,
  balance_qty numeric generated always as (greatest(required_qty - received_qty, 0)) stored,
  readiness_percent numeric generated always as (
    case when required_qty > 0 then round((received_qty / required_qty) * 100, 2) else 0 end
  ) stored,
  expected_inhouse_date date,
  inspection_status text not null default 'pending',
  approval_status text not null default 'pending',
  shortage_risk text not null default 'not_assessed',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_plans (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  line_id uuid references public.factory_lines(id),
  plan_code text unique,
  smv numeric not null check (smv > 0),
  efficiency_assumption numeric not null default 55 check (efficiency_assumption > 0),
  working_minutes_per_day integer not null default 540,
  required_operators integer not null default 0,
  daily_target integer,
  planned_start_date date,
  planned_finish_date date,
  required_days numeric,
  capacity_risk text not null default 'not_assessed',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_stage_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  plan_id uuid references public.production_plans(id),
  stage_name text not null
    check (stage_name in ('cutting', 'printing', 'embroidery', 'sewing', 'finishing', 'packing', 'shipment')),
  input_qty integer not null default 0,
  output_qty integer not null default 0,
  balance_qty integer generated always as (greatest(input_qty - output_qty, 0)) stored,
  rework_qty integer not null default 0,
  reject_qty integer not null default 0,
  start_date date,
  finish_date date,
  status text not null default 'not_started'
    check (status in ('not_started', 'ready', 'running', 'blocked', 'completed', 'on_hold')),
  risk_level text not null default 'not_assessed',
  responsible_team text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.factory_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null default current_date,
  active_orders integer not null default 0,
  orders_at_risk integer not null default 0,
  shipments_this_week integer not null default 0,
  material_shortages integer not null default 0,
  factory_efficiency numeric,
  production_achievement numeric,
  open_management_actions integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_factory_lines_group_id on public.factory_lines(group_id);
create index if not exists idx_style_master_customer_id on public.style_master(customer_id);
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_style_id on public.orders(style_id);
create index if not exists idx_orders_shipment_date on public.orders(shipment_date);
create index if not exists idx_material_readiness_order_id on public.material_readiness(order_id);
create index if not exists idx_production_plans_order_id on public.production_plans(order_id);
create index if not exists idx_production_plans_line_id on public.production_plans(line_id);
create index if not exists idx_stage_records_order_id on public.production_stage_records(order_id);
create index if not exists idx_stage_records_plan_id on public.production_stage_records(plan_id);
create index if not exists idx_factory_snapshots_date on public.factory_snapshots(snapshot_date desc);

alter table public.customers enable row level security;
alter table public.production_groups enable row level security;
alter table public.factory_lines enable row level security;
alter table public.style_master enable row level security;
alter table public.orders enable row level security;
alter table public.material_readiness enable row level security;
alter table public.production_plans enable row level security;
alter table public.production_stage_records enable row level security;
alter table public.factory_snapshots enable row level security;
alter table public.app_settings enable row level security;
