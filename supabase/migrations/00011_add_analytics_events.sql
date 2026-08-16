CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path text,
  event_detail jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

COMMENT ON TABLE analytics_events IS '用户行为埋点数据';
COMMENT ON COLUMN analytics_events.event_type IS '事件类型：page_view、button_click、login、register、play_bet 等';
COMMENT ON COLUMN analytics_events.page_path IS '页面路径';
COMMENT ON COLUMN analytics_events.event_detail IS '事件详情 JSON';

-- 管理员角色字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
COMMENT ON COLUMN profiles.role IS '用户角色：user 或 admin';

-- RLS 策略
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_events_owner_insert" ON analytics_events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "analytics_events_admin_read" ON analytics_events
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
