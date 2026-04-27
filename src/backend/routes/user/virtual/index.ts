import { FastifyInstance } from 'fastify';
import { start } from './start';
import { end } from './end';
import { cancel } from './cancel';
import { confirm } from './confirm';
import { submit } from './submit';
import { context } from './context';

export async function virtual(app: FastifyInstance) {
  app.register(start);
  app.register(end);
  app.register(cancel);
  app.register(confirm);
  app.register(submit);
  app.register(context);
}