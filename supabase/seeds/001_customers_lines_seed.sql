begin;

insert into public.customers (customer_code, customer_name, customer_group, status)
values
  ('JADE', 'Jade Export', 'Internal priority', 'active'),
  ('NORTH', 'North Retail', 'Export retail', 'active')
on conflict (customer_code) do update
set
  customer_name = excluded.customer_name,
  customer_group = excluded.customer_group,
  status = excluded.status,
  updated_at = now();

insert into public.production_groups (group_code, group_name, is_active, notes)
values
  ('H', 'Group H', true, 'Core sewing production group.'),
  ('G', 'Group G', true, 'Core sewing production group.'),
  ('GHOST', 'Ghost / Non-working', false, 'Non-working lines retained for historical accuracy.')
on conflict (group_code) do update
set
  group_name = excluded.group_name,
  is_active = excluded.is_active,
  notes = excluded.notes,
  updated_at = now();

insert into public.factory_lines (
  line_code,
  zone,
  floor,
  line_type,
  is_active,
  is_core_production,
  group_id,
  notes
)
values
  (
    'H93',
    'H Zone',
    'Main Floor',
    'production',
    true,
    true,
    (select id from public.production_groups where group_code = 'H'),
    'Legacy H93/115 label is normalized to H93. Do not create H115.'
  ),
  (
    'G-14',
    'G Zone',
    'Main Floor',
    'production',
    true,
    true,
    (select id from public.production_groups where group_code = 'G'),
    'G-14 correction preserved.'
  ),
  (
    'G-11',
    'Ghost / Non-working',
    'Main Floor',
    'ghost',
    false,
    false,
    (select id from public.production_groups where group_code = 'GHOST'),
    'Ghost/non-working line retained so historical references remain traceable.'
  )
on conflict (line_code) do update
set
  zone = excluded.zone,
  floor = excluded.floor,
  line_type = excluded.line_type,
  is_active = excluded.is_active,
  is_core_production = excluded.is_core_production,
  group_id = excluded.group_id,
  notes = excluded.notes,
  updated_at = now();

commit;
