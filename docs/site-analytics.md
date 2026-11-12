# Commissioner site analytics

Deployment setup (no new service or dependency):

1. Apply `migrations/001_site_analytics.sql` using the existing league database's direct connection. Test on a database branch first. It creates only the analytics table/index and does not modify league data.
2. Set a cryptographically random `COMMISSIONER_ANALYTICS_KEY` of at least 32 characters as a server-only production environment variable. Give it privately to the commissioner. Never use a NEXT_PUBLIC variable or commit the key.
3. Set `SITE_ANALYTICS_ENABLED=true` in production and redeploy. The existing `DATABASE_URL` is reused. Preview deployments do not track.
4. Open Commish → Site activity and enter the key. Unauthenticated summary requests return 401; missing configuration or database errors display an unavailable state, not made-up zeros.
5. Verify a real visit increments the total and navigation increments the relevant page. Reusing an event UUID must not increment counts. Reloading counts as a new view. Locking or leaving the tab clears the access key from React memory.

The key protects only the new analytics API and dashboard. Existing commissioner features are unchanged and are not secured by this key. Rotating the environment variable revokes the previous key.

Definitions: all-time views since collection began; today in America/Los_Angeles; rolling 7/30-day totals; estimated distinct browsers and per-tab visits over 30 days; 30 calendar-day chart; popular pages and device share over 30 days. The chart uses calendar-day boundaries while the 30-day total is rolling. No historical traffic is reconstructed.

Privacy: random browser ID stored locally for 90 days, random session ID refreshed after 30 minutes inactivity. No names, owner IDs, IP addresses, referrers, full user-agent strings, or location are stored. Do Not Track and Global Privacy Control skip collection. Clearing storage/multiple devices can inflate estimated visitors; blocking scripts/storage can reduce counts. Device type is an estimate. Counts include commissioner visits. Common bots are filtered, but anonymous browser analytics are not audit-grade and deliberate spoofing remains possible. Tell league members that anonymous usage is collected.

Disable collection by setting SITE_ANALYTICS_ENABLED=false and redeploying. Existing rows remain available in the database; define a retention policy if needed. No paid analytics subscription is introduced.
