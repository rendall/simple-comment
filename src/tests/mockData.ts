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
const emailAscii = "abcdefghijklmnopqrstuvwxyz01234567890"
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
  `${randomString(emailAscii)}@${randomString(emailAscii)}.${randomString(
    "abcdefghijklmnopqrstuvwxyz",
    3
  )}`

export const mockUserId = (): string =>
  randomString(emailAscii, randomNumber(5, 36))

export const mockUuid4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const mockPassword = () =>
  randomString(passwordInput, randomNumber(10, 50)).trim()

const mockComment = (parentId: TopicId | CommentId, user: User): Comment => ({
  id: mockUuid4(),
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

// Function to generate a random sentence
const generateRandomSentence = (): string => {
  const subjects = ["I", "You", "He", "She", "It", "They", "We"]
  const actions = [
    { verb: "add", objects: ["sugar", "flour", "salt", "pepper", "water"] },
    {
      verb: "admire",
      objects: ["courage", "intelligence", "honesty", "dedication", "patience"],
    },
    {
      verb: "arrange",
      objects: ["furniture", "flowers", "books", "documents", "ideas"],
    },
    {
      verb: "believe",
      objects: ["a story", "a theory", "a rumor", "a myth", "a promise"],
    },
    {
      verb: "belong",
      objects: [
        "to a club",
        "to a team",
        "to a group",
        "to a family",
        "to a school",
      ],
    },
    { verb: "brush", objects: ["teeth", "hair", "horses"] },
    {
      verb: "build",
      objects: ["a house", "a car", "a wall", "a website", "a model"],
    },
    { verb: "buy", objects: ["a car", "a house", "clothes", "books", "toys"] },
    {
      verb: "call",
      objects: ["a friend", "a taxi", "a doctor", "a meeting", "an ambulance"],
    },
    {
      verb: "carry",
      objects: ["a bag", "a baby", "a burden", "a torch", "a tune"],
    },
    {
      verb: "catch",
      objects: ["a ball", "a fish", "a bird", "a cold", "a fly"],
    },
    {
      verb: "catch",
      objects: ["a ball", "a fish", "a thief", "a cold", "a flight"],
    },
    {
      verb: "choose",
      objects: ["a shirt", "a dress", "a book", "a meal", "a movie"],
    },
    {
      verb: "clean",
      objects: ["a room", "a car", "a window", "a dish", "a shirt"],
    },
    {
      verb: "compare",
      objects: ["prices", "sizes", "weights", "distances", "speeds"],
    },
    {
      verb: "consider",
      objects: [
        "a proposal",
        "an offer",
        "a suggestion",
        "a plan",
        "a decision",
      ],
    },
    {
      verb: "contain",
      objects: ["water", "food", "letters", "people", "books"],
    },
    {
      verb: "continue",
      objects: ["a journey", "a story", "a song", "a speech", "a lesson"],
    },
    {
      verb: "cost",
      objects: ["a fortune", "a pound", "a dollar", "a euro", "a dime"],
    },
    {
      verb: "count",
      objects: ["money", "sheep", "stars", "calories", "steps"],
    },
    {
      verb: "create",
      objects: ["art", "music", "a story", "a game", "a movie"],
    },
    {
      verb: "defend",
      objects: ["a friend", "a title", "a thesis", "a goal", "an accusation"],
    },
    {
      verb: "deliver",
      objects: ["a package", "a message", "a letter", "a speech", "a pizza"],
    },
    {
      verb: "describe",
      objects: ["a person", "a scene", "a feeling", "a situation", "an object"],
    },
    {
      verb: "draw",
      objects: ["a cat", "a house", "a flower", "a tree", "a car"],
    },
    {
      verb: "drive",
      objects: ["a car", "a bus", "a nail", "a golf ball", "a hard bargain"],
    },
    {
      verb: "drop",
      objects: ["a ball", "a hint", "a class", "a name", "a bomb"],
    },
    {
      verb: "explain",
      objects: ["a theory", "a problem", "a situation", "a concept", "a rule"],
    },
    {
      verb: "fill",
      objects: ["a bottle", "a glass", "a tub", "a form", "a pool"],
    },
    {
      verb: "find",
      objects: ["a key", "a solution", "an answer", "a job", "a friend"],
    },
    {
      verb: "finish",
      objects: ["a race", "a task", "a project", "a book", "a movie"],
    },
    {
      verb: "fly",
      objects: ["a kite", "a plane", "a bird", "a helicopter", "a drone"],
    },
    {
      verb: "follow",
      objects: ["a path", "a recipe", "instructions", "a diet", "a dream"],
    },
    {
      verb: "forget",
      objects: ["a name", "a date", "an address", "a number", "a password"],
    },
    {
      verb: "greet",
      objects: [
        "a friend",
        "a guest",
        "a stranger",
        "a colleague",
        "a neighbor",
      ],
    },
    {
      verb: "guide",
      objects: ["a group", "a tourist", "a team", "a student", "a visitor"],
    },
    {
      verb: "hear",
      objects: ["music", "a noise", "a song", "a sound", "an alarm"],
    },
    {
      verb: "help",
      objects: [
        "a friend",
        "a neighbor",
        "a stranger",
        "a child",
        "an old lady",
      ],
    },
    {
      verb: "hit",
      objects: ["a ball", "a target", "a person", "a wall", "a button"],
    },
    {
      verb: "imagine",
      objects: ["a world", "a future", "a situation", "a scene", "an outcome"],
    },
    {
      verb: "include",
      objects: ["a chapter", "a receipt", "a photo", "a note", "a cover"],
    },
    {
      verb: "invite",
      objects: [
        "a friend",
        "a neighbor",
        "a colleague",
        "a relative",
        "a celebrity",
      ],
    },
    {
      verb: "keep",
      objects: ["money", "a secret", "a diary", "a pet", "a promise"],
    },
    {
      verb: "kick",
      objects: ["a ball", "a person", "a door", "a habit", "a bucket"],
    },
    {
      verb: "know",
      objects: ["the truth", "a secret", "the way", "the answer", "a solution"],
    },
    {
      verb: "learn",
      objects: ["French", "how to cook", "a song", "a poem", "to dance"],
    },
    {
      verb: "lift",
      objects: ["a box", "a weight", "a finger", "a ban", "a mood"],
    },
    { verb: "like", objects: ["dogs", "cats", "birds", "pasta", "coffee"] },
    {
      verb: "love",
      objects: ["music", "cooking", "painting", "books", "movies"],
    },
    {
      verb: "manage",
      objects: ["a business", "a team", "a project", "an event", "time"],
    },
    {
      verb: "mean",
      objects: [
        "no harm",
        "business",
        "a compliment",
        "a promise",
        "an apology",
      ],
    },
    {
      verb: "measure",
      objects: ["a distance", "a weight", "a height", "a width", "a depth"],
    },
    {
      verb: "meet",
      objects: [
        "a friend",
        "a celebrity",
        "a deadline",
        "a goal",
        "a stranger",
      ],
    },
    {
      verb: "move",
      objects: ["a box", "furniture", "a car", "a bike", "luggage"],
    },
    {
      verb: "need",
      objects: [
        "money",
        "food",
        "help",
        "a doctor",
        "a break",
        "a haircut",
        "a laptop",
        "a vacation",
        "an umbrella",
        "advice",
      ],
    },
    {
      verb: "notice",
      objects: ["a mistake", "a change", "a sign", "a detail", "a problem"],
    },
    { verb: "offer", objects: ["help", "food", "drinks", "advice", "a ride"] },
    {
      verb: "order",
      objects: ["a meal", "a book", "a drink", "a pizza", "a taxi"],
    },
    {
      verb: "owe",
      objects: ["money", "an apology", "a favor", "a visit", "a letter"],
    },
    {
      verb: "own",
      objects: ["a car", "a house", "a pet", "a business", "a computer"],
    },
    {
      verb: "paint",
      objects: ["a picture", "a room", "a house", "a portrait", "a landscape"],
    },
    {
      verb: "pick",
      objects: ["an apple", "a book", "a movie", "a shirt", "a game"],
    },
    {
      verb: "prefer",
      objects: ["coffee", "tea", "reading", "jogging", "apples"],
    },
    {
      verb: "prepare",
      objects: ["food", "a report", "a bed", "a lesson", "a speech"],
    },
    {
      verb: "pronounce",
      objects: ["a word", "a name", "a sentence", "a phrase", "an acronym"],
    },
    {
      verb: "protect",
      objects: [
        "a friend",
        "a child",
        "the environment",
        "yourself",
        "an animal",
      ],
    },
    {
      verb: "pull",
      objects: ["a door", "a rope", "a cart", "a tooth", "a muscle"],
    },
    {
      verb: "push",
      objects: ["a door", "a cart", "a button", "a swing", "a law"],
    },
    {
      verb: "receive",
      objects: ["a gift", "a letter", "a package", "a call", "a visitor"],
    },
    {
      verb: "recognize",
      objects: ["a face", "a voice", "a song", "a place", "a smell"],
    },
    {
      verb: "remember",
      objects: ["a story", "a song", "a name", "a place", "a joke"],
    },
    {
      verb: "report",
      objects: ["a crime", "a problem", "an accident", "news", "a story"],
    },
    {
      verb: "respect",
      objects: ["traditions", "rules", "laws", "differences", "privacy"],
    },
    {
      verb: "return",
      objects: ["a book", "money", "a favor", "a call", "a gift"],
    },
    {
      verb: "ride",
      objects: [
        "a bike",
        "a horse",
        "a car",
        "a roller coaster",
        "a skateboard",
      ],
    },
    {
      verb: "rule",
      objects: ["a country", "a kingdom", "a company", "a school", "a game"],
    },
    {
      verb: "save",
      objects: ["money", "a life", "a document", "a date", "a seat"],
    },
    {
      verb: "save",
      objects: ["money", "time", "a life", "a document", "a seat"],
    },
    {
      verb: "see",
      objects: ["a movie", "a show", "a play", "a concert", "an exhibition"],
    },
    { verb: "sell", objects: ["a car", "a house", "clothes", "books", "toys"] },
    {
      verb: "send",
      objects: ["an email", "a letter", "a package", "a message", "a card"],
    },
    {
      verb: "serve",
      objects: ["food", "drinks", "customers", "guests", "players"],
    },
    {
      verb: "show",
      objects: ["a ticket", "an ID", "a photo", "a video", "a painting"],
    },
    {
      verb: "spell",
      objects: ["a word", "a name", "an address", "a sentence", "an acronym"],
    },
    {
      verb: "start",
      objects: ["a business", "a project", "a journey", "a book", "a movie"],
    },
    {
      verb: "steal",
      objects: ["a glance", "money", "a car", "a kiss", "a scene"],
    },
    {
      verb: "stop",
      objects: ["a car", "a machine", "a habit", "a fight", "a leak"],
    },
    {
      verb: "study",
      objects: ["biology", "history", "mathematics", "a map", "a script"],
    },
    {
      verb: "support",
      objects: ["a team", "a friend", "a cause", "a candidate", "a project"],
    },
    {
      verb: "teach",
      objects: ["English", "mathematics", "art", "science", "history"],
    },
    {
      verb: "tell",
      objects: ["a story", "a joke", "a secret", "the truth", "a lie"],
    },
    {
      verb: "think",
      objects: ["a thought", "an idea", "a plan", "a decision", "an answer"],
    },
    {
      verb: "throw",
      objects: ["a ball", "a party", "a stone", "a punch", "a tantrum"],
    },
    {
      verb: "train",
      objects: ["a dog", "a team", "a new employee", "a soldier", "an actor"],
    },
    {
      verb: "translate",
      objects: ["a document", "a book", "a sentence", "a word", "an article"],
    },
    {
      verb: "understand",
      objects: ["math", "music", "science", "art", "politics"],
    },
    {
      verb: "visit",
      objects: ["a city", "a museum", "a friend", "a doctor", "a country"],
    },
    {
      verb: "want",
      objects: ["a car", "a book", "a break", "a sandwich", "money"],
    },
    { verb: "want", objects: ["a house", "a car", "a pet", "a job", "a book"] },
    {
      verb: "weigh",
      objects: ["a ton", "a kilogram", "a pound", "an ounce", "a gram"],
    },
    {
      verb: "write",
      objects: ["a letter", "a book", "a poem", "an email", "a report"],
    },
    { verb: "write", objects: ["a letter", "a novel", "a dissertation"] },
  ]

  const subject = chooseRandomElement(subjects)
  const action = chooseRandomElement(actions)
  const object = chooseRandomElement(action.objects)

  const isThirdPerson = (subject: string) =>
    ["He", "She", "It"].includes(subject)

  const thirdPersonSingular = (verb: string): string => {
    const endsWithEs = ["o", "ch", "sh", "ss", "x", "z"]
    const lastTwoChars = verb.slice(-2)
    const lastChar = verb.slice(-1)

    if (endsWithEs.some(ending => verb.endsWith(ending))) {
      return verb + "es"
    } else if (
      lastTwoChars[0] !== "a" &&
      lastTwoChars[0] !== "e" &&
      lastTwoChars[0] !== "i" &&
      lastTwoChars[0] !== "o" &&
      lastTwoChars[0] !== "u" &&
      lastChar === "y"
    ) {
      return verb.slice(0, -1) + "ies"
    } else {
      return verb + "s"
    }
  }

  // Generate the sentence
  const sentence = `${subject} ${
    isThirdPerson(subject) ? thirdPersonSingular(action.verb) : action.verb
  } ${object}.`

  // Capitalize the first letter of the sentence and return it
  return sentence.charAt(0).toUpperCase() + sentence.slice(1)
}

export const generateRandomCopy = (
  i: number = randomNumber(),
  copy: string = ""
): string =>
  i <= 0
    ? copy
    : generateRandomCopy(i - 1, `${copy} ${generateRandomSentence()}`)

const generateFinnishName = () => {
  const finnishFirstNames = [
    "Akseli",
    "Aleksis",
    "Alvar",
    "Antero",
    "Antti",
    "Ari",
    "Armas",
    "Eero",
    "Eino",
    "Erkki",
    "Esko",
    "Ilmari",
    "Jalmari",
    "Janne",
    "Jari",
    "Johannes",
    "Juha",
    "Juhani",
    "Jukka",
    "Jussi",
    "Kaarle",
    "Kalle",
    "Lauri",
    "Markku",
    "Matti",
    "Mika",
    "Mikael",
    "Olavi",
    "Oskari",
    "Pekka",
    "Risto",
    "Sami",
    "Tapani",
    "Tapio",
    "Teemu",
    "Timo",
    "Toivo",
    "Urho",
    "Veikko",
    "Väinö",
  ]
  const finnishLastNames = [
    "Korhonen",
    "Virtanen",
    "Mäkinen",
    "Nieminen",
    "Häkkinen",
    "Laine",
    "Heikkinen",
    "Koskinen",
    "Järvinen",
    "Lehtinen",
    "Lehtonen",
    "Saarinen",
    "Salminen",
    "Tuominen",
    "Laitinen",
    "Lindholm",
    "Mäkelä",
    "Hämäläinen",
    "Lampinen",
    "Toivonen",
    "Rantanen",
    "Heikkilä",
    "Kinnunen",
    "Nurmi",
    "Laitinen",
    "Kallio",
    "Salonen",
    "Mikkonen",
    "Laaksonen",
    "Heinonen",
    "Jokinen",
    "Koivisto",
    "Lahtinen",
    "Hiltunen",
    "Kettunen",
    "Mattila",
    "Koivunen",
    "Pelkonen",
    "Karjalainen",
    "Ojala",
  ]
  return `${chooseRandomElement(finnishFirstNames)} ${chooseRandomElement(
    finnishLastNames
  )}`
}
const generateAmericanName = () => {
  const americanFirstNames = [
    "James",
    "John",
    "Robert",
    "Michael",
    "William",
    "David",
    "Richard",
    "Joseph",
    "Thomas",
    "Charles",
    "Patricia",
    "Jennifer",
    "Linda",
    "Elizabeth",
    "Susan",
    "Jessica",
    "Sarah",
    "Karen",
    "Nancy",
    "Lisa",
    "Margaret",
    "Betty",
    "Sandra",
    "Ashley",
    "Dorothy",
    "Kimberly",
    "Emily",
    "Donna",
    "Michelle",
    "Carol",
  ]

  const americanLastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Harris",
    "Sanchez",
    "Clark",
    "Ramirez",
    "Lewis",
    "Robinson",
  ]

  const chooseRandomElement = array =>
    array[Math.floor(Math.random() * array.length)]

  return `${chooseRandomElement(americanFirstNames)} ${chooseRandomElement(
    americanLastNames
  )}`
}

export const generateRandomName = () =>
  chooseRandomElement([generateAmericanName, generateFinnishName])()
