# Codex Start Here

## Scope

This repo is the first working React + TypeScript + Supabase foundation for the Jade Textile Factory System.

Follow GitHub issue #1 exactly:

- Do not invent database tables.
- Use Supabase project `mhfheswzjrdoqgbygjfc` as the source of truth.
- Keep order, customer, style, PO, line, group, and shipment date connected across modules.
- Keep factory formulas centralized in `src/lib/factoryFormulas.ts`.
- Keep line status and risk rules centralized in `src/lib/riskRules.ts`.
- Keep the Supabase client isolated in `src/lib/supabase.ts`.

## Supabase

Frontend env names:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Do not commit real keys. When env values are missing, the app uses mock fallback data. When env values exist, the app queries the existing Supabase tables and does not use fallback rows.

## Screens

- `src/pages/ExecutiveCommandCenter.tsx` is the first screen.
- `src/pages/SewingControlRoom.tsx` is the second screen.
- `src/App.tsx` connects both screens through one working shell, not disconnected pages.
- `.github/workflows/ci.yml` runs install, lint, and build for pushes and pull requests.

## Data Notes

- Sewing layout is generated from `factory_lines` and `line_current_assignments`.
- `H93/115` is normalized to `H93`; do not create fake `H115`.
- `G-14` is preserved as the corrected line code.
- `G-11` is ghost/non-working.
- Historical events belong in `audit_events` with JSON snapshots in `old_values` and `new_values`.
- `supabase/migrations/003_authenticated_development_rls_policies.sql` contains V1 authenticated development RLS policies. These are intentionally broad for foundation work and must be tightened before production exposure.

## Commands

```bash
npm install
npm run build
```
