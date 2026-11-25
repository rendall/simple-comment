import { getContext } from "svelte"

export const discussionViewer = Symbol("discussion viewer")

export const useViewerRevision = () =>
  getContext<() => number>(discussionViewer) ?? (() => 0)
