-- V1 development policies for the existing Jade Textile public tables.
-- These policies intentionally allow any authenticated user to read and write
-- during the foundation phase. Tighten these before exposing production data.

grant usage on schema public to authenticated;

do $$
declare
  app_tables text[] := array[
    'customers',
    'production_groups',
    'factory_lines',
    'style_master',
    'orders',
    'material_readiness',
    'production_plans',
    'production_stage_records',
    'factory_snapshots',
    'app_settings',
    'line_current_assignments',
    'hourly_production',
    'downtime_events',
    'manpower_logs',
    'quality_records',
    'management_actions',
    'audit_events',
    'user_profiles',
    'role_permissions'
  ];
  table_name text;
begin
  foreach table_name in array app_tables loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);

    execute format(
      'drop policy if exists %I on public.%I',
      'authenticated read ' || table_name,
      table_name
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      'authenticated read ' || table_name,
      table_name
    );

    execute format(
      'drop policy if exists %I on public.%I',
      'authenticated write ' || table_name,
      table_name
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      'authenticated write ' || table_name,
      table_name
    );
  end loop;
end $$;
