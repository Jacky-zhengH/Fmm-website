import { loadArtwork, posterSizes } from './poster'
import type { PosterSize } from './poster'

interface StorybookPosterOptions {
  date: string
  days: number
  recipient: string
  artwork?: string | HTMLImageElement
}

interface IllustrationBounds {
  x: number
  y: number
  width: number
  height: number
}

const ink = '#3b3028'
const seal = '#823c34'
const gilt = '#946c41'
const displayFont = 'KaiTi, STKaiti, "Songti SC", "Noto Serif CJK SC", SimSun, serif'
const bodyFont = '"Songti SC", "Noto Serif CJK SC", SimSun, serif'
const storyTitle = '旅者、小丑和小狐狸'
const passage = [
  '谢谢你喜欢过阳光的旅者，',
  '也谢谢你愿意在没有阳光的时候，',
  '分给他一点月光。',
]
const closing = '晚安，小狐狸。我的心挂念着你。'

function drawParchment(context: CanvasRenderingContext2D, width: number, height: number) {
  const paper = context.createLinearGradient(0, 0, width, height)
  paper.addColorStop(0, '#f1dcb1')
  paper.addColorStop(0.37, '#fbefda')
  paper.addColorStop(0.69, '#f3e3c3')
  paper.addColorStop(1, '#e6c49b')
  context.fillStyle = paper
  context.fillRect(0, 0, width, height)

  const edge = context.createRadialGradient(width / 2, height * 0.45, Math.min(width, height) * 0.19,
    width / 2, height * 0.45, Math.hypot(width, height) * 0.54)
  edge.addColorStop(0, '#7a4e2d00')
  edge.addColorStop(0.65, '#7a4e2d0a')
  edge.addColorStop(1, '#7a4e2d57')
  context.fillStyle = edge
  context.fillRect(0, 0, width, height)

  context.save()
  context.fillStyle = '#6e4b2c'
  let seed = 53
  for (let grain = 0; grain < 9000; grain += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const x = (seed / 0x100000000) * width
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const y = (seed / 0x100000000) * height
    context.globalAlpha = 0.025 + (seed % 100) * 0.00055
    context.fillRect(x, y, grain % 11 === 0 ? 4 : 1.6, 1)
  }
  context.restore()
}

function drawDiamond(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.beginPath()
  context.moveTo(x, y - radius)
  context.lineTo(x + radius * 0.55, y)
  context.lineTo(x, y + radius)
  context.lineTo(x - radius * 0.55, y)
  context.closePath()
  context.fill()
}

function drawCorner(context: CanvasRenderingContext2D, x: number, y: number, horizontal: number, vertical: number) {
  context.save()
  context.translate(x, y)
  context.scale(horizontal, vertical)
  context.strokeStyle = gilt
  context.fillStyle = seal
  context.lineWidth = 1.5
  context.beginPath()
  context.moveTo(3, 75)
  context.bezierCurveTo(16, 32, 7, 14, 44, 8)
  context.bezierCurveTo(59, 6, 67, 23, 77, 15)
  context.moveTo(4, 52)
  context.bezierCurveTo(16, 40, 41, 36, 34, 23)
  context.bezierCurveTo(29, 16, 23, 23, 28, 27)
  context.stroke()
  drawDiamond(context, 13, 13, 6)
  context.restore()
}

function drawFrame(context: CanvasRenderingContext2D, width: number, height: number, margin: number) {
  context.save()
  context.strokeStyle = gilt
  context.lineWidth = 1.6
  context.strokeRect(margin, margin, width - margin * 2, height - margin * 2)
  context.globalAlpha = 0.62
  context.strokeRect(margin + 10, margin + 10, width - (margin + 10) * 2, height - (margin + 10) * 2)
  context.globalAlpha = 0.92
  for (const [x, directionX] of [[margin + 20, 1], [width - margin - 20, -1]]) {
    for (const [y, directionY] of [[margin + 20, 1], [height - margin - 20, -1]]) {
      drawCorner(context, x, y, directionX, directionY)
    }
  }
  context.restore()
}

function drawRule(context: CanvasRenderingContext2D, x: number, y: number, halfWidth: number) {
  context.strokeStyle = gilt
  context.lineWidth = 1.2
  context.beginPath()
  context.moveTo(x - halfWidth, y)
  context.lineTo(x - 17, y)
  context.moveTo(x + 17, y)
  context.lineTo(x + halfWidth, y)
  context.stroke()
  context.fillStyle = seal
  drawDiamond(context, x, y, 8)
}

function drawFallbackScene(context: CanvasRenderingContext2D, bounds: IllustrationBounds) {
  const scale = Math.min(bounds.width / 760, bounds.height / 375)
  context.save()
  context.translate(bounds.x + bounds.width / 2 - 380 * scale, bounds.y + bounds.height / 2 - 187.5 * scale)
  context.scale(scale, scale)
  context.fillStyle = '#c4925650'
  context.beginPath()
  context.arc(372, 153, 111, 0, Math.PI * 2)
  context.fill()

  // Cloaked traveler with a bedroll and walking staff.
  context.fillStyle = '#3e3b32'
  context.fill(new Path2D('M83 319 L117 314 L142 233 Q141 208 151 177 Q127 195 104 208 L77 197 Q92 165 112 147 Q127 132 151 128 L153 103 Q130 91 143 87 L161 85 Q165 63 183 62 Q204 61 211 87 L231 93 Q239 101 212 106 Q211 121 197 132 Q230 138 244 168 L260 191 L278 182 L286 191 L262 207 Q248 209 232 193 L226 190 Q223 226 245 267 L223 270 L232 311 L255 320 L254 328 L213 328 L196 276 L187 279 L174 321 L177 329 L140 329 L136 322 L115 328 L83 328 Z'))
  context.strokeStyle = '#3e3b32'
  context.lineWidth = 6
  context.beginPath()
  context.moveTo(284, 173)
  context.lineTo(271, 329)
  context.stroke()

  // A jester's pointed cap, belled collar and cape.
  context.fillStyle = '#51322e'
  context.fill(new Path2D('M441 328 L466 313 L486 250 L467 248 Q487 219 489 179 Q470 187 457 207 L445 202 Q451 170 482 148 L492 139 Q482 126 484 111 L467 105 Q439 112 431 91 Q448 96 464 86 Q480 75 492 91 Q493 62 521 54 Q515 73 526 94 Q545 78 569 96 L588 113 Q567 105 546 118 Q549 133 537 144 L561 152 L555 168 L574 169 Q589 200 598 217 L588 225 Q569 215 552 188 Q557 214 573 243 L555 248 L565 306 L592 322 L586 329 L550 327 L531 259 L523 260 L504 327 Z'))
  for (const [x, y] of [[430, 89], [523, 53], [590, 114]]) {
    context.beginPath()
    context.arc(x, y, 6, 0, Math.PI * 2)
    context.fill()
  }

  // A seated fox with a curved tail.
  context.fillStyle = '#78483a'
  context.fill(new Path2D('M352 328 Q316 333 303 314 Q286 294 311 277 Q330 264 353 281 Q369 275 365 246 Q366 224 381 208 L379 185 L395 196 L411 188 L412 208 Q425 217 444 229 Q443 239 425 244 Q410 246 405 257 Q405 273 424 299 Q431 309 443 315 L451 329 L415 329 Q403 317 392 320 Q378 329 352 328 Z'))
  context.strokeStyle = '#8f6d465c'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(55, 335)
  context.bezierCurveTo(209, 327, 540, 347, 672, 332)
  context.stroke()
  context.restore()
}

function drawScene(context: CanvasRenderingContext2D, bounds: IllustrationBounds, artwork?: HTMLImageElement) {
  const { x, y, width, height } = bounds
  const glow = context.createRadialGradient(x + width / 2, y + height * 0.44, height * 0.04,
    x + width / 2, y + height * 0.44, height * 0.44)
  glow.addColorStop(0, '#fef6dfb8')
  glow.addColorStop(0.68, '#e9bd7d38')
  glow.addColorStop(1, '#e9bd7d00')
  context.fillStyle = glow
  context.fillRect(x, y, width, height)

  if (artwork?.naturalWidth && artwork.naturalHeight) {
    const scale = Math.min(width / artwork.naturalWidth, height / artwork.naturalHeight)
    const sceneWidth = artwork.naturalWidth * scale
    const sceneHeight = artwork.naturalHeight * scale
    context.imageSmoothingQuality = 'high'
    context.drawImage(artwork, x + (width - sceneWidth) / 2, y + (height - sceneHeight) / 2, sceneWidth, sceneHeight)
  } else {
    drawFallbackScene(context, bounds)
  }
}

function drawWaxSeal(context: CanvasRenderingContext2D, x: number, y: number, days: number) {
  context.save()
  context.translate(x, y)
  context.rotate(-0.12)
  const wax = context.createLinearGradient(0, -43, 0, 43)
  wax.addColorStop(0, '#a15849')
  wax.addColorStop(1, '#73322c')
  context.fillStyle = wax
  context.beginPath()
  for (let point = 0; point < 64; point += 1) {
    const angle = point * Math.PI / 32
    const radius = 41 + Math.sin(angle * 5) * 1.8 + Math.cos(angle * 8) * 1.4
    const left = Math.cos(angle) * radius
    const top = Math.sin(angle) * radius
    if (point === 0) context.moveTo(left, top)
    else context.lineTo(left, top)
  }
  context.closePath()
  context.fill()
  context.strokeStyle = '#f3c28da0'
  context.lineWidth = 1.3
  context.beginPath()
  context.arc(0, 0, 32, 0, Math.PI * 2)
  context.stroke()
  context.fillStyle = '#f3d9b8'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = '28px Georgia, serif'
  context.fillText(String(days), 0, 1, 56)
  context.restore()
}

export async function renderStorybookPoster(canvas: HTMLCanvasElement, size: PosterSize, options: StorybookPosterOptions): Promise<void> {
  const [artwork] = await Promise.all([
    typeof options.artwork === 'string' ? loadArtwork(options.artwork) : options.artwork,
    document.fonts?.ready,
  ])
  const { width, height } = posterSizes[size]
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建海报画布')

  const landscape = size === 'landscape'
  const tall = size === 'story'
  const margin = landscape ? 63 : 53
  const art = landscape
    ? { x: 910, y: 207, width: 891, height: 640 }
    : { x: 117, y: tall ? 389 : 315, width: 846, height: tall ? 627 : 480 }
  drawParchment(context, width, height)
  drawFrame(context, width, height, margin)
  drawScene(context, art, artwork)

  const left = margin + 82
  const right = width - left
  context.fillStyle = seal
  context.textAlign = 'left'
  context.font = 'small-caps 24px Georgia, serif'
  context.fillText('Midnight Letters', left, margin + 73)
  context.textAlign = 'right'
  context.font = `25px ${bodyFont}`
  context.fillText('深夜来信', right, margin + 73)

  const textX = landscape ? 160 : width / 2
  const titleY = landscape ? 343 : tall ? 270 : 244
  const quoteY = landscape ? 483 : tall ? 1140 : 908
  const lineHeight = landscape ? 65 : tall ? 78 : 61
  const textWidth = landscape ? 725 : 806

  context.textAlign = landscape ? 'left' : 'center'
  context.font = `bold ${landscape ? 68 : tall ? 79 : 71}px ${displayFont}`
  context.fillStyle = ink
  context.fillText(storyTitle, textX, titleY, textWidth)
  drawRule(context, landscape ? textX + 107 : textX, titleY + 43, landscape ? 107 : 112)

  context.textAlign = landscape ? 'left' : 'center'
  context.fillStyle = ink
  context.font = `${tall ? 45 : 42}px ${displayFont}`
  for (const [index, line] of passage.entries()) {
    context.fillText(line, textX, quoteY + lineHeight * index, textWidth)
  }
  context.fillStyle = seal
  context.font = `${tall ? 36 : 33}px ${bodyFont}`
  context.fillText(closing, textX, quoteY + lineHeight * 3 + 32, textWidth)

  const footerY = height - margin - 52
  context.font = '23px Georgia, serif'
  context.fillStyle = gilt
  context.textAlign = 'left'
  context.fillText(options.date, left, footerY)
  context.font = `26px ${bodyFont}`
  context.textAlign = 'right'
  context.fillText(options.recipient, right, footerY, width * 0.37)
  drawWaxSeal(context, width / 2, footerY - 9, options.days)
}
