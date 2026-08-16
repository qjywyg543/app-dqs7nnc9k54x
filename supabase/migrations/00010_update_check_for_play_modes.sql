CREATE OR REPLACE FUNCTION check_pending_play_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  result_rec record;
  red_count int;
  blue_count int;
  red_match int;
  blue_match int;
  pos_match int;
  include_match int;
  new_win_level int;
  new_win_name text;
  new_status text;
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

    new_win_level := NULL;
    new_win_name := NULL;
    new_status := 'lost';

    IF rec.game_code = 'ssq' THEN red_count := 6; blue_count := 1;
    ELSIF rec.game_code = 'dlt' THEN red_count := 5; blue_count := 2;
    ELSIF rec.game_code = 'qlc' THEN red_count := 7; blue_count := 0;
    ELSIF rec.game_code = 'kl8' THEN red_count := 10; blue_count := 0;
    ELSIF rec.game_code IN ('3d', 'pl3') THEN red_count := 3; blue_count := 0;
    ELSIF rec.game_code = 'pl5' THEN red_count := 5; blue_count := 0;
    ELSIF rec.game_code = 'seven' THEN red_count := 7; blue_count := 0;
    ELSIF rec.game_code = 'qxc' THEN red_count := 7; blue_count := 0;
    ELSE red_count := 0; blue_count := 0;
    END IF;

    IF rec.mode = 'complex' THEN
      red_match := LEAST(
        (SELECT COUNT(*) FROM unnest(rec.numbers) n WHERE n = ANY(result_rec.numbers)),
        red_count
      );
      IF blue_count > 0 THEN
        blue_match := LEAST(
          (SELECT COUNT(*) FROM unnest(rec.special_numbers) n WHERE n = ANY(result_rec.special_numbers)),
          blue_count
        );
      ELSE
        blue_match := 0;
      END IF;

    ELSIF rec.mode = 'dantuo' THEN
      DECLARE
        dan_arr int[];
        tuo_arr int[];
        dan_in_winning int;
        remaining_winning int[];
        remaining_in_tuo int;
        effective_match int;
      BEGIN
        dan_arr := rec.numbers[1:COALESCE(rec.dan_count, 1)];
        tuo_arr := rec.numbers[(COALESCE(rec.dan_count, 1) + 1):array_length(rec.numbers, 1)];
        dan_in_winning := (SELECT COUNT(*) FROM unnest(dan_arr) n WHERE n = ANY(result_rec.numbers));

        IF dan_in_winning = COALESCE(rec.dan_count, 1) THEN
          remaining_winning := ARRAY(
            SELECT n FROM unnest(result_rec.numbers) n
            WHERE n <> ALL(dan_arr)
          );
          remaining_in_tuo := (SELECT COUNT(*) FROM unnest(tuo_arr) n WHERE n = ANY(remaining_winning));
          effective_match := COALESCE(rec.dan_count, 1) + LEAST(remaining_in_tuo, red_count - COALESCE(rec.dan_count, 1));
          red_match := effective_match;
        ELSE
          red_match := 0;
        END IF;

        IF blue_count > 0 THEN
          blue_match := LEAST(
            (SELECT COUNT(*) FROM unnest(rec.special_numbers) n WHERE n = ANY(result_rec.special_numbers)),
            blue_count
          );
        ELSE
          blue_match := 0;
        END IF;
      END;

    ELSE
      red_match := (SELECT COUNT(*) FROM unnest(rec.numbers) n WHERE n = ANY(result_rec.numbers));
      blue_match := (SELECT COUNT(*) FROM unnest(rec.special_numbers) n WHERE n = ANY(result_rec.special_numbers));
    END IF;

    IF rec.game_code = 'ssq' THEN
      IF red_match = 6 AND blue_match > 0 THEN new_win_level := 1; new_win_name := '一等奖'; new_status := 'won';
      ELSIF red_match = 6 THEN new_win_level := 2; new_win_name := '二等奖'; new_status := 'won';
      ELSIF red_match = 5 AND blue_match > 0 THEN new_win_level := 3; new_win_name := '三等奖'; new_status := 'won';
      ELSIF red_match = 5 OR (red_match = 4 AND blue_match > 0) THEN new_win_level := 4; new_win_name := '四等奖'; new_status := 'won';
      ELSIF red_match = 4 OR (red_match = 3 AND blue_match > 0) THEN new_win_level := 5; new_win_name := '五等奖'; new_status := 'won';
      ELSIF blue_match > 0 THEN new_win_level := 6; new_win_name := '六等奖'; new_status := 'won';
      END IF;

    ELSIF rec.game_code = 'dlt' THEN
      IF red_match = 5 AND blue_match = 2 THEN new_win_level := 1; new_win_name := '一等奖'; new_status := 'won';
      ELSIF red_match = 5 AND blue_match = 1 THEN new_win_level := 2; new_win_name := '二等奖'; new_status := 'won';
      ELSIF red_match = 5 OR (red_match = 4 AND blue_match = 2) THEN new_win_level := 3; new_win_name := '三等奖'; new_status := 'won';
      ELSIF red_match = 4 AND blue_match = 1 THEN new_win_level := 4; new_win_name := '四等奖'; new_status := 'won';
      ELSIF red_match = 4 OR (red_match = 3 AND blue_match = 2) THEN new_win_level := 5; new_win_name := '五等奖'; new_status := 'won';
      ELSIF red_match = 3 AND blue_match = 1 THEN new_win_level := 6; new_win_name := '六等奖'; new_status := 'won';
      ELSIF red_match = 3 OR (red_match = 2 AND blue_match = 2) OR (red_match = 1 AND blue_match = 2) THEN new_win_level := 7; new_win_name := '七等奖'; new_status := 'won';
      ELSIF red_match = 2 OR (red_match = 0 AND blue_match = 2) OR (red_match = 1 AND blue_match = 1) THEN new_win_level := 8; new_win_name := '八等奖'; new_status := 'won';
      ELSIF (red_match = 2 AND blue_match = 1) OR (red_match = 0 AND blue_match = 1) OR (red_match = 1 AND blue_match = 0) THEN new_win_level := 9; new_win_name := '九等奖'; new_status := 'won';
      END IF;

    ELSIF rec.game_code IN ('3d', 'pl3') THEN
      IF result_rec.numbers = rec.numbers THEN
        new_win_level := 1; new_win_name := '直选'; new_status := 'won';
      END IF;

    ELSIF rec.game_code IN ('pl5', 'seven', 'qxc') THEN
      pos_match := 0;
      FOR i IN 1..array_length(result_rec.numbers, 1) LOOP
        IF result_rec.numbers[i] = rec.numbers[i] THEN
          pos_match := pos_match + 1;
        END IF;
      END LOOP;

      IF rec.game_code = 'pl5' THEN
        IF pos_match = 5 THEN new_win_level := 1; new_win_name := '一等奖'; new_status := 'won'; END IF;

      ELSIF rec.game_code = 'seven' THEN
        IF pos_match = 7 THEN new_win_level := 1; new_win_name := '特等奖'; new_status := 'won';
        ELSIF pos_match = 6 THEN new_win_level := 2; new_win_name := '一等奖'; new_status := 'won';
        ELSIF pos_match = 5 THEN new_win_level := 3; new_win_name := '二等奖'; new_status := 'won';
        ELSIF pos_match = 4 THEN new_win_level := 4; new_win_name := '三等奖'; new_status := 'won';
        ELSIF pos_match = 3 THEN new_win_level := 5; new_win_name := '四等奖'; new_status := 'won';
        ELSIF pos_match = 2 THEN new_win_level := 6; new_win_name := '五等奖'; new_status := 'won';
        ELSIF pos_match = 1 THEN new_win_level := 7; new_win_name := '六等奖'; new_status := 'won';
        END IF;

      ELSIF rec.game_code = 'qxc' THEN
        IF pos_match = 7 THEN new_win_level := 1; new_win_name := '一等奖'; new_status := 'won';
        ELSIF pos_match = 6 THEN new_win_level := 2; new_win_name := '二等奖'; new_status := 'won';
        ELSIF pos_match = 5 THEN new_win_level := 3; new_win_name := '三等奖'; new_status := 'won';
        ELSIF pos_match = 4 THEN new_win_level := 4; new_win_name := '四等奖'; new_status := 'won';
        ELSIF pos_match = 3 THEN new_win_level := 5; new_win_name := '五等奖'; new_status := 'won';
        ELSIF pos_match = 2 THEN
          IF (result_rec.numbers[1] = rec.numbers[1] AND result_rec.numbers[2] = rec.numbers[2]) OR
             (result_rec.numbers[2] = rec.numbers[2] AND result_rec.numbers[3] = rec.numbers[3]) OR
             (result_rec.numbers[3] = rec.numbers[3] AND result_rec.numbers[4] = rec.numbers[4]) OR
             (result_rec.numbers[4] = rec.numbers[4] AND result_rec.numbers[5] = rec.numbers[5]) OR
             (result_rec.numbers[5] = rec.numbers[5] AND result_rec.numbers[6] = rec.numbers[6]) THEN
            new_win_level := 6; new_win_name := '六等奖'; new_status := 'won';
          END IF;
        END IF;
      END IF;

    ELSIF rec.game_code = 'qlc' THEN
      include_match := (SELECT COUNT(*) FROM unnest(rec.numbers) n WHERE n = ANY(result_rec.numbers));
      IF include_match = 7 THEN new_win_level := 1; new_win_name := '一等奖'; new_status := 'won';
      ELSIF include_match = 6 THEN new_win_level := 2; new_win_name := '二等奖'; new_status := 'won';
      ELSIF include_match = 5 THEN new_win_level := 3; new_win_name := '三等奖'; new_status := 'won';
      ELSIF include_match = 4 THEN new_win_level := 4; new_win_name := '四等奖'; new_status := 'won';
      ELSIF include_match = 3 THEN new_win_level := 5; new_win_name := '五等奖'; new_status := 'won';
      ELSIF include_match = 2 THEN new_win_level := 6; new_win_name := '六等奖'; new_status := 'won';
      END IF;

    ELSIF rec.game_code = 'kl8' THEN
      include_match := (SELECT COUNT(*) FROM unnest(rec.numbers) n WHERE n = ANY(result_rec.numbers));
      IF include_match = 10 THEN new_win_level := 1; new_win_name := '选十中十'; new_status := 'won';
      ELSIF include_match = 9 THEN new_win_level := 2; new_win_name := '选十中九'; new_status := 'won';
      ELSIF include_match = 8 THEN new_win_level := 3; new_win_name := '选十中八'; new_status := 'won';
      ELSIF include_match = 7 THEN new_win_level := 4; new_win_name := '选十中七'; new_status := 'won';
      ELSIF include_match = 6 THEN new_win_level := 5; new_win_name := '选十中六'; new_status := 'won';
      ELSIF include_match = 5 THEN new_win_level := 6; new_win_name := '选十中五'; new_status := 'won';
      END IF;
    END IF;

    UPDATE user_play_records
    SET status = new_status,
        win_level = new_win_level,
        win_name = new_win_name
    WHERE id = rec.id;
  END LOOP;
END;
$$;