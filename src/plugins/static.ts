import fastifyStatic from '@fastify/static';
import fp from 'fastify-plugin';

import { resolveStaticRoot } from '../lib/static-root.js';

export default fp(
  async function staticPlugin(fastify) {
    const root = resolveStaticRoot();

    await fastify.register(fastifyStatic, {
      root,
      prefix: '/'
    });

    fastify.get('/', async (_request, reply) => {
      return reply.sendFile('index.html');
    });
  },
  {
    name: 'static-plugin'
  }
);
