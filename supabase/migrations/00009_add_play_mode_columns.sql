ALTER TABLE user_play_records
ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'single',
ADD COLUMN IF NOT EXISTS dan_count integer;

COMMENT ON COLUMN user_play_records.mode IS '投注玩法模式: single 单式, complex 复式, dantuo 胆拖';
COMMENT ON COLUMN user_play_records.dan_count IS '胆拖模式中的胆码数量';
