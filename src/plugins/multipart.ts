import fp from 'fastify-plugin';
import fastifyMultipart from '@fastify/multipart';

export default fp(
  async function multipartPlugin(fastify) {
    await fastify.register(fastifyMultipart, {
      limits: {
        fileSize: 10 * 1024 * 1024
      }
    });
  },
  {
    name: 'multipart-plugin'
  }
);
