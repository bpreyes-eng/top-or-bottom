'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';

const tabs = [

  ['home', '⌂', 'Home'],

  ['standings', '▤', 'Standings'],

  ['schedule', '▦', 'Schedule'],

  ['team', '★', 'My Team'],

  ['moves', '⇄', 'Moves'],

  ['commish', '⚙', 'Commish'],

];

const fullNames = {

  ARI: 'Arizona Cardinals',

  ATL: 'Atlanta Falcons',

  BAL: 'Baltimore Ravens',

  BUF: 'Buffalo Bills',

  CAR: 'Carolina Panthers',

  CHI: 'Chicago Bears',

  CIN: 'Cincinnati Bengals',

  CLE: 'Cleveland Browns',

  DAL: 'Dallas Cowboys',

  DEN: 'Denver Broncos',

  DET: 'Detroit Lions',

  GB: 'Green Bay Packers',

  HOU: 'Houston Texans',

  IND: 'Indianapolis Colts',

  JAX: 'Jacksonville Jaguars',

  KC: 'Kansas City Chiefs',

  LAC: 'Los Angeles Chargers',

  LAR: 'Los Angeles Rams',

  LV: 'Las Vegas Raiders',

  MIA: 'Miami Dolphins',

  MIN: 'Minnesota Vikings',

  NE: 'New England Patriots',

  NO: 'New Orleans Saints',

  NYG: 'New York Giants',

  NYJ: 'New York Jets',

  PHI: 'Philadelphia Eagles',

  PIT: 'Pittsburgh Steelers',

  SEA: 'Seattle Seahawks',

  SF: 'San Francisco 49ers',

  TB: 'Tampa Bay Buccaneers',

  TEN: 'Tennessee Titans',

  WAS: 'Washington Commanders',

};

const logoCode = team =>

  ({ WAS: 'wsh' }[team] || String(team || '').toLowerCase());

const logoUrl = team =>

  `https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/${logoCode(team)}.png`;

const normalizeTeam = value =>

  ({ JAC: 'JAX', WSH: 'WAS', LA: 'LAR' }[value] || value);

const fmtDate = value =>

  value

    ? new Date(value).toLocaleString([], {

        month: 'short',

        day: 'numeric',

        hour: 'numeric',

        minute: '2-digit',

      })

    : '';

const statusClass = value =>

  String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

const sortOwners = owners =>

  [...owners].sort(

    (a, b) =>

      (b.points || 0) - (a.points || 0) ||

      (b.pointDifferential || 0) - (a.pointDifferential || 0) ||

      a.draftSlot - b.draftSlot

  );

export default function LeagueApp({ league }) {

  const [tab, setTab] = useState('home');

  const [selectedOwner, setSelectedOwner] = useState(3);

  const owner = useMemo(

    () =>

      league.owners.find(o => o.id === selectedOwner) ||

      league.owners[0],

    [league.owners, selectedOwner]

  );

  return (

    <main className="appShell">

      <div className="content">

        <header className="hero">

          <div className="stadiumLights leftLights" />

          <div className="stadiumLights rightLights" />

          <div className="brandLockup">

            <span className="upArrow">↑</span>

            <div>

              <div className="brandTop">TOP <em>OR</em></div>

              <div className="brandBottom">BOTTOM</div>

            </div>

            <span className="downArrow">↓</span>

          </div>

          <div className="eyebrow">PICK YOUR POSITION</div>

          <div className="season">2026 NFL REGULAR SEASON</div>

        </header>

        {tab === 'home' && <Home league={league} setTab={setTab} />}

        {tab === 'standings' && <Standings league={league} />}

        {tab === 'schedule' && <Schedule league={league} />}

        {tab === 'team' && (

          <MyTeam

            league={league}

            owner={owner}

            selectedOwner={selectedOwner}

            setSelectedOwner={setSelectedOwner}

          />

        )}

        {tab === 'moves' && <Moves league={league} owner={owner} />}

        {tab === 'commish' && <Commish league={league} />}

      </div>

      <nav className="bottomNav" aria-label="League navigation">

        {tabs.map(([key, icon, label]) => (

          <button

            key={key}

            className={tab === key ? 'active' : ''}

            onClick={() => {

              setTab(key);

              window.scrollTo({ top: 0, behavior: 'smooth' });

            }}

          >

            <span className="navIcon">{icon}</span>

            <span>{label}</span>

          </button>

        ))}

      </nav>

    </main>

  );

}

function Home({ league, setTab }) {

  const pending =

    league.addDropRequests.filter(x => x.status === 'pending').length +

    league.trades.filter(x => x.status === 'pending').length;

  const sorted = sortOwners(league.owners);

  return (

    <>

      <section className="card leagueSummary">

        <SummaryStat

          icon="🏆"

          label="CURRENT POT"

          value={`$${league.pot.toFixed(0)}`}

          detail="$20 × 10"

        />

        <SummaryStat icon="●●●" label="LEAGUE SIZE" value="10" detail="OWNERS" />

        <SummaryStat icon="▦" label="SCORING" value="1 PT" detail="WIN • 0.5 TIE" />

      </section>

      <section className="card announcement">

        <div className="sectionTitle">LEAGUE ANNOUNCEMENT</div>

        <p>{league.announcement}</p>

      </section>

      {pending > 0 && (

        <section className="card alertCard">

          <strong>{pending} pending league move{pending === 1 ? '' : 's'}</strong>

          <button className="textButton" onClick={() => setTab('commish')}>

            Review ›

          </button>

        </section>

      )}

      <section className="card standingsCard">

        <div className="cardHeader">

          <div className="sectionTitle">LEAGUE STANDINGS</div>

          <button className="textButton" onClick={() => setTab('standings')}>

            View all ›

          </button>

        </div>

        <div className="standingsHeader">

          <span>RK</span><span>TEAM / OWNER</span><span>PTS</span>

        </div>

        <div className="miniRows">

          {sorted.slice(0, 5).map((o, i) => (

            <OwnerRow

              key={o.id}

              league={league}

              owner={o}

              rank={i + 1}

              detailed

              leader={i === 0}

            />

          ))}

        </div>

      </section>

      <section className="card scoringCard">

        <div className="sectionTitle">HOW SCORING WORKS</div>

        <div className="scoreRules">

          <div><b>↑ 1 POINT</b><span>PER NFL WIN</span></div>

          <div><b>= 0.5 POINT</b><span>PER NFL TIE</span></div>

        </div>

        <div className="payouts">

          <div className="topPayout">

            🏆 <strong>TOP SCORE</strong><b>50%</b><span>OF THE POT</span>

          </div>

          <div className="bottomPayout">

            🔥 <strong>LOWEST SCORE</strong><b>50%</b><span>OF THE POT</span>

          </div>

        </div>

      </section>

    </>

  );

}

function SummaryStat({ icon, label, value, detail }) {

  return (

    <div className="summaryStat">

      <span className="summaryIcon">{icon}</span>

      <div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div>

    </div>

  );

}

function Standings({ league }) {

  const sorted = sortOwners(league.owners);

  return (

    <section className="card flush standingsCard">

      <div className="pageTitle">Standings</div>

      <div className="goldRule" />

      <div className="subtleNote">

        Week {league.currentWeek} • Refresh the page to check for updated results.

      </div>

      <div className="standingsHeader">

        <span>RK</span><span>TEAM / OWNER</span><span>PTS</span>

      </div>

      {sorted.map((o, i) => (

        <OwnerRow

          key={o.id}

          league={league}

          owner={o}

          rank={i + 1}

          detailed

          leader={i === 0}

          bottom={i === sorted.length - 1}

        />

      ))}

    </section>

  );

}

function OwnerRow({

  league, owner, rank, detailed = false, leader = false, bottom = false,

}) {

  const pd = Number(owner.pointDifferential || 0);

  return (

    <div className={`ownerRow ${leader ? 'leaderRow' : ''} ${bottom ? 'bottomRow' : ''}`}>

      <div className="rank">{leader ? '♛' : rank}</div>

      <div className="ownerInfo">

        <strong>{owner.teamName}</strong>

        <small>

          {owner.ownerName}

          {owner.commissioner ? ' • Commissioner' : ''}

          {detailed ? ` • PD ${pd > 0 ? '+' : ''}${pd}` : ''}

        </small>

        <div className="teamChips">

          {owner.teams.map(team => (

            <TeamBadge key={team} team={team} status={league.teamStatus?.[team]} />

          ))}

        </div>

      </div>

      {detailed && <div className="points">{Number(owner.points || 0).toFixed(1)}</div>}

    </div>

  );

}

function TeamBadge({ team, status, large = false }) {

  return (

    <span

      className={`teamBadge ${large ? 'largeBadge' : ''} ${status || ''}`}

      title={`${fullNames[team] || team}${status ? ` • ${status}` : ''}`}

    >

      <Image src={logoUrl(team)} alt="" width={40} height={40} />

      <b>{team}</b>

      {status && <i />}

    </span>

  );

}

function Schedule({ league }) {

  const [games, setGames] = useState(

    (league.games || []).filter(game => game.week === league.currentWeek)

  );

  const [week, setWeek] = useState(league.currentWeek || 1);

  const [loading, setLoading] = useState(false);

  useEffect(() => {

    let cancelled = false;

    const initial = (league.games || []).filter(game => game.week === week);

    if (initial.length) {

      setGames(initial);

      setLoading(false);

      return;

    }

    setLoading(true);

    fetch(

      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${week}`

    )

      .then(response => {

        if (!response.ok) throw new Error('Schedule unavailable');

        return response.json();

      })

      .then(payload => {

        if (cancelled) return;

        setGames((payload.events || []).map(event => {

          const competition = event.competitions?.[0];

          const teams = competition?.competitors || [];

          const home = teams.find(team => team.homeAway === 'home');

          const away = teams.find(team => team.homeAway === 'away');

          return {

            id: event.id,

            date: event.date,

            completed: Boolean(competition?.status?.type?.completed),

            status: competition?.status?.type?.shortDetail || '',

            home: normalizeTeam(home?.team?.abbreviation),

            away: normalizeTeam(away?.team?.abbreviation),

            homeScore: Number(home?.score || 0),

            awayScore: Number(away?.score || 0),

          };

        }));

      })

      .catch(() => {

        if (!cancelled) setGames([]);

      })

      .finally(() => {

        if (!cancelled) setLoading(false);

      });

    return () => { cancelled = true; };

  }, [week, league.games]);

  return (

    <>

      <section className="card scheduleHead">

        <div className="pageTitle">NFL Schedule</div>

        <div className="subtleNote">

          Refresh the page to check for updated scores and game status.

        </div>

        <div className="weekScroller">

          {Array.from({ length: 18 }, (_, i) => (

            <button

              key={i + 1}

              className={week === i + 1 ? 'selected' : ''}

              onClick={() => setWeek(i + 1)}

            >

              W{i + 1}

            </button>

          ))}

        </div>

      </section>

      <section className="card gameList">

        {loading ? (

          <div className="emptyState">Loading Week {week}…</div>

        ) : games.length ? (

          [...games]

            .sort((a, b) => new Date(a.date) - new Date(b.date))

            .map(game => <GameRow key={game.id} game={game} />)

        ) : (

          <Empty text="Schedule unavailable for this week. Try refreshing." />

        )}

      </section>

    </>

  );

}

function GameRow({ game }) {

  return (

    <div className="gameRow">

      <div className="gameMeta">

        <span>{fmtDate(game.date)}</span>

        <b className={game.completed ? 'final' : 'upcoming'}>

          {game.completed ? 'FINAL' : game.status}

        </b>

      </div>

      <GameTeam

        team={game.away}

        score={game.awayScore}

        winner={game.completed && game.awayScore > game.homeScore}

      />

      <GameTeam

        team={game.home}

        score={game.homeScore}

        winner={game.completed && game.homeScore > game.awayScore}

      />

    </div>

  );

}

function GameTeam({ team, score, winner }) {

  return (

    <div className={`gameTeam ${winner ? 'winner' : ''}`}>

      <Image src={logoUrl(team)} alt="" width={40} height={40} />

      <span>{fullNames[team] || team}</span>

      <strong>{score}</strong>

    </div>

  );

}

function MyTeam({ league, owner, selectedOwner, setSelectedOwner }) {

  return (

    <>

      <section className="card">

        <div className="sectionTitle">MY TEAM</div>

        <label className="fieldLabel">Owner preview</label>

        <select

          className="select"

          value={selectedOwner}

          onChange={e => setSelectedOwner(Number(e.target.value))}

        >

          {league.owners.map(o => (

            <option key={o.id} value={o.id}>{o.ownerName} — {o.teamName}</option>

          ))}

        </select>

        <div className="subtleNote">Choose an owner to preview the roster.</div>

      </section>

      <section className="card profileCard">

        <div className="avatar">{owner.ownerName.slice(0, 1)}</div>

        <div>

          <div className="profileName">{owner.teamName}</div>

          <div className="muted">

            {owner.ownerName}{owner.commissioner ? ' • Commissioner' : ''}

          </div>

          <div className="ownerTotal">{Number(owner.points || 0).toFixed(1)} points</div>

        </div>

      </section>

      <section className="card">

        <div className="sectionTitle">NFL TEAMS</div>

        {owner.teams.map(team => (

          <div className="nflTeam" key={team}>

            <TeamBadge team={team} status={league.teamStatus?.[team]} large />

            <div>

              <strong>{fullNames[team]}</strong>

              <small>Season points: {Number(league.teamPoints?.[team] || 0).toFixed(1)}</small>

            </div>

          </div>

        ))}

      </section>

    </>

  );

}

function Moves({ league, owner }) {

  const [moveTab, setMoveTab] = useState('adddrop');

  const ownerMoves = league.addDropRequests.filter(x => x.ownerId === owner.id);

  const ownerTrades = league.trades.filter(

    x => x.proposerOwnerId === owner.id || x.recipientOwnerId === owner.id

  );

  return (

    <>

      <section className="card">

        <div className="pageTitle">Moves</div>

        <div className="moveTabs">

          <button

            className={moveTab === 'adddrop' ? 'selected' : ''}

            onClick={() => setMoveTab('adddrop')}

          >Add / Drop</button>

          <button

            className={moveTab === 'trades' ? 'selected' : ''}

            onClick={() => setMoveTab('trades')}

          >Trades</button>

        </div>

      </section>

      {moveTab === 'adddrop' ? (

        <>

          <section className="card">

            <div className="sectionTitle">ADD / DROP</div>

            <p className="muted bodyText">

              $10 per completed move. First submitted gets priority.

              New team earns points only from the effective time forward.

            </p>

            <label className="fieldLabel">Drop from {owner.teamName}</label>

            <select className="select">

              <option>Select team to drop</option>

              {owner.teams.map(t => <option key={t}>{fullNames[t]}</option>)}

            </select>

            <label className="fieldLabel">Add free agent</label>

            <select className="select">

              <option>Select free agent</option>

              {league.freeAgents.map(t => <option key={t}>{fullNames[t]}</option>)}

            </select>

            <button className="primaryButton" disabled>

              Owner login required to submit

            </button>

          </section>

          <section className="card">

            <div className="sectionTitle">MY ADD / DROP HISTORY</div>

            {ownerMoves.length

              ? ownerMoves.map(m => <MoveRow key={m.id} move={m} />)

              : <Empty text="No add/drop requests yet." />}

          </section>

          <section className="card">

            <div className="sectionTitle">FREE AGENTS</div>

            {league.freeAgents.map(t => (

              <div className="nflTeam" key={t}>

                <TeamBadge team={t} large />

                <div><strong>{fullNames[t]}</strong><small>Available</small></div>

              </div>

            ))}

          </section>

        </>

      ) : (

        <>

          <section className="card">

            <div className="sectionTitle">TRADES</div>

            <p className="muted bodyText">

              Trades are free. No 2-for-1 trades. Prior wins never transfer.

            </p>

            <button className="primaryButton" disabled>

              Owner login required to propose trade

            </button>

          </section>

          <section className="card">

            <div className="sectionTitle">MY TRADE HISTORY</div>

            {ownerTrades.length

              ? ownerTrades.map(t => <TradeRow key={t.id} trade={t} />)

              : <Empty text="No trade proposals yet." />}

          </section>

        </>

      )}

    </>

  );

}

function MoveRow({ move }) {

  return (

    <div className="historyRow">

      <div>

        <strong>{move.dropTeam} → {move.addTeam}</strong>

        <small>{fmtDate(move.submittedAt)} • ${Number(move.fee || 0).toFixed(0)}</small>

      </div>

      <Status value={move.status} />

    </div>

  );

}

function TradeRow({ trade }) {

  return (

    <div className="historyRow">

      <div>

        <strong>{trade.proposerTeam} ⇄ {trade.recipientTeam}</strong>

        <small>

          {(trade.items || []).map(i => i.team).join(' / ') || 'Teams pending'}

          {' • '}{fmtDate(trade.submittedAt)}

        </small>

      </div>

      <Status value={trade.status} />

    </div>

  );

}

function Status({ value }) {

  return <span className={`status ${statusClass(value)}`}>{value || 'unknown'}</span>;

}

function Empty({ text }) {

  return <div className="emptyState">{text}</div>;

}

function Commish({ league }) {

  const pendingAdds = league.addDropRequests.filter(x => x.status === 'pending');

  const pendingTrades = league.trades.filter(x => x.status === 'pending');

  return (

    <>

      <section className="card">

        <div className="pageTitle">Commissioner</div>

        <p className="muted bodyText">League oversight, moves and accounting.</p>

      </section>

      <div className="statGrid">

        <div className="card stat">

          <small>POT</small><strong>${league.pot.toFixed(0)}</strong>

        </div>

        <div className="card stat">

          <small>OWNERS</small><strong>{league.owners.length}</strong>

        </div>

        <div className="card stat">

          <small>PENDING</small><strong>{pendingAdds.length + pendingTrades.length}</strong>

        </div>

        <div className="card stat">

          <small>FREE AGENTS</small><strong>{league.freeAgents.length}</strong>

        </div>

      </div>

      <section className="card">

        <div className="sectionTitle">PENDING ADD / DROPS</div>

        {pendingAdds.length

          ? pendingAdds.map(m => <MoveRow key={m.id} move={m} />)

          : <Empty text="Nothing waiting." />}

      </section>

      <section className="card">

        <div className="sectionTitle">PENDING TRADES</div>

        {pendingTrades.length

          ? pendingTrades.map(t => <TradeRow key={t.id} trade={t} />)

          : <Empty text="Nothing waiting." />}

      </section>

      <section className="card">

        <div className="sectionTitle">ACCOUNTING</div>

        {league.accounting.length ? league.accounting.slice(0, 10).map(a => (

          <div className="historyRow" key={a.id}>

            <div>

              <strong>{a.teamName || a.ownerName || 'League'} • {a.type}</strong>

              <small>{fmtDate(a.createdAt)}</small>

            </div>

            <div className="money">${Number(a.amount || 0).toFixed(0)}</div>

          </div>

        )) : <Empty text="No accounting activity yet." />}

      </section>

      <section className="card">

        <div className="sectionTitle">DATA STATUS</div>

        <div className="statusDot">

          <i className={league.connected ? 'green' : 'amber'} />

          {league.connected ? 'League database connected' : 'Using saved league roster'}

        </div>

        <div className="subtleNote scoreStatus">

          Refresh the page to request updated NFL results.

        </div>

      </section>

    </>

  );

}