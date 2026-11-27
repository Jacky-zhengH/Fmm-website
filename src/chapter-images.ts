const retainedImageCount = 3
const retainedImages = new Map<string, HTMLImageElement>()

export function warmChapterImage(url?: string): void {
  if (!url) return

  const retained = retainedImages.get(url)
  if (retained) {
    retainedImages.delete(url)
    retainedImages.set(url, retained)
    return
  }

  const image = new Image()
  image.decoding = 'async'
  image.fetchPriority = 'low'
  image.addEventListener('error', () => {
    if (retainedImages.get(url) === image) retainedImages.delete(url)
  }, { once: true })
  retainedImages.set(url, image)

  if (retainedImages.size > retainedImageCount) {
    const oldest = retainedImages.keys().next()
    if (!oldest.done) retainedImages.delete(oldest.value)
  }

  image.src = url
  // Loading the chapter never waits on this background decode.
  void image.decode().catch(() => {})
}
