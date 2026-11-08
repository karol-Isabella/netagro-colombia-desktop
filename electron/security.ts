export function isTrustedDocument(candidate: string, trusted: string): boolean {
  try {
    const url = new URL(candidate)
    const expected = new URL(trusted)
    // HashRouter changes the fragment, never the document or query.
    url.hash = ''
    expected.hash = ''
    return url.href === expected.href
  } catch {
    return false
  }
}

export function contentSecurityPolicy(development: boolean): string {
  const connections = development ? "'self' ws://127.0.0.1:5173" : "'none'"
  return [
    "default-src 'none'",
    development ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connections}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-src 'none'",
  ].join('; ')
}
