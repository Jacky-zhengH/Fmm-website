export function getCountdown(target: number, now: number) {
  const total = Math.max(0, Math.ceil((target - now) / 1000))
  return [
    Math.floor(total / 86400),
    Math.floor(total / 3600) % 24,
    Math.floor(total / 60) % 60,
    total % 60,
  ]
}

export function clockFrom(offset: string | null, realNow = Date.now) {
  const simulatedStart = offset ? Date.parse(offset) : NaN
  if (!Number.isFinite(simulatedStart)) return realNow
  const realStart = realNow()
  return () => simulatedStart + realNow() - realStart
}
