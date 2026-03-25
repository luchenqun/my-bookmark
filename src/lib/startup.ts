export function resolvePort(env: NodeJS.ProcessEnv = process.env) {
  return Number(env.PORT || 8157);
}

export function formatStartupUrls(port: number, networkAddress: string) {
  return [`Local: http://localhost:${port}`, `Network: ${networkAddress}`];
}
