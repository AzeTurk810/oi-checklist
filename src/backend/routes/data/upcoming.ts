import { FastifyInstance } from 'fastify';

let cache: any = null;
let lastFetch = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function upcoming(app: FastifyInstance) {
  app.get('/upcoming', async () => {
    const now = Date.now();
    if (cache && now - lastFetch < CACHE_DURATION) {
      return cache;
    }

    try {
      const [cfRes, atCoderRes] = await Promise.all([
        fetch('https://codeforces.com/api/contest.list?gym=false').then(res => res.json()),
        // AtCoder doesn't have a simple public JSON API without scraping or using a 3rd party,
        // but for this demo, we'll use a known 3rd party API or return mock if it fails.
        fetch('https://kontests.net/api/v1/atcoder').then(res => res.json()).catch(() => [])
      ]);

      const cfContests = cfRes.status === 'OK' 
        ? cfRes.result
            .filter((c: any) => c.phase === 'BEFORE')
            .map((c: any) => ({
              platform: 'Codeforces',
              name: c.name,
              start: new Date(c.startTimeSeconds * 1000).toISOString(),
              url: `https://codeforces.com/contests/${c.id}`
            }))
        : [];

      const atCoderContests = Array.isArray(atCoderRes)
        ? atCoderRes.map((c: any) => ({
            platform: 'AtCoder',
            name: c.name,
            start: c.start_time,
            url: c.url
          }))
        : [];

      // Mock OI-contest for now as they are harder to scrape dynamically without specific logic
      const oiContests = [
        { platform: 'OI-Contest', name: 'APIO 2026', start: '2026-05-22T00:00:00Z', url: 'https://apio2026.org' },
        { platform: 'OI-Contest', name: 'IOI 2026', start: '2026-09-01T00:00:00Z', url: 'https://ioi2026.org' }
      ];

      cache = [...cfContests, ...atCoderContests, ...oiContests].sort((a, b) => 
        new Date(a.start).getTime() - new Date(b.start).getTime()
      );
      lastFetch = now;
      return cache;
    } catch (error) {
      console.error('Error fetching upcoming contests:', error);
      return cache || [];
    }
  });
}
