CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE ROLE readonly;

GRANT CONNECT ON DATABASE mna_agent TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

CREATE USER grafana WITH PASSWORD 'grafana';

GRANT readonly TO grafana;