/// <reference types="svelte" />
import { getDefaultDiscussionId } from "./apiClient"
import SimpleComment from "./components/SimpleComment.svelte"

declare global {
  interface Window {
    loadSimpleComment: (options: Options) => void
    setSimpleCommentDiscussion: (discussionId: string) => void
    setSimpleCommentOptions: (setupOptions: { [key: string]: unknown }) => void
  }
}

let simpleComment

let options = {
  cancel: false,
  discussionId: getDefaultDiscussionId(),
  target: document.getElementById("simple-comment") ?? document.body,
  title: document.title,
}

type Options = typeof options

/**
 * Sets the options for the SimpleComment component.
 * This function merges the provided options with the default options.
 * If an option is not provided, the default value is used.
 *
 * @param {Object} setupOptions - An object containing options for the SimpleComment component.
 * @param {string} setupOptions.discussionId - The ID of the discussion to be displayed by the SimpleComment component.
 * @param {string} setupOptions.title - The title of the discussion.
 * @param {HTMLElement} setupOptions.target - The HTML element in which the SimpleComment component should be rendered.
 */
window.setSimpleCommentOptions = setupOptions =>
  (options = { ...options, ...setupOptions })

/**
 * Sets the discussionId for the SimpleComment component.
 * This function is a shorthand for calling setSimpleCommentOptions with an object that has a discussionId property.
 *
 * @param {string} discussionId - The ID of the discussion to be displayed by the SimpleComment component.
 *
 * @example
 *
 * ```html
 * <!-- Include the SimpleComment script -->
 * <script type="module" src="simple-comment.js" defer></script>
 *
 * <!-- Set the discussionId -->
 * <script type="module">
 *   window.setSimpleCommentDiscussion("http-localhost-7070");
 * </script>
 * ```
 */
window.setSimpleCommentDiscussion = (discussionId: string) =>
  window.setSimpleCommentOptions({ discussionId })

const loadSimpleComment = (setupOptions:Options) => {
  options = { ...options, ...setupOptions }
  simpleComment = new SimpleComment({
    target: options.target,
    props: { discussionId: options.discussionId, title: options.title },
  })
}

window.loadSimpleComment = loadSimpleComment

// Wait for DOMContentLoaded event before initializing SimpleComment
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded", {options})
  if (options.cancel) return
  else loadSimpleComment(options)
})



export default {
  simpleComment,
  setSimpleCommentOptions: window.setSimpleCommentOptions,
  setSimpleCommentDiscussion: window.setSimpleCommentDiscussion,
  loadSimpleComment: window.loadSimpleComment,
}
