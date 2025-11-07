-- Drop dependent objects first
DROP TABLE IF EXISTS alert CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop enum type if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    DROP TYPE user_role;
  END IF;
END$$;

-- Recreate enum type
CREATE TYPE user_role AS ENUM ('admin', 'tenant');

-- Recreate users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL, -- Accepts hashed values
  role user_role NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMP
);

-- Recreate admin table
CREATE TABLE admin (
  admin_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(50) UNIQUE NOT NULL,
  timestamp TIMESTAMP,
  CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Recreate tenants table (fixed typo from "tenats")
CREATE TABLE tenants (
  tenant_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(50) UNIQUE NOT NULL,
  timestamp TIMESTAMP,
  CONSTRAINT fk_tenants_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Recreate logs table
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  timestamp TIMESTAMP,
  tenant TEXT,
  source TEXT,
  vendor TEXT,
  product TEXT,
  event_type TEXT,
  event_subtype TEXT,
  severity INTEGER,
  action TEXT,
  src_ip INET,
  src_port INTEGER,
  dst_ip INET,
  dst_port INTEGER,
  protocol TEXT,
  "user" TEXT,
  host TEXT,
  process TEXT,
  url TEXT,
  http_method TEXT,
  status_code INTEGER,
  rule_name TEXT,
  rule_id TEXT,
  cloud_account_id TEXT,
  cloud_region TEXT,
  cloud_service TEXT,
  raw JSONB,
  tags TEXT[],
  CONSTRAINT fk_logs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
);

-- Recreate alert table
CREATE TABLE alert (
  alert_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  log_id INTEGER NOT NULL,
  alert TEXT,
  timestamp TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT fk_alert_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_alert_log FOREIGN KEY (log_id) REFERENCES logs(id)
);




