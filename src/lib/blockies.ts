// Nicked from https://github.com/download13/blockies/
// The random number is a js implementation of the Xorshift PRNG
// const randseed = new Array(4); // Xorshift: [x, y, z, w] 32 bit values
import Prando from "prando"

export const createColor = (rand: () => number) => {
  //saturation is the whole color spectrum
  const h = Math.floor(rand() * 360)
  //saturation goes from 40 to 100, it avoids greyish colors
  const s = rand() * 60 + 40 + "%"
  //lightness can be anything from 0 to 100, but probabilities are a bell curve around 50%
  const l = (rand() + rand() + rand() + rand()) * 25 + "%"

  return "hsl(" + h + "," + s + "," + l + ")"
}

export const createImageData = (size: number, rand: () => number) => {
  const width = size // Only support square icons for now
  const height = size

  const dataWidth = Math.ceil(width / 2)
  const mirrorWidth = width - dataWidth

  const data = Array.from({ length: height }, () => {
    const row = Array.from({ length: dataWidth }, () =>
      Math.floor(rand() * 2.3)
    )
    const r = row.slice(0, mirrorWidth)
    r.reverse()
    return row.concat(r)
  }).flat()

  return data
}

export const getGenerator = (seed: string) => new Prando(seed)

type BlockiesBuildOpts = {
  seed: string
  size: number
  scale: number
  color: string
  bgcolor: string
  spotcolor: string
  rand: () => number
}

export const buildOpts = (
  opts: Partial<BlockiesBuildOpts> = {}
): BlockiesBuildOpts => {
  const seed =
    opts.seed || Math.floor(Math.random() * Math.pow(10, 16)).toString(16)
  const generator = getGenerator(seed)

  const rand = () => generator.next() as number

  const size = opts.size || 8
  const scale = opts.scale || 4
  const color = opts.color || createColor(rand)
  const bgcolor = opts.bgcolor || createColor(rand)
  const spotcolor = opts.spotcolor || createColor(rand)
  return { seed, size, scale, color, bgcolor, spotcolor, rand }
}

export const renderIcon = (
  opts: Partial<BlockiesBuildOpts>,
  canvas: HTMLCanvasElement
): HTMLCanvasElement => {
  const fullOpts = buildOpts(opts)
  const imageData = createImageData(fullOpts.size, fullOpts.rand)
  const width = Math.sqrt(imageData.length)

  canvas.width = canvas.height = fullOpts.size * fullOpts.scale

  const cc = canvas.getContext("2d")

  if (cc === null) throw "Unable to acquire canvas context"

  cc.fillStyle = fullOpts.bgcolor
  cc.fillRect(0, 0, canvas.width, canvas.height)
  cc.fillStyle = fullOpts.color

  for (let i = 0; i < imageData.length; i++) {
    // if data is 0, leave the background
    if (imageData[i]) {
      const row = Math.floor(i / width)
      const col = i % width

      // if data is 2, choose spot color, if 1 choose foreground
      cc.fillStyle = imageData[i] == 1 ? fullOpts.color : fullOpts.spotcolor

      cc.fillRect(
        col * fullOpts.scale,
        row * fullOpts.scale,
        fullOpts.scale,
        fullOpts.scale
      )
    }
  }

  return canvas
}

export const createIcon = (
  opts: Partial<BlockiesBuildOpts> = buildOpts(),
  canvas = document.createElement("canvas")
) => renderIcon(opts, canvas)

export const blockiesMemoized = () => {
  let memo = new Map()

  const getDataUrl = (
    opts: Partial<BlockiesBuildOpts> = buildOpts(),
    doClearCache = false
  ) => {
    if (doClearCache) memo = new Map()
    const key = JSON.stringify(opts)
    if (memo.has(key)) {
      return memo.get(key)
    } else {
      try {
        const result = createIcon(opts).toDataURL("image/png")
        memo.set(key, result)
        return result
      } catch (error) {
        console.error(error)
        // if error, just return a 1x1 transparent png
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      }
    }
  }

  return getDataUrl
}
