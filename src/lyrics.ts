export interface LyricCue {
  time: number
  japanese: string
  chinese: string
}

const timestamp = /^\[(\d{1,3}):([0-5]\d)(?:\.(\d{1,3}))?\]/
const offsetTag = /^\[offset:\s*([+-]?\d{1,9})\s*\]$/i

function parseLrc(source: string) {
  const lines = new Map<number, string>()
  let offset: number | undefined
  for (const line of source.split(/\r\n?|\n/)) {
    const times: number[] = []
    let text = line.trim()
    const adjustment = offsetTag.exec(text)
    if (adjustment) {
      offset = Number(adjustment[1])
      continue
    }
    let tag = timestamp.exec(text)
    while (tag) {
      const [, minutes, seconds, fraction = ''] = tag
      times.push(Number(minutes) * 60000 + Number(seconds) * 1000 + Number(fraction.padEnd(3, '0')))
      text = text.slice(tag[0].length).trimStart()
      tag = timestamp.exec(text)
    }
    for (const time of times) lines.set(time, text)
  }
  return { lines, offset }
}

export function parseBilingualLyrics(japanese: string, chinese: string): LyricCue[] {
  const { lines, offset = 0 } = parseLrc(japanese)
  const { lines: translations, offset: translationOffset = offset } = parseLrc(chinese)
  return [...lines]
    .sort(([first], [second]) => first - second)
    .map(([time, text]) => {
      const playbackTime = time - offset
      return {
        time: playbackTime / 1000,
        japanese: text,
        chinese: text ? translations.get(playbackTime + translationOffset) ?? '' : '',
      }
    })
}

export function currentLyricIndex(cues: readonly LyricCue[], time: number): number {
  if (!Number.isFinite(time)) return -1
  let start = 0
  let end = cues.length
  while (start < end) {
    const middle = Math.floor((start + end) / 2)
    if (cues[middle].time <= time) start = middle + 1
    else end = middle
  }
  return start - 1
}
