'use client';

import { useEffect, useRef, useState } from 'react';

export function usePageTracking(page) {
  const previous = useRef(null);
  useEffect(() => {
    if (previous.current === page) return;
    previous.current = page;
    // Respect browser privacy preferences; blocked storage must never break navigation.
    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
    try {
      const now = Date.now();
      const stored = JSON.parse(localStorage.getItem('tob-analytics-visitor') || 'null');
      const visitor = stored?.expires > now ? stored.id : crypto.randomUUID();
      if (visitor !== stored?.id) localStorage.setItem('tob-analytics-visitor', JSON.stringify({ id: visitor, expires: now + 90 * 86400000 }));
      const session = JSON.parse(sessionStorage.getItem('tob-analytics-visit') || 'null');
      const visit = session && now - session.last < 30 * 60000 ? session.id : crypto.randomUUID();
      sessionStorage.setItem('tob-analytics-visit', JSON.stringify({ id: visit, last: now }));
      const device = /iPad|Tablet/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        ? 'tablet' : /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
      fetch('/api/analytics/track', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: crypto.randomUUID(), visitor, visit, page, device }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* Private browsing or disabled storage: skip tracking. */ }
  }, [page]);
}

const names = { home: 'Home', standings: 'Standings', schedule: 'Schedule', team: 'My Team', moves: 'Moves', rules: 'Rules', commish: 'Commissioner' };
const format = value => Number(value || 0).toLocaleString();
const timestamp = value => new Date(value).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

export default function SiteAnalytics() {
  const [key, setKey] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function refresh(event) {
    event?.preventDefault();
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/analytics/summary', {
        headers: { Authorization: `Bearer ${key}` }, cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok) { setData(null); throw new Error(result.error || 'Analytics could not be loaded.'); }
      setData(result);
    } catch (error) { setError(error.message || 'Please try again.'); }
    finally { setLoading(false); }
  }
  const max = Math.max(1, ...(data?.daily || []).map(day => day.views));
  return <section className="card analyticsPanel">
    <div className="analyticsHeading"><h2>Site activity</h2><span className="muted">Commissioner only</span></div>
    {!data && <form onSubmit={refresh} className="analyticsUnlock">
      <label htmlFor="analytics-key">Commissioner analytics access key</label>
      <input id="analytics-key" type="password" value={key} onChange={event => setKey(event.target.value)} required autoComplete="off" />
      <button disabled={loading}>{loading ? 'Opening…' : 'Open analytics'}</button>
    </form>}
    {error && <p role="alert">{error}</p>}
    {data && <>
      <div className="analyticsActions"><button onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        <button onClick={() => { setKey(''); setData(null); setError(''); }}>Lock analytics</button></div>
      <div className="analyticsStats">
        {[[data.views, 'Total page views'], [data.today, 'Views today'], [data.week, 'Views • last 7 days'], [data.month, 'Views • last 30 days'], [data.visitors, 'Est. visitors • 30 days'], [data.visits, 'Visits • 30 days']].map(([value, label]) =>
          <div key={label}><strong>{format(value)}</strong><span>{label}</span></div>)}
      </div>
      {!data.started && <p>No visits recorded yet. Counts will appear after people use the site with tracking enabled.</p>}
      <h3>Daily page views</h3>
      <div className="analyticsChart" role="img" aria-label={`Daily page views for the last 30 calendar days. ${data.daily.map(day => `${day.date}: ${day.views}`).join('; ')}`}>
        {data.daily.map(day => <div className="analyticsColumn" key={day.date} title={`${day.date}: ${format(day.views)} views`}>
          <div style={{ height: `${day.views / max * 100}%`, minHeight: day.views ? '2px' : 0 }} />
        </div>)}
      </div>
      <div className="analyticsChartDates"><span>{data.daily[0]?.date}</span><span>{data.daily.at(-1)?.date}</span></div>
      <details><summary>View daily counts</summary><div className="analyticsDaily">{data.daily.map(day => <div className="historyRow" key={day.date}><span>{day.date}</span><strong>{format(day.views)}</strong></div>)}</div></details>
      <h3>Popular pages <small>Last 30 days</small></h3>
      {data.pages.length ? data.pages.map(row => <div className="historyRow" key={row.page}><span>{names[row.page]}</span><strong>{format(row.views)} views</strong></div>) : <p className="muted">No page activity yet.</p>}
      <h3>Devices <small>Share of views • last 30 days</small></h3>
      {data.devices.map(row => <div className="historyRow" key={row.device}><span className="analyticsDevice">{row.device}</span><strong>{format(row.views)} · {Math.round(row.views / data.month * 100)}%</strong></div>)}
      <p className="muted analyticsNote">A view is a page load or tab change, including commissioner visits. Visitors are estimated by browser, not by owner. A visit ends after 30 minutes of inactivity or when its browser tab closes. Privacy settings and blockers can reduce counts.</p>
      <p className="muted analyticsNote">Dates use Pacific time. {data.started ? `First recorded view: ${timestamp(data.started)}. ` : ''}Updated: {timestamp(data.updatedAt)}.</p>
    </>}
  </section>;
}
