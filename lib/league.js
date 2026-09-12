import { neon } from '@neondatabase/serverless';
import { fallbackOwners, fallbackFreeAgents, fallbackAnnouncement } from './fallback';

function fallback() {
  return {
    owners: fallbackOwners,
    freeAgents: fallbackFreeAgents,
    announcement: fallbackAnnouncement,
    pot: 200,
    connected: false,
  };
}

export async function getLeagueData() {
  if (!process.env.DATABASE_URL) return fallback();
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rosterRows = await sql`
      SELECT o.id, o.draft_slot, o.owner_name, o.team_name, o.is_commissioner,
             t.abbreviation
      FROM owners o
      LEFT JOIN current_rosters cr ON cr.owner_id = o.id
      LEFT JOIN nfl_teams t ON t.id = cr.nfl_team_id
      ORDER BY o.draft_slot, t.abbreviation
    `;
    const freeRows = await sql`SELECT abbreviation FROM free_agents ORDER BY abbreviation`;
    const announcementRows = await sql`
      SELECT message FROM announcements WHERE active = true ORDER BY created_at DESC LIMIT 1
    `;
    const accountingRows = await sql`
      SELECT COALESCE(SUM(amount_cents),0)::int AS total_cents
      FROM accounting_transactions WHERE status = 'paid'
    `;

    const grouped = new Map();
    for (const r of rosterRows) {
      if (!grouped.has(Number(r.id))) {
        grouped.set(Number(r.id), {
          id: Number(r.id),
          draftSlot: Number(r.draft_slot),
          ownerName: r.owner_name,
          teamName: r.team_name,
          commissioner: Boolean(r.is_commissioner),
          teams: [],
        });
      }
      if (r.abbreviation) grouped.get(Number(r.id)).teams.push(r.abbreviation);
    }

    return {
      owners: [...grouped.values()],
      freeAgents: freeRows.map(r => r.abbreviation),
      announcement: announcementRows[0]?.message || fallbackAnnouncement,
      pot: Number(accountingRows[0]?.total_cents || 20000) / 100,
      connected: true,
    };
  } catch (error) {
    console.error('League database read failed:', error);
    return fallback();
  }
}
