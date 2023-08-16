#!/usr/bin/env node
/**
 * The following script generates a random English or Finnish sentence, along with a random name that could either be American or Finnish.
 *
 * The main functions in this script are:
 * - generateRandomEnglishSentence: Creates a random English sentence by picking a subject and verb, then choosing an appropriate object for that verb.
 * - generateRandomFinnishSentence: Creates a random Finnish sentence using similar logic as generateRandomEnglishSentence.
 * - generateRandomName: Generates a random American or Finnish name.
 * - generateRandomCopy: Utilizes the sentence generation functions to produce either English or Finnish sentences a random number of times.
 *
 * To use this script, run it from the command line using Node.js: 'node scripts/mockData.mjs'.
 * It will print out an object containing a randomly generated name and a paragraph of copy to the console.
 *
 * @example
 * > node scripts/mockData.mjs
 * > { name: 'James Smith', copy: 'He writes a dissertation. I believe a theory.' }
 *
 * Note: This is just a random example, the output will vary each time the script is run.
 */
var randomNumber = function (min, max) {
  if (min === void 0) {
    min = 1
  }
  if (max === void 0) {
    max = 10
  }
  return Math.floor(Math.random() * (max - min)) + min
}
var chooseRandomElement = function (array) {
  return array[Math.floor(Math.random() * array.length)]
}
var capitalize = function (word) {
  return word.replace(/^\w/, function (c) {
    return c.toUpperCase()
  })
}
// Function to generate a random sentence
var generateRandomEnglishSentence = function () {
  var subjects = ["I", "You", "He", "She", "It", "They", "We"]
  var actions = [
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
      objects: ["water", "food", "letters", "people", "books", "multitudes"],
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
  var subject = chooseRandomElement(subjects)
  var action = chooseRandomElement(actions)
  var object = chooseRandomElement(action.objects)
  var isThirdPerson = function (subject) {
    return ["He", "She", "It"].includes(subject)
  }
  var thirdPersonSingular = function (verb) {
    var endsWithEs = ["o", "ch", "sh", "ss", "x", "z"]
    var lastTwoChars = verb.slice(-2)
    var lastChar = verb.slice(-1)
    if (
      endsWithEs.some(function (ending) {
        return verb.endsWith(ending)
      })
    ) {
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
  var sentence = ""
    .concat(subject, " ")
    .concat(
      isThirdPerson(subject) ? thirdPersonSingular(action.verb) : action.verb,
      " "
    )
    .concat(object, ".")
  return sentence
}
var generateRandomCopy = function (sentenceFunc, i, copy) {
  if (sentenceFunc === void 0) {
    sentenceFunc = chooseRandomElement([
      generateRandomEnglishSentence,
      generateRandomFinnishSentence,
      generateRandomJapaneseSentence,
      generateRandomGreekSentence,
    ])
  }
  if (i === void 0) {
    i = randomNumber()
  }
  if (copy === void 0) {
    copy = ""
  }
  return i <= 0
    ? copy.trim()
    : generateRandomCopy(
        sentenceFunc,
        i - 1,
        "".concat(copy, " ").concat(sentenceFunc())
      )
}
var generateFinnishName = function () {
  var finnishFirstNames = [
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
  var finnishLastNames = [
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
  return ""
    .concat(chooseRandomElement(finnishFirstNames), " ")
    .concat(chooseRandomElement(finnishLastNames))
}
var generateAmericanName = function () {
  var americanFirstNames = [
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
  var americanLastNames = [
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
  return ""
    .concat(chooseRandomElement(americanFirstNames), " ")
    .concat(chooseRandomElement(americanLastNames))
}
var generateRandomName = function () {
  return chooseRandomElement([generateAmericanName, generateFinnishName])()
}
var generateRandomFinnishSentence = function () {
  var verbAssociationTuples = [
    [
      "aloittaa",
      [
        "opinnot",
        "projektin",
        "työt",
        "harjoituksen",
        "kokouksen",
        "urheiluharrastuksen",
      ],
    ],
    [
      "ampua",
      [
        "maalitauluun",
        "riistaa",
        "maaliin",
        "jousella",
        "haulikolla",
        "ilmaan",
        "pistoolilla",
        "sotaharjoituksissa",
        "metsästyksessä",
        "varoituslaukauksen",
        "savukranaatteja",
        "nuolia",
      ],
    ],
    ["antaa", ["lahjan", "neuvon", "vastauksen", "kommentin", "suosituksen"]],
    [
      "harjoittaa",
      ["urheilua", "kuntoilua", "meditaatiota", "ammattia", "harrastusta"],
    ],
    ["järjestää", ["tapahtuman", "kokouksen", "juhlan", "matkan", "projektin"]],
    ["kehittää", ["taitoja", "tuotteen", "palvelun", "ohjelman", "projektin"]],
    [
      "kertoa",
      ["tarinan", "totuuden", "uutisen", "salaisuuden", "mielipiteen"],
    ],
    [
      "kieltää",
      ["väitteet", "osallistumisen", "puheen", "totuuden", "tunkeutumisen"],
    ],
    ["kiertää", ["kaupunkia", "museota", "kirkkoa", "näyttelyä", "järveä"]],
    ["kiinnittää", ["huomiota", "kuvan", "merkin", "julisteen", "naulan"]],
    [
      "korostaa",
      ["mielipidettä", "tärkeyttä", "asiaa", "yksityiskohtaa", "vaikutusta"],
    ],
    [
      "kutsua",
      ["ystävän", "vieraan", "työhaastatteluun", "juhliin", "kokoukseen"],
    ],
    ["kysyä", ["neuvoa", "ohjeita", "tietoa", "apua", "lupaa"]],
    ["käyttää", ["työkalua", "ohjelmaa", "laitteita", "metodia", "resurssia"]],
    ["lopettaa", ["työt", "opiskelun", "harrastuksen", "projektin", "suhteen"]],
    ["lukea", ["kirjaa", "lehteä", "uutisia", "runoa", "tutkimusta"]],
    [
      "lähettää",
      ["viestin", "paketin", "kirjeen", "sähköpostin", "hakemuksen"],
    ],
    [
      "mainostaa",
      ["tuotetta", "palvelua", "tapahtumaa", "kampanjaa", "yritystä"],
    ],
    [
      "muistaa",
      ["nimen", "osoitteen", "tapauksen", "yksityiskohdat", "päivämäärän"],
    ],
    ["muodostaa", ["ryhmän", "sopimuksen", "suunnitelman", "päätöksen"]],
    ["nukkua", ["sängyssä", "teltassa", "sohvalla", "aamulla", "iltapäivällä"]],
    [
      "ohittaa",
      [
        "auton",
        "vastustajan",
        "esteen",
        "rajoituksen",
        "pysäkin",
        "rajapyykin",
        "kaupungin",
        "jonon",
        "kilpailijat",
        "odotukset",
      ],
    ],
    ["piirtää", ["kuvan", "kartan", "muotokuvan", "diagrammin", "luonnoksen"]],
    [
      "puhua",
      ["kieltä", "totuutta", "mielipidettä", "politiikkaa", "tunteista"],
    ],
    [
      "purkaa",
      [
        "ajatuksiaan",
        "esteen",
        "jännityksen",
        "koneen",
        "laatikon",
        "leirin",
        "rakennuksen",
        "sopimuksen",
        "tavaran",
      ],
    ],
    ["pyytää", ["apua", "anteeksi", "lupaa", "neuvoa", "lainaa"]],
    ["rahoittaa", ["projektin", "opinnot", "hankinnan", "yrityksen", "matkan"]],
    ["soittaa", ["pianoa", "kitaraa", "viulua", "rummuja", "harmonikkaa"]],
    [
      "sopia",
      [
        "kokouksesta",
        "tapaamisesta",
        "kaupasta",
        "sopimuksesta",
        "yhteistyöstä",
      ],
    ],
    ["sulkea", ["oven", "ikkunan", "kirjan", "laatikon", "säiliön"]],
    [
      "särkeä",
      [
        "lasin",
        "peilin",
        "ikkunan",
        "astian",
        "säännön",
        "hiljaisuuden",
        "sopimuksen",
      ],
    ],
    [
      "tappaa",
      [
        "aikaa",
        "bakteereita",
        "tuholaisia",
        "viruksen",
        "hyönteisiä",
        "rikkakasveja",
        "unelmia",
      ],
    ],
    [
      "tarkastaa",
      [
        "asiakirjat",
        "tiedot",
        "sähköpostin",
        "auton",
        "talon",
        "koneen",
        "rakennusprojektin",
        "laitteet",
        "turvatoimenpiteet",
        "tuotantolinjan",
        "ajoneuvon",
        "työmaan",
        "varaston",
        "lentokoneen",
      ],
    ],
    [
      "tietää",
      ["totuuden", "vastauksen", "ratkaisun", "menetelmän", "säännöt"],
    ],
    [
      "tinkiä",
      ["hinnasta", "palkasta", "korvauksesta", "maksusta", "vuokrasta"],
    ],
    ["tuottaa", ["tavaran", "palvelun", "elokuvan", "musiikin", "sisällön"]],
    [
      "unohtaa",
      ["avaimet", "lompakon", "puhelimen", "tapaamisen", "syntymäpäivän"],
    ],
    ["uskoa", ["Jumalaan", "unelmiin", "tulevaisuuteen", "ystävään"]],
    [
      "valmistaa",
      ["ruokaa", "raportin", "taideteoksen", "projektin", "juhlan"],
    ],
    ["valvoa", ["työtä", "lapsia", "projektia", "koetta", "ylläpidon"]],
  ]
  var conjugateFinnishType1Verb = function (subject, verb) {
    var stem = verb.slice(0, -1) // remove the last character
    var degrade = function (stem) {
      if (stem.match(/kk.$/)) return stem.replace(/kk(.)$/, "k$1")
      if (stem.match(/pp.$/)) return stem.replace(/pp(.)$/, "p$1")
      if (stem.match(/tt.$/)) return stem.replace(/tt(.)$/, "t$1")
      if (stem.match(/nt.$/)) return stem.replace(/nt(.)$/, "nn$1")
      if (stem.match(/nk.$/)) return stem.replace(/nk(.)$/, "ng$1")
      if (stem.match(/mp.$/)) return stem.replace(/mp(.)$/, "mm$1")
      if (stem.match(/lt.$/)) return stem.replace(/lt(.)$/, "ll$1")
      if (stem.match(/rt.$/)) return stem.replace(/rt(.)$/, "rr$1")
      if (stem.match(/tietä$/)) return stem.replace(/tietä$/, "tiedä")
      if (stem.match(/luke$/)) return stem.replace(/luke$/, "lue")
      if (stem.match(/p.$/)) return stem.replace(/p(.)$/, "v$1")
      if (stem.match(/lke$/)) return stem.replace(/lke$/, "lje")
      if (stem.match(/rke$/)) return stem.replace(/rke$/, "rje")
      return stem
    }
    switch (subject) {
      case "minä":
        return degrade(stem) + "n"
      case "sinä":
        return degrade(stem) + "t"
      case "hän":
        return stem + stem.slice(-1) // replace last vowel with second to last
      case "me":
        return degrade(stem) + "mme"
      case "te":
        return degrade(stem) + "tte"
      case "he":
        return stem + (verb.match(/[aou]/) ? "vat" : "vät")
      default:
        throw "Unexpected subject '".concat(subject, "'")
    }
  }
  var _a = chooseRandomElement(verbAssociationTuples),
    infinitive = _a[0],
    assocations = _a[1]
  var directObject = chooseRandomElement(assocations)
  var subject = chooseRandomElement(["minä", "sinä", "hän", "me", "te", "he"])
  var verb = conjugateFinnishType1Verb(subject, infinitive)
  return ""
    .concat(capitalize(subject), " ")
    .concat(verb, " ")
    .concat(directObject, ".")
}

var generateRandomJapaneseSentence = function () {
  var subjects = [
    "私",
    "僕",
    "俺",
    "私たち",
    "僕たち",
    "俺たち",
    "あなた",
    "あなたたち",
    "あなた方",
    "彼",
    "彼女",
    "彼ら",
    "彼女ら",
  ]
  var actions = [
    { verb: "する", objects: ["仕事", "勉強", "結婚", "練習"] },
    { verb: "仕事する" },
    {
      verb: "作る",
      objects: [
        "料理",
        "絵",
        "プログラム",
        "家",
        "服",
        "音楽",
        "映画",
        "ケーキ",
        "アート",
        "デザイン",
      ],
    },
    { verb: "出る", objects: ["家", "店", "学校", "オフィス", "部屋"] },
    { verb: "勉強する" },
    { verb: "動く" },
    { verb: "始まる" },
    { verb: "寝る" },
    { verb: "帰る" },
    { verb: "旅行する" },
    { verb: "書く" },
    { verb: "歌う", objects: ["歌", "曲", "メロディー"] },
    { verb: "止まる" },
    { verb: "泳ぐ" },
    {
      verb: "着る",
      objects: ["服", "ジャケット", "コート", "ドレス", "ズボン"],
    },
    { verb: "知る", objects: ["事実", "情報", "答え", "場所", "人"] },
    { verb: "笑う" },
    { verb: "終わる" },
    { verb: "結婚する" },
    { verb: "練習する" },
    { verb: "聞く", objects: ["音楽", "話", "ラジオ", "ニュース"] },
    {
      verb: "行く",
      objects: ["学校", "レストラン", "公園", "映画館", "海", "街"],
    },
    { verb: "見る", objects: ["映画", "本", "景色", "テレビ", "絵"] },
    { verb: "読む", objects: ["新聞", "小説", "詩", "雑誌", "本"] },
    { verb: "買う", objects: ["服", "本", "食べ物", "商品", "ギフト"] },
    { verb: "走る", objects: ["マラソン", "コース", "距離", "レース"] },
    { verb: "起きる" },
    { verb: "運転する", objects: ["車", "バス", "自動車"] },
    { verb: "食べる", objects: ["食事", "ご飯", "料理", "フルーツ", "野菜"] },
    { verb: "飲む", objects: ["水", "お茶", "コーヒー", "ジュース", "酒"] },
  ]

  var subject = chooseRandomElement(subjects)
  var action = chooseRandomElement(actions)
  const { objects, verb } = action

  // Generate the sentence
  var sentence = objects
    ? `${subject} は ${chooseRandomElement(objects)} を ${verb}。`
    : `${subject} は ${verb}。`

  return sentence
}

const generateRandomGreekSentence = () => {
  const subjects = [
    "Εγώ",
    "Εσύ",
    "Αυτός",
    "Αυτή",
    "Αυτό",
    "Εμείς",
    "Εσείς",
    "Αυτοί",
    "Αυτές",
  ]
  const subject = chooseRandomElement(subjects)
  const actions = [
    {
      verb: "αγαπώ",
      objects: [
        "την οικογένεια",
        "τους φίλους",
        "τον σύντροφο",
        "την τέχνη",
        "τη μουσική",
        "τον χορό",
        "τη ζωή",
        "τη φύση",
        "τα ζώα",
        "την αγάπη",
      ],
    },
    {
      verb: "ακούω",
      objects: [
        "μουσική",
        "ένα τραγούδι",
        "μια φωνή",
        "το ραδιόφωνο",
        "τα νέα",
        "μια συνέντευξη",
        "τον ήχο",
        "ένα ποίημα",
        "μια ιστορία",
        "τη φύση",
      ],
    },
    {
      verb: "βάφω",
      objects: [
        "τον τοίχο",
        "τα νύχια",
        "το ξύλο",
        "τα μαλλιά",
        "την πόρτα",
        "τον πίνακα",
        "τα ρούχα",
        "το αυτοκίνητο",
        "την εικόνα",
        "την τοιχογραφία",
      ],
    },
    {
      verb: "βλέπω",
      objects: [
        "τηλεόραση",
        "μια ταινία",
        "μια εικόνα",
        "τη θάλασσα",
        "την πόλη",
        "μια εκπομπή",
        "το φεγγάρι",
        "τον ήλιο",
        "τον κόσμο",
        "τον ουρανό",
      ],
    },
    {
      verb: "γράφω",
      objects: [
        "ένα μήνυμα",
        "μια επιστολή",
        "ένα άρθρο",
        "ένα διήγημα",
        "μια αναφορά",
        "ένα ποίημα",
        "ένα ημερολόγιο",
        "ένα μυθιστόρημα",
        "μια συνέντευξη",
        "ένα σενάριο",
      ],
    },
    {
      verb: "διαβάζω",
      objects: [
        "ένα βιβλίο",
        "μια εφημερίδα",
        "ένα άρθρο",
        "μια ιστορία",
        "μια περιγραφή",
        "ένα μυθιστόρημα",
        "μια αναφορά",
        "ένα ποίημα",
        "μια συνέντευξη",
        "ένα ημερολόγιο",
      ],
    },
    {
      verb: "καθαρίζω",
      objects: [
        "το δωμάτιο",
        "τα πιάτα",
        "το αυτοκίνητο",
        "το μπάνιο",
        "το παράθυρο",
        "το ρούχο",
        "το τραπέζι",
        "το πάτωμα",
        "την κουζίνα",
        "το πλυντήριο",
      ],
    },
    {
      verb: "πίνω",
      objects: [
        "νερό",
        "καφέ",
        "τσάι",
        "χυμό",
        "κρασί",
        "μπίρα",
        "γάλα",
        "σοκολάτα",
        "αναψυκτικό",
        "ποτό",
      ],
    },
    {
      verb: "πλένω",
      objects: [
        "τα ρούχα",
        "τα πιάτα",
        "τα μαλλιά",
        "το αυτοκίνητο",
        "τα παράθυρα",
        "τα ποτήρια",
        "τα χέρια",
        "το πατάρι",
        "τα μαξιλάρια",
        "το πάτωμα",
      ],
    },
    {
      verb: "τρώω",
      objects: [
        "το φαγητό",
        "τα φρούτα",
        "τα λαχανικά",
        "το ψωμί",
        "την πίτσα",
        "το κρέας",
        "το γλυκό",
        "τα σνακ",
        "το γιαούρτι",
        "τα ζυμαρικά",
      ],
    },
    {
      verb: "πηγαίνω",
      objects: [
        "σχολείο",
        "δουλειά",
        "σπίτι",
        "κατάστημα",
        "θέατρο",
        "εστιατόριο",
        "γυμναστήριο",
        "πάρκο",
        "παραλία",
        "βιβλιοθήκη",
      ],
    },
    {
      verb: "μιλάω",
      objects: [
        "Αγγλικά",
        "Ελληνικά",
        "Ισπανικά",
        "Γαλλικά",
        "Γερμανικά",
        "Ιταλικά",
        "Ρωσικά",
        "Κινέζικα",
        "Ιαπωνικά",
        "Αραβικά",
      ],
    },
    {
      verb: "κοιτάζω",
      objects: [
        "τον ουρανό",
        "το τοπίο",
        "την τηλεόραση",
        "την τέχνη",
        "τα αστέρια",
        "τα νέα",
        "τη φύση",
        "τις φωτογραφίες μου",
        "τα βιβλία",
        "τα παιδιά",
      ],
    },
    {
      verb: "ακολουθώ",
      objects: [
        "τον ρυθμό",
        "τις οδηγίες",
        "το όνειρό μου",
        "τη μόδα",
        "τον κόσμο",
        "τα αστέρια",
        "τα αθλήματα",
        "τις τάσεις",
        "το παρελθόν",
        "τη διαδρομή",
      ],
    },
    {
      verb: "παίζω",
      objects: [
        "ποδόσφαιρο",
        "μπάσκετ",
        "τένις",
        "βόλεϊ",
        "πιάνο",
        "κιθάρα",
        "παιχνίδια",
        "κάρτες",
        "παιχνίδια ρόλων",
        "βιντεοπαιχνίδια",
      ],
    },
    {
      verb: "αγοράζω",
      objects: [
        "ρούχα",
        "παπούτσια",
        "αξεσουάρ",
        "κοσμήματα",
        "ηλεκτρονικά",
        "βιβλία",
        "τρόφιμα",
        "αυτοκίνητα",
        "κινητά τηλέφωνα",
        "είδη προσωπικής φροντίδας",
      ],
    },
    {
      verb: "προσπαθώ",
      objects: [
        "να μάθω",
        "να καταλάβω",
        "να βελτιωθώ",
        "να εξελιχθώ",
        "να επιτύχω",
        "να ανακαλύψω",
        "να αντιμετωπίσω",
        "να ξεπεράσω",
        "να διαχειριστώ",
        "να αναπτύξω",
      ],
    },
    {
      verb: "μαθαίνω",
      objects: [
        "γλώσσες",
        "νέες δεξιότητες",
        "τεχνικές",
        "σχολικά μαθήματα",
        "επιστημονικά θέματα",
        "επαγγελματικά πράγματα",
        "νέες τεχνολογίες",
        "μουσική",
        "τέχνη",
        "ιστορία",
      ],
    },
  ]

  const { objects, verb } = chooseRandomElement(actions)
  const object = chooseRandomElement(objects)

  const conjugate = (subject, verb) => {
    switch (subject) {
      case "Εγώ":
        return verb.slice(0, -2) + "ω"
      case "Εσύ":
        return verb.slice(0, -1) + "εις"
      case "Αυτός":
      case "Αυτή":
      case "Αυτό":
        return verb.slice(0, -1) + "ει"
      case "Εμείς":
        return verb.slice(0, -1) + "ουμε"
      case "Εσείς":
        return verb.slice(0, -1) + "ετε"
      case "Αυτοί":
      case "Αυτές":
        return verb.slice(0, -1) + "ουν"
      default:
        return "Unknown subject"
    }
  }

  const sentence = `${subject} ${conjugate(subject, verb)} ${object}.`
  return sentence
}

function toEmail(name) {
  // Normalize the name to its base form (NFD)
  const normalized = name.normalize("NFD")

  // Replace special characters like ä and ö with their English equivalents
  const replacedSpecialChars = normalized.replace(/[\u0300-\u036f]/g, "")

  // Convert the name to lowercase
  const lowercaseName = replacedSpecialChars.toLowerCase()

  // Remove non-alphanumeric characters and replace spaces with dots
  const formattedName = lowercaseName
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, ".")

  return formattedName + "@example.com"
}

const randomName = generateRandomName()

console.log(randomName)
console.log(toEmail(randomName))
console.log(generateRandomCopy())

/**
する (suru) - to do
仕事する (shigoto suru) (しごとする) - to work
作る (tsukuru) (つくる) - to make, to create
出る (deru) (でる) - to go out, to leave
勉強する (benkyou suru) (べんきょうする) - to study
動く (ugoku) (うごく) - to move
始まる (hajimaru) (はじまる) - to begin, to start
寝る (neru) (ねる) - to sleep
帰る (kaeru) (かえる) - to go back, to return
旅行する (ryokou suru) (りょこうする) - to travel
書く (kaku) (かく) - to write
来る (kuru) (くる) - to come
歌う (utau) (うたう) - to sing
止まる (tomaru) (とまる) - to stop
泳ぐ (oyogu) (およぐ) - to swim
着る (kiru) (きる) - to wear
知る (shiru) (しる) - to know
笑う (warau) (わらう) - to laugh
終わる (owaru) (おわる) - to end, to finish
結婚する (kekkon suru) (けっこんする) - to get married
練習する (renshuu suru) (れんしゅうする) - to practice
聞く (kiku) (きく) - to listen, to ask
行く (iku) (いく) - to go
見る (miru) (みる) - to see, to look at
読む (yomu) (よむ) - to read
買う (kau) (かう) - to buy
走る (hashiru) (はしる) - to run
起きる (okiru) (おきる) - to wake up, to get up
運転する (unten suru) (うんてんする) - to drive
食べる (たべる) - to eat
飲む (nomu) (のむ) - to drink

const actions = [
{ verb: "する", objects: ["仕事", "勉強", "結婚", "練習"] },
{ verb: "仕事する"},
{ verb: "作る", objects: ["料理", "絵", "プログラム", "家", "服", "音楽", "映画", "ケーキ", "アート", "デザイン"] },
{ verb: "出る", objects: ["家", "店", "学校", "オフィス", "部屋"] },
{ verb: "勉強する"},
{ verb: "動く"},
{ verb: "始まる"},
{ verb: "寝る"},
{ verb: "帰る"},
{ verb: "旅行する"},
{ verb: "書く"},
{ verb: "歌う", objects: ["歌", "曲", "メロディー"] },
{ verb: "止まる"},
{ verb: "泳ぐ"},
{ verb: "着る", objects: ["服", "ジャケット", "コート", "ドレス", "ズボン"] },
{ verb: "知る", objects: ["事実", "情報", "答え", "場所", "人"] },
{ verb: "笑う"},
{ verb: "終わる"},
{ verb: "結婚する"},
{ verb: "練習する"},
{ verb: "聞く", objects: ["音楽", "話", "ラジオ", "ニュース"] },
{ verb: "行く", objects: ["学校", "レストラン", "公園", "映画館", "海", "街"] },
{ verb: "見る", objects: ["映画", "本", "景色", "テレビ", "絵"] },
{ verb: "読む", objects: ["新聞", "小説", "詩", "雑誌", "本"] },
{ verb: "買う", objects: ["服", "本", "食べ物", "商品", "ギフト"] },
{ verb: "走る", objects: ["マラソン", "コース", "距離", "レース"] },
{ verb: "起きる"},
{ verb: "運転する", objects: ["車", "バス", "自動車"] },
{ verb: "食べる", objects: ["食事", "ご飯", "料理", "フルーツ", "野菜"] },
{ verb: "飲む", objects: ["水", "お茶", "コーヒー", "ジュース", "酒"] },
]

    Singular: 私 (わたし) - I (neutral), 僕 (ぼく) - I (masculine), 俺 (おれ) - I (casual masculine)
    Plural: 私たち (わたしたち) - we, 僕たち (ぼくたち) - we, 俺たち (おれたち) - we

Second Person:

    Singular: あなた - you (neutral, can be used formally or informally)
    Plural: あなたたち - you all, あなた方 (あなたかた) - you all (more formal)

Third Person:

    Singular: 彼 (かれ) - he, 彼女 (かのじょ) - she
    Plural: 彼ら (かれら) - they (masculine), 彼女ら (かのじょら) - they (feminine)
    

const subjects = ["私", "僕", "俺", "私たち", "僕たち", "俺たち", "あなた", "あなたたち", "あなた方", "彼", "彼女", "彼ら", "彼女ら"]


    あなた方 は 帰る。 (Incorrect)
    あなたたち は 帰る。

    彼女ら は 止まる。 (Incorrect)
    彼女たち は 止まる。

    彼女ら は 仕事する。 (Incorrect)
    彼女たち は 仕事する。
 */
