import { linear } from "svelte/easing"

export const open = (
  _element: HTMLElement,
  params?: {
    delay?: number
    duration?: number
    easing?: (t: number) => number
    direction?: "in" | "out" | "both"
    axis?: "x" | "y"
    max?: string
  }
) => {
  const {
    delay = 0,
    duration = 250,
    easing = linear,
    axis = "x",
    max = "100%",
  } = params ?? {}

  const [_, magnitude, unit] = max.match(/^(\d+\.?\d*)([a-zA-Z%]*)$/) ?? [
    undefined,
    "100",
    "%",
  ]

  const css = (t: number, u: number) => {
    const percent = (1 - u) * parseFloat(magnitude)
    const dimension = axis === "x" ? "width" : "height"
    return `max-${dimension}: ${percent}${unit}`
  }

  return {
    delay,
    duration,
    easing,
    css,
  }
}
