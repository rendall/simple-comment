import { uuidv4 } from "../src/lib/crypt"
import type {
  Comment,
  CommentId,
  Discussion,
  Email,
  Topic,
  TopicId,
  User
} from "../src/lib/simple-comment"

export const alphaUserInput =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÅ abcdefghijklmnopqrstuvwxyzäöå 1234567890 !@#$%^&*()_+-= "
const passwordInput =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()_+-= "
const alphaAscii =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-"
const emailAscii = "abcdefghijklmnopqrstuvwxyz01234567890"
const randomNumber = (min: number, max: number): number =>
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
  `${randomString(emailAscii)}@${randomString(emailAscii)}.${randomString(
    "abcdefghijklmnopqrstuvwxyz",
    3
  )}`

export const mockPassword = () =>
  randomString(passwordInput, randomNumber(10, 50))
// Functions that generate fake data - these could be moved to a common file to help other Service tests
const mockComment = (parentId: TopicId | CommentId, user: User): Comment => ({
  id: uuidv4(),
  parentId,
  userId: user.id,
  text: randomString(alphaUserInput, randomNumber(50, 500)),
  dateCreated: new Date()
})

export const mockCommentTree = (
  replies: number,
  users: User[],
  chain: (Comment | Discussion)[]
): (Comment | Discussion)[] =>
  replies <= 0
    ? chain
    : mockCommentTree(replies - 1, users, [
        ...chain,
        mockComment(chooseRandomElement(chain).id, chooseRandomElement(users))
      ])
export const chooseRandomElement = <T>(arr: T[]) =>
  arr[Math.floor(Math.random() * arr.length)]
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
const getTopicId = prepend => `${prepend}topic-id-${topicCount++}`

export const mockTopic = (prepend = ""): Topic => ({
  id: getTopicId(prepend),
  isLocked: false,
  title: randomString(alphaUserInput, randomNumber(25, 100)),
  dateCreated: randomDate()
})

let userCount = 0
const createUserId = (prepend = "") => `${prepend}user-id-${userCount++}`
export const mockUser = (prepend = ""): User => ({
  id: createUserId(prepend),
  email: mockEmail(),
  name: randomString(alphaUserInput),
  isVerified: Math.random() > 0.5,
  isAdmin: Math.random() > 0.5,
  hash: randomString(alphaAscii, 32)
})
