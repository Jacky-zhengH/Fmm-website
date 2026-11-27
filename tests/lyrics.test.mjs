import assert from 'node:assert/strict'
import test from 'node:test'
import { currentLyricIndex, parseBilingualLyrics } from '../src/lyrics.ts'

test('pairs equivalent timestamps while preserving repeated lines and instrumental gaps', () => {
  const cues = parseBilingualLyrics(
    '\uFEFF[ti:Track]\r\n[00:20.1][00:40.100]First\r\n[00:32.50]',
    '[00:20.100][00:40.10]Translation\n[00:31]Unpaired',
  )

  assert.deepEqual(cues, [
    { time: 20.1, japanese: 'First', chinese: 'Translation' },
    { time: 32.5, japanese: '', chinese: '' },
    { time: 40.1, japanese: 'First', chinese: 'Translation' },
  ])
  assert.deepEqual([0, 40.1, 32.5, 20.1].map(time => currentLyricIndex(cues, time)), [-1, 2, 1, 0])
})

test('a translation without an offset follows the Japanese timeline', () => {
  const cues = parseBilingualLyrics('[00:10]First\n[offset:+250]', '[00:10]Translation')
  assert.deepEqual(cues, [{ time: 9.75, japanese: 'First', chinese: 'Translation' }])
})

test('pairs explicitly offset translations at their effective time', () => {
  const cues = parseBilingualLyrics('[offset:-500]\n[00:10]First', '[offset:+500]\n[00:11]Translation')
  assert.deepEqual(cues, [{ time: 10.5, japanese: 'First', chinese: 'Translation' }])
})
