export function readAuthorizationToken(headerValue?: string) {
  if (!headerValue) {
    return null;
  }

  const trimmed = headerValue.trim();
  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.slice(7).trim();
  }

  return trimmed;
}
