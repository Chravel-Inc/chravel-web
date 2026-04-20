# B2 webhook local test (v2)

This script validates Stream webhook mention fanout paths using real `auth.users` IDs and `trip_members`, avoiding synthetic non-UUID IDs.

## Run locally

```bash
cd scripts/b2-webhook-test
STREAM_API_KEY=... \
STREAM_API_SECRET=... \
SUPABASE_URL=https://jmjiyekmxwsxkfnqwyaa.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
node b2-webhook-test.v2.mjs
```

## Notes

- Uses service role key and creates disposable auth users.
- Cleans up created users and trip in `finally` teardown.
- Do **not** run against production unless you intend to create/delete temporary records.
