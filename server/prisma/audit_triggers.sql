-- =========================================================================
-- AGT TEXTILE MILLS — SUPABASE POSTGRESQL AUTOMATED AUDIT TRIGGERS
-- =========================================================================

CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO "AuditLog" ("id", "action", "entity", "entityId", "details", "createdAt")
        VALUES (
            gen_random_uuid(),
            'DELETE',
            TG_TABLE_NAME::text,
            OLD.id::text,
            row_to_json(OLD),
            NOW()
        );
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO "AuditLog" ("id", "action", "entity", "entityId", "details", "createdAt")
        VALUES (
            gen_random_uuid(),
            'UPDATE',
            TG_TABLE_NAME::text,
            NEW.id::text,
            json_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)),
            NOW()
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO "AuditLog" ("id", "action", "entity", "entityId", "details", "createdAt")
        VALUES (
            gen_random_uuid(),
            'INSERT',
            TG_TABLE_NAME::text,
            NEW.id::text,
            row_to_json(NEW),
            NOW()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers conditionally to critical manufacturing entities
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_orders') THEN
        CREATE TRIGGER trg_audit_orders
        AFTER INSERT OR UPDATE OR DELETE ON "Order"
        FOR EACH ROW EXECUTE FUNCTION process_audit_log();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_dispatches') THEN
        CREATE TRIGGER trg_audit_dispatches
        AFTER INSERT OR UPDATE OR DELETE ON "Dispatch"
        FOR EACH ROW EXECUTE FUNCTION process_audit_log();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_invoices') THEN
        CREATE TRIGGER trg_audit_invoices
        AFTER INSERT OR UPDATE OR DELETE ON "Invoice"
        FOR EACH ROW EXECUTE FUNCTION process_audit_log();
    END IF;
END $$;
