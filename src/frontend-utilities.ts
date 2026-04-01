import { blockiesMemoized } from "./lib/blockies"
import type {
  ServerResponse,
  ServerResponseSuccess,
  ValidationResult,
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
  allComments: U[] | undefined,
  sort: (a: U, b: U) => number = (a, b) => (b.id < a.id ? 0 : 1)
): T => {
  const commentWithoutReplies = <W extends MinComment>(comment: W): W => {
    const { replies: _replies, ...commentWithNoReplies } = comment
    return commentWithNoReplies as W
  }

  if (!allComments) return commentWithoutReplies(comment)
  // Make this robust but warn
  allComments = allComments.filter(reply => {
    if (reply && reply.id) return true
    else {
      console.warn(`Bad data in comment ${comment.id} replies:`, reply)
      return false
    }
  })
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
      return commentWithoutReplies(comment)
    }
  }

  return threadCommentsWithMap(comment)
}
const transliterationMap = {
  "a": "aaàáâäãāαå",
  "b": "bβвб",
  "c": "cçčć",
  "d": "dδд",
  "e": "eeèéêëēėεеё€",
  "f": "fφф",
  "g": "gγг",
  "h": "hηхх",
  "i": "iiìíîïīιиії",
  "j": "jй",
  "k": "kκк",
  "l": "llłλл",
  "m": "mμм",
  "n": "nñńн",
  "o": "ooòóôõöøōο",
  "p": "pπп",
  "q": "q",
  "r": "rр",
  "s": "sßšś",
  "t": "tτт",
  "u": "uùúûüūυ",
  "v": "vν",
  "w": "wω",
  "x": "xχ",
  "y": "yγу",
  "z": "zžźżз",
}

const transliterate = (char: string = ""): string =>
  (Object.entries(transliterationMap).find(([_key, value]) =>
    value.includes(char)
  ) ?? [char, undefined])[0]

/** Convert a display name to a default user id */
export const formatUserId = (displayName: string) => {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, (match: string) => transliterate(match))
    .replace(/[^a-z0-9-]/g, "-")
}

export const validatePassword = (password: string): ValidationResult => {
  if (password.length === 0) {
    return { isValid: false, reason: "Password is required." }
  }

  const isValid = password.trim() === password
  if (!isValid) {
    return {
      isValid: false,
      reason: "The password cannot begin or end with a space.",
    }
  }

  const isTooShort = password.length < 4
  if (isTooShort) {
    return {
      isValid: false,
      reason: "The password must be at least 6 characters long",
    }
  }

  return { isValid: true }
}

/** Serves as both a type guard and predicate for validation objects */
export const isValidationTrue = (
  validation: ValidationResult
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
 * const logMessage = (message: string) =>  * const debouncedLogMessage = debounceFunc(logMessage, 300);
 * debouncedLogMessage('Hello, world!');
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounceFunc = <T extends (...args: any[]) => void>(
  func: T,
  wait = 250
) => {
  let debounceTimeout: number | null = null
  return (...args: Parameters<T>): void => {
    window.clearTimeout(debounceTimeout!)
    debounceTimeout = window.setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export const shortFormatDate = (
  date: Date | string | undefined,
  locale?: string
) => {
  if (!date) return "unknown"
  const dateObj = new Date(date)
  const now = new Date()
  const isThisYear = now.getFullYear() === dateObj.getFullYear()
  const isToday =
    isThisYear &&
    now.getMonth() === dateObj.getMonth() &&
    now.getDate() === dateObj.getDate()

  if (isToday)
    return new Date(date).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })
  else
    return new Date(date).toLocaleDateString(locale, {
      year: isThisYear ? undefined : "numeric",
      month: isToday ? undefined : "short",
      day: isToday ? undefined : "numeric",
      hour: isToday ? "numeric" : undefined,
      minute: isToday ? "numeric" : undefined,
    })
}

export const longFormatDate = (
  date: Date | string | undefined,
  locale?: string
) =>
  date
    ? new Date(date).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    : "unknown"

// TODO: consider instead https://github.com/dmester/jdenticon
const idIconDataUrlFunc = blockiesMemoized()
export const idIconDataUrl = (userId: string) =>
  idIconDataUrlFunc({
    seed: userId,
    size: 8,
    scale: 6,
  })

export const toParagraphs = (comment: string) =>
  comment
    .replace(/\n{2,}/g, "\n")
    .split("\n")
    .filter(line => line.length)
    .map(line => line.trim())
