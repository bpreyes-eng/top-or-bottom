import test from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/analytics/summary/route.js';
import { POST } from '../app/api/analytics/track/route.js';
import { validEvent } from '../lib/analytics-validation.mjs';

const url = 'https://league.example/api/analytics/track';
test('private analytics fail closed and cannot be cached', async () => {
  delete process.env.COMMISSIONER_ANALYTICS_KEY;
  assert.equal((await GET(new Request(url))).status, 503);
  process.env.COMMISSIONER_ANALYTICS_KEY = 'test-only-random-key-at-least-32-characters';
  const response = await GET(new Request(url));
  assert.equal(response.status, 401);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal((await GET(new Request(url, { headers: { authorization: 'Bearer wrong' } }))).status, 401);
  delete process.env.DATABASE_URL;
  const authorized = await GET(new Request(url, { headers: { authorization: `Bearer ${process.env.COMMISSIONER_ANALYTICS_KEY}` } }));
  assert.equal(authorized.status, 503); // Missing database is not shown as zero traffic.
});
test('tracking rejects untrusted origins and malformed events before database access', async () => {
  process.env.SITE_ANALYTICS_ENABLED = 'true';
  process.env.DATABASE_URL = 'not-used';
  delete process.env.VERCEL_ENV;
  const request = (body, origin = 'https://league.example') => new Request(url, {
    method: 'POST', headers: { origin, 'content-type': 'application/json' }, body,
  });
  assert.equal((await POST(request('{}', 'https://other.example'))).status, 403);
  assert.equal((await POST(request('not json'))).status, 400);
  assert.equal((await POST(request('{}'))).status, 400);
  assert.equal((await POST(request('x'.repeat(1025)))).status, 413);
  process.env.VERCEL_ENV = 'preview';
  assert.equal((await POST(request('{}'))).status, 204);
});
test('event validation limits stored values to known pages, device categories and random IDs', () => {
  const event = { page: 'home', device: 'mobile', id: crypto.randomUUID(), visitor: crypto.randomUUID(), visit: crypto.randomUUID() };
  assert.ok(validEvent(event));
  assert.ok(!validEvent({ ...event, page: '/owner/private-data?email=test' }));
  assert.ok(!validEvent({ ...event, visitor: 'Bernardo' }));
  assert.ok(!validEvent({ ...event, device: 'full-user-agent' }));
});
