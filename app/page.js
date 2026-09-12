import LeagueApp from '../components/LeagueApp';
import { getLeagueData } from '../lib/league';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const league = await getLeagueData();
  return <LeagueApp league={league} />;
}
