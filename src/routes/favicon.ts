import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { FastifyPluginAsync, FastifyReply } from 'fastify';

import { resolveStaticRoot } from '../lib/static-root.js';

const DEFAULT_FAVICON_PATH = join(resolveStaticRoot(), 'images/default.ico');
const DEFAULT_SIZE = 24;
const MIN_SIZE = 16;
const MAX_SIZE = 256;
const UPSTREAM_URL = 'https://t2.gstatic.com/faviconV2';

let defaultFaviconPromise: Promise<Buffer> | null = null;

function getDefaultFavicon() {
  defaultFaviconPromise ??= readFile(DEFAULT_FAVICON_PATH);
  return defaultFaviconPromise;
}

function normalizeSize(value?: string) {
  const size = Number.parseInt(value || '', 10);

  if (!Number.isFinite(size)) {
    return DEFAULT_SIZE;
  }

  return Math.min(Math.max(size, MIN_SIZE), MAX_SIZE);
}

function parseTargetUrl(value?: string) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

async function sendDefaultFavicon(reply: FastifyReply) {
  const body = await getDefaultFavicon();

  return reply.header('cache-control', 'public, max-age=3600').type('image/x-icon').send(body);
}

const faviconRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/favicon', async (request, reply) => {
    const query = request.query as { url?: string; size?: string };
    const targetUrl = parseTargetUrl(query.url);

    if (!targetUrl) {
      return sendDefaultFavicon(reply);
    }

    const upstreamUrl = new URL(UPSTREAM_URL);
    upstreamUrl.searchParams.set('client', 'SOCIAL');
    upstreamUrl.searchParams.set('type', 'FAVICON');
    upstreamUrl.searchParams.set('fallback_opts', 'TYPE,SIZE,URL');
    upstreamUrl.searchParams.set('size', String(normalizeSize(query.size)));
    upstreamUrl.searchParams.set('url', targetUrl.toString());

    try {
      const response = await fetch(upstreamUrl, {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return sendDefaultFavicon(reply);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        return sendDefaultFavicon(reply);
      }

      const body = Buffer.from(await response.arrayBuffer());
      if (body.byteLength === 0) {
        return sendDefaultFavicon(reply);
      }

      return reply.header('cache-control', 'public, max-age=86400').type(contentType).send(body);
    } catch {
      return sendDefaultFavicon(reply);
    }
  });
};

export default faviconRoutes;
