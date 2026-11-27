import assert from 'node:assert/strict'
import test from 'node:test'
import { clockFrom, getCountdown, isPublicReviewPath } from '../src/clock.ts'

const midnight = Date.parse('2026-11-28T00:00:00+08:00')

test('Beijing midnight is one instant across time zones', () => {
  assert.equal(midnight, Date.parse('2026-11-27T16:00:00Z'))
  assert.deepEqual(getCountdown(midnight, Date.parse('2026-11-27T10:29:00-05:00')), [0, 0, 31, 0])
})

test('the countdown stays positive until the deadline and never goes negative', () => {
  assert.deepEqual(getCountdown(midnight, midnight - 1), [0, 0, 0, 1])
  assert.deepEqual(getCountdown(midnight, midnight), [0, 0, 0, 0])
  assert.deepEqual(getCountdown(midnight, midnight + 10000), [0, 0, 0, 0])
})

test('a paused tab catches up in one update using elapsed wall time', () => {
  let current = 10000
  const readClock = clockFrom('2026-11-27T23:59:55+08:00', () => current)
  assert.deepEqual(getCountdown(midnight, readClock()), [0, 0, 0, 5])
  current += 180000
  assert.deepEqual(getCountdown(midnight, readClock()), [0, 0, 0, 0])
  assert.ok(readClock() > midnight)
})

test('missing or invalid simulation falls back to system time', () => {
  assert.equal(clockFrom('invalid', () => midnight)(), midnight)
  assert.equal(clockFrom(null, () => midnight)(), midnight)
})

test('only the dedicated preview page has the public review route', () => {
  for (const path of ['/memories/nemu-200/preview', '/memories/nemu-200/preview/', '/memories/nemu-200/preview/index.html']) {
    assert.equal(isPublicReviewPath(path), true)
  }
  for (const path of ['/', '/memories/nemu-200/', '/memories/nemu-200/index.html', '/memories/nemu-200/preview/other']) {
    assert.equal(isPublicReviewPath(path), false)
  }
})
