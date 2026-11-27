export interface Track {
  src: string
  title: string
  volume?: number
  start?: number
  loop?: boolean
  fade?: number
}

interface Deck {
  audio: HTMLAudioElement
  gain?: GainNode
  track?: Track
  mix: number
  seekAfterMetadata: boolean
}

function bounded(value: number | undefined, fallback: number, max = 1): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(max, value))
    : fallback
}

function startTime(track: Track): number {
  return bounded(track.start, 0, Number.MAX_SAFE_INTEGER)
}

function sameClip(first?: Track, second?: Track): boolean {
  return !!first && !!second && first.src === second.src && startTime(first) === startTime(second)
}

export class Music {
  private decks: [Deck, Deck]
  private active?: Deck
  private pending?: Deck
  private selected?: Track
  private upcoming?: Track
  private context?: AudioContext
  private audioPrepared = false
  private elementVolume = true
  private optedIn = false
  private volume = 0.7
  private attempt = 0
  private frame = 0
  private finishFade?: () => void

  constructor(private readonly onChange: (status: string) => void) {
    this.decks = [this.createDeck(), this.createDeck()]
    document.addEventListener('visibilitychange', this.restore)
    window.addEventListener('pageshow', this.restore)
    window.addEventListener('focus', this.restore)
  }

  get enabled(): boolean {
    return this.optedIn
  }

  setTrack(track?: Track): void {
    this.selected = track
    if (this.optedIn) this.syncTrack()
  }

  prime(track?: Track): void {
    this.upcoming = track
    this.preload()
  }

  enable(): void {
    if (!this.optedIn) {
      this.optedIn = true
      this.prepareAudio()
    }
    this.resumeContext()
    this.syncTrack()
  }

  toggle(): void {
    if (!this.optedIn) {
      this.enable()
      return
    }
    this.optedIn = false
    this.attempt++
    this.pending = undefined
    this.cancelFade()
    this.decks.forEach((deck) => this.stop(deck))
    this.onChange('音乐关闭')
  }

  setVolume(value: number): void {
    this.volume = bounded(value, this.volume)
    this.decks.forEach((deck) => this.applyLevel(deck))
  }

  dispose(): void {
    this.optedIn = false
    this.attempt++
    this.cancelFade()
    document.removeEventListener('visibilitychange', this.restore)
    window.removeEventListener('pageshow', this.restore)
    window.removeEventListener('focus', this.restore)
    for (const deck of this.decks) {
      this.stop(deck)
      deck.audio.removeAttribute('src')
      deck.audio.load()
    }
    void this.context?.close().catch(() => {})
  }

  private createDeck(): Deck {
    const audio = new Audio()
    audio.preload = 'none'
    const deck: Deck = { audio, mix: 0, seekAfterMetadata: false }
    audio.addEventListener('loadedmetadata', () => {
      if (deck.seekAfterMetadata && deck.track) {
        deck.seekAfterMetadata = false
        this.seek(deck, startTime(deck.track))
      }
    })
    audio.addEventListener('ended', () => {
      if (this.optedIn && deck === this.active && !this.pending) this.onChange('曲目播放完毕')
    })
    audio.addEventListener('error', () => {
      if (this.optedIn && deck === this.active && !this.pending && audio.error) {
        this.onChange('音乐无法播放')
      }
    })
    return deck
  }

  private prepareAudio(): void {
    if (this.audioPrepared) return
    this.audioPrepared = true
    const AudioGraph = window.AudioContext
    if (AudioGraph) {
      let context: AudioContext | undefined
      try {
        context = new AudioGraph()
        for (const deck of this.decks) {
          const gain = context.createGain()
          gain.gain.value = 0
          context.createMediaElementSource(deck.audio).connect(gain)
          gain.connect(context.destination)
          deck.gain = gain
        }
        this.context = context
        return
      } catch {
        // An element already attached to a failed graph needs replacing for direct playback.
        void context?.close().catch(() => {})
        this.decks = [this.createDeck(), this.createDeck()]
        this.active = undefined
      }
    }
    const { audio } = this.decks[0]
    audio.volume = 0.5
    this.elementVolume = audio.volume === 0.5
    audio.volume = 1
  }

  private resumeContext(): void {
    if (this.context && this.context.state !== 'running') {
      void this.context.resume().catch(() => {})
    }
  }

  private restore = (): void => {
    if (document.hidden) {
      this.finishFade?.()
      return
    }
    if (!this.optedIn) return
    this.resumeContext()
    const audio = this.active?.audio
    if (audio?.paused && !audio.ended && !audio.error && !this.pending) this.syncTrack()
  }

  private applyLevel(deck: Deck): void {
    const level = this.volume * deck.mix * bounded(deck.track?.volume, 1)
    if (deck.gain) {
      deck.gain.gain.value = level
    } else {
      deck.audio.muted = level === 0
      if (this.elementVolume) deck.audio.volume = level
    }
  }

  private stop(deck: Deck): void {
    deck.audio.pause()
    deck.mix = 0
    this.applyLevel(deck)
  }

  private cancelFade(): void {
    window.cancelAnimationFrame(this.frame)
    this.finishFade = undefined
  }

  private crossfade(incoming: Deck | undefined, seconds: number): void {
    this.cancelFade()
    const from = this.decks.map((deck) => ({ deck, level: deck.mix }))
    const apply = (progress: number) => {
      for (const { deck, level } of from) {
        const destination = deck === incoming ? 1 : 0
        deck.mix = level + progress * (destination - level)
        this.applyLevel(deck)
      }
    }
    const finish = () => {
      this.cancelFade()
      apply(1)
      for (const deck of this.decks) {
        if (deck !== incoming) this.stop(deck)
      }
      this.preload()
    }
    if (!seconds || document.hidden || (!this.context && !this.elementVolume)) {
      finish()
      return
    }
    this.finishFade = finish
    const started = performance.now()
    const update = (now: number) => {
      const progress = Math.min(1, (now - started) / (1000 * seconds))
      if (progress >= 1) {
        finish()
        return
      }
      apply(progress)
      this.frame = window.requestAnimationFrame(update)
    }
    this.frame = window.requestAnimationFrame(update)
  }

  private load(deck: Deck, track: Track): void {
    if (deck.track?.src !== track.src || deck.audio.error) {
      deck.seekAfterMetadata = false
      deck.audio.src = track.src
      deck.audio.preload = 'metadata'
      deck.audio.load()
    }
    deck.track = track
    deck.audio.loop = track.loop ?? true
  }

  private seek(deck: Deck, start: number): void {
    const { audio } = deck
    try {
      audio.currentTime = Number.isFinite(audio.duration) && start >= audio.duration ? 0 : start
    } catch {
      // loadedmetadata retries browsers that cannot seek a newly assigned source yet.
    }
  }

  private preload(): void {
    const track = this.upcoming
    if (!this.optedIn || !track || this.pending || this.finishFade || track.src === this.selected?.src) return
    const idle = this.decks.find((deck) => deck !== this.active && deck.audio.paused)
    if (idle) this.load(idle, track)
  }

  private syncTrack(): void {
    const track = this.selected
    if (track && this.pending && sameClip(this.pending.track, track)) {
      this.load(this.pending, track)
      this.applyLevel(this.pending)
      return
    }
    const attempt = ++this.attempt
    if (this.pending && this.pending !== this.active) this.stop(this.pending)
    this.pending = undefined
    const previous = this.active
    if (!track) {
      this.active = undefined
      this.crossfade(undefined, bounded(previous?.track?.fade, 3, 10))
      this.onChange('本段暂无配乐')
      return
    }

    const continueTrack = previous && sameClip(previous.track, track) && !previous.audio.error
    const incoming = continueTrack ? previous : this.decks.find((deck) => deck !== previous)!
    if (!continueTrack) {
      this.cancelFade()
      this.stop(incoming)
    }
    this.play(incoming, track, attempt, !continueTrack, continueTrack ? undefined : previous)
  }

  private play(deck: Deck, track: Track, attempt: number, restart: boolean, fallback?: Deck): void {
    const { audio } = deck
    this.pending = deck
    this.load(deck, track)
    if (restart) {
      deck.seekAfterMetadata = audio.readyState < audio.HAVE_METADATA
      this.seek(deck, startTime(track))
    }
    this.applyLevel(deck)
    // Call play in the same task as the gesture so Safari can authorize it.
    void audio.play().then(() => {
      if (attempt !== this.attempt) return
      this.pending = undefined
      this.active = deck
      const current = deck.track ?? track
      this.crossfade(deck, bounded(current.fade, 3, 10))
      this.onChange(current.title)
    }).catch((error: unknown) => {
      if (attempt !== this.attempt) return
      this.stop(deck)
      this.pending = undefined
      const blocked = error instanceof DOMException && error.name === 'NotAllowedError'
      if (blocked && fallback) {
        this.stop(fallback)
        this.active = undefined
        this.play(fallback, deck.track ?? track, attempt, true)
        return
      }
      this.active = undefined
      if (blocked) this.optedIn = false
      this.crossfade(undefined, blocked ? 0 : bounded(track.fade, 3, 10))
      this.onChange(blocked ? '请点按音乐按钮开启播放' : '音乐无法播放')
    })
  }
}
