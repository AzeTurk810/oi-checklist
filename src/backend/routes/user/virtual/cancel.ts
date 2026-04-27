import { db } from '@db';
import { FastifyInstance } from 'fastify';
import createError from 'http-errors';
import { differenceInMinutes } from 'date-fns';

export async function cancel(app: FastifyInstance) {
  const schema = {
    body: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string' }
      }
    }
  };
  app.post<{ Body: { token: string } }>('/cancel', { schema }, async (req) => {
    const { token } = req.body;
    const session = await db.session.findUnique({ where: { id: token } });
    if (!session) {
      throw createError.Unauthorized('Invalid token');
    }
    const userId = session.userId;
    const contest = await db.activeVirtualContest.findUnique({
      where: { userId }
    });
    if (!contest) {
      throw createError.NotFound('No active contest exists');
    }

    // Check if it's within 3 minutes
    const minutesElapsed = differenceInMinutes(new Date(), contest.startedAt);
    if (minutesElapsed >= 3) {
      throw createError.BadRequest('Cannot cancel contest after 3 minutes');
    }

    // Delete the active contest
    // Also delete any virtual submissions associated with it
    await db.virtualSubmission.deleteMany({
      where: { activeVirtualContestUserId: userId }
    });
    await db.activeVirtualContest.delete({
      where: { userId }
    });

    return { success: true };
  });
}
