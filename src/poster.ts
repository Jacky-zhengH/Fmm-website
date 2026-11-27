export const posterSizes = {
  portrait: { width: 1080, height: 1440, label: '动态配图' },
  story: { width: 1080, height: 1920, label: '手机海报' },
  landscape: { width: 1920, height: 1080, label: '桌面壁纸' },
} as const

export type PosterSize = keyof typeof posterSizes

interface PosterOptions {
  recipient: string
  days: number
  date: string
  message?: string
  signature?: string
  accent?: string
  artwork?: string
  avatars?: { left?: string; right?: string }
}

const serif = 'Georgia, "Songti SC", SimSun, "Noto Serif CJK SC", serif'
const cream = '#f1e8d7'
const brass = '#c4a97f'
const midnight = '#101421'
const pending = new WeakMap<HTMLCanvasElement, symbol>()

function hash(x: number, y: number) {
  const seed = Math.imul(x, 0x159a55e5) ^ Math.imul(y, 0x1b873593)
  const mixed = Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d)
  return ((mixed ^ (mixed >>> 12)) >>> 0) / 0xffffffff
}

function noise(x: number, y: number) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const u = x - x0
  const v = y - y0
  const s = u * u * (3 - 2 * u)
  const t = v * v * (3 - 2 * v)
  const top = hash(x0, y0) * (1 - s) + hash(x0 + 1, y0) * s
  const bottom = hash(x0, y0 + 1) * (1 - s) + hash(x0 + 1, y0 + 1) * s
  return top * (1 - t) + bottom * t
}

function makeMoon(radius: number) {
  const moon = document.createElement('canvas')
  moon.width = moon.height = Math.ceil(radius * 2 + 2)
  const context = moon.getContext('2d')!
  const terrain = context.createImageData(moon.width, moon.height)
  const center = moon.width / 2

  for (let row = 0; row < moon.height; row += 1) {
    const y = (row - center) / radius
    for (let column = 0; column < moon.width; column += 1) {
      const x = (column - center) / radius
      const distance = Math.hypot(x, y)
      if (distance >= 1) continue

      const depth = Math.sqrt(1 - distance * distance)
      const light = Math.max(0, -0.72 * x - 0.3 * y + 0.63 * depth)
      const surface = noise(x * 3.8 + 61, y * 3.8 + 4)
      const detail = noise(x * 15 + 63, y * 15 + 51)
      const grain = hash(column + 17, row + 7)
      const maria = Math.min(1, Math.max(0, (surface - 0.2) * 2))
      const albedo = 0.67 + maria * 0.31 + detail * 0.11 + grain * 0.06
      const illumination = (0.055 + 0.95 * Math.pow(light, 0.66)) * albedo
      const pixel = (row * moon.width + column) * 4
      terrain.data[pixel] = 17 + 211 * illumination
      terrain.data[pixel + 1] = 21 + 190 * illumination
      terrain.data[pixel + 2] = 33 + 159 * illumination
      terrain.data[pixel + 3] = Math.min(255, (1 - distance) * radius * 255)
    }
  }

  context.putImageData(terrain, 0, 0)
  context.globalCompositeOperation = 'source-atop'
  for (let index = 0; index < 46; index += 1) {
    const x = hash(index, 22) * 1.9 - 0.95
    const y = hash(index, 85) * 1.9 - 0.95
    const distance = x * x + y * y
    if (distance > 0.88) continue
    const light = Math.max(0, -0.72 * x - 0.3 * y + 0.63 * Math.sqrt(1 - distance))
    const r = radius * (0.01 + Math.pow(hash(index, 53), 2.5) * 0.037)
    context.lineWidth = 1
    context.globalAlpha = light * 0.31
    context.strokeStyle = '#382f2e'
    context.beginPath()
    context.arc(center + x * radius, center + y * radius, r, Math.PI, Math.PI * 1.55)
    context.stroke()
    context.strokeStyle = '#fff0cd'
    context.beginPath()
    context.arc(center + x * radius, center + y * radius, r, 0, Math.PI * 0.68)
    context.stroke()
  }
  return moon
}

function path(context: CanvasRenderingContext2D, points: [number, number][]) {
  context.beginPath()
  context.moveTo(...points[0])
  for (const point of points.slice(1)) context.lineTo(...point)
  context.stroke()
}

function spark(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  path(context, [[x - size, y], [x + size, y]])
  path(context, [[x, y - size], [x, y + size]])
}

function sky(context: CanvasRenderingContext2D, width: number, height: number, x: number, y: number, radius: number) {
  const glow = context.createRadialGradient(x, y, 0, x, y, radius * 2.65)
  glow.addColorStop(0, '#292e40')
  glow.addColorStop(0.48, '#1b2131')
  glow.addColorStop(1, midnight)
  context.fillStyle = glow
  context.fillRect(0, 0, width, height)

  const count = Math.ceil(width * height / 4400)
  context.save()
  context.fillStyle = cream
  for (let index = 0; index < count; index += 1) {
    const left = hash(index, 79) * width
    const top = hash(index, 121) * height
    const brightness = hash(index, 19)
    context.globalAlpha = 0.06 + brightness * 0.48
    context.beginPath()
    context.arc(left, top, 0.4 + brightness * brightness * 1.3, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

function illustration(
  context: CanvasRenderingContext2D, x: number, y: number, radius: number, accent: string, artwork?: HTMLImageElement,
) {
  context.save()
  context.strokeStyle = accent
  context.lineWidth = 1
  context.globalAlpha = 0.4
  for (const ratio of [1.15, 1.24]) {
    context.beginPath()
    context.arc(x, y, radius * ratio, 0, Math.PI * 2)
    context.stroke()
  }
  context.globalAlpha = 0.58
  for (let tick = 0; tick < 48; tick += 1) {
    const angle = Math.PI * tick / 24
    const inner = tick % 6 === 0 ? 1.173 : 1.206
    path(context, [
      [x + Math.cos(angle) * radius * inner, y + Math.sin(angle) * radius * inner],
      [x + Math.cos(angle) * radius * 1.24, y + Math.sin(angle) * radius * 1.24],
    ])
  }
  context.globalAlpha = 0.69
  spark(context, x + radius * 1.51, y - radius * 0.51, 12)
  spark(context, x - radius * 1.48, y + radius * 0.43, 9)
  spark(context, x - radius * 1.08, y - radius * 0.97, 6)
  context.globalAlpha = 1

  if (artwork) {
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.clip()
    const diameter = radius * 2
    const scale = Math.max(diameter / artwork.naturalWidth, diameter / artwork.naturalHeight)
    const width = artwork.naturalWidth * scale
    const height = artwork.naturalHeight * scale
    context.drawImage(artwork, x - width / 2, y - height / 2, width, height)
  } else {
    const moon = makeMoon(radius)
    context.drawImage(moon, x - moon.width / 2, y - moon.height / 2)
  }
  context.restore()
}

function avatarMedallion(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, radius: number, accent: string) {
  context.save()
  context.fillStyle = '#171a28'
  context.shadowColor = '#070910e0'
  context.shadowBlur = 17
  context.shadowOffsetY = 5
  context.beginPath()
  context.arc(x, y, radius + 6, 0, Math.PI * 2)
  context.fill()
  context.restore()

  context.save()
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.clip()
  const scale = radius * 2 / Math.min(image.naturalWidth, image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  context.drawImage(image, x - width / 2, y - height / 2, width, height)
  context.restore()

  context.save()
  const metal = context.createLinearGradient(x - radius, y - radius, x + radius, y + radius)
  metal.addColorStop(0, '#fff1d0')
  metal.addColorStop(0.42, accent)
  metal.addColorStop(0.7, '#826b50')
  metal.addColorStop(1, '#e5c9a0')
  context.strokeStyle = metal
  for (const [ringRadius, weight] of [[radius, 3], [radius + 6, 1.5]]) {
    context.lineWidth = weight
    context.beginPath()
    context.arc(x, y, ringRadius, 0, Math.PI * 2)
    context.stroke()
  }
  context.restore()
}

function portraitLinks(
  context: CanvasRenderingContext2D, x: number, y: number, moonRadius: number, accent: string, landscape: boolean,
  left?: HTMLImageElement, right?: HTMLImageElement,
) {
  const offset = landscape ? 413 : 346
  const avatarRadius = landscape ? 87 : 76
  const baseY = y + moonRadius * 0.55
  if (left && right) {
    const lineStart = x - offset + avatarRadius + 5
    const lineEnd = x + offset - avatarRadius - 5
    const points: [number, number][] = [
      [lineStart, baseY],
      [x - moonRadius * 0.44, baseY],
      [x - moonRadius * 0.36, baseY - moonRadius * 0.048],
      [x - moonRadius * 0.27, baseY],
      [x - moonRadius * 0.17, baseY],
      [x - moonRadius * 0.09, baseY + moonRadius * 0.077],
      [x, baseY - moonRadius * 0.212],
      [x + moonRadius * 0.11, baseY + moonRadius * 0.102],
      [x + moonRadius * 0.21, baseY],
      [x + moonRadius * 0.3, baseY],
      [x + moonRadius * 0.38, baseY - moonRadius * 0.045],
      [x + moonRadius * 0.47, baseY],
      [lineEnd, baseY],
    ]

    context.save()
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 5.5
    context.strokeStyle = '#1a17249c'
    path(context, points)

    const gold = context.createLinearGradient(lineStart, baseY, lineEnd, baseY)
    gold.addColorStop(0, accent)
    gold.addColorStop(0.39, '#f8dbac')
    gold.addColorStop(0.52, '#ffc3ba')
    gold.addColorStop(0.67, '#f8dbac')
    gold.addColorStop(1, accent)
    context.lineWidth = 2.7
    context.strokeStyle = gold
    context.shadowBlur = 7
    context.shadowColor = '#f4bd9e70'
    path(context, points)
    context.restore()
  }
  if (left) avatarMedallion(context, left, x - offset, baseY, avatarRadius, accent)
  if (right) avatarMedallion(context, right, x + offset, baseY, avatarRadius, accent)
}

function frame(context: CanvasRenderingContext2D, width: number, height: number, margin: number, accent: string) {
  context.save()
  context.strokeStyle = accent
  context.globalAlpha = 0.5
  context.lineWidth = 1
  context.strokeRect(margin, margin, width - margin * 2, height - margin * 2)
  context.globalAlpha = 0.9
  for (const x of [margin, width - margin]) {
    for (const y of [margin, height - margin]) {
      spark(context, x, y, 10)
    }
  }
  context.restore()
}

function spacedText(
  context: CanvasRenderingContext2D, text: string, left: number, y: number, spacing: number, centered = false,
) {
  const letters = Array.from(text)
  const widths = letters.map(letter => context.measureText(letter).width)
  const width = widths.reduce((sum, advance) => sum + advance, 0) + (letters.length - 1) * spacing
  let x = centered ? left - width / 2 : left
  context.textAlign = 'left'
  letters.forEach((letter, index) => {
    context.fillText(letter, x, y)
    x += widths[index] + spacing
  })
}

function messageText(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, maxLines: number) {
  const lines: string[] = []
  let line = ''
  const parts = text.trim().match(/\n|[^\S\n]+|[\p{Script=Han}、。！？]|[^\s\p{Script=Han}、。！？]+/gu) ?? []
  for (const part of parts) {
    if (line && (part === '\n' || context.measureText(line + part).width > width)) {
      lines.push(line.trim())
      line = ''
    }
    if (!line && !part.trim()) continue
    line += part
  }
  if (line) lines.push(line.trim())
  if (lines.length > maxLines) {
    const lastLine = lines[maxLines - 1]
    let clipped = lastLine
    while (clipped && context.measureText(`${clipped}…`).width > width) clipped = clipped.slice(0, -1)
    lines[maxLines - 1] = `${clipped}…`
  }
  lines.slice(0, maxLines).forEach((line, index) => context.fillText(line, x, y + index * 39, width))
  return Math.min(lines.length, maxLines) * 39
}

export function loadArtwork(source?: string): Promise<HTMLImageElement | undefined> {
  if (!source) return Promise.resolve(undefined)

  let url: URL
  try {
    url = new URL(source, document.baseURI)
  } catch {
    return Promise.resolve(undefined)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return Promise.resolve(undefined)

  return new Promise(resolve => {
    const image = new Image()
    const timeout = window.setTimeout(() => finish(), 5000)
    function finish(result?: HTMLImageElement) {
      window.clearTimeout(timeout)
      image.onload = image.onerror = null
      resolve(result)
    }
    image.crossOrigin = 'anonymous'
    image.onerror = () => finish()
    image.onload = () => finish(image.naturalWidth && image.naturalHeight ? image : undefined)
    image.src = url.href
  })
}

export async function renderPoster(canvas: HTMLCanvasElement, size: PosterSize, options: PosterOptions): Promise<void> {
  const request = Symbol()
  pending.set(canvas, request)
  const [artwork, leftAvatar, rightAvatar] = await Promise.all([
    loadArtwork(options.artwork),
    loadArtwork(options.avatars?.left),
    loadArtwork(options.avatars?.right),
    document.fonts?.ready,
  ])
  if (pending.get(canvas) !== request) return
  pending.delete(canvas)

  const { width, height } = posterSizes[size]
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建海报画布')

  const landscape = size === 'landscape'
  const story = size === 'story'
  const accent = options.accent && CSS.supports('color', options.accent) ? options.accent : brass
  const centerX = landscape ? 1335 : width / 2
  const centerY = landscape ? 524 : story ? 671 : 511
  const radius = landscape ? 290 : story ? 281 : 222
  const frameMargin = landscape ? 65 : 56

  sky(context, width, height, centerX, centerY, radius)
  frame(context, width, height, frameMargin, accent)
  illustration(context, centerX, centerY, radius, accent, artwork)
  portraitLinks(context, centerX, centerY, radius, accent, landscape, leftAvatar, rightAvatar)

  const labelLeft = frameMargin + 45
  const labelRight = width - labelLeft
  context.fillStyle = accent
  context.font = '500 19px system-ui, sans-serif'
  spacedText(context, 'MIDNIGHT LETTERS', labelLeft, frameMargin + 61, 4.3)
  context.textAlign = 'right'
  context.font = `23px ${serif}`
  context.fillText('深夜来信', labelRight, frameMargin + 61)

  const textX = landscape ? 168 : width / 2
  const align = landscape ? 'left' : 'center'
  const numberY = landscape ? 481 : story ? 1265 : 1002
  const nameY = numberY + (story ? 151 : 138)
  const textWidth = landscape ? 610 : 758

  context.textAlign = align
  context.fillStyle = cream
  context.font = `${landscape ? 292 : story ? 304 : 267}px ${serif}`
  context.fillText(String(options.days), textX, numberY, textWidth)

  context.fillStyle = accent
  context.font = '500 26px system-ui, sans-serif'
  spacedText(context, 'DAYS', textX, numberY + 48, 11, !landscape)

  context.lineWidth = 1
  context.strokeStyle = accent
  const ruleStart = landscape ? textX : textX - 36
  path(context, [[ruleStart, nameY - 53], [ruleStart + 72, nameY - 53]])

  context.textAlign = align
  context.fillStyle = cream
  context.font = `51px ${serif}`
  context.fillText(options.recipient, textX, nameY, textWidth)

  const messageY = nameY + 59
  let messageHeight = 0
  if (options.message?.trim()) {
    context.fillStyle = '#d4c7b6'
    context.font = `27px ${serif}`
    messageHeight = messageText(context, options.message, textX, messageY, textWidth, story || landscape ? 3 : 2)
  }
  if (options.signature?.trim()) {
    context.fillStyle = accent
    context.font = `italic 22px ${serif}`
    context.fillText(options.signature, textX, messageY + messageHeight + 3, textWidth)
  }

  const footerY = height - frameMargin - 46
  context.fillStyle = accent
  context.font = '500 20px system-ui, sans-serif'
  spacedText(context, options.date, labelLeft, footerY, 3.1)
  context.strokeStyle = accent
  for (const [index, radius] of [3, 5, 8, 5, 3].entries()) {
    context.beginPath()
    context.arc(labelRight - (4 - index) * 21, footerY - 7, radius, 0, Math.PI * 2)
    if (index === 2) context.fill()
    else context.stroke()
  }
}
