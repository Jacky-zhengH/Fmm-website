export interface Track {
  src: string
  title: string
  volume?: number
}

export interface Playback {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'
  elapsed: number
  duration: number
  muted: boolean
}

export class Music {
  private audio = new Audio()
  private track?: Track
  private context?: AudioContext
  private gain?: GainNode
  private volume = 0.65
  private attempt = 0
  private playback: Playback = { status: 'idle', elapsed: 0, duration: 0, muted: false }
  private events = new AbortController()

  constructor(private readonly onChange: (state: Playback) => void) {
    this.audio.preload = 'none'
    this.listen()
    document.addEventListener('visibilitychange', this.resumeContext, { signal: this.events.signal })
  }

  start(track: Track) {
    if (this.track) return
    this.track = track
    this.prepareAudio()
    this.audio.src = track.src
    this.play()
  }

  togglePlayback() {
    if (this.playback.status === 'playing' || this.playback.status === 'loading') {
      this.attempt++
      this.audio.pause()
      this.update('paused')
      return
    }
    if (this.playback.status === 'ended') this.audio.currentTime = 0
    if (this.audio.error) this.audio.load()
    this.play()
  }

  toggleMute() {
    this.playback.muted = !this.playback.muted
    this.applyLevel()
    this.update()
  }

  setVolume(volume: number) {
    if (!Number.isFinite(volume)) return
    this.volume = Math.min(1, Math.max(0, volume))
    this.applyLevel()
  }

  dispose() {
    this.attempt++
    this.events.abort()
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
    void this.context?.close().catch(() => {})
  }

  private listen() {
    const options = { signal: this.events.signal }
    for (const event of ['loadedmetadata', 'durationchange', 'timeupdate']) {
      this.audio.addEventListener(event, () => this.update(), options)
    }
    this.audio.addEventListener('pause', () => {
      if (this.playback.status === 'playing' && this.audio.paused && !this.audio.ended) this.update('paused')
    }, options)
    this.audio.addEventListener('ended', () => this.update('ended'), options)
    this.audio.addEventListener('error', () => this.update('error'), options)
  }

  private prepareAudio() {
    if (!window.AudioContext) return
    let context: AudioContext | undefined
    try {
      context = new AudioContext()
      const gain = context.createGain()
      context.createMediaElementSource(this.audio).connect(gain).connect(context.destination)
      this.gain = gain
      this.context = context
    } catch {
      if (!context) return
      void context.close().catch(() => {})
      // A partially connected element cannot reliably return to direct playback.
      this.audio = new Audio()
      this.audio.preload = 'none'
      this.listen()
    }
  }

  private resumeContext = () => {
    if (!document.hidden && !this.audio.paused && this.context?.state !== 'running') {
      void this.context?.resume().catch(() => {})
    }
  }

  private play() {
    if (!this.track) return
    const attempt = ++this.attempt
    this.applyLevel()
    if (this.context?.state !== 'running') void this.context?.resume().catch(() => {})
    this.update('loading')
    // Keep the play call in the initiating click, including on mobile Safari.
    void this.audio.play().then(() => {
      if (attempt === this.attempt && !this.audio.paused) this.update('playing')
    }).catch((error: unknown) => {
      if (attempt !== this.attempt) return
      const blocked = error instanceof DOMException && error.name === 'NotAllowedError'
      this.update(blocked ? 'paused' : 'error')
    })
  }

  private applyLevel() {
    const trackVolume = this.track?.volume
    const level = this.volume * (typeof trackVolume === 'number' && Number.isFinite(trackVolume)
      ? Math.min(1, Math.max(0, trackVolume))
      : 1)
    this.audio.muted = this.playback.muted || level === 0
    if (this.gain) this.gain.gain.value = level
    else this.audio.volume = level
  }

  private update(status = this.playback.status) {
    this.playback.status = status
    this.playback.elapsed = this.audio.currentTime
    this.playback.duration = Number.isFinite(this.audio.duration) ? this.audio.duration : 0
    this.onChange({ ...this.playback })
  }
}
