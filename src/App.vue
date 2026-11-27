<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { Music } from './audio'
import { clockFrom, getCountdown } from './clock'
import { loadLetter, loadMemory, memoryAsset, memoryPath, memoryTrack } from './content'
import type { Memory } from './content'
import { posterSizes, renderPoster } from './poster'
import type { PosterSize } from './poster'

type Phase = 'loading' | 'waiting' | 'arriving' | 'ready' | 'opening' | 'reading' | 'finale' | 'poster' | 'error'

const archive = location.pathname === '/' || location.pathname === '/index.html'
const isDevelopment = import.meta.env.DEV
const simulatedAt = isDevelopment ? new URLSearchParams(location.search).get('at') : null
const now = clockFrom(simulatedAt)
const memory = ref<Memory>()
const phase = ref<Phase>('loading')
const countdown = ref([0, 0, 0, 0])
const chapterIndex = ref(0)
const letter = ref(new Map<string, string[]>())
const letterStatus = ref<'pending' | 'loaded' | 'error'>('pending')
const imageFailed = ref(false)
const musicStatus = ref('音乐关闭')
const musicOn = ref(false)
const volume = ref(0.65)
const posterSize = ref<PosterSize>('portrait')
const posterCanvas = ref<HTMLCanvasElement>()
const posterUrl = ref('')
const posterFailed = ref(false)
const capture = ref(false)
const heading = ref<HTMLElement>()
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)')
const music = new Music(status => {
  musicStatus.value = status
  musicOn.value = music.enabled
})
let manuallyControlled = false
let clockTimer: number | undefined
let sceneTimer: number | undefined
let posterRevision = 0
let letterRequest: Promise<void> | undefined

const firstStage = computed(() => ['waiting', 'arriving', 'ready', 'opening'].includes(phase.value))
const locked = computed(() => phase.value === 'waiting')
const chapter = computed(() => memory.value?.chapters[chapterIndex.value])
const paragraphs = computed(() => chapter.value ? letter.value.get(chapter.value.title) ?? [] : [])
const day = computed(() => memory.value ? memory.value.days - Number(locked.value) : 0)
const chapterNumber = computed(() => String(chapterIndex.value + 1).padStart(2, '0'))
const chapterTotal = computed(() => String(memory.value?.chapters.length ?? 0).padStart(2, '0'))
const image = computed(() => memoryAsset(chapter.value?.image))
const chapterBackground = computed(() => {
  const background = chapter.value?.background
  if (!background) return undefined
  if (CSS.supports('color', background)) return { backgroundColor: background }
  const asset = memoryAsset(background)
  return asset ? { '--chapter-backdrop': `url("${asset.replaceAll('"', '%22')}")` } : undefined
})

function allowMotion() {
  return memory.value?.animations !== false && !motionPreference.matches
}

function focusScene() {
  window.scrollTo(0, 0)
  void nextTick(() => heading.value?.focus({ preventScroll: true }))
}

function updateClock() {
  if (!memory.value || phase.value !== 'waiting') return
  const target = Date.parse(memory.value.unlockAt)
  const current = now()
  countdown.value = getCountdown(target, current)
  if (current < target) return
  clearInterval(clockTimer)
  phase.value = allowMotion() ? 'arriving' : 'ready'
  if (phase.value === 'arriving') {
    sceneTimer = window.setTimeout(() => { phase.value = 'ready' }, 950)
  }
}

function toggleMusic() {
  manuallyControlled = true
  music.toggle()
  musicOn.value = music.enabled
}

function changeVolume(event: Event) {
  volume.value = Number((event.target as HTMLInputElement).value)
  music.setVolume(volume.value)
}

function requestLetter() {
  letterStatus.value = 'pending'
  letterRequest = loadLetter().then(sections => {
    letter.value = sections
    letterStatus.value = 'loaded'
  }).catch(() => {
    letterStatus.value = 'error'
    letterRequest = undefined
  })
}

function openLetter() {
  if (phase.value !== 'ready' || !memory.value) return
  music.setTrack(memoryTrack(memory.value.chapters[0]?.music))
  if (!manuallyControlled) music.enable()
  musicOn.value = music.enabled
  if (!letterRequest) requestLetter()
  if (!allowMotion()) {
    showChapter(0)
    return
  }
  phase.value = 'opening'
  sceneTimer = window.setTimeout(finishOpening, 1650)
  void nextTick(() => heading.value?.focus({ preventScroll: true }))
}

function finishOpening() {
  if (phase.value !== 'opening') return
  clearTimeout(sceneTimer)
  showChapter(0)
}

function showChapter(index: number) {
  if (!memory.value || index < 0 || index >= memory.value.chapters.length) return
  chapterIndex.value = index
  imageFailed.value = false
  phase.value = 'reading'
  music.setTrack(memoryTrack(memory.value.chapters[index]?.music))
  music.prime(memoryTrack(memory.value.chapters[index + 1]?.music ?? memory.value.finaleMusic))
  focusScene()
}

let movingChapter = false

function chapterStep(delta: -1 | 1) {
  if (!memory.value) return
  const chapterCount = memory.value.chapters.length
  const run = () => {
    if (chapterIndex.value + delta >= chapterCount) showFinale()
    else showChapter(chapterIndex.value + delta)
  }
  const panel = heading.value?.closest<HTMLElement>('.letter-paper')
  if (movingChapter || chapterIndex.value + delta < 0) return
  if (allowMotion() && chapter.value?.exit === 'fade' && panel?.animate) {
    movingChapter = true
    const leaving = panel.animate([{ opacity: 1 }, { opacity: 0.15, transform: 'translateY(-6px)' }], { duration: 160, fill: 'forwards' })
    void leaving.finished.then(() => {
      run()
      leaving.cancel()
    }).catch(() => undefined).finally(() => { movingChapter = false })
  } else {
    run()
  }
}

function reloadPage() {
  location.reload()
}

function showFinale() {
  capture.value = false
  posterRevision++
  if (posterUrl.value) URL.revokeObjectURL(posterUrl.value)
  posterUrl.value = ''
  phase.value = 'finale'
  music.setTrack(memoryTrack(memory.value?.finaleMusic))
  focusScene()
}

async function showPoster() {
  phase.value = 'poster'
  focusScene()
  await nextTick()
  await drawPoster()
}

async function drawPoster() {
  if (!memory.value || !posterCanvas.value) return
  const revision = ++posterRevision
  const sheet = document.createElement('canvas')
  posterFailed.value = false
  if (posterUrl.value) URL.revokeObjectURL(posterUrl.value)
  posterUrl.value = ''
  try {
    await renderPoster(sheet, posterSize.value, {
      recipient: memory.value.recipient,
      days: memory.value.days,
      date: memory.value.displayDate,
      signature: memory.value.signature,
      message: memory.value.poster?.message,
      accent: memory.value.poster?.accent,
      artwork: memoryAsset(memory.value.poster?.artwork),
    })
    if (revision !== posterRevision || !posterCanvas.value) return
    posterCanvas.value.width = sheet.width
    posterCanvas.value.height = sheet.height
    const context = posterCanvas.value.getContext('2d')
    if (!context) throw new Error('Canvas unavailable')
    context.drawImage(sheet, 0, 0)
    sheet.toBlob(blob => {
      if (revision !== posterRevision) return
      if (blob) posterUrl.value = URL.createObjectURL(blob)
      else posterFailed.value = true
    }, 'image/png')
  } catch {
    if (revision === posterRevision) posterFailed.value = true
  }
}

function setCapture(enabled: boolean) {
  capture.value = enabled
  focusScene()
}

function handleKeys(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (event.key === 'Escape' && capture.value) {
    setCapture(false)
    return
  }
  if (phase.value !== 'reading' || (event.target as HTMLElement | null)?.closest('input, select, textarea')) return
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    chapterStep(event.key === 'ArrowLeft' ? -1 : 1)
  }
}

onMounted(async () => {
  document.addEventListener('visibilitychange', updateClock)
  window.addEventListener('focus', updateClock)
  window.addEventListener('pageshow', updateClock)
  window.addEventListener('keydown', handleKeys)
  music.setVolume(volume.value)
  try {
    memory.value = await loadMemory()
    if (archive) return
    if (now() < Date.parse(memory.value.unlockAt)) {
      phase.value = 'waiting'
      updateClock()
      music.setTrack(memoryTrack(memory.value.waitingMusic))
      if (phase.value === 'waiting') clockTimer = window.setInterval(updateClock, 200)
    } else {
      phase.value = 'ready'
      music.setTrack(memoryTrack(memory.value.waitingMusic ?? memory.value.chapters[0]?.music))
    }
  } catch {
    phase.value = 'error'
  }
})

onUnmounted(() => {
  clearInterval(clockTimer)
  clearTimeout(sceneTimer)
  posterRevision++
  if (posterUrl.value) URL.revokeObjectURL(posterUrl.value)
  document.removeEventListener('visibilitychange', updateClock)
  window.removeEventListener('focus', updateClock)
  window.removeEventListener('pageshow', updateClock)
  window.removeEventListener('keydown', handleKeys)
  music.dispose()
})
</script>

<template>
  <div class="site" :class="{ 'capture-mode': capture, 'still': memory?.animations === false }" :data-phase="phase">
    <a v-if="!capture" class="skip" href="#content">跳至正文</a>
    <header v-if="!capture" class="masthead page-width">
      <a class="brand" href="/" aria-label="Midnight Letters 深夜来信，档案首页">
        <span class="brand-mark" aria-hidden="true"><i></i></span>
        <span>Midnight Letters<small>深夜来信</small></span>
      </a>
      <div v-if="!archive && memory" class="audio-controls">
        <label v-if="musicOn" class="volume">
          <span class="sr-only">音乐音量</span>
          <input type="range" min="0" max="1" step="0.05" :value="volume" @input="changeVolume">
        </label>
        <button type="button" class="music-button" :aria-pressed="musicOn" :title="musicStatus" @click="toggleMusic">
          <span class="equalizer" :class="{ playing: musicOn }" aria-hidden="true"><i></i><i></i><i></i></span>
          {{ musicOn ? '关闭音乐' : '开启音乐' }}
        </button>
        <span class="sr-only" role="status">{{ musicStatus }}</span>
      </div>
    </header>

    <main id="content">
      <section v-if="archive" class="archive page-width">
        <div class="archive-copy">
          <p class="kicker">MIDNIGHT LETTERS ARCHIVE</p>
          <h1>深夜来信</h1>
          <p>把值得记住的日子，写成信。</p>
          <a v-if="memory && (!memory.draft || isDevelopment)"
             class="action" :href="memoryPath">{{ memory.draft ? '预览 Nemu · 200 Days' : memory.title }}</a>
          <p v-else-if="memory" class="hint">纪念信件将在定稿后收入档案。</p>
        </div>
      </section>

      <section v-else-if="memory && firstStage" class="arrival page-width">
        <div class="arrival-copy">
          <p class="kicker hero-kicker"><span></span>{{ memory.recipient }} · 纪念特辑</p>
          <h1 ref="heading" tabindex="-1" class="day-title" :aria-label="`第 ${day} 天`" :key="day">
            <span>{{ day }}</span><em aria-hidden="true">days</em>
          </h1>
          <h2>{{ locked ? '一封等待零点的来信' : (phase === 'opening' ? '正在拆开来信' : `第 ${day} 天，来信已抵达`) }}</h2>
          <p class="subtitle">{{ memory.subtitle }}</p>
          <div v-if="locked" class="countdown">
            <div class="countdown-label"><span>距离来信抵达</span><span class="time-zone">北京时间</span></div>
            <div class="counter" role="timer" aria-label="距离解封">
              <div v-for="(unit, i) in ['天', '小时', '分钟', '秒']" :key="unit" class="time-unit">
                <span>{{ String(countdown[i]).padStart(2, '0') }}</span><small>{{ unit }}</small>
              </div>
            </div>
          </div>
          <div v-else class="opening-choices">
            <p v-if="phase === 'arriving'" class="arriving-note" role="status">封存时间已到</p>
            <template v-if="phase === 'ready'">
              <button class="action" type="button" @click="openLetter">拆开来信</button>
              <p class="hint">{{ manuallyControlled && !musicOn ? '音乐已关闭' : '点击拆信即可播放章节配乐' }}</p>
            </template>
            <button v-if="phase === 'opening'" class="text-action" type="button" @click="finishOpening">跳过动画</button>
          </div>
        </div>
        <div class="moon-frame" :class="{ 'unsealed': !locked, 'is-opening': phase === 'opening' }">
          <div class="frame-picture" aria-hidden="true"></div>
          <div class="frame-lines" aria-hidden="true"></div>
          <div class="star-sparks" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <span class="frame-recipient">TO {{ memory.recipient.replace(/.*\s/, '').toUpperCase() }}</span>
          <button v-if="phase === 'ready'" type="button" class="envelope-button" aria-label="打开信封" @click="openLetter">
            <span class="envelope" aria-hidden="true">
              <span class="env-back"></span><span class="env-paper"></span><span class="env-pocket"></span><span class="env-flap"></span><span class="env-seal">✦</span>
            </span>
          </button>
          <div v-else class="envelope-button" aria-hidden="true">
            <span class="envelope">
              <span class="env-back"></span><span class="env-paper"></span><span class="env-pocket"></span><span class="env-flap"></span><span class="env-seal">✦</span>
            </span>
          </div>
          <span class="frame-date">{{ memory.displayDate }}</span>
          <span class="frame-status"><span aria-hidden="true">✧</span> {{ locked ? '封存中' : '已解封' }}</span>
        </div>
      </section>

      <section v-else-if="memory && chapter && phase === 'reading'" class="reading page-width" :style="chapterBackground">
        <aside class="chapter-guide" aria-label="阅读目录">
          <p class="kicker">信件章节</p>
          <p class="chapter-count"><strong>{{ chapterNumber }}</strong> / {{ chapterTotal }}</p>
          <ol>
            <li v-for="(item, i) in memory.chapters" :key="item.id">
              <button type="button" :aria-current="i === chapterIndex ? 'step' : undefined" @click="showChapter(i)">{{ item.title }}</button>
            </li>
          </ol>
        </aside>
        <article :key="chapter.id" class="letter-paper" :class="`chapter-enter-${chapter.enter || 'fade'}`">
          <header class="paper-head">
            <p class="kicker">MIDNIGHT LETTERS <span>／</span> {{ chapterNumber }}</p>
            <h1 ref="heading" tabindex="-1">{{ chapter.title }}</h1>
            <p v-if="memory.draft" class="draft-note">试读版 · 正文待替换</p>
          </header>
          <img v-if="image && !imageFailed" class="chapter-image" :src="image" :alt="chapter.imageAlt || ''" decoding="async" @error="imageFailed = true">
          <div class="letter-text">
            <p v-if="letterStatus === 'pending'" role="status">正在取出信纸…</p>
            <div v-else-if="letterStatus === 'error'">
              <p>来信暂时无法读取。</p>
              <button type="button" class="text-action" @click="requestLetter">重新载入</button>
            </div>
            <template v-else>
              <p v-for="(paragraph, i) in paragraphs" :key="i">{{ paragraph }}</p>
              <p v-if="!paragraphs.length">这一章暂时留白。</p>
            </template>
            <p v-if="memory.signature && chapterIndex === memory.chapters.length - 1" class="signature">{{ memory.signature }}</p>
          </div>
          <nav class="letter-nav" aria-label="章节翻页">
            <button type="button" class="text-action" :disabled="chapterIndex === 0" @click="chapterStep(-1)">上一章</button>
            <span>{{ chapterNumber }} / {{ chapterTotal }}</span>
            <button type="button" class="action" @click="chapterStep(1)">{{ chapterIndex === memory.chapters.length - 1 ? '读到落幕' : '下一章' }}</button>
          </nav>
        </article>
      </section>

      <section v-else-if="memory && phase === 'finale'" class="finale page-width">
        <p class="kicker">{{ memory.displayDate }} · {{ memory.recipient }}</p>
        <h1 ref="heading" tabindex="-1" class="day-title"><span>{{ memory.days }}</span><em>days</em></h1>
        <p class="finale-message">{{ memory.poster?.message || '来信读毕，纪念留存。' }}</p>
        <div class="finale-actions">
          <button type="button" class="action" @click="showPoster">查看纪念海报</button>
          <button type="button" class="text-action" @click="showChapter(0)">重新阅读</button>
        </div>
      </section>

      <section v-else-if="memory && phase === 'poster'" class="poster-page page-width" :class="{ 'landscape-poster': posterSize === 'landscape' }">
        <div v-if="!capture" class="poster-controls">
          <p class="kicker">{{ memory.title }}</p>
          <h1 ref="heading" tabindex="-1">纪念海报</h1>
          <label for="poster-size">海报尺寸</label>
          <select id="poster-size" v-model="posterSize" @change="drawPoster">
            <option v-for="(size, key) in posterSizes" :key="key" :value="key">{{ size.label }} · {{ size.width }} × {{ size.height }}</option>
          </select>
          <a v-if="posterUrl" class="action" :href="posterUrl" :download="`nemu-200-${posterSize}.png`">保存 PNG</a>
          <a v-if="posterUrl" class="text-action" :href="posterUrl" target="_blank" rel="noopener">打开原图</a>
          <button type="button" class="text-action" @click="setCapture(true)">纯净截图模式</button>
          <button type="button" class="text-action back-to-finale" @click="showFinale">返回落幕</button>
          <p v-if="posterFailed" role="status" class="hint">PNG 暂时无法生成，可使用截图模式。</p>
        </div>
        <figure class="poster-sheet">
          <canvas ref="posterCanvas" role="img" :aria-label="`${memory.recipient} ${memory.days} 天纪念海报`">{{ memory.recipient }} · {{ memory.days }} DAYS · {{ memory.displayDate }}</canvas>
          <button v-if="capture" ref="heading" type="button" class="exit-capture" aria-label="退出纯净截图模式" title="点击或按 Esc 退出" @click="setCapture(false)"></button>
        </figure>
      </section>

      <section v-else class="center-message page-width">
        <h1>{{ phase === 'error' ? '来信暂时无法载入' : '正在取出深夜来信…' }}</h1>
        <button v-if="phase === 'error'" type="button" class="action" @click="reloadPage">重试</button>
      </section>
    </main>

    <footer v-if="!capture" class="site-footer page-width">
      <span>{{ archive ? '纪念档案' : (memory?.title || '深夜来信') }}</span>
      <span v-if="!archive && musicStatus !== '音乐关闭'" class="current-track">{{ musicStatus }}</span>
      <span v-else-if="simulatedAt" class="current-track">本地时间模拟</span>
      <span>{{ memory?.displayDate || 'Midnight Letters' }}<span v-if="!archive"> · CST</span></span>
    </footer>
  </div>
</template>
