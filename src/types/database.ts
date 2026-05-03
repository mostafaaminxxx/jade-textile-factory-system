export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      orders: Table<{
        color: string | null;
        created_at: string;
        current_stage: string;
        customer_id: string | null;
        delivery_date: string | null;
        id: string;
        order_code: string;
        order_quantity: number;
        po_number: string | null;
        priority: string;
        risk_level: string;
        shipment_date: string | null;
        size_breakdown: Json;
        special_process_required: boolean;
        status: string;
        style_code: string;
        style_id: string | null;
        updated_at: string;
      }>;
      customers: Table<{
        created_at: string;
        customer_code: string;
        customer_group: string | null;
        customer_name: string;
        id: string;
        status: string;
        updated_at: string;
      }>;
      style_master: Table<{
        created_at: string;
        customer_id: string | null;
        customer_name: string | null;
        default_smv: number | null;
        embroidery_required: boolean;
        fabric_family: string | null;
        id: string;
        print_required: boolean;
        product_category: string | null;
        special_process_required: boolean;
        status: string;
        style_code: string;
        style_description: string | null;
        updated_at: string;
      }>;
      production_groups: Table<{
        created_at: string;
        group_code: string;
        group_name: string;
        id: string;
        is_active: boolean;
        notes: string | null;
        updated_at: string;
      }>;
      factory_lines: Table<{
        created_at: string;
        floor: string | null;
        group_id: string | null;
        id: string;
        is_active: boolean;
        is_core_production: boolean;
        line_code: string;
        line_type: string;
        notes: string | null;
        updated_at: string;
        zone: string | null;
      }>;
      line_current_assignments: Table<{
        active_downtime_type: string | null;
        actual_qty: number;
        assignment_date: string;
        created_at: string;
        current_customer_name: string | null;
        current_po_number: string | null;
        current_style_code: string | null;
        customer_id: string | null;
        id: string;
        last_event_at: string | null;
        line_id: string;
        manpower: number;
        notes: string | null;
        order_id: string | null;
        plan_id: string | null;
        status: string;
        style_id: string | null;
        target_qty: number;
        updated_at: string;
      }>;
      material_readiness: Table<{
        approval_status: string;
        balance_qty: number | null;
        created_at: string;
        expected_inhouse_date: string | null;
        id: string;
        inspection_status: string;
        material_type: string;
        notes: string | null;
        order_id: string;
        readiness_percent: number | null;
        received_qty: number;
        required_qty: number;
        shortage_risk: string;
        updated_at: string;
      }>;
      production_stage_records: Table<{
        balance_qty: number | null;
        created_at: string;
        finish_date: string | null;
        id: string;
        input_qty: number;
        notes: string | null;
        order_id: string;
        output_qty: number;
        plan_id: string | null;
        reject_qty: number;
        responsible_team: string | null;
        rework_qty: number;
        risk_level: string;
        stage_name: string;
        start_date: string | null;
        status: string;
        updated_at: string;
      }>;
      hourly_production: Table<{
        created_at: string;
        defect_qty: number;
        downtime_minutes: number;
        hour_slot: string;
        id: string;
        line_id: string | null;
        manpower: number;
        order_id: string;
        output_qty: number;
        plan_id: string | null;
        production_date: string;
        remarks: string | null;
        target_qty: number;
        updated_at: string;
      }>;
      factory_snapshots: Table<{
        active_orders: number;
        created_at: string;
        factory_efficiency: number | null;
        id: string;
        material_shortages: number;
        notes: string | null;
        open_management_actions: number;
        orders_at_risk: number;
        production_achievement: number | null;
        shipments_this_week: number;
        snapshot_date: string;
      }>;
      management_actions: Table<{
        closed_at: string | null;
        created_at: string;
        due_date: string | null;
        expected_impact: string | null;
        id: string;
        issue: string;
        order_id: string | null;
        required_decision: string | null;
        responsible_team: string;
        risk_level: string;
        status: string;
        updated_at: string;
      }>;
      app_settings: Table<{
        created_at: string;
        description: string | null;
        id: string;
        setting_key: string;
        setting_value: Json;
        updated_at: string;
      }>;
      audit_events: Table<{
        actor_name: string | null;
        created_at: string;
        entity_id: string | null;
        entity_table: string;
        event_summary: string;
        event_type: string;
        id: string;
        new_values: Json | null;
        old_values: Json | null;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Row'];
