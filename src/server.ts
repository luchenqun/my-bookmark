import { buildApp } from './app.js';
import { formatStartupUrls, loadRuntimeEnv, resolvePort } from './lib/startup.js';

loadRuntimeEnv();

const app = await buildApp();
const port = resolvePort();

try {
  const address = await app.listen({
    host: '0.0.0.0',
    port
  });

  for (const line of formatStartupUrls(port, address)) {
    console.log(line);
  }
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
