SELECT cron.schedule(
  'lottery-sync-daily',
  '30 13 * * *',
  $$
  SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/lottery-sync',
      headers := jsonb_build_object(
        'Content-type', 'application/json',
        'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'publishable_key')
      ),
      body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);