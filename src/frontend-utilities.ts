type MinComment = {
  id: string
  parentId?: string | null
  replies?: MinComment[]
}

/**
 * This function takes a topic and its replies, and threads the replies according to their parent-child relationships.
 * It returns a new topic object where each comment includes its child replies.
 * The function uses a generic type parameter to ensure that the input and output types are the same.
 *
 * @param {T} topic - The topic to which the comments belong.
 * @param {U[]} replies - An array of replies to the topic.
 * @param {(a: U, b: U) => number} [sort=(a, b) => (b.id < a.id ? 0 : 1)] - An optional sorting function for ordering the replies. By default, it sorts by id in descending order.
 * 
 * @returns {T} - A new topic object with the same type as the input topic, where each comment includes its child replies.
 */
export const threadComments = <T extends MinComment, U extends MinComment>(
  comment: T,
  allComments: U[],
  sort: (a: U, b: U) => number = (a, b) => (b.id < a.id ? 0 : 1)
) => {
  // Create a map of parent IDs to arrays of their child comments
  const parentToChildrenMap = allComments.reduce(
    (map, reply) =>
      reply.parentId
        ? {
            ...map,
            [reply.parentId]: map[reply.parentId]
              ? [...map[reply.parentId], reply]
              : [reply],
          }
        : map,
    {} as Record<string, MinComment[]>
  )

  // Now we can use this map to quickly look up the child comments for each comment
  const threadCommentsWithMap = (comment: MinComment): MinComment => {
    const replies = parentToChildrenMap[comment.id]
    if (replies) {
      return {
        ...comment,
        replies: replies.map(reply => threadCommentsWithMap(reply)).sort(sort),
      }
    } else {
      return comment
    }
  }

  return threadCommentsWithMap(comment)
}
