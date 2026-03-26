export function loadRuntimeEnv(path = '.env') {
  try {
    process.loadEnvFile(path);
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;

    if (errno.code !== 'ENOENT') {
      throw error;
    }
  }
}

export function resolvePort(env: NodeJS.ProcessEnv = process.env) {
  return Number(env.PORT || 8157);
}

export function formatStartupUrls(port: number, networkAddress: string) {
  return [`Local: http://localhost:${port}`, `Network: ${networkAddress}`];
}
