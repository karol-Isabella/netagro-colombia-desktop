import { expect, it } from 'vitest'
import { messages } from './messages'

it('provides a nonempty translation for every key in both languages', () => {
  expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages.es).sort())
  for (const dictionary of Object.values(messages)) {
    for (const message of Object.values(dictionary)) expect(message.trim().length).toBeGreaterThan(0)
  }
})
