import { neon } from '@neondatabase/serverless';
import {
  fallbackOwners,
  fallbackFreeAgents,
  fallbackAnnouncement,
} from './fallback';

function fallback() {
  return {
    owners: fallbackOwners,
    freeAgents: fallbackFreeAgents,
    announcement: fallbackAnnouncement,
    pot: 200,
    connected: false,
    addDropRequests: [],
    trades: [],
    accounting: [],
    auditLog: [],
  };
}

const normalizeTeam = value =>
  ({ JAC: 'JAX', LA: 'LAR', WSH: 'WAS' }[value] || value);

function historicalOwners(league, games) {
  const totals = new Map(
    league.owners.map(o => [
      o.id,
      { points: 0, pointDifferential: 0 },
    ])
  );

  const moves = [
    ...league.addDropRequests
      .filter(m => m.status === 'completed')
      .map(m => ({ ...m, kind: 'adddrop' })),
    ...league.trades
      .filter(m => m.status === 'completed')
      .map(m => ({ ...m, kind: 'trade' })),
  ]
    .map(m => {
      const time = new Date(m.completedAt).getTime();
      if (!m.completedAt || !Number.isFinite(time)) {
        throw new Error('Completed move has no effective timestamp');
      }
      return { ...m, time };
    })
    .sort((a, b) => b.time - a.time);

  for (const game of games.filter(g => g.completed)) {
    const kickoff = new Date(game.date).getTime();
    if (!Number.isFinite(kickoff)) {
      throw new Error('Game has no kickoff timestamp');
    }

    const held = new Map();
    for (const owner of league.owners) {
      for (const team of owner.teams) {
        held.set(team, owner.id);
      }
    }

    for (const move of moves) {
      if (move.time <= kickoff) continue;

      if (move.kind === 'adddrop') {
        if (held.get(move.addTeam) !== move.ownerId) {
          throw new Error('Add/drop history does not match roster');
        }
        held.delete(move.addTeam);
        held.set(move.dropTeam, move.ownerId);
      } else {
        if (move.items.length !== 2) {
          throw new Error('Trade history must contain both teams');
        }
        for (const item of move.items) {
          const from = Number(item.fromOwnerId);
          const to =
            from === move.proposerOwnerId
              ? move.recipientOwnerId
              : move.proposerOwnerId;

          if (
            ![move.proposerOwnerId, move.recipientOwnerId].includes(from) ||
            held.get(item.team) !== to
          ) {
            throw new Error('Trade history does not match roster');
          }
        }
        for (const item of move.items) {
          held.set(item.team, Number(item.fromOwnerId));
        }
      }
    }

    const results = [
      [game.home, game.homeScore, game.awayScore],
      [game.away, game.awayScore, game.homeScore],
    ];

    for (const [team, scored, conceded] of results) {
      const total = totals.get(held.get(team));
      if (!total) continue;
      total.points += scored === conceded ? 0.5 : scored > conceded ? 1 : 0;
      total.pointDifferential += scored - conceded;
    }
  }

  return league.owners.map(owner => ({
    ...owner,
    ...totals.get(owner.id),
  }));
}

function currentRegularSeasonWeek() {
  const weekTwoStart = Date.parse('2026-09-16T07:00:00Z');
  if (Date.now() < weekTwoStart) return 1;
  const week =
    Math.floor(
      (Date.now() - weekTwoStart) / (7 * 24 * 60 * 60 * 1000)
    ) + 2;
  return Math.min(18, week);
}

async function addLiveScoring(league) {
  const currentWeek = currentRegularSeasonWeek();

  try {
    const weeks = await Promise.all(
      Array.from({ length: currentWeek }, async (_, index) => {
        const week = index + 1;
        const response = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${week}`,
          { next: { revalidate: 300 } }
        );

        if (!response.ok) {
          throw new Error(`NFL scoreboard returned ${response.status}`);
        }

        const payload = await response.json();
        if (!Array.isArray(payload.events) || !payload.events.length) {
          throw new Error('NFL scoreboard is incomplete');
        }

        return payload.events.map(event => {
          const competition = event.competitions?.[0];
          const competitors = competition?.competitors || [];
          const home = competitors.find(team => team.homeAway === 'home');
          const away = competitors.find(team => team.homeAway === 'away');

          return {
            id: event.id,
            week,
            date: event.date,
            completed: Boolean(competition?.status?.type?.completed),
            status: competition?.status?.type?.shortDetail || '',
            home: normalizeTeam(home?.team?.abbreviation),
            away: normalizeTeam(away?.team?.abbreviation),
            homeScore: Number(home?.score || 0),
            awayScore: Number(away?.score || 0),
          };
        });
      })
    );

    const games = weeks.flat();
    const teamPoints = {};
    const teamDifferential = {};
    const teamStatus = {};

    for (const game of games) {
      if (!game.home || !game.away) continue;

      if (!game.completed) {
        teamStatus[game.home] = 'pending';
        teamStatus[game.away] = 'pending';
        continue;
      }

      teamDifferential[game.home] =
        (teamDifferential[game.home] || 0) +
        game.homeScore - game.awayScore;

      teamDifferential[game.away] =
        (teamDifferential[game.away] || 0) +
        game.awayScore - game.homeScore;

      if (game.homeScore === game.awayScore) {
        teamPoints[game.home] = (teamPoints[game.home] || 0) + 0.5;
        teamPoints[game.away] = (teamPoints[game.away] || 0) + 0.5;
        teamStatus[game.home] = 'tie';
        teamStatus[game.away] = 'tie';
      } else {
        const winner =
          game.homeScore > game.awayScore ? game.home : game.away;
        const loser = winner === game.home ? game.away : game.home;

        teamPoints[winner] = (teamPoints[winner] || 0) + 1;
        teamPoints[loser] = teamPoints[loser] || 0;
        teamStatus[winner] = 'win';
        teamStatus[loser] = 'loss';
      }
    }

    return {
      ...league,
      currentWeek,
      games,
      teamPoints,
      teamDifferential,
      teamStatus,
      scoresUpdatedAt: new Date().toISOString(),
      owners: historicalOwners(league, games),
    };
  } catch (error) {
    console.error('NFL score read failed:', error);
    throw new Error(
      'Standings could not be verified. Please refresh shortly.'
    );
  }
}

export async function getLeagueData() {
  if (!process.env.DATABASE_URL) {
    return addLiveScoring(fallback());
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const [
      rosterRows,
      freeRows,
      announcementRows,
      accountingTotalRows,
      addDropRows,
      tradeRows,
      accountingRows,
      auditRows,
    ] = await Promise.all([
      sql`
        SELECT o.id, o.draft_slot, o.owner_name,
               o.team_name, o.is_commissioner, t.abbreviation
        FROM owners o
        LEFT JOIN current_rosters cr ON cr.owner_id = o.id
        LEFT JOIN nfl_teams t ON t.id = cr.nfl_team_id
        ORDER BY o.draft_slot, t.abbreviation
      `,
      sql`
        SELECT abbreviation FROM free_agents ORDER BY abbreviation
      `,
      sql`
        SELECT message FROM announcements
        WHERE active = true
        ORDER BY created_at DESC
        LIMIT 1
      `,
      sql`
        SELECT COALESCE(SUM(amount_cents),0)::int AS total_cents
        FROM accounting_transactions WHERE status = 'paid'
      `,
      sql`
        SELECT adr.id, adr.owner_id, o.owner_name, o.team_name,
               dt.abbreviation AS drop_team,
               at.abbreviation AS add_team,
               adr.status, adr.fee_cents,
               adr.submitted_at, adr.completed_at
        FROM add_drop_requests adr
        JOIN owners o ON o.id = adr.owner_id
        JOIN nfl_teams dt ON dt.id = adr.drop_team_id
        JOIN nfl_teams at ON at.id = adr.add_team_id
        ORDER BY adr.submitted_at DESC
      `,
      sql`
        SELECT tt.id, tt.proposer_owner_id,
               po.owner_name AS proposer_name,
               po.team_name AS proposer_team,
               tt.recipient_owner_id,
               ro.owner_name AS recipient_name,
               ro.team_name AS recipient_team,
               tt.status, tt.submitted_at,
               tt.expires_at, tt.completed_at,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'fromOwnerId', ti.from_owner_id,
                     'team', nt.abbreviation
                   )
                 ) FILTER (WHERE ti.id IS NOT NULL),
                 '[]'::json
               ) AS items
        FROM trade_threads tt
        JOIN owners po ON po.id = tt.proposer_owner_id
        JOIN owners ro ON ro.id = tt.recipient_owner_id
        LEFT JOIN trade_items ti ON ti.trade_id = tt.id
        LEFT JOIN nfl_teams nt ON nt.id = ti.nfl_team_id
        GROUP BY tt.id, po.owner_name, po.team_name,
                 ro.owner_name, ro.team_name
        ORDER BY tt.submitted_at DESC
      `,
      sql`
        SELECT ac.id, ac.owner_id, o.owner_name,
               o.team_name, ac.transaction_type,
               ac.amount_cents, ac.status, ac.created_at
        FROM accounting_transactions ac
        LEFT JOIN owners o ON o.id = ac.owner_id
        ORDER BY ac.created_at DESC
        LIMIT 40
      `,
      sql`
        SELECT al.id, al.actor_owner_id, o.owner_name,
               al.action, al.details, al.created_at
        FROM audit_log al
        LEFT JOIN owners o ON o.id = al.actor_owner_id
        ORDER BY al.created_at DESC
        LIMIT 30
      `,
    ]);

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
          points: 0,
        });
      }
      if (r.abbreviation) {
        grouped.get(Number(r.id)).teams.push(r.abbreviation);
      }
    }

    return addLiveScoring({
      owners: [...grouped.values()],
      freeAgents: freeRows.map(r => r.abbreviation),
      announcement:
        announcementRows[0]?.message || fallbackAnnouncement,
      pot:
        Number(accountingTotalRows[0]?.total_cents || 20000) / 100,
      connected: true,

      addDropRequests: addDropRows.map(r => ({
        id: Number(r.id),
        ownerId: Number(r.owner_id),
        ownerName: r.owner_name,
        teamName: r.team_name,
        dropTeam: r.drop_team,
        addTeam: r.add_team,
        status: r.status,
        fee: Number(r.fee_cents || 0) / 100,
        submittedAt: r.submitted_at,
        completedAt: r.completed_at,
      })),

      trades: tradeRows.map(r => ({
        id: Number(r.id),
        proposerOwnerId: Number(r.proposer_owner_id),
        proposerName: r.proposer_name,
        proposerTeam: r.proposer_team,
        recipientOwnerId: Number(r.recipient_owner_id),
        recipientName: r.recipient_name,
        recipientTeam: r.recipient_team,
        status: r.status,
        submittedAt: r.submitted_at,
        expiresAt: r.expires_at,
        completedAt: r.completed_at,
        items: Array.isArray(r.items) ? r.items : [],
      })),

      accounting: accountingRows.map(r => ({
        id: Number(r.id),
        ownerId: r.owner_id == null ? null : Number(r.owner_id),
        ownerName: r.owner_name,
        teamName: r.team_name,
        type: r.transaction_type,
        amount: Number(r.amount_cents || 0) / 100,
        status: r.status,
        createdAt: r.created_at,
      })),

      auditLog: auditRows.map(r => ({
        id: Number(r.id),
        actorOwnerId:
          r.actor_owner_id == null ? null : Number(r.actor_owner_id),
        ownerName: r.owner_name,
        action: r.action,
        details: r.details || {},
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('League database read failed:', error);
    return addLiveScoring(fallback());
  }
}