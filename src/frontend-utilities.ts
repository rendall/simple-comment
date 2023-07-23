import type {
  ServerResponse,
  ServerResponseSuccess,
  Validation,
} from "./lib/simple-comment-types"

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
): T => {
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
    {} as Record<string, U[]>
  )

  // Now we can use this map to quickly look up the child comments for each comment
  const threadCommentsWithMap = <W extends MinComment>(comment: W): W => {
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

export const validateUserName = (username: string): Validation => {
  if (username.length === 0) {
    return { isValid: false, reason: "Username cannot be empty." }
  }

  const isValid = /^[a-z0-9-]*$/.test(username)
  if (!isValid) {
    return {
      isValid: false,
      reason:
        "Username is not valid. Please use only lowercase letters (a-z), numbers (0-9), and hyphens (-).",
    }
  }

  const isTooShort = username.length < 4
  if (isTooShort) {
    return {
      isValid: false,
      reason:
        "Username is too short. The username must be at least 4 characters.",
    }
  }

  const isTooLong = username.length > 30
  if (isTooLong) {
    return { isValid: false, reason: "Username is too long." }
  }

  return { isValid: true }
}

/** Serves as both a type guard and predicate for validation objects */
export const isValidationTrue = (
  validation: Validation
): validation is { isValid: true } => validation.isValid === true

/** Type guard for success vs error responses */
export const isResponseOk = <T>(
  res: ServerResponse<T>
): res is ServerResponseSuccess<T> => res.ok === true

/**
 * Creates a debounced function that delays invoking the provided
 * function until after `wait` milliseconds have elapsed since the
 * last time the debounced function was invoked. Typically used to
 * run an expensive or async function after user interaction.
 *
 * @template T The type of the function to debounce.
 * @param {T} func The function to debounce.
 * @param {number} [wait=250] The number of milliseconds to delay.
 * @returns {(...args: Parameters<T>) => void} Returns the new debounced function.
 *
 * @example
 * // Usage with a function that takes one string parameter
 * const logMessage = (message: string) => console.log(message);
 * const debouncedLogMessage = debounceFunc(logMessage, 300);
 * debouncedLogMessage('Hello, world!');
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounceFunc = <T extends (...args: any[]) => void>(
  func: T,
  wait = 250
) => {
  let debounceTimeout: number | null = null
  return (...args: Parameters<T>): void => {
    if (debounceTimeout) {
      window.clearTimeout(debounceTimeout)
    }
    debounceTimeout = window.setTimeout(() => {
      func(...args)
    }, wait)
  }
}
export const formatDate = (date: Date | string | undefined, locale?:string) =>
  date
    ? new Date(date).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    : "unknown"
