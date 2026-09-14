'use client';

import { useEffect, useMemo, useState } from 'react';
const tabs = [
  ['home','⌂','Home'], ['standings','▤','Standings'], ['schedule','▦','Schedule'],[ 'team','★','My Team'], ['moves','⇄','Moves'], ['commish','⚙','Commish'],
];
const fullNames = {
  ARI:'Arizona Cardinals', ATL:'Atlanta Falcons', BAL:'Baltimore Ravens', BUF:'Buffalo Bills', CAR:'Carolina Panthers',
  CHI:'Chicago Bears', CIN:'Cincinnati Bengals', CLE:'Cleveland Browns', DAL:'Dallas Cowboys', DEN:'Denver Broncos', DET:'Detroit Lions',
  GB:'Green Bay Packers', HOU:'Houston Texans', IND:'Indianapolis Colts', JAX:'Jacksonville Jaguars', KC:'Kansas City Chiefs',
  LAC:'Los Angeles Chargers', LAR:'Los Angeles Rams', LV:'Las Vegas Raiders', MIA:'Miami Dolphins', MIN:'Minnesota Vikings',
  NE:'New England Patriots', NO:'New Orleans Saints', NYG:'New York Giants', NYJ:'New York Jets', PHI:'Philadelphia Eagles',
  PIT:'Pittsburgh Steelers', SEA:'Seattle Seahawks', SF:'San Francisco 49ers', TB:'Tampa Bay Buccaneers', TEN:'Tennessee Titans', WAS:'Washington Commanders'
};
const fmtDate = v => v ? new Date(v).toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}) : '';
const statusClass = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g,'-');

export default function LeagueApp({ league }) {
  const [tab, setTab] = useState('home');
  const [selectedOwner, setSelectedOwner] = useState(3);
  const owner = useMemo(() => league.owners.find(o => o.id === selectedOwner) || league.owners[0], [league.owners, selectedOwner]);
  return <main className="appShell"><div className="content">
    <header className="hero"><div className="eyebrow">PICK YOUR POSITION</div><h1>TOP <span>OR</span> BOTTOM</h1><div className="season">2026 NFL Season</div></header>
    {tab==='home' && <Home league={league} setTab={setTab}/>} {tab==='standings' && <Standings owners={league.owners}/>} {tab==='schedule' && <Schedule/>} {tab==='team' && <MyTeam owners={league.owners} owner={owner} selectedOwner={selectedOwner} setSelectedOwner={setSelectedOwner}/>} {tab==='moves' && <Moves league={league} owner={owner}/>} {tab==='commish' && <Commish league={league}/>} 
  </div><nav className="bottomNav">{tabs.map(([key,icon,label])=><button key={key} className={tab===key?'active':''} onClick={()=>setTab(key)}><span className="navIcon">{icon}</span><span>{label}</span></button>)}</nav></main>;
}

function Home({league,setTab}) { const pending = league.addDropRequests.filter(x=>x.status==='pending').length + league.trades.filter(x=>x.status==='pending').length; return <>
  <section className="card potCard"><div className="muted caps">CURRENT POT</div><div className="pot">${league.pot.toFixed(0)}</div><div className="muted">10 owners • $20 entry</div><div className="potSplit"><span>Top prize ${(league.pot/2).toFixed(0)}</span><span>Bottom prize ${(league.pot/2).toFixed(0)}</span></div></section>
  <section className="card announcement"><div className="sectionTitle">LEAGUE ANNOUNCEMENT</div><p>{league.announcement}</p></section>
  {pending>0 && <section className="card alertCard"><strong>{pending} pending league move{pending===1?'':'s'}</strong><button className="textButton" onClick={()=>setTab('commish')}>Review ›</button></section>}
  <section className="card"><div className="cardHeader"><div className="sectionTitle">LEAGUE</div><button className="textButton" onClick={()=>setTab('standings')}>View standings ›</button></div><div className="miniRows">{league.owners.slice(0,5).map((o,i)=><OwnerRow key={o.id} owner={o} rank={i+1}/>)}</div></section>
  <section className="card"><div className="sectionTitle">SCORING</div><div className="rule">🏈 <span>NFL win = 1 point</span></div><div className="rule">🤝 <span>NFL tie = 0.5 point</span></div><div className="rule">🏆 <span>Highest score = 50% of pot</span></div><div className="rule">🔥 <span>Lowest score = 50% of pot</span></div></section>
</>; }

function Standings({owners}) { const sorted=[...owners].sort((a,b)=>(b.points||0)-(a.points||0)||a.draftSlot-b.draftSlot); return <section className="card flush"><div className="pageTitle">Standings</div><div className="subtleNote">Roster ownership is live. Weekly NFL result scoring is the next data connection.</div><div className="standingsHeader"><span>RK</span><span>OWNER</span><span>PTS</span></div>{sorted.map((o,i)=><OwnerRow key={o.id} owner={o} rank={i+1} detailed/>)}</section>; }
function OwnerRow({owner,rank,detailed=false}) { return <div className="ownerRow"><div className="rank">{rank}</div><div className="ownerInfo"><strong>{owner.teamName}</strong><small>{owner.ownerName}{owner.commissioner?' • Commissioner':''}</small><div className="teamChips">{owner.teams.map(t=><span key={t}>{t}</span>)}</div></div>{detailed&&<div className="points">{Number(owner.points||0).toFixed(1)}</div>}</div>; }
function Schedule(){
  const [games,setGames]=useState([]);
  const [week,setWeek]=useState(1);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
  setLoading(true);
  fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${week}`)
    .then(r=>r.json())
    .then(d=>setGames(d.events||[]))
    .catch(()=>setGames([]))
    .finally(()=>setLoading(false));
},[week]);

return <section className="card">
  <div className="pageTitle">NFL Schedule</div>

  <div className="moveTabs">
    {Array.from({length:18},(_,i)=>
      <button
        key={i+1}
        className={week===i+1?'active':''}
        onClick={()=>setWeek(i+1)}
      >
        W{i+1}
      </button>
    )}
  </div>

  {loading
    ? <div className="muted">Loading schedule...</div>
    : games.length
      ? games.map(g=>
          <div className="historyRow" key={g.id}>
            <div>{g.name}</div>
            <div className="muted">
              {new Date(g.date).toLocaleString([],{
                weekday:'short',
                month:'short',
                day:'numeric',
                hour:'numeric',
                minute:'2-digit'
              })}
              {' • '}
              {g.status?.type?.shortDetail||''}
            </div>
          </div>
        )
      : <div className="muted">No games found.</div>
  }
</section>;
}
function MyTeam({owners,owner,selectedOwner,setSelectedOwner}) { return <>
  <section className="card"><div className="sectionTitle">MY TEAM</div><label className="fieldLabel">Owner preview</label><select className="select" value={selectedOwner} onChange={e=>setSelectedOwner(Number(e.target.value))}>{owners.map(o=><option key={o.id} value={o.id}>{o.ownerName} — {o.teamName}</option>)}</select><div className="subtleNote">This selector disappears once owner login is connected.</div></section>
  <section className="card profileCard"><div className="avatar">{owner.ownerName.slice(0,1)}</div><div><div className="profileName">{owner.teamName}</div><div className="muted">{owner.ownerName}{owner.commissioner?' • Commissioner':''}</div></div></section>
  <section className="card"><div className="sectionTitle">NFL TEAMS</div>{owner.teams.map(team=><div className="nflTeam" key={team}><div className="logoBubble">{team}</div><div><strong>{fullNames[team]}</strong><small>2026 points: 0.0</small></div></div>)}</section>
</>; }

function Moves({league,owner}) { const [moveTab,setMoveTab]=useState('adddrop'); const ownerMoves=league.addDropRequests.filter(x=>x.ownerId===owner.id); const ownerTrades=league.trades.filter(x=>x.proposerOwnerId===owner.id||x.recipientOwnerId===owner.id); return <>
  <section className="card"><div className="pageTitle">Moves</div><div className="moveTabs"><button className={moveTab==='adddrop'?'selected':''} onClick={()=>setMoveTab('adddrop')}>Add / Drop</button><button className={moveTab==='trades'?'selected':''} onClick={()=>setMoveTab('trades')}>Trades</button></div></section>
  {moveTab==='adddrop'?<><section className="card"><div className="sectionTitle">ADD / DROP</div><p className="muted bodyText">$10 per completed move. First submitted gets priority. New team earns points only from the effective time forward.</p><label className="fieldLabel">Drop from {owner.teamName}</label><select className="select"><option>Select team to drop</option>{owner.teams.map(t=><option key={t}>{fullNames[t]}</option>)}</select><label className="fieldLabel">Add free agent</label><select className="select"><option>Select free agent</option>{league.freeAgents.map(t=><option key={t}>{fullNames[t]}</option>)}</select><button className="primaryButton" disabled>Owner login required to submit</button></section><section className="card"><div className="sectionTitle">MY ADD / DROP HISTORY</div>{ownerMoves.length?ownerMoves.map(m=><MoveRow key={m.id} move={m}/>):<Empty text="No add/drop requests yet."/>}</section><section className="card"><div className="sectionTitle">FREE AGENTS</div>{league.freeAgents.map(t=><div className="nflTeam" key={t}><div className="logoBubble">{t}</div><div><strong>{fullNames[t]}</strong><small>Available</small></div></div>)}</section></>:<><section className="card"><div className="sectionTitle">TRADES</div><p className="muted bodyText">Trades are free. No 2-for-1 trades. Prior wins never transfer.</p><button className="primaryButton" disabled>Owner login required to propose trade</button></section><section className="card"><div className="sectionTitle">MY TRADE HISTORY</div>{ownerTrades.length?ownerTrades.map(t=><TradeRow key={t.id} trade={t}/>):<Empty text="No trade proposals yet."/>}</section></>}
</>; }

function MoveRow({move}) { return <div className="historyRow"><div><strong>{move.dropTeam} → {move.addTeam}</strong><small>{fmtDate(move.submittedAt)} • ${move.fee.toFixed(0)}</small></div><Status value={move.status}/></div>; }
function TradeRow({trade}) { return <div className="historyRow"><div><strong>{trade.proposerTeam} ⇄ {trade.recipientTeam}</strong><small>{trade.items.map(i=>i.team).join(' / ')||'Teams pending'} • {fmtDate(trade.submittedAt)}</small></div><Status value={trade.status}/></div>; }
function Status({value}) { return <span className={`status ${statusClass(value)}`}>{value||'unknown'}</span>; }
function Empty({text}) { return <div className="emptyState">{text}</div>; }

function Commish({league}) { const pendingAdds=league.addDropRequests.filter(x=>x.status==='pending'); const pendingTrades=league.trades.filter(x=>x.status==='pending'); return <>
  <section className="card"><div className="pageTitle">Commissioner</div><p className="muted bodyText">Live league oversight is connected. Write controls activate after owner authentication.</p></section>
  <div className="statGrid"><div className="card stat"><small>POT</small><strong>${league.pot.toFixed(0)}</strong></div><div className="card stat"><small>OWNERS</small><strong>{league.owners.length}</strong></div><div className="card stat"><small>PENDING</small><strong>{pendingAdds.length+pendingTrades.length}</strong></div><div className="card stat"><small>FREE AGENTS</small><strong>{league.freeAgents.length}</strong></div></div>
  <section className="card"><div className="sectionTitle">PENDING ADD / DROPS</div>{pendingAdds.length?pendingAdds.map(m=><MoveRow key={m.id} move={m}/>):<Empty text="Nothing waiting."/>}</section>
  <section className="card"><div className="sectionTitle">PENDING TRADES</div>{pendingTrades.length?pendingTrades.map(t=><TradeRow key={t.id} trade={t}/>):<Empty text="Nothing waiting."/>}</section>
  <section className="card"><div className="sectionTitle">ACCOUNTING</div>{league.accounting.length?league.accounting.slice(0,10).map(a=><div className="historyRow" key={a.id}><div><strong>{a.teamName||a.ownerName||'League'} • {a.type}</strong><small>{fmtDate(a.createdAt)}</small></div><div className="money">${a.amount.toFixed(0)}</div></div>):<Empty text="No accounting activity yet."/>}</section>
  <section className="card"><div className="sectionTitle">DATA STATUS</div><div className="statusDot"><i className={league.connected?'green':'amber'}></i>{league.connected?'Connected to Neon database':'Using safe fallback data'}</div></section>
</>; }
