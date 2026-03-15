-- Add refresh policies to widgets (stored in MongoDB, but tracked in SQL for analytics)
CREATE TABLE widget_refresh_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    widget_id VARCHAR(255) NOT NULL,
    layout_id VARCHAR(255) NOT NULL,
    policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('interval', 'realtime', 'manual', 'schedule')),
    interval_ms INTEGER,
    cron_expression VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_refresh_at TIMESTAMP,
    next_scheduled_refresh TIMESTAMP,
    refresh_count INTEGER DEFAULT 0,
    avg_refresh_duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_widget_policies_widget ON widget_refresh_policies(widget_id);
CREATE INDEX idx_widget_policies_next_refresh ON widget_refresh_policies(next_scheduled_refresh) WHERE is_active = true;

-- Query performance tracking
CREATE TABLE query_performance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash VARCHAR(64) NOT NULL,
    connector_id UUID REFERENCES connectors(id),
    widget_id VARCHAR(255),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    query_text TEXT,
    execution_time_ms INTEGER NOT NULL,
    rows_returned INTEGER,
    cache_hit BOOLEAN DEFAULT false,
    error_occurred BOOLEAN DEFAULT false,
    error_message TEXT,
    execution_plan JSONB,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_query_perf_hash ON query_performance_logs(query_hash, executed_at DESC);
CREATE INDEX idx_query_perf_connector ON query_performance_logs(connector_id, executed_at DESC);

-- Add trigger function for query hash generation
CREATE OR REPLACE FUNCTION generate_query_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.query_hash = encode(digest(NEW.query_text, 'sha256'), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_query_hash BEFORE INSERT ON query_performance_logs
    FOR EACH ROW EXECUTE FUNCTION generate_query_hash();
