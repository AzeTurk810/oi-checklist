import createError from 'http-errors';
import { db } from '@db';
import { FastifyInstance } from 'fastify';

// Sends profile data for /profile/username
// If auth, sends more data

export async function profile(app: FastifyInstance) {
  const schema = {
    body: {
      type: 'object',
      required: ['username'],
      properties: {
        username: { type: 'string' },
        token: { type: 'string' }
      }
    }
  };
  app.post<{ Body: { username: string, token?: string } }>('/profile', { schema }, async (req) => {
    // Send:
    // - #1, #2: user id
    // - join date
    // - failed, progress, solved
    // - github, discord, google
    // - last activity time (based on changed any status)
    // - followers

    // If auth:
    // - also report if we're following or not

    const { token, username } = req.body;
    const user = await db.user.findUnique({
      where: { username },
      include: {
        followers: true,
        problemsData: {
          include: {
            problem: {
              include: {
                problemLinks: true
              }
            }
          }
        },
        authIdentities: true,
        settings: true
      }
    });
    if (!user) {
      throw createError.NotFound('User not found');
    }

    const platformPref = (user.settings?.platformPref as string[]) || ['oj.uz', 'qoj.ac'];
    function pickLink(links: any[]): string {
      if (!links || links.length === 0) return '#';
      let chosen = platformPref.find(platform => links.some(link => link.platform == platform));
      return links.find(link => link.platform == chosen)?.url ?? links[0].url ?? '#';
    }

    let areFollowing = 0;
    if (token) {
      const session = await db.session.findUnique({ where: { id: token } });
      if (session) {
        const record = await db.follow.findUnique({
          where: {
            followerId_followedId: {
              followerId: session.userId, followedId: user.id
            }
          }
        });
        if (record) {
          areFollowing = 2;
        } else {
          areFollowing = 1;
        }
      }
    }

    const activeProblems = user.problemsData.filter(p => p.status !== 0 || p.score !== 0 || (p.note && p.note.trim() !== ''));

    const progress = activeProblems.filter(i => i.status == 1).length;
    const solved = activeProblems.filter(i => i.status == 2).length;
    const failed = activeProblems.filter(i => i.status == 3).length;
    const authIdentities = user.authIdentities.map(i => {
      return {
        displayName: i.displayName,
        provider: i.provider,
      }
    });
    const lastActivityAt = activeProblems.length ? new Date(Math.max(...activeProblems.map(p => p.updatedAt.getTime()))) : null;
    const followers = user.followers.length;

    // Calculate activity map for heatmap
    const activityMap: Record<string, number> = {};
    const detailedActivity: Record<string, any[]> = {};

    activeProblems.forEach(p => {
      const date = p.updatedAt.toISOString().split('T')[0];
      activityMap[date] = (activityMap[date] || 0) + 1;
      
      if (!detailedActivity[date]) detailedActivity[date] = [];
      detailedActivity[date].push({
        problemId: p.problemId,
        problemName: p.problem.name,
        problemLink: pickLink(p.problem.problemLinks),
        status: p.status,
        score: p.score,
        updatedAt: p.updatedAt
      });
    });

    // Calculate streaks
    const uniqueDates = Array.from(new Set(Object.keys(activityMap))).sort((a, b) => b.localeCompare(a));
    let currentStreak = 0;
    let maxStreak = 0;

    if (uniqueDates.length > 0) {
      // Current Streak
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let lastDate = uniqueDates[0];
      if (lastDate === today || lastDate === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const d1 = new Date(uniqueDates[i-1]);
          const d2 = new Date(uniqueDates[i]);
          const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Max Streak
      let tempStreak = 1;
      maxStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const d1 = new Date(uniqueDates[i-1]);
        const d2 = new Date(uniqueDates[i]);
        const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      }
    }

    return {
      userId: user.id,
      joinDate: user.createdAt,
      solveStats: { progress, solved, failed },
      authIdentities,
      lastActivityAt,
      followers,
      activityMap,
      detailedActivity,
      streaks: { current: currentStreak, max: maxStreak },
      ...(areFollowing == 0 ? {} : { following: areFollowing - 1 })
    };
  });
}