'use client';

import { useMemo, useState } from 'react';

const tabs = [
  ['home','⌂','Home'],
  ['standings','▤','Standings'],
  ['team','★','My Team'],
  ['moves','⇄','Moves'],
  ['commish','⚙','Commish'],
];

const fullNames = {
  ARI:'Arizona Cardinals', ATL:'Atlanta Falcons', BAL:'Baltimore Ravens', BUF:'Buffalo Bills', CAR:'Carolina Panthers',
  CHI:'Chicago Bears', CIN:'Cincinnati Bengals', CLE:'Cleveland Browns', DAL:'Dallas Cowboys', DEN:'Denver Broncos',
  DET:'Detroit Lions', GB:'Green Bay Packers', HOU:'Houston Texans', IND:'Indianapolis Colts', JAX:'Jacksonville Jaguars',
  KC:'Kansas City Chiefs', LAC:'Los Angeles Chargers', LAR:'Los Angeles Rams', LV:'Las Vegas Raiders', MIA:'Miami Dolphins',
  MIN:'Minnesota Vikings', NE:'New England Patriots', NO:'New Orleans Saints', NYG:'New York Giants', NYJ:'New York Jets',
  PHI:'Philadelphia Eagles', PIT:'Pittsburgh Steelers', SEA:'Seattle Seahawks', SF:'San Francisco 49ers', TB:'Tampa Bay Buccaneers',
  TEN:'Tennessee Titans', WAS:'Washington Commanders'
};

export default function LeagueApp({ league }) {
  const [tab, setTab] = useState('home');
  const [selectedOwner, setSelectedOwner] = useState(3);
  const owner = useMemo(() => league.owners.find(o => o.id === selectedOwner) || league.owners[0], [league.owners, selectedOwner]);

  return (
    <main className="appShell">
      <div className="content">
        <header className="hero">
          <div className="eyebrow">PICK YOUR POSITION</div>
          <h1>TOP <span>OR</span> BOTTOM</h1>
          <div className="season">2026 NFL Season</div>
        </header>

        {tab === 'home' && <Home league={league} setTab={setTab} />}
        {tab === 'standings' && <Standings owners={league.owners} />}
        {tab === 'team' && <MyTeam owners={league.owners} owner={owner} selectedOwner={selectedOwner} setSelectedOwner={setSelectedOwner} />}
        {tab === 'moves' && <Moves owner={owner} freeAgents={league.freeAgents} />}
        {tab === 'commish' && <Commish league={league} />}
      </div>
      <nav className="bottomNav">
        {tabs.map(([key,icon,label]) => (
          <button key={key} className={tab===key?'active':''} onClick={() => setTab(key)}>
            <span className="navIcon">{icon}</span><span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

function Home({ league, setTab }) {
  return <>
    <section className="card potCard">
      <div className="muted caps">CURRENT POT</div>
      <div className="pot">${league.pot.toFixed(0)}</div>
      <div className="muted">10 owners • $20 entry</div>
      <div className="potSplit"><span>Top prize ${(league.pot/2).toFixed(0)}</span><span>Bottom prize ${(league.pot/2).toFixed(0)}</span></div>
    </section>

    <section className="card announcement">
      <div className="sectionTitle">LEAGUE ANNOUNCEMENT</div>
      <p>{league.announcement}</p>
    </section>

    <section className="card">
      <div className="cardHeader"><div className="sectionTitle">LEAGUE</div><button className="textButton" onClick={()=>setTab('standings')}>View standings ›</button></div>
      <div className="miniRows">
        {league.owners.slice(0,5).map((o,i) => <OwnerRow key={o.id} owner={o} rank={i+1} />)}
      </div>
    </section>

    <section className="card">
      <div className="sectionTitle">SCORING</div>
      <div className="rule">🏈 <span>NFL win = 1 point</span></div>
      <div className="rule">🤝 <span>NFL tie = 0.5 point</span></div>
      <div className="rule">🏆 <span>Highest score = 50% of pot</span></div>
      <div className="rule">🔥 <span>Lowest score = 50% of pot</span></div>
    </section>
  </>;
}

function Standings({ owners }) {
  return <section className="card flush">
    <div className="pageTitle">Standings</div>
    <div className="subtleNote">Scores are ready for the weekly-results connection. Current roster ownership is live.</div>
    <div className="standingsHeader"><span>RK</span><span>OWNER</span><span>PTS</span></div>
    {owners.map((o,i)=><OwnerRow key={o.id} owner={o} rank={i+1} detailed />)}
  </section>;
}

function OwnerRow({ owner, rank, detailed=false }) {
  return <div className="ownerRow">
    <div className="rank">{rank}</div>
    <div className="ownerInfo"><strong>{owner.teamName}</strong><small>{owner.ownerName}{owner.commissioner?' • Commissioner':''}</small><div className="teamChips">{owner.teams.map(t=><span key={t}>{t}</span>)}</div></div>
    {detailed && <div className="points">0.0</div>}
  </div>;
}

function MyTeam({ owners, owner, selectedOwner, setSelectedOwner }) {
  return <>
    <section className="card">
      <div className="sectionTitle">MY TEAM</div>
      <label className="fieldLabel">Preview owner</label>
      <select className="select" value={selectedOwner} onChange={e=>setSelectedOwner(Number(e.target.value))}>
        {owners.map(o=><option key={o.id} value={o.id}>{o.ownerName} — {o.teamName}</option>)}
      </select>
    </section>
    <section className="card profileCard">
      <div className="avatar">{owner.ownerName.slice(0,1)}</div>
      <div><div className="profileName">{owner.teamName}</div><div className="muted">{owner.ownerName}{owner.commissioner?' • Commissioner':''}</div></div>
    </section>
    <section className="card">
      <div className="sectionTitle">NFL TEAMS</div>
      {owner.teams.map(team=><div className="nflTeam" key={team}><div className="logoBubble">{team}</div><div><strong>{fullNames[team]}</strong><small>2026 points: 0.0</small></div></div>)}
    </section>
  </>;
}

function Moves({ owner, freeAgents }) {
  return <>
    <section className="card">
      <div className="pageTitle">Moves</div>
      <div className="moveTabs"><button className="selected">Add / Drop</button><button>Trades</button></div>
    </section>
    <section className="card">
      <div className="sectionTitle">ADD / DROP</div>
      <p className="muted bodyText">$10 per completed move. New team earns points only from the effective time forward.</p>
      <label className="fieldLabel">Drop from {owner.teamName}</label>
      <select className="select"><option>Select team to drop</option>{owner.teams.map(t=><option key={t}>{fullNames[t]}</option>)}</select>
      <label className="fieldLabel">Add free agent</label>
      <select className="select"><option>Select free agent</option>{freeAgents.map(t=><option key={t}>{fullNames[t]}</option>)}</select>
      <button className="primaryButton" disabled>Submit request — coming next</button>
    </section>
    <section className="card">
      <div className="sectionTitle">FREE AGENTS</div>
      {freeAgents.map(t=><div className="nflTeam" key={t}><div className="logoBubble">{t}</div><div><strong>{fullNames[t]}</strong><small>Available</small></div></div>)}
    </section>
  </>;
}

function Commish({ league }) {
  const paid = league.pot;
  return <>
    <section className="card">
      <div className="pageTitle">Commissioner</div>
      <p className="muted bodyText">Controls stay read-only until owner authentication is connected.</p>
    </section>
    <div className="statGrid"><div className="card stat"><small>POT</small><strong>${paid.toFixed(0)}</strong></div><div className="card stat"><small>OWNERS</small><strong>10</strong></div><div className="card stat"><small>ROSTERED</small><strong>30</strong></div><div className="card stat"><small>FREE AGENTS</small><strong>{league.freeAgents.length}</strong></div></div>
    <section className="card"><div className="sectionTitle">QUICK CONTROLS</div><button className="control">Post announcement <span>›</span></button><button className="control">Review add/drop requests <span>›</span></button><button className="control">Review trades <span>›</span></button><button className="control">Accounting <span>›</span></button></section>
    <section className="card"><div className="sectionTitle">DATA STATUS</div><div className="statusDot"><i className={league.connected?'green':'amber'}></i>{league.connected?'Connected to Neon database':'Using safe fallback data'}</div></section>
  </>;
}
