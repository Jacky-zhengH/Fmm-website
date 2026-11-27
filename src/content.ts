import type { Track } from './audio'

export const memoryPath = '/memories/nemu-200/'

interface Chapter {
  id: string
  title: string
  paper?: 'storybook'
  image?: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
  background?: string
  enter?: string
  exit?: string
}

export interface Memory {
  title: string
  recipient: string
  days: number
  unlockAt: string
  displayDate: string
  subtitle: string
  signature?: string
  animations?: boolean
  draft?: boolean
  music?: Omit<Track, 'src'> & {
    src?: string
    fallback?: Track
    cues?: { at: number; tone: 'dawn' | 'clear' | 'tide' | 'tail' }[]
    lyrics?: { japanese: string; chinese: string }
  }
  poster?: {
    message?: string
    accent?: string
    artwork?: string
    avatars?: { left?: string; right?: string }
    storybookArtwork?: string
  }
  chapters: Chapter[]
}

export async function loadMemory(): Promise<Memory> {
  const response = await fetch(`${memoryPath}config.json`, { cache: 'no-cache' })
  if (!response.ok) throw new Error('纪念配置无法加载')
  const memory: Memory = await response.json()
  if (typeof memory.title !== 'string' || typeof memory.recipient !== 'string' ||
      !Number.isSafeInteger(memory.days) || memory.days < 1 ||
      typeof memory.unlockAt !== 'string' || !/(Z|[+-]\d\d:\d\d)$/.test(memory.unlockAt) ||
      !Number.isFinite(Date.parse(memory.unlockAt)) || !Array.isArray(memory.chapters) ||
      !memory.chapters.length || memory.chapters.some(chapter => !chapter?.id || !chapter.title)) {
    throw new Error('纪念配置格式有误')
  }
  return memory
}

export function memoryAsset(path?: string) {
  if (typeof path !== 'string' || !path.trim()) return undefined
  try {
    const url = new URL(path, new URL(memoryPath, location.origin))
    return url.origin === location.origin && url.pathname.startsWith(memoryPath) ? url.href : undefined
  } catch {
    return undefined
  }
}

export function memoryTrack(track?: Track): Track | undefined {
  const src = memoryAsset(track?.src)
  return track && src ? { ...track, src } : undefined
}

export async function loadLetter() {
  const response = await fetch(`${memoryPath}letter.md`, { cache: 'no-cache' })
  if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
    throw new Error('来信暂时无法读取')
  }
  const sections = parseLetter(await response.text())
  if (sections.size === 0) throw new Error('来信缺少章节')
  return sections
}

// Paragraphs preserve single line breaks, while level-two headings match the chapter configuration.
export function parseLetter(markdown: string) {
  const sections = new Map<string, string[]>()
  const source = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  for (const section of source.split(/^##[\t ]+/m).slice(1)) {
    const endOfTitle = section.indexOf('\n')
    if (endOfTitle === -1) continue
    const title = section.slice(0, endOfTitle).trim()
    const paragraphs = section.slice(endOfTitle + 1).trim().split(/\n\s*\n/).filter(Boolean)
    sections.set(title, paragraphs)
  }
  return sections
}
