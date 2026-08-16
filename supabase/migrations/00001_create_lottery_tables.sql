-- 彩种定义表
CREATE TABLE IF NOT EXISTS lottery_games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL CHECK (category IN ('welfare', 'sports')),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    display_name text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    red_count integer,
    red_min integer,
    red_max integer,
    blue_count integer,
    blue_min integer,
    blue_max integer,
    rules text,
    prize_levels jsonb,
    draw_days text,
    draw_time text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 开奖结果表
CREATE TABLE IF NOT EXISTS lottery_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_code text NOT NULL REFERENCES lottery_games(code) ON DELETE CASCADE,
    issue text NOT NULL,
    draw_date date NOT NULL,
    numbers integer[] NOT NULL,
    special_numbers integer[] DEFAULT '{}',
    sales text,
    pool text,
    details jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(game_code, issue)
);

CREATE INDEX IF NOT EXISTS idx_lottery_results_game_code_draw_date ON lottery_results(game_code, draw_date DESC);
CREATE INDEX IF NOT EXISTS idx_lottery_results_issue ON lottery_results(issue DESC);

-- 启用 RLS
ALTER TABLE lottery_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_results ENABLE ROW LEVEL SECURITY;

-- 匿名用户和认证用户均可读取彩种定义
CREATE POLICY "任何人可读取彩种定义" ON lottery_games
    FOR SELECT TO anon, authenticated USING (true);

-- 匿名用户和认证用户均可读取开奖结果
CREATE POLICY "任何人可读取开奖结果" ON lottery_results
    FOR SELECT TO anon, authenticated USING (true);

-- 插入/更新/删除仅通过 service_role 或 Edge Function
CREATE POLICY "禁止匿名用户修改开奖结果" ON lottery_results
    FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "禁止匿名用户更新开奖结果" ON lottery_results
    FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "禁止匿名用户删除开奖结果" ON lottery_results
    FOR DELETE TO anon, authenticated USING (false);

CREATE POLICY "禁止匿名用户修改彩种定义" ON lottery_games
    FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "禁止匿名用户更新彩种定义" ON lottery_games
    FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "禁止匿名用户删除彩种定义" ON lottery_games
    FOR DELETE TO anon, authenticated USING (false);

-- 初始化彩种数据
INSERT INTO lottery_games (category, code, name, display_name, sort_order, red_count, red_min, red_max, blue_count, blue_min, blue_max, rules, prize_levels, draw_days, draw_time) VALUES
('welfare', 'ssq', '双色球', '双色球', 1, 6, 1, 33, 1, 1, 16, '从1-33中选择6个红球，从1-16中选择1个蓝球', '[{"level":1,"name":"一等奖","condition":"6红+1蓝","prize":"浮动"},{"level":2,"name":"二等奖","condition":"6红","prize":"浮动"},{"level":3,"name":"三等奖","condition":"5红+1蓝","prize":"3000元"},{"level":4,"name":"四等奖","condition":"5红或4红+1蓝","prize":"200元"},{"level":5,"name":"五等奖","condition":"4红或3红+1蓝","prize":"10元"},{"level":6,"name":"六等奖","condition":"2红+1蓝或1蓝","prize":"5元"}]', '周二、四、日', '21:15'),
('welfare', '3d', '福彩3D', '福彩3D', 2, 3, 0, 9, 0, 0, 0, '从0-9中选择3个号码（可重复）', '[{"level":1,"name":"直选","condition":"位置与号码全中","prize":"1040元"},{"level":2,"name":"组选3","condition":"3个号码中2个相同","prize":"346元"},{"level":3,"name":"组选6","condition":"3个号码各不相同","prize":"173元"}]', '每日', '21:15'),
('welfare', 'qlc', '七乐彩', '七乐彩', 3, 7, 1, 30, 0, 0, 0, '从1-30中选择7个号码', '[{"level":1,"name":"一等奖","condition":"7个号码全中","prize":"浮动"},{"level":2,"name":"二等奖","condition":"中6个号码","prize":"浮动"},{"level":3,"name":"三等奖","condition":"中5个号码","prize":"浮动"},{"level":4,"name":"四等奖","condition":"中4个号码","prize":"200元"},{"level":5,"name":"五等奖","condition":"中3个号码","prize":"10元"},{"level":6,"name":"六等奖","condition":"中2个号码","prize":"5元"}]', '周一、三、五', '21:15'),
('welfare', 'kl8', '快乐8', '快乐8', 4, 20, 1, 80, 0, 0, 0, '从1-80中选择20个号码', '[{"level":1,"name":"选十中十","condition":"选10中10","prize":"浮动"},{"level":2,"name":"选十中九","condition":"选10中9","prize":"8000元"},{"level":3,"name":"选十中八","condition":"选10中8","prize":"800元"},{"level":4,"name":"选十中七","condition":"选10中7","prize":"80元"},{"level":5,"name":"选十中六","condition":"选10中6","prize":"5元"},{"level":6,"name":"选十中五","condition":"选10中5","prize":"3元"}]', '每日', '21:30'),
('sports', 'dlt', '大乐透', '大乐透', 1, 5, 1, 35, 2, 1, 12, '从1-35中选择5个前区号码，从1-12中选择2个后区号码', '[{"level":1,"name":"一等奖","condition":"5前+2后","prize":"浮动"},{"level":2,"name":"二等奖","condition":"5前+1后","prize":"浮动"},{"level":3,"name":"三等奖","condition":"5前或4前+2后","prize":"10000元"},{"level":4,"name":"四等奖","condition":"4前+1后","prize":"3000元"},{"level":5,"name":"五等奖","condition":"4前或3前+2后","prize":"300元"},{"level":6,"name":"六等奖","condition":"3前+1后或2前+2后","prize":"200元"},{"level":7,"name":"七等奖","condition":"3前或2前+1后或1前+2后","prize":"100元"},{"level":8,"name":"八等奖","condition":"2前或1前+2后或0前+2后","prize":"15元"},{"level":9,"name":"九等奖","condition":"2前+1后或1前+1后或0前+1后","prize":"5元"}]', '周一、三、六', '21:25'),
('sports', 'pl3', '排列3', '排列3', 2, 3, 0, 9, 0, 0, 0, '从0-9中选择3个号码（可重复），按位置开奖', '[{"level":1,"name":"直选","condition":"位置与号码全中","prize":"1040元"},{"level":2,"name":"组选3","condition":"3个号码中2个相同","prize":"346元"},{"level":3,"name":"组选6","condition":"3个号码各不相同","prize":"173元"}]', '每日', '20:30'),
('sports', 'pl5', '排列5', '排列5', 3, 5, 0, 9, 0, 0, 0, '从0-9中选择5个号码（可重复），按位置开奖', '[{"level":1,"name":"一等奖","condition":"位置与号码全中","prize":"100000元"}]', '每日', '20:30'),
('sports', 'qxc', '七星彩', '七星彩', 4, 7, 0, 9, 0, 0, 0, '从0-9中选择7个号码（可重复），按位置开奖', '[{"level":1,"name":"一等奖","condition":"7个号码位置全中","prize":"浮动"},{"level":2,"name":"二等奖","condition":"中6个号码","prize":"浮动"},{"level":3,"name":"三等奖","condition":"中5个号码","prize":"浮动"},{"level":4,"name":"四等奖","condition":"中4个号码","prize":"500元"},{"level":5,"name":"五等奖","condition":"中3个号码","prize":"30元"},{"level":6,"name":"六等奖","condition":"连续2位中","prize":"5元"}]', '周二、五、日', '21:15'),
('sports', 'seven', '7位数', '7位数', 5, 7, 0, 9, 0, 0, 0, '从0-9中选择7个号码（可重复），按位置开奖', '[{"level":1,"name":"特等奖","condition":"7个号码位置全中","prize":"浮动"},{"level":2,"name":"一等奖","condition":"中6个号码","prize":"浮动"},{"level":3,"name":"二等奖","condition":"中5个号码","prize":"浮动"},{"level":4,"name":"三等奖","condition":"中4个号码","prize":"500元"},{"level":5,"name":"四等奖","condition":"中3个号码","prize":"20元"},{"level":6,"name":"五等奖","condition":"中2个号码","prize":"5元"}]', '周一、四、五', '20:30')
ON CONFLICT (code) DO UPDATE SET
    category = EXCLUDED.category,
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    sort_order = EXCLUDED.sort_order,
    red_count = EXCLUDED.red_count,
    red_min = EXCLUDED.red_min,
    red_max = EXCLUDED.red_max,
    blue_count = EXCLUDED.blue_count,
    blue_min = EXCLUDED.blue_min,
    blue_max = EXCLUDED.blue_max,
    rules = EXCLUDED.rules,
    prize_levels = EXCLUDED.prize_levels,
    draw_days = EXCLUDED.draw_days,
    draw_time = EXCLUDED.draw_time;
