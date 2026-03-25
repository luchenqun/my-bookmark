import type { FastifyPluginAsync } from 'fastify';

import apiRoutes from './api.js';

const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(apiRoutes, { prefix: '/api' });
};

export default routes;
