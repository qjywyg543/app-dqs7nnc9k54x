CREATE OR REPLACE FUNCTION check_pending_play_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  result_rec record;
  red_match int;
  blue_match int;
  pos_match int;
  include_match int;
  win_level int;
  win_name text;
  status text;
BEGIN
  FOR rec IN
    SELECT * FROM user_play_records WHERE status = 'pending'
  LOOP
    SELECT * INTO result_rec
    FROM lottery_results
    WHERE game_code = rec.game_code AND issue = rec.issue
    LIMIT 1;

    IF result_rec IS NULL THEN
      CONTINUE;
    END IF;

    win_level := NULL;
    win_name := NULL;
    status := 'lost';

    IF rec.game_code = 'ssq' THEN
      red_match := (SELECT COUNT(*) FROM unnest(rec.numbers) n WHERE n = ANY(result_rec.numbers));
      blue_match := (SELECT COUNT(*) FROM unnest(rec.special_numbers) n WHERE n = ANY(result_rec.special_numbers));
      IF red_match = 6 AND blue_match > 0 THEN win_level := 1; win_name := '一等奖'; status := 'won';
      ELSIF red_match = 6 THEN win_level := 2; win_name := '二等奖'; status := 'won';
      ELSIF red_match = 5 AND blue_match > 0 THEN win_level := 3; win_name := '三等奖'; status := 'won';
      ELSIF red_match = 5 OR (red_match = 4 AND blue_match > 0) THEN win_level := 4; win_name := '四等奖'; status := 'won';
      ELSIF red_match = 4 OR (red_match = 3 AND blue_match > 0) THEN win_level := 5; win_name := '五等奖'; status := 'won';
      ELSIF blue_match > 0 THEN win_level := 6; win_name := '六等奖'; status := 'won';
      END IF;

    ELSIF rec.game_code = 'dlt' THEN
      red_match := (SELECT COUNT(*) FROM unnest(rec.numbers) n WHERE n = ANY(result_rec.numbers));
      blue_match := (SELECT COUNT(*) FROM unnest(rec.special_numbers) n WHERE n = ANY(result_rec.special_numbers));
      IF red_match = 5 AND blue_match = 2 THEN win_level := 1; win_name := '一等奖'; status := 'won';
      ELSIF red_match = 5 AND blue_match = 1 THEN win_level := 2; win_name := '二等奖'; status := 'won';
      ELSIF red_match = 5 OR (red_match = 4 AND blue_match = 2) THEN win_level := 3; win_name := '三等奖'; status := 'won';
      ELSIF red_match = 4 AND blue_match = 1 THEN win_level := 4; win_name := '四等奖'; status := 'won';
      ELSIF red_match = 4 OR (red_match = 3 AND blue_match = 2) THEN win_level := 5; win_name := '五等奖'; status := 'won';
      ELSIF red_match = 3 AND blue_match = 1 THEN win_level := 6; win_name := '六等奖'; status := 'won';
      ELSIF red_match = 3 OR (red_match = 2 AND blue_match = 2) OR (red_match = 1 AND blue_match = 2) THEN win_level := 7; win_name := '七等奖'; status := 'won';
      ELSIF red_match = 2 OR (red_match = 0 AND blue_match = 2) OR (red_match = 1 AND blue_match = 1) THEN win_level := 8; win_name := '八等奖'; status := 'won';
      ELSIF (red_match = 2 AND blue_match = 1) OR (red_match = 0 AND blue_match = 1) OR (red_match = 1 AND blue_match = 0) THEN win_level := 9; win_name := '九等奖'; status := 'won';
      END IF;

    ELSIF rec.game_code IN ('3d', 'pl3') THEN
      IF result_rec.numbers = rec.numbers THEN
        win_level := 1; win_name := '直选'; status := 'won';
      END IF;

    ELSIF rec.game_code IN ('pl5', 'seven', 'qxc') THEN
      pos_match := 0;
      FOR i IN 1..array_length(result_rec.numbers, 1) LOOP
        IF result_rec.numbers[i] = rec.numbers[i] THEN
          pos_match := pos_match + 1;
        END IF;
      END LOOP;

      IF rec.game_code = 'pl5' THEN
        IF pos_match = 5 THEN win_level := 1; win_name := '一等奖'; status := 'won'; END IF;

      ELSIF rec.game_code = 'seven' THEN
        IF pos_match = 7 THEN win_level := 1; win_name := '特等奖'; status := 'won';
        ELSIF pos_match = 6 THEN win_level := 2; win_name := '一等奖'; status := 'won';
        ELSIF pos_match = 5 THEN win_level := 3; win_name := '二等奖'; status := 'won';
        ELSIF pos_match = 4 THEN win_level := 4; win_name := '三等奖'; status := 'won';
        ELSIF pos_match = 3 THEN win_level := 5; win_name := '四等奖'; status := 'won';
        ELSIF pos_match = 2 THEN win_level := 6; win_name := '五等奖'; status := 'won';
        ELSIF pos_match = 1 THEN win_level := 7; win_name := '六等奖'; status := 'won';
        END IF;

      ELSIF rec.game_code = 'qxc' THEN
        IF pos_match = 7 THEN win_level := 1; win_name := '一等奖'; status := 'won';
        ELSIF pos_match = 6 THEN win_level := 2; win_name := '二等奖'; status := 'won';
        ELSIF pos_match = 5 THEN win_level := 3; win_name := '三等奖'; status := 'won';
        ELSIF pos_match = 4 THEN win_level := 4; win_name := '四等奖'; status := 'won';
        ELSIF pos_match = 3 THEN win_level := 5; win_name := '五等奖'; status := 'won';
        ELSIF pos_match = 2 THEN
          -- Check consecutive 2
          IF (result_rec.numbers[1] = rec.numbers[1] AND result_rec.numbers[2] = rec.numbers[2]) OR
             (result_rec.numbers[2] = rec.numbers[2] AND result_rec.numbers[3] = rec.numbers[3]) OR
             (result_rec.numbers[3] = rec.numbers[3] AND result_rec.numbers[4] = rec.numbers[4]) OR
             (result_rec.numbers[4] = rec.numbers[4] AND result_rec.numbers[5] = rec.numbers[5]) OR
             (result_rec.numbers[5] = rec.numbers[5] AND result_rec.numbers[6] = rec.numbers[6]) THEN
            win_level := 6; win_name := '六等奖'; status := 'won';
          END IF;
        END IF;
      END IF;

    ELSIF rec.game_code = 'qlc' THEN
      include_match := (SELECT COUNT(*) FROM unnest(rec.numbers) n WHERE n = ANY(result_rec.numbers));
      IF include_match = 7 THEN win_level := 1; win_name := '一等奖'; status := 'won';
      ELSIF include_match = 6 THEN win_level := 2; win_name := '二等奖'; status := 'won';
      ELSIF include_match = 5 THEN win_level := 3; win_name := '三等奖'; status := 'won';
      ELSIF include_match = 4 THEN win_level := 4; win_name := '四等奖'; status := 'won';
      ELSIF include_match = 3 THEN win_level := 5; win_name := '五等奖'; status := 'won';
      ELSIF include_match = 2 THEN win_level := 6; win_name := '六等奖'; status := 'won';
      END IF;

    ELSIF rec.game_code = 'kl8' THEN
      include_match := (SELECT COUNT(*) FROM unnest(rec.numbers) n WHERE n = ANY(result_rec.numbers));
      IF include_match = 10 THEN win_level := 1; win_name := '选十中十'; status := 'won';
      ELSIF include_match = 9 THEN win_level := 2; win_name := '选十中九'; status := 'won';
      ELSIF include_match = 8 THEN win_level := 3; win_name := '选十中八'; status := 'won';
      ELSIF include_match = 7 THEN win_level := 4; win_name := '选十中七'; status := 'won';
      ELSIF include_match = 6 THEN win_level := 5; win_name := '选十中六'; status := 'won';
      ELSIF include_match = 5 THEN win_level := 6; win_name := '选十中五'; status := 'won';
      END IF;
    END IF;

    UPDATE user_play_records
    SET status = status,
        win_level = win_level,
        win_name = win_name
    WHERE id = rec.id;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION check_pending_play_records() TO authenticated;
GRANT EXECUTE ON FUNCTION check_pending_play_records() TO anon;
