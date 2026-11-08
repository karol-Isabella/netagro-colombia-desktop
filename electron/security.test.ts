import { describe, expect, it } from 'vitest'
import { contentSecurityPolicy, isTrustedDocument } from './security'

describe('document trust boundary', () => {
  const document = 'file:///C:/NetAgro/dist/index.html'
  it('allows hash routes in the exact local document', () => {
    expect(isTrustedDocument(`${document}#/settings`, document)).toBe(true)
  })
  it.each([
    'file:///C:/NetAgro/dist/other.html',
    'file:///C:/NetAgro/dist/index.html?remote=1',
    'https://attacker.example/index.html',
    'data:text/html,test',
    'invalid',
  ])('rejects another document: %s', (url) => {
    expect(isTrustedDocument(url, document)).toBe(false)
  })
  it('does not trust arbitrary localhost origins or paths', () => {
    const dev = 'http://127.0.0.1:5173/'
    expect(isTrustedDocument(`${dev}#/map`, dev)).toBe(true)
    expect(isTrustedDocument('http://127.0.0.1:5173/evil', dev)).toBe(false)
    expect(isTrustedDocument('http://127.0.0.1:5174/', dev)).toBe(false)
  })
  it('forbids production connections and inline scripts', () => {
    const policy = contentSecurityPolicy(false)
    expect(policy).toContain("connect-src 'none'")
    expect(policy).toContain("script-src 'self';")
    expect(policy).not.toContain('https:')
    expect(policy).not.toContain('ws:')
  })
})
