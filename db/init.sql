DROP INDEX IF EXISTS idx_tenant;
DROP INDEX IF EXISTS idx_timestamp;
DROP INDEX IF EXISTS idx_event_type;
DROP INDEX IF EXISTS idx_ip;

CREATE INDEX idx_timestamp ON logs (timestamp);
CREATE INDEX idx_tenant ON tenants (tenant_id);
CREATE INDEX idx_event_type ON logs (event_type);
CREATE INDEX idx_ip ON logs (src_ip);