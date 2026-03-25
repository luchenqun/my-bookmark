import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

import { readAuthorizationToken } from '../lib/token.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: number;
      username: string;
    };
    user: {
      id: number;
      username: string;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>;
  }
}

interface AuthPluginOptions {
  jwtSecret?: string;
}

export default fp<AuthPluginOptions>(
  async function authPlugin(fastify, options) {
    await fastify.register(fastifyJwt, {
      secret: options.jwtSecret || process.env.JWT_SECRET || 'bookmark-secret'
    });

    fastify.decorate('authenticate', async (request, reply) => {
      const token = readAuthorizationToken(request.headers.authorization);

      if (!token) {
        reply.code(401).send({
          code: 401,
          data: '',
          msg: '请先登录'
        });
        return;
      }

      try {
        const payload = await fastify.jwt.verify<{ id: number; username: string }>(token);
        request.user = payload;
      } catch {
        reply.code(401).send({
          code: 401,
          data: '',
          msg: '请先登录'
        });
      }
    });
  },
  {
    name: 'auth-plugin'
  }
);
