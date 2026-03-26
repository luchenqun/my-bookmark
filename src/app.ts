import Fastify, { type FastifyInstance } from 'fastify';

import authPlugin from './plugins/auth.js';
import multipartPlugin from './plugins/multipart.js';
import prismaPlugin from './plugins/prisma.js';
import staticPlugin from './plugins/static.js';
import routes from './routes/index.js';

interface BuildAppOptions {
  databaseUrl?: string;
  jwtSecret?: string;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    routerOptions: {
      ignoreTrailingSlash: true
    }
  });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  await app.register(prismaPlugin, {
    databaseUrl: options.databaseUrl
  });
  await app.register(authPlugin, {
    jwtSecret: options.jwtSecret
  });
  await app.register(multipartPlugin);
  await app.register(staticPlugin);
  await app.register(routes);

  return app;
}
