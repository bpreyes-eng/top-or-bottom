'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';

const tabs = [

  ['home', '⌂', 'Home'],

  ['standings', '▤', 'Standings'],

  ['schedule', '▦', 'Schedule'],

  ['team', '★', 'My Team'],

  ['moves', '⇄', 'Moves'],

  ['rules', '☷', 'Rules'],

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

        <header className="hero artworkHero">

          <div className="stadiumLights leftLights" />

          <div className="stadiumLights rightLights" />

          <div className="brandArtwork">
            <Image src="/top-or-bottom-logo.png" alt="Top or Bottom — Pick Your Position"
              width={1536} height={864} priority className="officialLogo" />
          </div>

          <div className="season">2026 NFL REGULAR SEASON</div>
          <div className="leagueMotto">10 OWNERS <span>•</span> 30 NFL TEAMS <span>•</span> TOP OR BOTTOM WINS</div>

        </header>

        {tab === 'home' && <Home league={league} setTab={setTab} />}

        {tab === 'standings' && <Standings league={league} />}

        {tab === 'schedule' && <Schedule league={league} />}

        {tab === 'rules' && <LeagueRules />}

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

    <div className="homeDashboard">

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

      <WeekThreeNewsletter />

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

            Full standings ›

          </button>

        </div>

        <div className="standingsHeader">

          <span>RK</span><span>TEAM / OWNER</span><span>PTS</span>

        </div>

        <div className="miniRows">

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

        </div>

      </section>

      <section className="card scoringCard">

        <div className="cardHeader">
          <div className="sectionTitle">HOW SCORING WORKS</div>
          <button className="textButton" onClick={() => setTab('rules')}>League rules ›</button>
        </div>

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

    </div>

  );

}


const weekThreeSections = [
  [
    "🚨 ART HAS ACCIDENTALLY BUILT A CONTENDER",
    "Takin Da Browns to Da Super Bowl | 6 points | Week 3: 3–0",
    "Cleveland. Indianapolis. Las Vegas.\n\nWhen Art drafted those three teams, nobody asked about his strategy.\n\nWe asked if he needed a ride home.\n\nNow all three won in the same week.\n\nArt has six points and is one behind Rico.\n\n**This man ordered the basement and got upgraded to a suite.**\n\nThe Browns are contributing. The Raiders are undefeated. The Colts helped.\n\nThat roster looked like three check-engine lights. Apparently it’s a Ferrari.\n\nArt, if you were trying to finish last, this is a deeply embarrassing performance.\n\nPlease take your winning somewhere else. You’re upsetting the people who actually tried."
  ],
  [
    "👑 RICO: WE’VE LET THIS GO ON LONG ENOUGH",
    "Jed York | 7 points | Week 3: 2–1",
    "Rico is still in first.\n\nThree weeks ago, that was a funny little accident.\n\nNow it’s becoming a workplace issue.\n\nBuffalo won. Chicago won. Seattle lost, presumably to keep Rico humble.\n\nIt did not work.\n\nThe Bears beat David’s Eagles on Monday night, so Rico got to watch his own total rise while David sat there holding the remote like it owed him money.\n\n**Rico has reached the stage where he might start giving advice.**\n\nWe cannot allow this.\n\nIf he says “the key is trusting your draft board,” somebody unplug the Wi-Fi."
  ],
  [
    "😤 DAVID WOULD LIKE TO SPEAK TO THE MANAGER",
    "Salvadorks | 6 points | Week 3: 1–2",
    "David drafted Baltimore, Cincinnati and Philadelphia.\n\nThat sounds like a serious person making serious football decisions.\n\nArt drafted Cleveland, Indianapolis and Las Vegas.\n\nThat sounds like the itinerary for a regrettable bachelor party.\n\n**They have the same number of points.**\n\nDavid did the research. Art apparently shook a Magic 8 Ball until it said “Browns.”\n\nNow David has to share the six-point table with him.\n\nThere is no refund policy, David. We checked."
  ],
  [
    "🚂 ROD: “I CHO CHO CHOOSE… WHATEVER’S HAPPENING”",
    "I cho cho choose u | 5 points | Week 3: 2–1",
    "Rod owns Denver, the Rams and the Giants.\n\nThe Giants won.\n\nWe’ll give you a moment.\n\nRod also had Denver playing the Rams, which meant he could spend the entire game yelling:\n\n**“LET’S GO!”**\n\nImmediately followed by:\n\n**“WHAT THE HELL ARE YOU DOING?”**\n\nHe’s watching football with the emotional stability of a printer that says there’s a paper jam when there is no paper jam.\n\nStill, two wins put him at five points.\n\nRod’s train is moving up the standings. Whether he bought a ticket for that direction remains unclear."
  ],
  [
    "📉 ANTHONY HAS BEEN RETURNED TO FACTORY SETTINGS",
    "Quest for Shiva | 5 points | Week 3: 1–2",
    "Last week, Anthony went 3–0.\n\nThis week, he went 1–2.\n\nApparently the premium subscription expired.\n\nKansas City delivered. Dallas and New England sent their apologies in the form of absolutely nothing.\n\nAnthony went from “everybody needs to watch out” to “there’s still a lot of football left” in seven days.\n\n**“There’s still a lot of football left” is fantasy football for “please stop looking at me.”**"
  ],
  [
    "🏄 ANDY IS CURRENTLY WINNING A FREE NOTHING",
    "SurferGuy 69 | 4 points | Week 3: 1–2",
    "San Francisco is doing the work.\n\nGreen Bay and the Chargers are the other two guys in the group project who say:\n\n**“Just put all our names on it.”**\n\nAndy has four points.\n\nToo many to feel good about the Bottom.\n\nToo few to feel good about the Top.\n\nHe has successfully found the exact temperature of room-temperature water.\n\nSurferGuy 69 isn’t catching a wave.\n\nHe’s standing in the pool while the lifeguard asks if he’s getting in or getting out."
  ],
  [
    "⚖️ BERNARDO: AN INDEPENDENT INVESTIGATION HAS CLEARED ME",
    "Tua in the Pink | 3 points | Week 3: 1–2",
    "As commissioner, I would like to address concerns about my three-point total.\n\nI built the site.\n\nI maintain the standings.\n\nI write the newsletter.\n\n**Apparently choosing three useful football teams was where I decided to draw the line.**\n\nAtlanta won this week, which was nice.\n\nArizona and Carolina continue to provide character development.\n\nI am not struggling.\n\nI am gathering material.\n\nUnfortunately, the material is me."
  ],
  [
    "🪑 KEN: PLEASE REMAIN SEATED",
    "Kick Names, Take Ass | 3 points | Week 3: 1–2",
    "Ken started the season near the top.\n\nThen went 0–3.\n\nThen added one win.\n\nThis isn’t a championship run. It’s a shopping cart with one bad wheel.\n\nPittsburgh contributed while the Jets and Titans continued their unpaid internships.\n\n“Kick Names, Take Ass” sounds aggressive.\n\nAt three points, we may need to rebrand:\n\n**“Take a Number, Have a Seat.”**"
  ],
  [
    "💀 ROB: DETROIT HAS VIOLATED THE PLAN",
    "Japilino | 2 points | Week 3: 1–2",
    "Rob was putting together a respectable Bottom campaign.\n\nThen Detroit won.\n\nYou hate to see an organization undermine its owner like that.\n\nHouston and Tampa Bay understood the assignment.\n\nDetroit showed up early, finished the work and ruined everything for the group.\n\nRob is still tied for the lowest point total, but this kind of initiative cannot continue.\n\n**There is no “W” in “Japilino.”**\n\nPlease respect the branding."
  ],
  [
    "🪦 JOHN: FOOTBALL IS LIFE, AND LIFE NEEDS TO CALM DOWN",
    "Football is Life | 2 points | Week 3: 1–2",
    "John opened the season with zero wins.\n\nBeautiful work. Clear vision. Strong execution.\n\nThen he won a game in Week 2.\n\nNow another in Week 3.\n\nJohn, this is how bad habits start.\n\nWashington beat Seattle, which helped John while hurting Rico.\n\nFor one brief moment, John was a public servant.\n\nUnfortunately, the payment was a point he may not have wanted.\n\n**John and Rob are now tied at the Bottom, like two guys politely holding the door for each other.**\n\n“No, you finish last.”\n\n“No, please. After you.”\n\nMeanwhile, the rest of us are paying $20 to watch this."
  ]
];
const weekThreeDamage = [["Rico","2–1",7,"Becoming unbearable"],["David","1–2",6,"Requesting a supervisor"],["Art","3–0",6,"Failed successfully"],["Anthony","1–2",5,"Free trial expired"],["Rod","2–1",5,"Train going somewhere"],["Andy","1–2",4,"Participation certificate"],["Bernardo","1–2",3,"Investigating himself"],["Ken","1–2",3,"Waiting to be seated"],["Rob","1–2",2,"Filing a complaint against Detroit"],["John","1–2",2,"Developing a winning problem"]];
function NewsletterParagraphs({ text }) {
  return text.split('\n\n').map((paragraph, i) => (
    <p key={i}>{paragraph.split('**').map((part, j) =>
      j % 2 ? <strong key={j}>{part}</strong> : part
    )}</p>
  ));
}
function WeekThreeNewsletter() {
  return (
    <section className="card newsletterCard">
      <div className="newsletterKicker">📰 THIS WEEK IN TOP OR BOTTOM • WEEK 3</div>
      <h2>Task Failed Successfully</h2>
      <p className="newsletterDeck">Some owners drafted like they were trying to lose… and accidentally ended up on the winning side. Art sweeps, Rico threatens to start a podcast, and the Bottom race gets personal.</p>
      <blockquote>“This man ordered the basement and got upgraded to a suite.”</blockquote>
      <details className="newsletterIssue">
        <summary>Read the Week 3 newsletter <span>↓</span></summary>
        <div className="newsletterBody" style={{fontSize:'1rem'}}>
          <header className="newsletterLead">
            <span>TOP OR BOTTOM — WEEK 3</span>
            <h3>Task Failed Successfully</h3>
          </header>
          <NewsletterParagraphs text={"**Some of you drafted to win. Some of you drafted to lose. After three weeks, we’re starting to suspect neither group knew what the hell they were doing.**\n\nWelcome back to the only league where you can watch your team score a touchdown and yell:\n\n**“YOU INCONSIDERATE PIECE OF SHIT.”**\n\nThis week’s biggest story: owners who looked like they were building a last-place roster are suddenly on the winning side.\n\nTurns out you can’t even trust bad teams to be bad anymore.\n\nWhich brings us to our Employee of the Week."} />
          {weekThreeSections.map(([title, meta, text]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p><strong>{meta}</strong></p>
              <NewsletterParagraphs text={text} />
            </article>
          ))}
          <section className="newsletterStandings" aria-label="Week 3 damage report">
            <h3>📊 THE DAMAGE REPORT</h3>
            {weekThreeDamage.map(([owner, week, total, diagnosis]) => (
              <div key={owner} className="newsletterStandingRow" style={{gridTemplateColumns:'minmax(0,1fr) auto'}}>
                <span><strong>{owner} • Week 3: {week}</strong><small>{diagnosis}</small></span>
                <strong>{total} pts</strong>
              </div>
            ))}
            <small className="newsletterFootnote">Totals use the saved draft rosters, assuming no roster changes. Tied totals are grouped without assigning tiebreaker positions.</small>
          </section>
          <article>
            <h3>👻 THE “NOBODY WANTED US” REPORT</h3>
            <p><strong>Minnesota: 3–0 | Jacksonville: 2–1</strong></p>
            <NewsletterParagraphs text={"The two teams we left undrafted have five combined wins.\n\nMinnesota alone has more wins than Rob’s entire roster.\n\nAnd John’s.\n\nAnd as many as mine.\n\n**An empty chair could have drafted Minnesota and outperformed several paying members of this league.**\n\nWe should invite the chair next season.\n\nIt’s available on draft night, doesn’t argue about the rules, and has already demonstrated excellent judgment by staying out of the group chat."} />
          </article>
          <footer className="newsletterSignoff">
            <h3>🏆 COMMISSIONER’S CLOSING STATEMENT</h3>
            <NewsletterParagraphs text={"Art looks like he tried to lose and accidentally became good.\n\nDavid tried to be good and now has to explain why he’s tied with Art.\n\nRob and John are trying to stay down, but their teams keep showing occasional signs of employment.\n\nAnd Rico is one more good week away from starting a podcast.\n\n**For the sake of all ten owners, somebody stop that man.**"} />
            <strong>Commissioner Bernardo 🏈</strong>
            <small>Top or Bottom: You can win by losing. Apparently, you can also lose at losing.</small>
          </footer>
        </div>
      </details>
      <details style={{marginTop:32}}>
        <summary style={{cursor:'pointer',color:'var(--gold2)',padding:'12px 0',fontSize:14}}>Previous issue: Week 2 — Rico Is Getting Suspicious</summary>
        <WeekTwoNewsletter />
      </details>
    </section>
  );
}

function WeekTwoNewsletter() {
  const standings = [
    ['1', 'Rico', 'Jed York', '5.0'],
    ['2', 'David', 'Salvadorks', '5.0'],
    ['3', 'Anthony', 'Quest for Shiva', '4.0'],
    ['4', 'Andy', 'SurferGuy 69', '3.0'],
    ['5', 'Art', 'Takin Da Browns to Da Super Bowl', '3.0'],
    ['6', 'Rod', 'I cho cho choose u', '3.0'],
    ['7', 'Bernardo', 'Tua in the Pink', '2.0'],
    ['8', 'Ken', 'Kick Names, Take Ass', '2.0'],
    ['9', 'Rob', 'Japilino', '1.0'],
    ['10', 'John', 'Football is Life', '1.0'],
  ];

  return (
    <section className="card newsletterCard">
      <div className="newsletterKicker">📰 THIS WEEK IN TOP OR BOTTOM</div>
      <h2>Rico Is Getting Suspicious</h2>
      <p className="newsletterDeck">
        Rico remains in first, Anthony goes 3–0, Ken answers a strong Week 1
        by going 0–3, and undrafted Minnesota is somehow still undefeated.
      </p>

      <blockquote>
        “Thirty teams selected. Ten owners. Hundreds of years of combined
        football knowledge. And we collectively looked at an undefeated NFL
        team and said: Nah.”
      </blockquote>

      <details className="newsletterIssue">
        <summary>Read the Week 2 newsletter <span>↓</span></summary>
        <div className="newsletterBody">
          <header className="newsletterLead">
            <span>WEEK 2 NEWSLETTER</span>
            <h3>Rico Is Getting Suspicious</h3>
            <p>10 owners. 30 drafted teams. 2 free agents. And apparently Rico has learned how football works.</p>
          </header>

          <p>
            Week 2 is officially over, and we need to address the elephant in
            the room: <strong>Rico is still in first place.</strong> This is no
            longer funny. Well… it’s still pretty funny.
          </p>

          <article>
            <span className="newsletterLabel">🚨 BREAKING NEWS</span>
            <h3>Rico remains in first place</h3>
            <p><strong>Rico — Jed York — 5.0 points</strong></p>
            <p>
              Rico added two wins in Week 2. Seattle and Buffalo delivered;
              Chicago prevented another perfect week. Thank you, Bears. The
              league appreciates your service.
            </p>
          </article>

          <article>
            <span className="newsletterLabel">🥈 DAVID REFUSES TO GO AWAY</span>
            <h3>Doing everything right—and still second</h3>
            <p><strong>David — Salvadorks — 5.0 points</strong></p>
            <p>
              David also went 2–1 and remains tied with Rico. The tiebreaker
              keeps Rico ahead, which means Rico still gets to tell everyone
              he’s in first. That’s probably the worst part.
            </p>
          </article>

          <article>
            <span className="newsletterLabel">🚀 BIGGEST MOVE OF THE WEEK</span>
            <h3>Anthony went 3-for-3</h3>
            <p><strong>Anthony — Quest for Shiva — 4.0 points</strong></p>
            <p>
              Dallas, Kansas City and New England completed the sweep. Anthony
              jumped from the giant one-point traffic jam directly into the
              championship conversation. Someone check his roster for
              performance-enhancing substances.
            </p>
          </article>

          <article>
            <span className="newsletterLabel">📈 MOVING UP</span>
            <h3>Andy and Art are alive</h3>
            <p>
              Andy caught two wins and is paddling toward the front.
              Meanwhile, Art also went 2–1—and yes, the Browns won.
              “Takin Da Browns to Da Super Bowl” suddenly looks approximately
              4% less ridiculous.
            </p>
          </article>

          <article>
            <span className="newsletterLabel">😐 THE MIDDLE</span>
            <h3>Bernardo, Ken and Rod</h3>
            <p>
              Carolina did the heavy lifting for Bernardo. Ken entered Week 2
              alone in third and responded by going 0–3. Rod owned both teams
              in Monday night’s Rams-Giants game, allowing him to win and lose
              at the same time. Impressive efficiency.
            </p>
          </article>

          <article>
            <span className="newsletterLabel">💀 BOTTOM WATCH</span>
            <h3>Rob has activated Bottom Mode™</h3>
            <p>
              Detroit, Houston and Tampa Bay all lost, leaving Rob at one
              point. John also sits at one after accidentally winning his
              first game. We officially have a Bottom championship race.
            </p>
          </article>

          <section className="newsletterStandings" aria-label="Week 2 standings">
            <span className="newsletterLabel">OFFICIAL STANDINGS</span>
            {standings.map(([rank, owner, team, points]) => (
              <div className="newsletterStandingRow" key={owner}>
                <b>{rank}</b>
                <span><strong>{owner}</strong><small>{team}</small></span>
                <strong>{points}</strong>
              </div>
            ))}
            <small className="newsletterFootnote">
              Tied teams are ordered using the league point-differential tiebreaker.
            </small>
          </section>

          <article>
            <span className="newsletterLabel">👻 NOBODY WANTED US REPORT</span>
            <h3>Minnesota is 2–0—and none of us drafted them</h3>
            <p>
              Thirty teams selected. Ten owners. Three selections each.
              Hundreds of years of combined football knowledge.* We
              collectively looked at an undefeated NFL team and said “Nah.”
            </p>
            <small>*Combined football knowledge estimate has not been independently verified.</small>
          </article>

          <article className="newsletterPayout">
            <span className="newsletterLabel">🏆 IF THE SEASON ENDED TODAY</span>
            <p><strong>TOP: Rico — 5 points</strong></p>
            <p><strong>BOTTOM: John — 1 point</strong></p>
            <p>
              The dangerous place is the middle. Nobody gets paid for seventh.
              Nobody gets paid for fourth. Nobody remembers fifth.
              <strong> In Top or Bottom, mediocrity is the enemy.</strong>
            </p>
          </article>

          <footer className="newsletterSignoff">
            <h3>Week 3 storylines</h3>
            <p>
              Can Rico’s unnecessary Cinderella story continue? Can David
              finally take first? Can Anthony repeat his monster week? Will
              Minnesota go 3–0 while sitting completely undrafted? And who
              will pretend by Sunday night that they were trying to finish
              last all along?
            </p>
            <strong>Commissioner Bernardo 🏈</strong>
            <small>Where first place gets paid, last place gets paid, and everyone in between made terrible life choices.</small>
          </footer>
        </div>
      </details>
    </section>
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

const leagueRuleSections = [
  {
    title: 'League & draft',
    rules: [
      '10 owners draft 3 NFL teams each in a 3-round snake draft.',
      'The 2 undrafted NFL teams become free agents.',
      'Every owner must maintain exactly 3 NFL teams.'
    ]
  },
  {
    title: 'Scoring',
    rules: [
      'Only NFL regular-season games count.',
      'Each NFL win earns 1 league point. A tie earns 0.5 points. A loss or bye earns 0.',
      'Weekly standings are updated after Monday Night Football.',
      'Prior wins do not transfer with an added or traded team. Scoring follows the applicable effective time.'
    ]
  },
  {
    title: 'Entry fee & payouts',
    rules: [
      'The entry fee is $20 per owner, creating a $200 starting pot.',
      'The highest league-point total wins 50% of the pot. The lowest league-point total wins the other 50%.',
      'Completed add/drop fees increase the league pot. Trades are free.'
    ]
  },
  {
    title: 'Tie-breakers',
    rules: [
      'Top prize: highest combined point differential across the owner’s 3 teams, then highest combined NFL points scored.',
      'Bottom prize: lowest combined point differential, then lowest combined NFL points scored.',
      'Combined NFL points scored means the actual football points scored by the teams, not league points earned for wins and ties.',
      'If owners remain tied after both tie-breakers, they split the applicable prize.'
    ]
  },
  {
    title: 'Add / drop & payment',
    rules: [
      'An owner may add only a team on the free-agent list and must drop a rostered team to keep exactly 3 teams.',
      'Priority goes to the first valid request, using the site’s recorded timestamp.',
      'Each completed add/drop costs $10. Payment is by Venmo and is due within 24 hours after approval; otherwise the request expires.',
      'A transaction is not valid until payment is received.',
      'The added team earns points only for eligible games that have not started at the effective submission time. Its earlier wins are not included.'
    ]
  },
  {
    title: 'Trades',
    rules: [
      'Trades are free and must exchange equal numbers of teams: 1-for-1, 2-for-2, or 3-for-3. No 2-for-1 trades.',
      'An owner may accept, deny, or counter an offer. Each offer or counteroffer expires after 48 hours.',
      'Trades require commissioner approval. Approved trades take effect when the weekly lock ends.',
      'Prior wins stay with their original owner; they do not transfer in a trade.'
    ]
  },
  {
    title: 'Weekly lock & commissioner',
    rules: [
      'Roster transactions are locked from the first game’s kickoff through the end of the final Monday game.',
      'The lock ends when the game is finished, rather than at a fixed timer deadline.',
      'The commissioner may correct accidental roster moves. Corrections must be logged and auditable.'
    ]
  }
];

function LeagueRules() {
  return (
    <div className="rulesPage">
      <section className="card">
        <div className="pageTitle">League Rules</div>
        <div className="goldRule" />
        <p className="muted bodyText">Top or Bottom • 2026 NFL regular season</p>
      </section>
      {leagueRuleSections.map(section => (
        <section className="card" key={section.title}>
          <h2 className="sectionTitle">{section.title}</h2>
          <ul className="leagueRulesList">
            {section.rules.map(rule => <li key={rule}>{rule}</li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}
