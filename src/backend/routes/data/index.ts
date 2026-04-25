import { FastifyInstance } from 'fastify';
import { problems } from './problems';
import { virtual } from './virtual';
import { profile } from './profile';
import { upcoming } from './upcoming';

export async function data(app: FastifyInstance) {
  app.register(problems);
  app.register(virtual, { prefix: '/virtual' });
  app.register(profile);
  app.register(upcoming);
}