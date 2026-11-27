<script setup lang="ts">
import { computed } from 'vue'
import { currentLyricIndex } from './lyrics'
import type { LyricCue } from './lyrics'

const props = defineProps<{ cues: readonly LyricCue[]; elapsed: number; shown: boolean }>()
const holdTime = 8
const lines = computed(() => {
  if (!props.shown) return undefined
  const index = currentLyricIndex(props.cues, props.elapsed)
  const current = props.cues[index]
  if (!current?.japanese || !current.chinese || props.elapsed - current.time >= holdTime) return undefined
  const previous = props.cues[index - 1]
  const next = props.cues[index + 1]
  return {
    current,
    previous: previous?.japanese && previous.chinese && current.time - previous.time <= holdTime ? previous : null,
    next: next?.japanese && next.chinese && next.time - current.time <= holdTime ? next : null,
  }
})
</script>

<template>
  <aside class="lyric-atmosphere" aria-label="双语歌词">
    <Transition name="lyric-roll">
      <div v-if="lines" :key="lines.current.time" class="lyric-stack">
        <div class="lyric-pair lyric-neighbor" aria-hidden="true">
          <span lang="ja">{{ lines.previous?.japanese }}</span>
          <span lang="zh-Hans">{{ lines.previous?.chinese }}</span>
        </div>
        <div class="lyric-pair lyric-current">
          <span lang="ja">{{ lines.current.japanese }}</span>
          <span lang="zh-Hans">{{ lines.current.chinese }}</span>
        </div>
        <div class="lyric-pair lyric-neighbor" aria-hidden="true">
          <span lang="ja">{{ lines.next?.japanese }}</span>
          <span lang="zh-Hans">{{ lines.next?.chinese }}</span>
        </div>
      </div>
    </Transition>
  </aside>
</template>

<style scoped>
.lyric-atmosphere {
  display: grid;
  align-items: center;
  position: sticky;
  top: clamp(3.5rem, 25vh, 13rem);
  min-width: 0;
  padding-block: 1.15rem;
}

.lyric-atmosphere::before {
  content: "";
  position: absolute;
  inset: -1rem -0.4rem;
  pointer-events: none;
  background:
    radial-gradient(circle at 88% 15%, #eadcc456 0.7px, transparent 2px),
    radial-gradient(circle at 96% 48%, #d5dfef4d 0.5px, transparent 1.5px),
    radial-gradient(circle at 69% 93%, #eadcc449 0.6px, transparent 1.7px);
}

.lyric-stack {
  grid-area: 1 / 1;
  display: grid;
  grid-template-rows: repeat(3, minmax(3.25rem, auto));
  gap: 0.85rem;
}

.lyric-pair {
  display: grid;
  align-content: center;
  gap: 0.3rem;
  overflow-wrap: anywhere;
}

.lyric-pair span[lang="ja"] { color: #eee8de; font: 1.02rem/1.52 var(--serif); }
.lyric-pair span[lang="zh-Hans"] { color: #c9cbd1; font: 0.85rem/1.6 var(--serif); }
.lyric-current { opacity: 0.89; }
.lyric-neighbor { opacity: 0.43; }
.lyric-roll-enter-active, .lyric-roll-leave-active { transition: opacity 480ms ease, transform 560ms cubic-bezier(.22,.7,.22,1); }
.lyric-roll-enter-from { opacity: 0; transform: translateY(0.65rem); }
.lyric-roll-leave-to { opacity: 0; transform: translateY(-0.65rem); }

@media (max-width: 899px) {
  .lyric-atmosphere { position: static; text-align: center; padding: 0.25rem 0 0; }
  .lyric-atmosphere::before { display: none; }
  .lyric-stack { grid-template-rows: auto; }
  .lyric-neighbor { display: none; }
}
</style>
