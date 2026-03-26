import type { FastifyPluginAsync } from 'fastify';

import apiRoutes from './api.js';
import faviconRoutes from './favicon.js';

const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(faviconRoutes);
  await fastify.register(apiRoutes, { prefix: '/api' });
};

export default routes;
