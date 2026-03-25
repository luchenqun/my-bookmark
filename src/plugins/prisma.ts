import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

interface PrismaPluginOptions {
  databaseUrl?: string;
}

export default fp<PrismaPluginOptions>(
  async function prismaPlugin(fastify, options) {
    const databaseUrl = options.databaseUrl || process.env.DATABASE_URL || 'file:./data/app.db';
    process.env.DATABASE_URL = databaseUrl;

    const prisma = new PrismaClient({
      adapter: new PrismaBetterSqlite3({
        url: databaseUrl
      })
    });

    fastify.decorate('prisma', prisma);
    fastify.addHook('onClose', async () => {
      await prisma.$disconnect();
    });
  },
  {
    name: 'prisma-plugin'
  }
);
