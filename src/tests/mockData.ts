import type {
  Comment,
  CommentId,
  Discussion,
  Email,
  Topic,
  TopicId,
  User,
} from "../../src/lib/simple-comment-types"

export const alphaUserInput =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÅ abcdefghijklmnopqrstuvwxyzäöå 1234567890 !@#$%^&*()_+-= "
const passwordInput =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()_+-= "
const alphaAscii =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-"
const base36 = "abcdefghijklmnopqrstuvwxyz01234567890"
const idCharacters = "abcdefghijklmnopqrstuvwxyz-0123456789"

const randomNumber = (min: number = 1, max: number = 10): number =>
  Math.floor(Math.random() * (max - min)) + min
export const randomString = (
  alpha: string = alphaAscii,
  len: number = randomNumber(10, 50),
  str: string = ""
): string =>
  len === 0
    ? str
    : randomString(
        alpha,
        len - 1,
        `${str}${alpha.charAt(Math.floor(Math.random() * alpha.length))}`
      )
const randomDate = () => new Date(randomNumber(0, new Date().valueOf()))
// Returns a random email that will validate but does not create examples of all possible valid emails
export const mockEmail = (): Email =>
  `${randomString(base36)}@${randomString(base36)}.${randomString(
    "abcdefghijklmnopqrstuvwxyz",
    3
  )}`

export const mockUserId = (length: number = randomNumber(5, 36)): string =>
  randomString(idCharacters, length)

export const mockPassword = () =>
  randomString(passwordInput, randomNumber(10, 50)).trim()

const randomAlphaNumeric = (length = 10) => randomString(base36, length)

const generateMockCommentId = (parentId = "") => {
  const cId = `${randomAlphaNumeric(3)}-${randomAlphaNumeric(
    4
  )}-${randomAlphaNumeric(5)}`
  if (parentId === "") return cId
  const appendIndex = parentId.lastIndexOf("_")
  const pId = parentId.slice(appendIndex + 1)
  if (pId === "") return cId

  // if the commentId will be longer than 36 characters, truncate it
  if (pId.length > 36 - cId.length - 1) {
    const to36 = pId.slice(0, 36)
    return `${to36.slice(0, -cId.length - 1)}_${cId}`
  }

  return `${pId}_${cId}`
}
const mockComment = (parentId: TopicId | CommentId, user: User): Comment => ({
  id: generateMockCommentId(parentId),
  parentId,
  userId: user.id,
  text: randomString(alphaUserInput, randomNumber(50, 500)),
  dateCreated: new Date(),
})

export const mockCommentTree = (
  replies: number = 500,
  users: User[] = mockUsersArray(100),
  chain: (Comment | Discussion)[] = mockTopicsArray()
): (Comment | Discussion)[] => {
  for (let i = 0; i < replies; i++) {
    chain = [
      ...chain,
      mockComment(chooseRandomElement(chain).id, chooseRandomElement(users)),
    ]
  }
  return chain
}

export const chooseRandomElement = <T>(array: T[]) =>
  array[Math.floor(Math.random() * array.length)]
export const mockUsersArray = (
  population: number,
  users: User[] = []
): User[] =>
  population <= 0
    ? users
    : mockUsersArray(population - 1, [...users, mockUser()])

export const mockTopicsArray = (
  num: number = randomNumber(2, 20),
  topics: Topic[] = []
): Topic[] =>
  num <= 0 ? topics : mockTopicsArray(num - 1, [...topics, mockTopic()])

let topicCount = 0
const getTopicId = (prepend: string = "") =>
  `${prepend}topic-id-${topicCount++}`

export const mockTopic = (prepend = ""): Topic => ({
  id: getTopicId(prepend),
  isLocked: false,
  title: randomString(alphaUserInput, randomNumber(25, 100)),
  dateCreated: randomDate(),
})

let userCount = 0
const createUserId = (prepend = "") => `${prepend}user-id-${userCount++}`
export const mockUser = (prepend = ""): User => ({
  id: createUserId(prepend),
  email: mockEmail(),
  name: randomString(alphaUserInput),
  isVerified: Math.random() > 0.5,
  isAdmin: Math.random() > 0.5,
  hash: randomString(alphaAscii, 32),
})
