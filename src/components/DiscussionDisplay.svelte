<script lang="ts">
  import CommentList from "./CommentList.svelte"
  import type {
    Discussion,
    Comment,
    User,
    ServerResponse,
  } from "../lib/simple-comment-types"
  import { useMachine } from "@xstate/svelte"
  import { createNewTopic, getOneDiscussion } from "../apiClient"
  import { discussionMachine } from "../lib/discussion.xstate"
  import { isResponseOk, threadComments } from "../frontend-utilities"
  import CommentInput from "./CommentInput.svelte"
  import SkeletonComment from "./low-level/SkeletonComment.svelte"

  export let discussionId: string
  export let title: string = ""
  export let currentUser: User | undefined
  const emptyTopicMessages = [
    "Looks like this topic is waiting for its first thoughts. Be the pioneer and start the conversation!",
    "This space is all yours! Kick off the discussion with your insights.",
    "No comments yet. Share your perspective and spark the dialogue!",
    "It's quiet here... Why not break the ice with your viewpoint?",
    "A fresh topic awaits your input. Lead the way with your comment!",
  ]

  let repliesFlatArray: (Comment & { isNew?: true })[] = []
  let discussion: Discussion = {
    id: "",
    title,
    isLocked: false,
    dateCreated: undefined,
  }
  let showReply = discussionId

  const { state, send } = useMachine(discussionMachine)

  const updateStatusDisplay = (message = "", error = false) =>
    error ? console.error(message) : console.info(message)

  const loadingStateHandler = () => {
    getOneDiscussion(discussionId)
      .then(response => {
        if (isResponseOk(response)) {
          const topic = response.body as Discussion
          updateDiscussionDisplay(topic, topic.replies)
          send({ type: "SUCCESS" })
        } else {
          send({ type: "ERROR", error: response })
        }
      })
      .catch(error => {
        send({ type: "ERROR", error })
      })
  }

  const updateDiscussionDisplay = (
    topic: Discussion,
    topicReplies: Comment[] | undefined
  ) => {
    repliesFlatArray = topicReplies ?? []
    discussion = threadComments(
      topic,
      topicReplies,
      (a, b) =>
        new Date(b.dateCreated).valueOf() - new Date(a.dateCreated).valueOf()
    )
  }

  const errorStateHandler = () => {
    const error = $state.context.error
    if (!error) {
      console.error("Unknown error")
      console.trace()
      return
    }

    if (typeof error === "string") {
      console.error(error)
      return
    }

    const { status, statusText, ok, body } = error as ServerResponse
    if (ok) console.warn("Error handler caught an OK response", error)

    const isUnknownTopic =
      status === 404 && statusText === "Not Found" && body.startsWith("Topic")

    if (isUnknownTopic) {
      setTimeout(() => {
        send("CREATE")
      }, 1)
      return
    }

    const errorMessages = [
      [
        403,
        "User not authorized",
        "Oops! It looks like this discussion topic hasn't been created yet. The administrator needs to set it up. Please check back later or contact the site admin. Thanks for your patience!",
      ],
    ]

    const messageTuple = errorMessages.find(
      ([_code, text, _friendly]) => text === body
    )
    if (messageTuple) {
      const [code, _text, friendly] = messageTuple as [number, string, string]
      if (code !== status)
        console.warn(
          `Error response code ${status} does not match error message code ${code}`
        )
      updateStatusDisplay(friendly, true)
    } else updateStatusDisplay(`${status}:${statusText} ${body}`, true)
  }

  const creatingStateHandler = () => {
    createNewTopic(discussionId, title)
      .then(response => {
        if (isResponseOk(response)) send("SUCCESS")
        else send({ type: "ERROR", error: response })
      })
      .catch(error => send({ type: "ERROR", error }))
  }

  // Update the single source of truth without roundtrip to the server
  const onCommentPosted = commentPostedEvent => {
    const { comment } = commentPostedEvent.detail
    repliesFlatArray = [{ ...comment, isNew: true }, ...repliesFlatArray]
    updateDiscussionDisplay(discussion, repliesFlatArray)
  }

  const onCommentUpdated = commentUpdatedEvent => {
    const { comment } = commentUpdatedEvent.detail
    repliesFlatArray = repliesFlatArray.map(reply =>
      reply.id === comment.id ? { ...comment, isNew: true } : reply
    )
    updateDiscussionDisplay(discussion, repliesFlatArray)
  }

  const onReply = event => {
    const { commentId } = event.detail
    showReply = commentId === "" ? discussionId : commentId
  }

  const onReplyClick = event => {
    event.preventDefault()
    showReply = discussionId
  }

  // Update the single source of truth without roundtrip to the server
  const onCommentDeleted = commentDeletedEvent => {
    const { commentId } = commentDeletedEvent.detail
    const comment = repliesFlatArray.find(comment => comment.id === commentId)
    const hasReplies = repliesFlatArray.some(
      comment => comment.parentId === commentId
    )
    // if comment has replies, it is a soft delete
    if (hasReplies) {
      const softDeletedComment: Comment = {
        ...comment,
        user: null,
        userId: null,
        text: null,
        dateDeleted: new Date(),
      }
      repliesFlatArray = repliesFlatArray.map(comment =>
        comment.id === commentId ? softDeletedComment : comment
      )
    }
    // otherwise it is a hard delete
    else
      repliesFlatArray = repliesFlatArray.filter(
        comment => comment.id !== commentId
      )

    updateDiscussionDisplay(discussion, repliesFlatArray)
  }

  $: {
    const stateHandlers: [string, () => void][] = [
      ["loading", loadingStateHandler],
      ["creating", creatingStateHandler],
      ["error", errorStateHandler],
    ]

    stateHandlers.forEach(([stateValue, stateHandler]) => {
      if ($state.value === stateValue) stateHandler()
    })
  }
</script>

<section class="simple-comment-discussion">
  {#if !discussion?.replies}
    <p class="instructions">
      {emptyTopicMessages[
        Math.floor(Math.random() * emptyTopicMessages.length)
      ]}
    </p>
  {/if}
  {#if showReply === discussionId}
    <CommentInput
      commentId={discussionId}
      {currentUser}
      on:posted={onCommentPosted}
    />
  {:else}
    <div class="button-row">
      <button on:click={onReplyClick} class="comment-reply-button">Reply</button
      >
    </div>
  {/if}

  {#if discussion?.replies}
    <CommentList
      {currentUser}
      {showReply}
      replies={discussion.replies}
      on:reply={onReply}
      on:delete={onCommentDeleted}
      on:posted={onCommentPosted}
      on:updated={onCommentUpdated}
    />
  {/if}
  {#if $state.value === "loading"}
    <SkeletonComment />
    <div style="margin-bottom:10rem" />
  {/if}
</section>
