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

    const progress = user.problemsData.filter(i => i.status == 1).length;
    const solved = user.problemsData.filter(i => i.status == 2).length;
    const failed = user.problemsData.filter(i => i.status == 3).length;
    const authIdentities = user.authIdentities.map(i => {
      return {
        displayName: i.displayName,
        provider: i.provider,
      }
    });
    const lastActivityAt = user.problemsData.length ? new Date(Math.max(...user.problemsData.map(p => p.updatedAt.getTime()))) : null;
    const followers = user.followers.length;

    // Calculate activity map for heatmap
    const activityMap: Record<string, number> = {};
    const detailedActivity: Record<string, any[]> = {};

    user.problemsData.forEach(p => {
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

    return {
      userId: user.id,
      joinDate: user.createdAt,
      solveStats: { progress, solved, failed },
      authIdentities,
      lastActivityAt,
      followers,
      activityMap,
      detailedActivity,
      ...(areFollowing == 0 ? {} : { following: areFollowing - 1 })
    };
  });
}