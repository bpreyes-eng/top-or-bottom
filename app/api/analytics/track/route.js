import { neon } from '@neondatabase/serverless';
import { validEvent } from '../../../../lib/analytics-validation.mjs';

export async function POST(request) {
  // Ignore preview deployments and disabled tracking. Never interrupt league use.
  if (!process.env.DATABASE_URL || process.env.SITE_ANALYTICS_ENABLED !== 'true' ||
      (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production')) {
    return new Response(null, { status: 204 });
  }
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return new Response(null, { status: 403 });
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return new Response(null, { status: 415 });
  }
  if (/bot|crawler|spider|headless/i.test(request.headers.get('user-agent') || '')) {
    return new Response(null, { status: 204 });
  }
  try {
    const body = await request.text();
    if (body.length > 1024) return new Response(null, { status: 413 });
    let event;
    try { event = JSON.parse(body); } catch { return new Response(null, { status: 400 }); }
    if (!validEvent(event)) return new Response(null, { status: 400 });
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO site_page_views (id, visitor_id, visit_id, page, device)
      VALUES (${event.id}, ${event.visitor}, ${event.visit}, ${event.page}, ${event.device})
      ON CONFLICT (id) DO NOTHING
    `;
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
