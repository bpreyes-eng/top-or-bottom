import { createHash, timingSafeEqual } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const json = (data, status = 200) => Response.json(data, {
  status, headers: { 'Cache-Control': 'no-store, private', 'Vary': 'Authorization' },
});
const digest = value => createHash('sha256').update(value).digest();

export async function GET(request) {
  const secret = process.env.COMMISSIONER_ANALYTICS_KEY;
  if (!secret || secret.length < 32) {
    return json({ error: 'Analytics needs a commissioner access key configured before it can be opened.' }, 503);
  }
  const supplied = request.headers.get('authorization') || '';
  if (!timingSafeEqual(digest(supplied), digest(`Bearer ${secret}`))) {
    return json({ error: 'Enter the commissioner analytics access key.' }, 401);
  }
  if (!process.env.DATABASE_URL || process.env.SITE_ANALYTICS_ENABLED !== 'true') {
    return json({ error: 'Site tracking has not been enabled yet.' }, 503);
  }
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [totals, daily, pages, devices] = await Promise.all([
      sql`SELECT count(*)::int AS views,
        count(*) FILTER (WHERE viewed_at >= (date_trunc('day', now() AT TIME ZONE 'America/Los_Angeles') AT TIME ZONE 'America/Los_Angeles'))::int AS today,
        count(*) FILTER (WHERE viewed_at >= now() - interval '7 days')::int AS week,
        count(*) FILTER (WHERE viewed_at >= now() - interval '30 days')::int AS month,
        count(DISTINCT visitor_id) FILTER (WHERE viewed_at >= now() - interval '30 days')::int AS visitors,
        count(DISTINCT visit_id) FILTER (WHERE viewed_at >= now() - interval '30 days')::int AS visits,
        min(viewed_at) AS started, max(viewed_at) AS latest FROM site_page_views`,
      sql`SELECT to_char(day, 'YYYY-MM-DD') AS date, count(v.id)::int AS views
        FROM generate_series(
          date_trunc('day', now() AT TIME ZONE 'America/Los_Angeles') - interval '29 days',
          date_trunc('day', now() AT TIME ZONE 'America/Los_Angeles'), interval '1 day'
        ) AS day
        LEFT JOIN site_page_views v ON v.viewed_at >= (day AT TIME ZONE 'America/Los_Angeles')
          AND v.viewed_at < ((day + interval '1 day') AT TIME ZONE 'America/Los_Angeles')
        GROUP BY day ORDER BY day`,
      sql`SELECT page, count(*)::int AS views FROM site_page_views
        WHERE viewed_at >= now() - interval '30 days' GROUP BY page ORDER BY views DESC, page`,
      sql`SELECT device, count(*)::int AS views FROM site_page_views
        WHERE viewed_at >= now() - interval '30 days' GROUP BY device ORDER BY views DESC, device`,
    ]);
    return json({ ...totals[0], daily, pages, devices, updatedAt: new Date().toISOString() });
  } catch {
    return json({ error: 'Analytics is temporarily unavailable. Check the database setup and try again.' }, 503);
  }
}
