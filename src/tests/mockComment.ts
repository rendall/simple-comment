/**
 * Generates a paragraph of random grammatical sentences in various scripts and languages.
 * 
 * Use: `node ./scripts/mockComment.mjs`
 * 
 * Compile:
 * 
 * 1) `npx tsc src/tests/mockComment.ts --module es6 --lib es6 --target esnext --skipLibCheck true --outDir ./scripts  --rootDir ./src/tests/ --removeComments true`
 * 2) rename the file (important): `mv ./scripts/mockComment.js ./scripts/mockComment.mjs`
 * 
 * Watch:
 * on commandline in two separate terminals:
 * 
 * 1) `npx tsc src/tests/mockComment.ts --module es6 --lib es6 --target esnext --skipLibCheck true --outDir ./scripts  --rootDir ./src/tests/ --removeComments true --watch`
 * 2) `while true; do inotifywait -e create,modify ./scripts/ && mv ./scripts/mockComment.js ./scripts/mockComment.mjs; done`
 * 
 * (to install inotifywait: `sudo apt install inotify-tools`)
 * 
 * 
 * Example output:

 * Margaret Davis
 * margaret.davis@example.com
 * Αυτοί προσπαθουν να ξεπεράσω. Αυτός ακολουθει το παρελθόν. Εσύ πλένεις το αυτοκίνητο. Αυτή τρώει το γιαούρτι. Εσύ βάφεις το ξύλο. Αυτό ακολουθει τη διαδρομή. Αυτή κοιτάζει τα αστέρια. Αυτοί βάφουν το αυτοκίνητο. Εγώ μαθαίω μουσική.
 * 
 * Sandra Robinson
 * sandra.robinson@example.com
 * نحن نرمي مهمة أنتُما ترى نتيجة أنتُما تدير مهمة هما يفهم شرح هن يقيس كمية أنتم تلاحظ خطأ أنتُما تحتفظ مقال هم يمتلك فندق أنا أُؤمِن العدالة
 * 
 * Lauri Tuominen
 * lauri.tuominen@example.com
 * We catch a fish. It respects differences. He forgets a password. You learn to dance. They fill a pool. They translate a document. They choose a book. It builds a model. I prefer coffee.
 */
const randomNumber = (min: number = 1, max: number = 10): number =>
  Math.floor(Math.random() * (max - min)) + min
const chooseRandomElement = <T>(array: T[]) =>
  array[Math.floor(Math.random() * array.length)]

const capitalize = (word: string) => word.replace(/^\w/, c => c.toUpperCase())

/* Verb list
add
admire
arrange
believe
belong
brush
build
buy
call
carry
catch
catch
choose
clean
compare
consider
contain
continue
cost
count
create
defend
deliver
describe
draw
drive
drop
explain
fill
find
finish
fly
follow
forget
greet
guide
hear
help
hit
imagine
include
invite
keep
kick
know
learn
lift
like
love
manage
mean
measure
meet
move
need
notice
offer
order
owe
own
paint
pick
prefer
prepare
pronounce
protect
pull
push
receive
recognize
remember
report
respect
return
ride
rule
save
save
see
sell
send
serve
show
spell
start
steal
stop
study
support
teach
tell
think
throw
train
translate
understand
visit
want
want
weigh
write
write
*/

const generateRandomEnglishSentence = (): string => {
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
      objects: [
        "about the future",
        "of an idea",
        "in images",
        "a thought",
        "of an answer",
      ],
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
      objects: [
        "a document",
        "a book",
        "a sentence",
        "a word",
        "an article",
        "word for word",
      ],
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

  return sentence
}

const generateRandomFinnishSentence = () => {
  type Subject = "minä" | "sinä" | "hän" | "me" | "te" | "he"

  const verbAssociationTuples: [string, string[]][] = [
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

  const conjugateFinnishType1Verb = (
    subject: Subject,
    verb: string
  ): string => {
    const stem = verb.slice(0, -1) // remove the last character

    const degrade = (stem: string) => {
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
        throw `Unexpected subject '${subject}'`
    }
  }

  const [infinitive, assocations] = chooseRandomElement(verbAssociationTuples)
  const directObject = chooseRandomElement(assocations)
  const subject = chooseRandomElement<Subject>([
    "minä",
    "sinä",
    "hän",
    "me",
    "te",
    "he",
  ])
  const verb = conjugateFinnishType1Verb(subject, infinitive)

  return `${capitalize(subject)} ${verb} ${directObject}.`
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

  const conjugate = (subject: string, verb: string) => {
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

const generateRandomArabicSentence = () => {
  /**
    Singular:
        أنا (ana) - I (used by both males and females)
        أنتَ (anta) - You (masculine singular)
        أنتِ (anti) - You (feminine singular)
        هو (huwa) - He (used for males)
        هي (hiya) - She (used for females)

    Dual:
       أنتُما (antuma) - You both (masculine and feminine)
        هما (humā) - They both (used for two males or a mixed gender pair)
        هما (humā) - They both (used for two females)

    Plural:
       نحن (naḥnu) - We (used for both males and females)
        أنتم (antum) - You (masculine plural)
        أنتن (antunna) - You (feminine plural)
        هم (hum) - They (used for a group of males or a mixed gender group)
        هن (hun) - They (used for a group of females)
 */

  //    كلمة (kalimah) - word
  //    رقم (raqam) - number
  //    فقرة (fuqrah) - paragraph
  //    صورة (ṣūrah) - image
  //    تعليق (taʿlīq) - comment

  /*
- add: يُضيف (yuḍīf)
- arrange: يُرتِّب (yurattib)
- believe: يُؤمِن (yuʾmin)
- brush: يُفرِّش (yufarrish)
- build: يبني (yabnī)
- buy: يشتري (yishtarī)
- call: يُتصل (yutṣal)
- carry: يحمل (yaḥmil)
- catch: يمسك (yamsik)
- catch: يلتقط (yaltaqṭ)
- choose: يختار (yukhtār)
- clean: ينظّف (yunazzif)
- compare: يُقارِن (yuqārin)
- consider: يُعتَبِر (yuʿtabir)
- contain: يحتوي (yaḥtawī)
- continue: يستمرّ (yastamarr)
- cost: يكلّف (yukallif)
- count: يعدّ (yuʿadd)
- create: يخلق (yakhluq)
- defend: يدافع (yudāfiʿ)
- deliver: يوصل (yuwaṣṣil)
- describe: يصف (yuṣif)
- draw: يرسم (yurassim)
- drive: يقود (yuqūd)
- drop: يُسقِط (yusqit)
- explain: يشرح (yushriḥ)
- fill: يملأ (yamlaʾ)
- find: يجد (yajid)
- finish: ينهي (yunihi)
- fly: يطير (yuṭīr)
- greet: يُسلّم (yusallim)
- guide: يرشد (yurshid)
- hear: يسمع (yasmaʿ)
- help: يساعد (yusaʿid)
- hit: يضرب (yuḍrib)
- imagine: يتخيل (yatkhayil)
- include: يشمل (yashmal)
- invite: يدعو (yadʿū)
- keep: يحتفظ (yaḥtifẓ)
- kick: يرمي (yarmi)
- know: يعرف (yaʿrif)
- learn: يتعلم (yataʿallam)
- lift: يرفع (yarfaʿ)
- love: يحبّ (yuḥibb)
- manage: يدير (yudīr)
- mean: يعني (yaʿnī)
- measure: يقيس (yuqīs)
- meet: يلتقي (yaltaqī)
- move: يتحرّك (yataḥarrak)
- need: يحتاج (yaḥtāj)
- notice: يلاحظ (yalāḥiẓ)
- offer: يقدّم (yuqaddim)
- order: يأمر (yaʾmur)
- owe: يدين (yudayin)
- own: يمتلك (yamtalik)
- paint: يرسم (yurassim)
- pick: يختار (yukhtār)
- prefer: يفضل (yufaḍḍil)
- prepare: يعدّ (yuʿadd)
- pronounce: ينطق (yuntaq)
- protect: يحمي (yaḥmī)
- pull: يسحب (yashhab)
- push: يدفع (yadfaʿ)
- receive: يستلم (yastalam)
- recognize: يتعرّف (yataʿraf)
- remember: يتذكّر (yatadhakkar)
- report: يُبلّغ (yuballigh)
- respect: يحترم (yaḥtaram)
- return: يعود (yaʿūd)
- ride: يركب (yarkab)
- rule: يحكم (yaḥkum)
- save: يوفِّر (yuwaffir)
- save: يحفظ (yaḥfiẓ)
- see: يرى (yurā)
- sell: يبيع (yabiʿ)
- send: يرسل (yursil)
- serve: يخدم (yukhidm)
- show: يظهر (yadhhar)
- spell: يتهجى (yatahajja)
- start: يبدأ (yabdaʾ)
- steal: يسرق (yasriq)
- stop: يتوقّف (yatwaqqaf)
- study: يدرس (yadrus)
- support: يدعم (yudaʿim)
- teach: يعلم (yaʿlam)
- tell: يخبر (yukhbir)
- think: يفكر (yufakir)
- throw: يرمي (yarmi)
- train: يدرب (yadrib)
- translate: يترجم (yatargam)
- understand: يفهم (yufham)
- visit: يزور (yazūr)
- want: يرغب (yarghub)
- want: يريد (yurīd)
- weigh: يزن (yazin)
- write: يكتب (yaktub)
- write: يرسم (yurassim)
    
    أنا (ana) - I (used by both males and females)
    أنتَ (anta) - You (masculine singular)
    أنتِ (anti) - You (feminine singular)
    هو (huwa) - He (used for males)
    هي (hiya) - She (used for females)
    أنتُما (antuma) - You both (masculine and feminine)
    هما (humā) - They both (used for two males or a mixed gender pair)
    هما (humā) - They both (used for two females)
    نحن (naḥnu) - We (used for both males and females)
    أنتم (antum) - You (masculine plural)
    أنتن (antunna) - You (feminine plural)
    هم (hum) - They (used for a group of males or a mixed gender group)
    هن (hun) - They (used for a group of females)

    المساواة (al-musawa) - equality
    العدالة (al-'adalah) - justice
    حقوق الإنسان (huquq al-insan) - human rights
    الديمقراطية (ad-dimuqraṭiyah) - democracy
    التنوع (at-tanaww') - diversity
    العلم (al-'ilm) - science
    التقدم (at-taqaddum) - progress
    التعليم (at-ta'leem) - education
    الاقتصاد (al-iqtisad) - economics
    البيئة (al-bi'ah) - the environment
     بالمشروعية -legality
*/

  type ArabicSubject =
    | "أنا"
    | "أنتَ"
    | "أنتِ"
    | "هو"
    | "هي"
    | "أنتُما"
    | "هما"
    | "هم"
    | "هما"
    | "نحن"
    | "أنتم"
    | "أنتن"
    | "هن"

  const arabicSubjects: ArabicSubject[] = [
    "أنا",
    "أنتَ",
    "أنتِ",
    "هو",
    "هي",
    "أنتُما",
    "هما",
    "هم",
    "هما",
    "نحن",
    "أنتم",
    "أنتن",
    "هن",
  ]
  const arabicActions = [
    { verb: "يكتب", objects: ["رسالة", "كتاب"] },
    { verb: "يُضيف", objects: ["كلمة", "رقم", "فقرة", "صورة", "تعليق"] },
    { verb: "يُرتِّب", objects: ["جدول", "كتب", "صور", "ملفات", "أفكار"] },
    {
      verb: "يُؤمِن",
      objects: [
        "المساواة",
        "العدالة",
        "حقوق",
        "الديمقراطية",
        "التنوع",
        "العلم",
        "التقدم",
        "التعليم",
        "الاقتصاد",
        "البيئة",
        "بالمشروعية",
      ],
    },
    {
      "verb": "يُفرِّش",
      "objects": [
        "شعر",
        "أسنان",
        "فرشاة الأسنان",
        "لوحة",
        "صورة",
        "غرفة",
        "سيارة",
        "ملابس",
        "أثاث",
        "جدار",
      ],
    },
    // شعر (shaʿr) - hair
    // أسنان (asnān) - teeth
    // فرشاة الأسنان (furshat al-asnān) - toothbrush
    // لوحة (luḥah) - canvas
    // صورة (ṣūrah) - image
    // غرفة (ghurfah) - room
    // سيارة (sayyārah) - car
    // ملابس (malābis) - clothes
    // أثاث (athāth) - furniture
    // جدار (jidār) - wall
    {
      "verb": "يبني",
      "objects": [
        "منزل",
        "مبنى",
        "جسر",
        "طريق",
        "سور",
        "مصنع",
        "برج",
        "سد",
        "فندق",
        "مدرسة",
      ],
    },
    // منزل (manzil) - house
    // مبنى (mabnā) - building
    // جسر (jusr) - bridge
    // طريق (ṭarīq) - road
    // سور (sawr) - wall (surrounding)
    // مصنع (muṣnaʿ) - factory
    // برج (burj) - tower
    // سد (sad) - dam
    // فندق (funduq) - hotel
    // مدرسة (madrasah) - school
    {
      "verb": "يشتري",
      "objects": [
        "سيارة",
        "منزل",
        "هاتف",
        "ملابس",
        "طعام",
        "كتاب",
        "حقيبة",
        "ساعة",
        "تذكرة",
        "جواهر",
      ],
    },
    // سيارة (sayyārah) - car
    // منزل (manzil) - house
    // هاتف (hātif) - phone
    // ملابس (malābis) - clothes
    // طعام (ṭaʿām) - food
    // كتاب (kitāb) - book
    // حقيبة (ḥaqībah) - bag
    // ساعة (sāʿah) - watch
    // تذكرة (tadhkirah) - ticket
    // جواهر (jawāhir) - jewelry
    {
      "verb": "يُتصل", // call
      "objects": [
        "بشخص", // with a person
        "بصديق", // with a friend
        "بعائلة", // with a family
        "برقم هاتف", // with a phone number
        "بمدير", // with a manager
        "بزبون", // with a customer
        "بوالدين", // with parents
        "بجار", // with a neighbor
        "بمستشفى", // with a hospital
        "بمكتب", // with an office
      ],
    },
    {
      "verb": "يحمل", // carry
      "objects": [
        "حقيبة", // a bag
        "صندوق", // a box
        "طفلًا", // a child
        "شيئًا ثقيلًا", // something heavy
        "تسوقًا", // shopping (activity)
        "سلة", // a basket
        "أمتعة", // luggage
        "أدوات", // tools
        "شنطة", // a suitcase
        "كيس", // a sack
      ],
    },
    {
      "verb": "يمسك", // catch (yamsik)
      "objects": [
        "كرة", // ball
        "سمكة", // fish
        "كائن", // object
        "قطار", // train
        "فرصة", // opportunity
        "كلب", // dog
        "بالون", // balloon
        "فريسة", // prey
        "جائزة", // prize
        "طائرة", // airplane
      ],
    },
    {
      "verb": "يلتقط", //  "catch" - يلتقط (yaltaqṭ)
      "objects": [
        "صورة", // picture
        "أنفاس", // breaths
        "زهرة", // flower
        "فكرة", // idea
        "ذكريات", // memories
        "لقطة", // snapshot
        "أشياء", // things
        "ألوان", // colors
        "فرصة", // chance
        "لمحة", // glimpse
      ],
    },
    {
      "verb": "يختار", // "choose" - يختار (yukhtār)
      "objects": [
        "خيار", // choice
        "مسار", // path
        "قرار", // decision
        "ملابس", // clothes
        "غذاء", // food
        "هدية", // gift
        "مكان", // place
        "خيارات", // options
        "منتج", // product
        "فرصة", // opportunity
      ],
    },
    {
      "verb": "ينظّف", // "clean" - ينظّف (yunazzif)
      "objects": [
        "منزل", // house
        "غرفة", // room
        "سيارة", // car
        "ملابس", // clothes
        "أواني", // dishes
        "شاشة", // screen
        "أثاث", // furniture
        "زجاج", // glass
        "حمام", // bathroom
        "سجادة", // carpet
      ],
    },
    {
      "verb": "يُقارِن", //  "compare" - يُقارِن (yuqārin)
      "objects": [
        "أسعار", // prices
        "منتجات", // products
        "خصائص", // features
        "ميزات", // advantages
        "تصاميم", // designs
        "أحجام", // sizes
        "نتائج", // results
        "أشكال", // shapes
        "أداء", // performance
        "خيارات", // choices
      ],
    },
    {
      "verb": "يُعتَبِر", // "consider" - يُعتَبِر (yuʿtabir)
      "objects": [
        "فكرة", // idea
        "رأي", // opinion
        "خيار", // option
        "مقترح", // proposal
        "حقيقة", // fact
        "أمر", // matter
        "تصرف", // action
        "رؤية", // vision
        "نتيجة", // result
        "تأثير", // influence
      ],
    },
    {
      "verb": "يحتوي", // "contain" - يحتوي (yaḥtawī)
      "objects": [
        "حاوية", // container
        "صندوق", // box
        "كيس", // bag
        "زجاجة", // bottle
        "منتج", // product
        "مستودع", // warehouse
        "حقيبة", // bag
        "محتوى", // content
        "مطبخ", // kitchen
        "غرفة", // room
      ],
    },
    {
      "verb": "يستمرّ", // "continue" - يستمرّ (yastamarr)
      "objects": [
        "عمل", // work
        "دراسة", // study
        "جهد", // effort
        "نشاط", // activity
        "حركة", // movement
        "حياة", // life
        "تقدم", // progress
        "تطوير", // development
        "رحلة", // journey
        "علاقة", // relationship
      ],
    },
    {
      "verb": "يدافع", // defend
      "objects": [
        "عن حقوق الإنسان", // on human rights
        "عن وطنه", // for his country
        "عن الضعفاء", // for the weak
        "عن نفسه", // for himself
        "عن الحقيقة", // on the truth
        "عن الحياة", // on life
        "عن المستقبل", // for the future
        "عن الحرية", // on freedom
        "عن العدالة", // on justice
        "عن الديمقراطية", // on democracy
      ],
    },
    {
      "verb": "يوصل",
      "objects": [
        "إلى الوجهة", // to the destination
        "إلى المطار", // to the airport
        "إلى الفندق", // to the hotel
        "إلى المدرسة", // to the school
        "إلى المكتب", // to the office
        "إلى المستشفى", // to the hospital
        "إلى المحطة", // to the station
        "إلى المنزل", // to the home
        "إلى الشاطئ", // to the beach
        "إلى الجامعة", // to the university
      ],
    },
    {
      "verb": "يوصل", // "deliver" - يوصل (yuwaṣṣil)
      "objects": [
        "بطرد", // a parcel
        "برسالة", // a message
        "بمنتج", // a product
        "بطلب", // an order
        "بخبر", // news
        "بزمان", // on time
        "بوجبة", // a meal
        "ببضعة أيام", // in a few days
        "بوثيقة", // a document
        "بهدية", // a gift
      ],
    },
    {
      "verb": "يصف", // "describe" - يصف (yuṣif)
      "objects": [
        "بمكان", // a place
        "بشخص", // a person
        "بحدث", // an event
        "بمشهد", // a scene
        "بمشاعر", // feelings
        "بتجربة", // an experience
        "بمظهر", // an appearance
        "بصوت", // a voice
        "بطعام", // food
        "بمشروع", // a project
      ],
    },
    {
      "verb": "يرسم", // "draw" - يرسم (yurassim)
      "objects": [
        "صورة", // a picture
        "لوحة", // a painting
        "رسمة", // a sketch
        "خريطة", // a map
        "شكل", // a shape
        "مخطط", // a diagram
        "خطوط", // lines
        "كاريكاتير", // a cartoon
        "رمز", // a symbol
        "أشكال هندسية", // geometric shapes
      ],
    },
    {
      "verb": "يقود", // "drive" - يقود (yuqūd)
      "objects": [
        "سيارة", // a car
        "دراجة", // a bike
        "حافلة", // a bus
        "شاحنة", // a truck
        "قارب", // a boat
        "دراجة نارية", // a motorcycle
        "سفينة", // a ship
        "طائرة", // an airplane
        "جرار", // a tractor
        "قطار", // a train
      ],
    },
    {
      "verb": "يُسقِط", // "drop" - يُسقِط (yusqit)
      "objects": [
        "كرة", // a ball
        "مفتاح", // a key
        "ورقة", // a paper
        "قلم", // a pen
        "حقيبة", // a bag
        "زجاجة", // a bottle
        "صحن", // a plate
        "مظلة", // an umbrella
        "قطرة ماء", // a drop of water
        "هاتف محمول", // a mobile phone
      ],
    },
    {
      "verb": "يشرح", // "explain" - يشرح (yushriḥ)
      "objects": [
        "فكرة", // an idea
        "مفهوم", // a concept
        "موضوع", // a topic
        "عملية", // a process
        "مفتاح", // a key
        "نظرية", // a theory
        "معلومة", // information
        "سياق", // context
        "تفصيل", // a detail
        "حقيقة", // a fact
      ],
    },
    {
      "verb": "يملأ", // "fill" - يملأ (yamlaʾ)
      "objects": [
        "كوب", // a cup
        "حوض", // a basin
        "صحن", // a dish
        "حقيبة", // a bag
        "حوض استحمام", // a bathtub
        "سطل", // a bucket
        "صفيحة", // a sheet
        "كيس", // a sack
        "قلب", // a heart
        "فم", // a mouth
      ],
    },
    {
      "verb": "يجد", // "find" - يجد (yajid)
      "objects": [
        "مفتاح", // a key
        "كنز", // a treasure
        "مسار", // a path
        "حل", // a solution
        "إجابة", // an answer
        "مخرج", // an exit
        "خيار", // an option
        "مكان", // a place
        "وظيفة", // a job
        "أخطاء", // mistakes
      ],
    },
    {
      "verb": "ينهي", // "finish" - ينهي (yunihi)
      "objects": [
        "مهمة", // a task
        "عمل", // work
        "دراسة", // a study
        "فيلم", // a movie
        "كتاب", // a book
        "مشروع", // a project
        "تمرين", // an exercise
        "طعام", // a meal
        "سباق", // a race
        "لعبة", // a game
      ],
    },
    {
      "verb": "يطير", // "fly" - يطير (yuṭīr)
      "objects": [
        "طائرة", // an airplane
        "طائر", // a bird
        "طائرة ورقية", // a paper plane
        "جواز سفر", // a passport
        "طائرة حربية", // a fighter jet
        "بالون هواء", // a hot air balloon
        "طائرة شراعية", // a glider
        "فراشة", // a butterfly
        "طائرة درون", // a drone
        "جمل طائر", // a flying camel (figurative)
      ],
    },
    {
      "verb": "يُسلّم", // "greet" - يُسلّم (yusallim)
      "objects": [
        "بالسلام", // with peace
        "بالتحية", // with a greeting
        "بالابتسامة", // with a smile
        "بالكلمة الطيبة", // with a kind word
        "بالمصافحة", // with a handshake
        "بالاحترام", // with respect
        "بالود", // with affection
        "بالترحيب", // with welcome
        "بالدعوة", // with an invitation
        "بالمرحبا", // with hello
      ],
    },
    {
      "verb": "يُرشد", // "guide" - يُرشد (yurshid)
      "objects": [
        "بالمسار", // with the path
        "بالإرشاد", // with guidance
        "بالتوجيه", // with direction
        "بالنصيحة", // with advice
        "بالخبرة", // with expertise
        "بالمعلومات", // with information
        "بالمساعدة", // with assistance
        "بالإشارة", // with signaling
        "بالتوجيهات", // with instructions
        "بالملامح", // with cues
      ],
    },
    {
      "verb": "يُسمع", // "hear" - يُسمع (yasmaʿ)
      "objects": [
        "بالصوت", // with sound
        "بالأصوات", // with sounds
        "بالضجيج", // with noise
        "بالموسيقى", // with music
        "بالكلام", // with speech
        "بالأخبار", // with news
        "بالتلفزيون", // with television
        "بالمكالمة", // with a call
        "بالموسيقى", // with song
        "بالأصوات الطبيعية", // with natural sounds
      ],
    },
    {
      "verb": "يُساعد", // "help" - يُساعد (yusaʿid)
      "objects": [
        "بالمشكلة", // with the problem
        "بالمساعدة", // with assistance
        "بالنصيحة", // with advice
        "بالدعم", // with support
        "بالتوجيه", // with guidance
        "بالحل", // with the solution
        "بالتعليم", // with education
        "بالتسهيل", // with facilitation
        "بالفهم", // with understanding
        "بالعمل", // with work
      ],
    },
    {
      "verb": "يُضرب", // "hit" - يُضرب (yuḍrib)
      "objects": [
        "بالقوة", // with force
        "باللكمة", // with a punch
        "بالضربة", // with a strike
        "بالجزمة", // with a kick
        "بالعصا", // with a stick
        "بالمطرقة", // with a hammer
        "بالمضرب", // with a bat
        "باليد", // with the hand
        "بالركلة", // with a kick
        "باللكمة القاضية", // with a knockout punch
      ],
    },
    {
      "verb": "يُتخيل", // "imagine" - يُتخيل (yatkhayil)
      "objects": [
        "بالمغامرة", // with adventure
        "بالأحلام", // with dreams
        "بالخيال", // with imagination
        "بالقصص", // with stories
        "بالعوالم", // with worlds
        "بالمستقبل", // with the future
        "بالرحلات", // with journeys
        "بالسفر", // with travel
        "بالأفكار", // with ideas
        "بالتصورات", // with visions
      ],
    },
    {
      "verb": "يشمل", // "include" - يشمل (yashmal)
      "objects": [
        "قائمة", // a list
        "مجموعة", // a group
        "عناصر", // elements
        "مكونات", // components
        "أعضاء", // members
        "مواد", // materials
        "خيارات", // options
        "فئات", // categories
        "مستندات", // documents
        "أفراد", // individuals
      ],
    },
    {
      "verb": "يدعو", // "invite" - يدعو (yadʿū)
      "objects": [
        "أصدقاء", // friends
        "ضيوف", // guests
        "عائلة", // family
        "زملاء", // colleagues
        "جيران", // neighbors
        "شركاء", // partners
        "مشجعين", // supporters
        "زبائن", // customers
        "زملاء عمل", // coworkers
        "متحدثين", // speakers
      ],
    },
    {
      "verb": "يحتفظ", // "keep" - يحتفظ (yaḥtifẓ)
      "objects": [
        "مفتاح", // a key
        "سجل", // a record
        "ملف", // a file
        "سرّ", // a secret
        "ذاكرة", // memory
        "مقال", // an article
        "سرير", // a bed
        "كلمة مرور", // a password
        "صورة", // a picture
        "عقد", // a contract
      ],
    },
    {
      "verb": "يرمي", // "kick" - يرمي (yarmi)
      "objects": [
        "كرة", // a ball
        "حجر", // a stone
        "قمامة", // garbage
        "كرسي", // a chair
        "كعب", // a heel
        "زجاجة", // a bottle
        "باب", // a door
        "كلب", // a dog
        "صخرة", // a rock
        "كرة قدم", // a soccer ball
      ],
    },
    {
      "verb": "يعرف", // "know" - يعرف (yaʿrif)
      "objects": [
        "شخص", // a person
        "مكان", // a place
        "سبب", // a reason
        "لغة", // a language
        "علم", // knowledge
        "تفاصيل", // details
        "أمور", // things
        "وقت", // time
        "حقيقة", // a fact
        "حدث", // an event
      ],
    },
    {
      "verb": "يتعلم", // "learn" - يتعلم (yataʿallam)
      "objects": [
        "لغة", // a language
        "مهارة", // a skill
        "مادة دراسية", // a subject
        "فن", // an art
        "علم", // knowledge
        "درس", // a lesson
        "تقنية", // a technique
        "نظرية", // a theory
        "أسلوب", // a style
        "معلومات", // information
      ],
    },
    {
      "verb": "يرفع", // "lift" - يرفع (yarfaʿ)
      "objects": [
        "وزن", // weight
        "أثقال", // weights
        "أشياء", // objects
        "أيدي", // hands
        "أجسام", // bodies
        "أمتعة", // luggage
        "رأس", // head
        "سلاح", // a weapon
        "صوت", // a voice
        "علم", // a flag
      ],
    },
    {
      "verb": "يحبّ", // "love" - يحبّ (yuḥibb)
      "objects": [
        "زهرة", // a flower
        "أهل", // family
        "أصدقاء", // friends
        "حيوان", // an animal
        "فن", // art
        "أطفال", // children
        "طعام", // food
        "موسيقى", // music
        "طبيعة", // nature
        "ألعاب", // games
      ],
    },
    {
      "verb": "يدير", // "manage" - يدير (yudīr)
      "objects": [
        "مشروع", // a project
        "شركة", // a company
        "فريق", // a team
        "موارد", // resources
        "عملية", // an operation
        "مهمة", // a task
        "أمور", // affairs
        "محل", // a store
        "مستودع", // a warehouse
        "موظفين", // employees
      ],
    },
    {
      "verb": "يعني", // "mean" - يعني (yaʿnī)
      "objects": [
        "كلمة", // a word
        "مفهوم", // a concept
        "عبارة", // a phrase
        "رمز", // a symbol
        "معنى", // meaning
        "إشارة", // a sign
        "تفسير", // an interpretation
        "مقصود", // intent
        "نية", // intention
        "تأويل", // interpretation
      ],
    },
    {
      "verb": "يقيس", // "measure" - يقيس (yuqīs)
      "objects": [
        "مسافة", // distance
        "زمن", // time
        "حجم", // size
        "وزن", // weight
        "سرعة", // speed
        "درجة حرارة", // temperature
        "كمية", // quantity
        "أبعاد", // dimensions
        "كفاءة", // efficiency
        "عمق", // depth
      ],
    },
    {
      "verb": "يلتقي", // "meet" - يلتقي (yaltaqī)
      "objects": [
        "صديق", // a friend
        "شريك", // a partner
        "عائلة", // a family
        "زميل", // a colleague
        "عميل", // a client
        "زبون", // a customer
        "زميل دراسة", // a classmate
        "زملاء عمل", // coworkers
        "جار", // a neighbor
        "فريق عمل", // a work team
      ],
    },
    {
      "verb": "يتحرّك", // "move" - يتحرّك (yataḥarrak)
      "objects": [
        "سيارة", // a car
        "شاحنة", // a truck
        "جسم", // a body
        "جندي", // a soldier
        "قافلة", // a caravan
        "سفينة", // a ship
        "قطار", // a train
        "حيوان", // an animal
        "رأس", // a head
        "بضائع", // goods
      ],
    },
    {
      "verb": "يحتاج", // "need" - يحتاج (yaḥtāj)
      "objects": [
        "مساعدة", // help
        "وقت", // time
        "مال", // money
        "دعم", // support
        "نصيحة", // advice
        "معلومات", // information
        "فهم", // understanding
        "مساحة", // space
        "أدوات", // tools
        "فرص", // opportunities
      ],
    },
    {
      "verb": "يلاحظ", // "notice" - يلاحظ (yalāḥiẓ)
      "objects": [
        "فرق", // a difference
        "تغيير", // a change
        "علامة", // a sign
        "خطأ", // an error
        "تفاصيل", // details
        "ملاحظة", // a note
        "اختلاف", // a variation
        "ظاهرة", // a phenomenon
        "تحسين", // improvement
        "تناقض", // a contradiction
      ],
    },
    {
      "verb": "يقدّم", // "offer" - يقدّم (yuqaddim)
      "objects": [
        "مساعدة", // help
        "اقتراح", // a suggestion
        "طعام", // food
        "خدمة", // a service
        "هدية", // a gift
        "عرض", // an offer
        "معلومات", // information
        "دعم", // support
        "شكر", // thanks
        "مساعدة إنسانية", // humanitarian aid
      ],
    },
    {
      "verb": "يأمر", // "order" - يأمر (yaʾmur)
      "objects": [
        "طعام", // food
        "منتج", // a product
        "خدمة", // a service
        "عمل", // work
        "مشروب", // a drink
        "وجبة", // a meal
        "أوامر", // orders
        "أمور", // matters
        "مستلزمات", // supplies
        "توجيهات", // instructions
      ],
    },
    {
      "verb": "يدين", // "owe" - يدين (yudayin)
      "objects": [
        "مال", // money
        "دين", // debt
        "خدمة", // service
        "لصديق", // to a friend
        "لشركة", // to a company
        "لبنك", // to a bank
        "لعائلة", // to a family
        "لحكومة", // to a government
        "لزبون", // to a customer
        "لجامعة", // to a university
      ],
    },
    {
      "verb": "يمتلك", // "own" - يمتلك (yamtalik)
      "objects": [
        "سيارة", // a car
        "منزل", // a house
        "شركة", // a company
        "أرض", // land
        "هاتف", // a phone
        "فندق", // a hotel
        "أعمال", // businesses
        "مصنع", // a factory
        "حقوق", // rights
        "تحف", // art pieces
      ],
    },
    {
      "verb": "يرسم", // "paint" - يرسم (yurassim)
      "objects": [
        "لوحة", // a painting
        "صورة", // a picture
        "جدار", // a wall
        "سيارة", // a car
        "باب", // a door
        "مناظر", // landscapes
        "غرفة", // a room
        "وجه", // a face
        "أظافر", // nails
        "أشكال", // shapes
      ],
    },
    {
      "verb": "يختار", // "pick" - يختار (yukhtār)
      "objects": [
        "زهرة", // a flower
        "ملابس", // clothes
        "فاكهة", // fruit
        "مكان", // a place
        "فريق", // a team
        "كتاب", // a book
        "ألوان", // colors
        "منتج", // a product
        "قائمة", // a menu
        "خيارات", // choices
      ],
    },
    {
      "verb": "يفضل", // "prefer" - يفضل (yufaḍḍil)
      "objects": [
        "شاي", // tea
        "قهوة", // coffee
        "طعام", // food
        "سيارة", // a car
        "جوارب", // socks
        "طقس", // weather
        "أفلام", // movies
        "أصدقاء", // friends
        "مكان", // a place
        "تجربة", // an experience
      ],
    },
    {
      "verb": "يعدّ", // "prepare" - يعدّ (yuʿadd)
      "objects": [
        "وجبة", // a meal
        "تقرير", // a report
        "عرض", // a presentation
        "اختبار", // a test
        "مشروع", // a project
        "خطة", // a plan
        "مفاجأة", // a surprise
        "طعام", // food
        "مشروب", // a drink
        "هدية", // a gift
      ],
    },
    {
      "verb": "ينطق", // "pronounce" - ينطق (yuntaq)
      "objects": [
        "كلمة", // a word
        "اسم", // a name
        "جملة", // a sentence
        "حروف", // letters
        "صوت", // a sound
        "لغة", // a language
        "حرف", // a letter
        "كلمات", // words
        "عبارة", // a phrase
        "ألفاظ", // terms
      ],
    },
    {
      "verb": "يحمي", // "protect" - يحمي (yaḥmī)
      "objects": [
        "بيئة", // the environment
        "حقوق", // rights
        "أمان", // safety
        "أطفال", // children
        "معلومات", // information
        "ممتلكات", // properties
        "مجتمع", // a community
        "ممتلكات شخصية", // personal belongings
        "سرية", // confidentiality
        "بيانات", // data
      ],
    },
    {
      "verb": "يسحب", // "pull" - يسحب (yashhab)
      "objects": [
        "ستارة", // a curtain
        "جسم", // a body
        "زنجير", // a chain
        "كرسي", // a chair
        "سيارة", // a car
        "أغطية", // covers
        "ماء", // water
        "ملف", // a file
        "أمتعة", // luggage
        "رف", // a shelf
      ],
    },
    {
      "verb": "يدفع", // "push" - يدفع (yadfaʿ)
      "objects": [
        "باب", // a door
        "سيارة", // a car
        "كرسي", // a chair
        "زنجير", // a chain
        "موقع", // a location
        "دراجة", // a bicycle
        "لوح", // a board
        "مكتب", // a desk
        "صندوق", // a box
        "زر", // a button
      ],
    },
    {
      "verb": "يستلم", // "receive" - يستلم (yastalam)
      "objects": [
        "بريد", // mail
        "طرد", // package
        "هدية", // gift
        "أموال", // money
        "طلب", // order
        "إشعار", // notification
        "رسالة", // message
        "جواب", // reply
        "شهادة", // certificate
        "تحديث", // update
      ],
    },
    {
      "verb": "يتعرّف", // "recognize" - يتعرّف (yataʿraf)
      "objects": [
        "وجوه", // faces
        "أصوات", // voices
        "أماكن", // places
        "رموز", // symbols
        "ألوان", // colors
        "أشخاص", // people
        "علامات", // signs
        "عيوب", // flaws
        "نماذج", // models
        "ملامح", // features
      ],
    },
    {
      "verb": "يتذكّر", // "remember" - يتذكّر (yatadhakkar)
      "objects": [
        "ذكريات", // memories
        "أحداث", // events
        "أسماء", // names
        "مواعيد", // dates
        "تفاصيل", // details
        "أرقام", // numbers
        "كلمات", // words
        "أماكن", // places
        "وعود", // promises
        "أفكار", // ideas
      ],
    },
    {
      "verb": "يُبلّغ", // "report" - يُبلّغ (yuballigh)
      "objects": [
        "أخبار", // news
        "معلومات", // information
        "أحداث", // events
        "تقارير", // reports
        "نتائج", // results
        "شكاوى", // complaints
        "ملاحظات", // observations
        "تطورات", // developments
        "مشاكل", // problems
        "إجراءات", // procedures
      ],
    },
    {
      "verb": "يحترم", // "respect" - يحترم (yaḥtaram)
      "objects": [
        "قوانين", // laws
        "قيم", // values
        "حقوق", // rights
        "عادات", // customs
        "ثقافات", // cultures
        "رؤساء", // leaders
        "أصول", // principles
        "تقاليد", // traditions
        "معتقدات", // beliefs
        "فعاليات", // events
      ],
    },
    {
      "verb": "يعود", // "return" - يعود (yaʿūd)
      "objects": [
        "منتج", // product
        "زائر", // visitor
        "سفر", // trip
        "استثمار", // investment
        "أموال", // money
        "فصل دراسي", // semester
        "ملف", // file
        "هدية", // gift
        "كتاب", // book
        "صديق", // friend
      ],
    },
    {
      "verb": "يركب", // "ride" - يركب (yarkab)
      "objects": [
        "سيارة", // car
        "دراجة", // bike
        "حصان", // horse
        "حافلة", // bus
        "دراجة نارية", // motorcycle
        "قطار", // train
        "طائرة", // plane
        "زلاجة", // sled
        "قارب", // boat
        "ألعاب", // rides
      ],
    },
    {
      "verb": "يحكم", // "rule" - يحكم (yaḥkum)
      "objects": [
        "بلد", // country
        "مجتمع", // community
        "قانون", // law
        "حكومة", // government
        "مملكة", // kingdom
        "مدينة", // city
        "قرار", // decision
        "فريق", // team
        "شركة", // company
        "منطقة", // region
      ],
    },
    {
      "verb": "يوفِّر", // "save" - يوفِّر (yuwaffir)
      "objects": [
        "وقت", // time
        "مال", // money
        "جهد", // effort
        "موارد", // resources
        "فرصة", // opportunity
        "فاتورة", // bill
        "مساحة", // space
        "حياة", // life
        "طاقة", // energy
        "بيانات", // data
      ],
    },
    {
      "verb": "يحفظ", // "save" - يحفظ (yaḥfiẓ)
      "objects": [
        "معلومات", // information
        "صور", // pictures
        "ملفات", // files
        "ذكريات", // memories
        "أمان", // security
        "مستندات", // documents
        "أسرار", // secrets
        "أموال", // money
        "كلمات مرور", // passwords
        "مفاتيح", // keys
      ],
    },
    {
      "verb": "يرى", // "see" - يرى (yurā)
      "objects": [
        "مشهد", // scene
        "صورة", // picture
        "رؤية", // vision
        "شاشة", // screen
        "عرض", // display
        "فيلم", // movie
        "نتيجة", // result
        "حقيقة", // fact
        "ظاهرة", // phenomenon
        "أشباح", // ghosts
      ],
    },
    {
      "verb": "يبيع", // "sell" - يبيع (yabiʿ)
      "objects": [
        "سلعة", // a commodity
        "منتج", // a product
        "خدمة", // a service
        "عقار", // real estate
        "ملكية", // ownership
        "سيارة", // a car
        "منزل", // a house
        "أسهم", // shares
        "جواهر", // jewels
        "تذاكر", // tickets
      ],
    },
    {
      "verb": "يرسل", // "send" - يرسل (yursil)
      "objects": [
        "رسالة", // a message
        "بريد إلكتروني", // an email
        "طلب", // a request
        "هدية", // a gift
        "ملف", // a file
        "طرد", // a package
        "صورة", // a picture
        "رسميات", // documents
        "بيانات", // data
        "صوت", // audio
      ],
    },
    {
      "verb": "يخدم", // "serve" - يخدم (yukhidm)
      "objects": [
        "زبون", // a customer
        "مجتمع", // a community
        "ضيوف", // guests
        "عملاء", // clients
        "مريض", // a patient
        "جمهور", // an audience
        "جيش", // an army
        "مستخدم", // a user
        "أعضاء", // members
        "عائلة", // a family
      ],
    },
    {
      "verb": "يظهر", // "show" - يظهر (yadhhar)
      "objects": [
        "فيلم", // a movie
        "صورة", // a picture
        "شاشة", // a screen
        "برنامج", // a program
        "معلومات", // information
        "حقائق", // facts
        "خيارات", // options
        "إعلان", // an advertisement
        "عرض", // a presentation
        "موهبة", // a talent
      ],
    },
    {
      "verb": "يتهجى", // "spell" - يتهجى (yatahajja)
      "objects": [
        "كلمة", // a word
        "اسم", // a name
        "جملة", // a sentence
        "حرف", // a letter
        "تسجيل", // a recording
        "لفظ", // a pronunciation
        "نص", // a text
        "سلسلة", // a series
        "شفرة", // a code
        "شعار", // a logo
      ],
    },
    {
      "verb": "يبدأ", // "start" - يبدأ (yabdaʾ)
      "objects": [
        "مشروع", // a project
        "عمل", // work
        "فصل", // a chapter
        "سباق", // a race
        "أحداث", // events
        "رحلة", // a journey
        "عام دراسي", // an academic year
        "عرض", // a show
        "مهرجان", // a festival
        "تدريب", // training
      ],
    },
    {
      "verb": "يسرق", // "steal" - يسرق (yasriq)
      "objects": [
        "مال", // money
        "مجوهرات", // jewelry
        "هاتف", // a phone
        "سيارة", // a car
        "بيانات", // data
        "أفكار", // ideas
        "هدايا", // gifts
        "لوحة فنية", // an artwork
        "ساعة", // a watch
        "ملابس", // clothes
      ],
    },
    {
      "verb": "يتوقّف", // "stop" - يتوقّف (yatwaqqaf)
      "objects": [
        "سيارة", // a car
        "عملية", // a process
        "حركة", // movement
        "ضوضاء", // noise
        "تنفس", // breathing
        "مظهر", // appearance
        "مشروع", // a project
        "دموع", // tears
        "عمل", // work
        "نشاط", // activity
      ],
    },
    {
      "verb": "يدرس", // "study" - يدرس (yadrus)
      "objects": [
        "مادة دراسية", // a subject
        "كتاب", // a book
        "دروس", // lessons
        "بحث", // a research
        "تقرير", // a report
        "لغة", // a language
        "فصل", // a chapter
        "مشروع", // a project
        "تاريخ", // history
        "علوم", // sciences
      ],
    },
    {
      "verb": "يدعم", // "support" - يدعم (yudaʿim)
      "objects": [
        "فريق", // a team
        "مشروع", // a project
        "قضية", // a cause
        "مبادرة", // an initiative
        "مؤسسة", // an organization
        "حملة", // a campaign
        "مبلغ مالي", // financial aid
        "أسرة", // a family
        "طلاب", // students
        "فنان", // an artist
      ],
    },
    {
      "verb": "يعلم", // "teach" - يعلم (yaʿlam)
      "objects": [
        "طالب", // a student
        "مادة دراسية", // a subject
        "لغة", // a language
        "مهارة", // a skill
        "درس", // a lesson
        "فن", // an art
        "علم", // knowledge
        "تقنية", // a technique
        "مبدأ", // a principle
        "فصل", // a chapter
      ],
    },
    {
      "verb": "يخبر", // "tell" - يخبر (yukhbir)
      "objects": [
        "شخص", // a person
        "قصة", // a story
        "خبر", // news
        "سر", // a secret
        "أحداث", // events
        "حقيقة", // fact
        "رأي", // opinion
        "معلومات", // information
        "خطة", // a plan
        "تفاصيل", // details
      ],
    },
    {
      "verb": "يفكر", // "think" - يفكر (yufakir)
      "objects": [
        "فكرة", // an idea
        "مسألة", // a problem
        "قرار", // a decision
        "أمر", // a matter
        "سيناريو", // a scenario
        "رؤية", // a vision
        "مستقبل", // the future
        "خيار", // an option
        "فلسفة", // philosophy
        "أحلام", // dreams
      ],
    },
    {
      "verb": "يرمي", // "throw" - يرمي (yarmi)
      "objects": [
        "كرة", // a ball
        "مهمة", // a task
        "قمامة", // garbage
        "حجر", // a stone
        "سهم", // an arrow
        "ورقة", // a paper
        "قنبلة", // a bomb
        "سلاح", // a weapon
        "صاروخ", // a rocket
        "خطأ", // a mistake
      ],
    },
    {
      "verb": "يدرب", // "train" - يدرب (yadrib)
      "objects": [
        "فريق", // a team
        "رياضي", // an athlete
        "موظف", // an employee
        "جيش", // an army
        "مجموعة", // a group
        "متدرب", // a trainee
        "حيوان", // an animal
        "فني", // a technician
        "ألعاب", // games
        "فرسان", // knights
      ],
    },
    {
      "verb": "يترجم", // "translate" - يترجم (yatargam)
      "objects": [
        "نص", // a text
        "كتاب", // a book
        "مقال", // an article
        "لغة", // a language
        "وثيقة", // a document
        "ترجمة", // translation
        "جملة", // a sentence
        "كلمة", // a word
        "شعر", // poetry
        "فيلم", // a movie
      ],
    },
    {
      "verb": "يفهم", // "understand" - يفهم (yufham)
      "objects": [
        "مفهوم", // a concept
        "لغة", // a language
        "معنى", // meaning
        "سياق", // context
        "أفكار", // ideas
        "شرح", // explanation
        "دروس", // lessons
        "رموز", // symbols
        "تصميم", // design
        "خيارات", // choices
      ],
    },
    {
      "verb": "يزور", // "visit" - يزور (yazūr)
      "objects": [
        "مدينة", // a city
        "معلم سياحي", // a tourist attraction
        "عائلة", // a family
        "أصدقاء", // friends
        "متحف", // a museum
        "مكان", // a place
        "مريض", // a patient
        "مدرسة", // a school
        "بيت", // a house
        "بلد", // a country
      ],
    },
    {
      "verb": "يرغب", // "want" - يرغب (yarghub)
      "objects": [
        "سفر", // traveling
        "عمل", // work
        "منتج", // a product
        "تغيير", // change
        "تحسين", // improvement
        "زواج", // marriage
        "مغامرة", // an adventure
        "مستقبل", // the future
        "تحدي", // a challenge
        "مرافقة", // companionship
      ],
    },
    {
      "verb": "يريد", // "want" - يريد (yurīd)
      "objects": [
        "شيء", // something
        "نجاح", // success
        "سعادة", // happiness
        "حب", // love
        "استقرار", // stability
        "حياة", // life
        "راحة", // comfort
        "تغيير", // change
        "إصلاح", // repair
        "حلم", // a dream
      ],
    },
    {
      "verb": "يزن", // "weigh" - يزن (yazin)
      "objects": [
        "جسم", // a body
        "طعام", // food
        "حقيبة", // a bag
        "ذهب", // gold
        "سائل", // liquid
        "حجر كريم", // a gemstone
        "ورقة", // paper
        "كتلة", // mass
        "عينة", // a sample
        "أوزان", // weights
      ],
    },
    {
      "verb": "يكتب", // "write" - يكتب (yaktub)
      "objects": [
        "رسالة", // a letter
        "مقال", // an article
        "كتاب", // a book
        "مذكرة", // a memo
        "تقرير", // a report
        "مدونة", // a blog
        "شهادة", // a certificate
        "قصة", // a story
        "رسم", // drawing
        "ملاحظات", // notes
      ],
    },
    {
      "verb": "يرسم", // "write" - يرسم (yurassim)
      "objects": [
        "صورة", // a picture
        "رسم", // a drawing
        "لوحة", // a painting
        "مخطط", // a diagram
        "خارطة", // a map
        "تصميم", // a design
        "شكل", // a shape
        "رمز", // an icon
        "جرافيك", // graphics
        "فن", // art
      ],
    },
  ]

  const conjugateArabicVerbs = (subject: ArabicSubject, verb: string) => {
    switch (subject) {
      case "أنا":
        return `أ${verb.slice(1)}`
      case "أنتم":
        return `ت${verb.slice(1)}`
      case "أنتن":
        return `ت${verb.slice(1)}`
      case "أنتَ":
        return `ت${verb.slice(1)}`
      case "أنتُما":
        return `ت${verb.slice(1)}`
      case "أنتِ":
        return `ت${verb.slice(1)}`
      case "نحن":
        return `ن${verb.slice(1)}`
      case "هم":
        return `ي${verb.slice(1)}`
      case "هما":
        return `ي${verb.slice(1)}`
      case "هن":
        return `ي${verb.slice(1)}`
      case "هو":
        return `ي${verb.slice(1)}`
      case "هي":
        return `ت${verb.slice(1)}`
      default:
        throw new Error("Invalid subject")
    }
  }

  const subject = chooseRandomElement(arabicSubjects)
  const action = chooseRandomElement(arabicActions)

  return `${subject} ${conjugateArabicVerbs(
    subject,
    action.verb
  )} ${chooseRandomElement(action.objects)}`
}

const generateRandomJapaneseSentence = function () {
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

    Singular: 私 (わたし) - I (neutral), 僕 (ぼく) - I (masculine), 俺 (おれ) - I (casual masculine)
    Plural: 私たち (わたしたち) - we, 僕たち (ぼくたち) - we, 俺たち (おれたち) - we

Second Person:

    Singular: あなた - you (neutral, can be used formally or informally)
    Plural: あなたたち - you all, あなた方 (あなたかた) - you all (more formal)

Third Person:

    Singular: 彼 (かれ) - he, 彼女 (かのじょ) - she
    Plural: 彼ら (かれら) - they (masculine), 彼女ら (かのじょら) - they (feminine)
 */

  const subjects = [
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
  const actions = [
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

  const subject = chooseRandomElement(subjects)
  const action = chooseRandomElement(actions)
  const { objects, verb } = action

  const sentence = objects
    ? `${subject} は ${chooseRandomElement(objects)} を ${verb}。`
    : `${subject} は ${verb}。`

  return sentence
}

const generateRandomHebrewSentence = () => {
  type HebrewSubect =
    | "אֲנִי" // (Ani) - I
    | "אַתָּה" // (Atah) - You (masculine singular)
    | "אַתְּ" // (At) - You (feminine singular)
    | "הוּא" // (Hu) - He
    | "הִיא" // (Hi) - She
    | "אֲנַחְנוּ" // (Anachnu) - We
    | "אַתֶּם" // (Atem) - You (masculine plural)
    | "אַתֶּן" // (Aten) - You (feminine plural)
    | "הֵם" // (Hem) - They (masculine)
    | "הֵן" // (Hen) - They (feminine)

  const hebrewSubjects: HebrewSubect[] = [
    "אֲנִי", // (Ani) - I
    "אַתָּה", // (Atah) - You (masculine singular)
    "אַתְּ", // (At) - You (feminine singular)
    "הוּא", // (Hu) - He
    "הִיא", // (Hi) - She
    "אֲנַחְנוּ", // (Anachnu) - We
    "אַתֶּם", // (Atem) - You (masculine plural)
    "אַתֶּן", // (Aten) - You (feminine plural)
    "הֵם", // (Hem) - They (masculine)
    "הֵן", // (Hen) - They (feminine)
  ]

  const conjugateHebrewVerb = (
    subject: HebrewSubect,
    verb: {
      infinitive: string
      ms: string
      fs: string
      mp: string
      fp: string
    }
  ) => {
    const { ms, fs, mp, fp } = verb
    switch (subject) {
      case "אֲנִי": // (Ani) - I
        return ms
      case "אַתָּה": // (Atah) - You (masculine singular)
        return ms
      case "אַתְּ": // (At) - You (feminine singular)
        return fs
      case "הוּא": // (Hu) - He
        return ms
      case "הִיא": // (Hi) - She
        return fs
      case "אֲנַחְנוּ": // (Anachnu) - We
        return mp
      case "אַתֶּם": // (Atem) - You (masculine plural)
        return mp
      case "אַתֶּן": // (Aten) - You (feminine plural)
        return fp
      case "הֵם": // (Hem) - They (masculine)
        return ms
      case "הֵן": // (Hen) - They (feminine)
        return fp
    }
  }

  const hebrewActions = [
    {
      verb: {
        infinitive: "כְּתוֹב", // to write
        ms: "כּוֹתֵב",
        fs: "כּוֹתֶבֶת",
        mp: "כּוֹתְבִים",
        fp: "כּוֹתְבוֹת",
      },
      objects: [
        "סֵפֶר", //(sefer) - book
        "מַכְתֵּב", // (mikhtev) - letter
        "דִּבְרֵי תוֹרָה", //(divrei torah) - Torah scrolls or Torah teachings
        "יוֹםָן", // (yoman) - diary
        "מַגָּזִין", // (magazin) - magazine
        "מַשְׁמָעוֹת", // (mashma'ot) - reports
        "שִׁיר", // (shir) - song
        "רוֹמָן", // (roman) - novel
        "מֵאָמַר", // (me'amar) - article
        "פּוֹסְטֶר", // (poster) - poster
      ],
    },
    {
      verb: {
        infinitive: "לְהוֹסִיף", // to add / continue
        ms: "מוֹסִיף",
        fs: "מוֹסִיפָה",
        mp: "מוֹסִיפִים",
        fp: "מוֹסִיפוֹת",
      },
      objects: [
        "אִפְשָׁרוּת", // (ifsharut) - possibility
        "אֶנֶרְגִיָּה", // (energiyah) - energy
        "זְמַן", // (zman) - time
        "יַדְעַן", // (yadan) - knowledge
        "כֹּחַ", // (koach) - strength
        "מִסְפָּרִים", // (misparim) - numbers
        "מֵידָע", // (meida) - information
        "מֶלַח", // (melach) - salt
        "מַסְמֵר", // (masmer) - nail
        "מַסְפֵּר", // (masper) - a number
        "מַסָּה", // (masa) - a load
        "פְּרָטִים", // (pratim) - details
        "פֵּרוֹת", // (perot) - fruits
        "צְבָע", // (tseva) - color
        "שִׁמְשׁוֹן", // (shimshon) - sunscreens ],
        "שֶׁקֶל", // (shekel) - money or currency
        "שֵׂיבָה", // (seivah) - old age
        "תַּכְשִׁיטִים", // (tachshitim) - jewelry
        "תַּמְרוּץ", // (tamrutz) - effort
        "תַּמְרוּצִים", // (tamrutzim) - efforts
      ],
    },
    {
      verb: {
        infinitive: "לְהַעֲרִיץ", // to admire
        ms: "מַעֲרִיץ",
        fs: "מַעֲרִיצָה",
        mp: "מַעֲרִיצִים",
        fp: "מַעֲרִיצוֹת",
      },
      objects: [
        "אָדָם", // (adam) - person
        "תַמוּנָה", // (tamu'na) - image
        "יֹצֵר", // (yotzer) - artist
        "צִיּוּן", // (tzion) - monument
        "יֹופִי", // (yofi) - beauty
        "פְרָטִיוּת", // (prativut) - uniqueness
        "גְאוֹנֵךְ", // (ge'onech) - pride
        "כָּשֵׁר", // (kashehr) - talent
        "קְשָׁרֵיהוּת", // (keshareyut) - connection
        "חוּפָּה", // (chuppa) - wedding canopy
      ],
    },
    {
      verb: {
        infinitive: "לְאַרְגֵּן", // to arrange
        ms: "מְאַרְגֵּן",
        fs: "מְאַרְגֶּנֶת",
        mp: "מְאַרְגְּנִים",
        fp: "מְאַרְגְּנוֹת",
      },
      root: "אדן",
      objects: [
        "אִירוּועִים", // (iruvim) - parties
        "אִירוּעִים", // (iru'im) - events
        "דַּפָּנוֹת", // (dapannot) - walls
        "חִתּוּנוֹת", // (chitunot) - weddings
        "חֶדֶר", // (cheder) - room
        "יָמִים", // (yamim) - days
        "כִּיסוֹאִין", // (kiso'in) - chairs
        "כְּנִסְיָה", // (knesiya) - meetings
        "מִסְדְרִים", // (misdrim) - arrangements
        "סִדְרֵי", // הַיּוֹם (sidrei hayom) - daily schedules
        "סִדּוּר", // (sidur) - order
        "סֵפֶר", // (sefer) - book
        "עֵץ", // (etz) - tree
        "פַּרְחֵי", // (parchei) - flowers
        "פַּרְטִים", // (partim) - details
        "פְּעֻלּוֹת", // (pe'ulot) - tasks or assignments
        "שֻׁלְחָן", // (shulchan) - table
        "שׁוֹלֵי", // הַדֶּרֶךְ (sholei haderakh) - travel itineraries
        "תְּמוּנָה", // (temuna) - picture
        "תַּכְנִים", // (takhnim) - plans or schemes
      ],
    },
    {
      verb: {
        infinitive: "מַאֲמִין", // to believe
        ms: "מַאֲמִין",
        fs: "מַאֲמִינָה",
        mp: "מַאֲמִינִים",
        fp: "מַאֲמִינוֹת",
      },
      objects: [
        "אֱמוּנָה", // (emuna) - faith
        "אַדְמִירְצָה", // (admirtza) - someone's word or promise
        "אַמּוּנָה", // (amuna) - loyalty
        "אָהַבְתָּ", // (ahavta) - love
        "גִּאוּלָּה", // (gi'ulah) - redemption
        "דְּבָקוּת", // (d'vakut) - attachment
        "הַבִּטָּחוֹן", // (habitachon) - confidence
        "חִיל", // (chil) - strength
        "טְמוּנוּת", // (temunut) - trust
        "תְּקִיָּה", // (tekiya) - hope
        "תְּשׁוּעָה", // (teshua) - salvation
      ],
    },
    {
      verb: {
        infinitive: "לְהִשְׁתַּייֵּךְ", // to belong
        ms: "מִשְׁתַּיֵּךְ",
        fs: "מִשְׁתַּיֶּכֶת",
        mp: "מִשְׁתַּיְּכִים",
        fp: "מִשְׁתַּיְּכוֹת",
      },
      objects: [
        "דְּת", // (dat) - religion
        "זְמַן", // (zman) - time
        "לֵב", // (lev) - heart
        "מִשְפָּחָה", // (mishpacha) - family
        "מָקוֹם", // (makom) - place
        "עַם", // (am) - nation
        "קֶהֶל", // (kehel) - community
        "קָהָל", // (kahal) - congregation
        "קָהָלִים", // (kahalim) - crowds
        "תִּקוּפָה", // (tikufa) - era
      ],
    },
    {
      verb: {
        infinitive: "לְהַבְרִישׁ", // to brush
        ms: "מַבְרִישׁ",
        fs: "מַבְרִישָׁה",
        mp: "מַבְרִישִׁים",
        fp: "מַבְרִישׁוֹת",
      },
      objects: [
        "שֵׁיעַר", // (she'ar) - hair
        "שִׁנַּיִם", // (shinayim) - teeth
        "בֶּרֶזֶל", // (be'rezel) - iron
        "פַּיִס", // (payis) - comb
        "מָסָן", // (masan) - brush
        "מַשְׁטֵג", // (mashteg) - broom
        "כַּפָּיוֹן", // (kappayon) - mop
        "סַמְרֵטוּט", // (samretut) - scrubbing
        "צְעֵרֵי", // (tze'erei) - bristles
        "לַחֲצֵנֵי", // (lachatzenei) - handle
      ],
    },
    {
      verb: {
        infinitive: "בוֹנֶה", // to build
        ms: "בּוֹנֶה",
        fs: "בּוֹנָה",
        mp: "בּוֹנִים",
        fp: "בּוֹנוֹת",
      },
      objects: [
        "בַּיִת", // (bayit) - house
        "גַּג", // (gag) - roof
        "חָדֵר", // (chader) - room
        "קִיר", // (kir) - wall
        "פֶּתַח", // (petach) - door
        "חַלּוֹן", // (chalon) - window
        "מִדְרָגָה", // (midraga) - staircase
        "בְּנִיָּין", // (bniyan) - building
        "עִיצוּב", // (itzuv) - design
        "מְקוֹמָהוּת", // (mekomahut) - location
      ],
    },
    {
      verb: {
        infinitive: "קוֹנֶה", // to buy
        ms: "קוֹנֶה",
        fs: "קוֹנָה",
        mp: "קוֹנִים",
        fp: "קוֹנוֹת",
      },
      objects: [
        "אֶלֶפַנִים", // (elefanim) - groceries
        "אוֹתָנִי", // (otani) - souvenir
        "בַּגֶּדֶ", // (bagged) - clothing
        "דֶּירָה", // (dirah) - an apartment or dwelling
        "חֲגִים", // (chagim) - holidays
        "חוֹל", // (chol) - sand
        "כָּרָמִים", // (karamim) - vineyards
        "מִצְבֵּר", // (mitzber) - storehouse
        "מַזְרֵן", // (mazren) - a mattress
        "מַכְלֵל", // (makhlel) - store
        "מַלְחֶם", // (malchem) - bread
        "מָשֵׁק", // (mashke) - drink
        "סֵפֶר", // (sefer) - a book
        "פֶּרַח", // (perach) - flower
        "קְטַנִּיּוֹת", // (k'taniyot) - small items or commodities
        "קְנִיּוֹן", // (k'niyon) - acquisition
        "רֶכֶב", // (rechev) - a car or vehicle
        "תְּכוּנָה", // (techunah) - a plan
        "תֵּקֶף", // (tekef) - a ticket
      ],
    },
    {
      verb: {
        infinitive: "קוֹרֵא", // to call
        ms: "קוֹרֵא",
        fs: "קוֹרֵאת",
        mp: "קוֹרְאִים",
        fp: "קוֹרְאוֹת",
      },
      objects: [
        "אָדָם", // (adam) - person
        "שֵׁם", // (shem) - name
        "טֵלֵפוֹן", // (telephone) - telephone
        "חֲבֵר", // (chaver) - friend
        "רַחֵל", // (rachel) - Rachel
        "מְסִיבָה", // (misiba) - party
        "זְמַן", // (zman) - time
        "מִנְיָן", // (minyan) - count
        "מְבוֹצָר", // (mevotsar) - contact
        "קוֹל", // (kol) - voice
      ],
    },
    {
      verb: {
        infinitive: "לָשֵׂאת", // to carry
        ms: "נוֹשֵׂא",
        fs: "נוֹשֵׂאת",
        mp: "נוֹשְׂאִים",
        fp: "נוֹשְׂאוֹת",
      },
      objects: [
        "אֶבֶן", // (even) - stone
        "אֶגְרוֹף", // (egrof) - shovel
        "דְּבַרִים", // (deva'rim) - things
        "חָפֶז", // (chafez) - suitcase
        "כִּיסֵא", // (kise) - chair
        "כַּרְטִיס", // (kartis) - card
        "מַזְלֵג", // (mazleg) - fork
        "מַשְׁאוֹת", // (mashot) - loads
        "סֵפֶר", // (sefer) - book
        "סֶלַע", // (selah) - rock
        "קַרְטוֹן", // (karton) - cardboard box
        "קוֹרֵץ", // (koretz) - stretcher
        "תְּיקוּ", // (tiku) - suitcase
        "תַּיק", // (taik) - bag
        "תַּיקָה", // (taika) - backpack
        "תַּמְרוּת", // (tamrut) - load
      ],
    },
    {
      verb: {
        infinitive: "לִלְכּוֹד", // to catch
        ms: "לוֹכֵד",
        fs: "לוֹכֶדֶת",
        mp: "לוֹכְדִים",
        fp: "לוֹכְדוֹת",
      },
      objects: [
        "בַּיָּעִים", // (bayaim) - animals
        "גַּנָּב", // (ganav) - thief
        "דַּג", // (dag) - fish
        "דָּגִים", // (dagim) - fish
        "זְמַנִּים", // (zmanim) - moments
        "חִטָּה", // (chitah) - wheat
        "חֶבֶר", // (khever) - friend
        "חַזִּיר", // (khazir) - pig
        "חַיָּה", // (khayyah) - animal
        "חַרְקִי", // (kharki) - insect
        "טֶרֶף", // (teref) - prey
        "יָרֵק", // (yarek) - vegetable
        "לַקִּידָרוֹן", // (lakidaron) - train
        "עֲטַלֵּף", // (atalaf) - bat
        "פַּרְפַּרֵים", // (parparim) - butterflies
        "פּוֹקֵד", // (poqed) - prisoner
        "צִפּוֹר", // (tsippor) - bird
        "תַּז", // (taz) - goat
        "תַּזְרֵים", // (tazreim) - seeds
        "תַּפְרִיטִים", // (tafratim) - items
      ],
    },
    {
      verb: {
        infinitive: "לִבְחוֹר", // to choose
        ms: "בּוֹחֵר",
        fs: "בּוֹחֶרֶת",
        mp: "בּוֹחֲרִים",
        fp: "בּוֹחֲרוֹת",
      },
      objects: [
        "אֲפִלּוּ", // (afilu) - even
        "בְּאָפְשָׁרוּת", // opportunity.
        "בְּדֶרֶךְ", // path.
        "בְּחִבְרִים", // - Chooses friends.
        "בְּחִרּוּת", // (b'chirut) - freedom
        "בְּחִרּוּת", // - Chooses freedom.
        "בְּחֵירָה", // option.
        "בְּמָקוֹם", // place.
        "בְּסֵפֶר", // book.
        "בְּצַדִּיקִים", // righteous.
        "בְּרֵעִים", // wicked.
        "בְּשָׁפְעָה", //bundance.
        "דְּרָכִים", // (drachim) - paths
        "דִּגְלִים", // (diglim) - flags
        "הַסְּכָּמוֹת", // (haskamot) - agreements
        "חַבְרֵי", // (chavrei) - friends
        "מְדַרְגּוֹת", // (mdaragot) - levels
        "עִקָּרוֹנוֹת", // (ikaronot) - priorities
        "צַדִּיקִים", // (tzadikim) - righteous
        "שְׁפָע", // (shefa) - abundance
      ],
    },
    {
      verb: {
        infinitive: "מַשְׁוִיעֵר", // to clean
        ms: "מְנַקֶּה",
        fs: "מְנַקָּה",
        mp: "מְנַקִּים",
        fp: "מְנַקּוֹת",
      },
      objects: [
        "בַּיִת", // (bayit) - house
        "חֶדֶר", // (cheder) - room
        "שֻׁלְחָן", // (shulchan) - table
        "כִּסֵּא", // (kise) - chair
        "אָדָם", // (adam) - person
        "צַלֵּחַת", // (tzalachat) - plate
        "כַּף", // (kaf) - fork
        "מָטְרֵסָה", // (motresa) - broom
        "כְּרֵיוֹן", // (kreyon) - crayon
        "תַּפְרִיטִים", // (tafratim) - items
      ],
    },
    {
      verb: {
        infinitive: "לְהַשְׁווֹת", // to compare
        ms: "מַשְׁוֶה",
        fs: "מַשְׁוָה",
        mp: "מַשְׁוִים",
        fp: "מַשְׁווֹת",
      },
      objects: [
        "מְחִירִים", // (mechirim) - prices
        "גוֹדְלִים", // (godlim) - sizes
        "מַרְכֵּזִים", // (markazim) - centers
        "מִשְׁקָלוֹת", // (mishkalot) - weights
        "טַעֲמִים", // (ta'amim) - tastes
        "קְטַנִּיּוֹת", // (k'taniyot) - small things
        "מַסִּיבוֹת", // (masibot) - parties
        "צְבָעִים", // (tzeva'im) - colors
        "מַסְכְּנוֹת", // (maskenot) - risks
        "סַכָּנוֹת", // (sakanot) - dangers
      ],
    },
    {
      verb: {
        infinitive: "לִשְׁקוֹל", // to consider
        ms: "שׁוֹקֵל",
        fs: "שׁוֹקֶלֶת",
        mp: "שׁוֹקְלִים",
        fp: "שׁוֹקְלוֹת",
      },
      objects: [
        "אֵבֶן", // - stone
        "אוֹכֶל", // - food
        "דֶּגֶם", // - model
        "דֶּרֶךְ", // (derech) - way
        "דַּבָּרִים", // (d'varim) - things
        "דַּעַת", // (da'at) - knowledge
        "הַבַּגָּרָה", // (habagara) - neighbor
        "זְמַן", // (zman) - time
        "חָמֵר", // - material
        "טוֹב", // (tov) - good
        "כְּלִי", // - object
        "מַטְרֵס", // - mattress
        "מַסָּכָה", // - covering
        "מָזָל", // (mazal) - luck
        "עֵץ", // (etz) - tree
        "עֵץִים", // (etzim) - trees
        "צְבָע", // - color
        "קְטַנִּיּוֹת", // - small items
        "קַדְמִי", // (kadmi) - ancient
        "תַּפְרִיט", // - item
      ],
    },
    {
      verb: {
        infinitive: "לְהָכִיל", // to contain
        ms: "מֵכִיל",
        fs: "מְכִילָה",
        mp: "מְכִילִים",
        fp: "מְכִילוֹת",
      },
      objects: [
        "אֲוִיר", // (avir) - air
        "אִגְרֵף", // (igref) - handful
        "אֵשׁ", // (esh) - fire
        "אֹכֶל", // (ochel) - food
        "חַיִּים", // (chayim) - life
        "חָמֵר", // (chomer) - material
        "כַּלִּים", // (kalim) - tools
        "כֹּחוֹת", // (koachot) - abilities
        "מַחְזֵק", // (machzek) - container
        "מַחְצֵב", // (machtzev) - sculpture
        "מַים", // (mayim) - water
        "מָקוֹם", // (makom) - place
        "נַפְט", // (naft) - oil
        "פֶּטַח", // (petach) - opening
        "קְטַנִּיּוֹת", // (ketaniyot) - small objects
        "קֶדֶר", // (keder) - pot
        "קָנֶה", // (kaneh) - stalk
        "רוּחוֹת", // (ruchot) - spirits
        "שָׁמֶן", // (shamen) - oil
        "תַּפְרִיטִים", // (tafratim) - items
      ],
    },
    {
      verb: {
        infinitive: "לְהַמְשִׁיךְ", // to continue
        ms: "מַמְשִׁיךְ",
        fs: "מַמְשִׁיכָה",
        mp: "מַמְשִׁיכִים",
        fp: "מַמְשִׁיכוֹת",
      },
      objects: [
        "דְּרֶךְ", // (derekh) - way or journey
        "זְמַן", // (zman) - time
        "חַיִים", // (chayim) - life
        "טוֹבָה", // (tovah) - goodness
        "יוֹם", // (yom) - day
        "מְבוּצַּר", // (mevutzar) - continuing
        "מַחֲרוּז", // (macharuz) - poem
        "מַכְתִּימִים", // (machtimim) - stains
        "מַרְקוֹם", // (markom) - place
        "מַשְׁתֵּה", // (mashte) - feast or celebration
        "מַשְׂקִיעַ", // (mas'kia) - investor
        "נְסִיעָה", // (nesia) - journey
        "סְרַט", // (serat) - film
        "סִפְרָה", // (sifra) - story or tale
        "סוּף", // (sof) - end
        "שִׁיחָה", // (sichah) - conversation
        "תְּקוּפָה", // (tekufo) - period
        "תַּהֲלִיךְ", // (tahalich) - process
      ],
    },
    {
      verb: {
        infinitive: "לַעֲלוֹת", // to cost
        ms: "עוֹלֶה",
        fs: "עוֹלָה",
        mp: "עוֹלִים",
        fp: "עוֹלוֹת",
      },
      objects: [
        "אֲבַקֵּשׁ", // (avakesh) - will ask
        "אֲרֻכָּה", // (aruka) - distance
        "אָפֵּשׁ", // (afesh) - expensive
        "הָזְמָן", // (hazman) - the time
        "יָקָר", // (yakar) - expensive
        "כֶּסֶף", // (kesef) - money
        "מַחֲרוּת", // (macharut) - tomorrow
        "מַסָּג", // (masag) - touch
        "שִׁנָּיִם", // (shinnayim) - two
        "תַּחֲבֵרֵי", // (tachavrei) - friends
      ],
    },
    // {
    //   verb: "לִמְנוֹת", // to count
    //   objects: [
    //     "עֵדִים", // (edim) - witnesses
    //     "אָנְקִיּוּת", // (onkiyut) - maturity
    //     "קְטַנִּיּוֹת", // (k'taniyot) - small things
    //     "שִׁירִים", // (shirim) - songs
    //     "שִׁנַּיִם", // (shinayim) - two
    //     "שְׂפִירוּת", // (s'firoot) - counting
    //     "אַרְבַּעָּה", // (arba'a) - four
    //     "מִסְפָּר", // (mispar) - number
    //     "מַסָּגָן", // (masagan) - treasurer
    //     "סְפִירָה", // (sfira) - counting
    //   ],
    // },
    {
      verb: {
        infinitive: "יוֹצֵר", // to create
        ms: "יוֹצֵר",
        fs: "יוֹצֵר",
        mp: "יוֹצֵר",
        fp: "יוֹצֵר",
      },
      objects: [
        "עוֹלָם", // (olam) - world
        "יְצִירָה", // (y'tzira) - creation
        "דַּעַת", // (da'at) - knowledge
        "בְּרִיאוּת", // (b'riyut) - health
        "חֵיִם", // (chayim) - life
        "יְצִירוֹת", // (y'tzirot) - creations
        "מִסְגְּרָה", // (misg'ra) - frame
        "יֹוצְרֵי", // (yotzrei) - creators
        "שֵׁם", // (shem) - name
        "עֵשֶׂה", // (aseh) - make
      ],
    },
    // {
    //   verb: "מַגֵּן", // to defend
    //   objects: [
    //     "מַגְנֵי", // (magnei) - shields
    //     "מִגִּינִים", // (migginim) - defenders
    //     "מַגֵּנִים", // (magginim) - protectors
    //     "מְגִנָּה", // (mginah) - defense
    //     "מַגֵּנֵי", // (magenei) - defenders
    //     "מַגֵּן", // (maggen) - shield
    //     "מִגִּינוֹת", // (migginot) - defenses
    //     "מְגִנִּים", // (mginim) - defenders
    //     "מַגֵּן", // (maggen) - protector
    //   ],
    // },
    // {
    //   verb: "נוֹתֵן", // to deliver
    //   objects: [
    //     "מִשְׁלַח", // (mishlach) - delivery
    //     "מֵרַץ", // (meratz) - marathon
    //     "תְּחִיָּה", // (techiya) - revival
    //     "אַרְצוּת", // (artzot) - countries
    //     "צַיָּד", // (tzayad) - hunter
    //     "דֶּרֶךְ", // (derech) - way
    //     "אֲנַגְשֵׁים", // (ang'shim) - messages
    //     "מַסָּחֵר", // (masacher) - merchandise
    //     "אִגְרוּף", // (igruf) - envelope
    //     "שַׁבָּת", // (shabbat) - Sabbath
    //   ],
    // },
    // {
    //   verb: "מַצְטַיֵּן", // to describe
    //   objects: [
    //     "תַּמְרוּת", // (tamrut) - innocence
    //     "פֶּסַח", // (pesach) - Passover
    //     "פָּנִים", // (panim) - face
    //     "שֵׁם", // (shem) - name
    //     "מַאֲבָק", // (ma'avak) - struggle
    //     "סִפְרֵי", // (sifrei) - books
    //     "עוֹלָם", // (olam) - world
    //     "תַּבְנִיּוֹת", // (tavniyot) - structures
    //     "אִירוּעִין", // (iru'in) - experiences
    //     "סַגְפֵּרוּת", // (sagperut) - description
    //   ],
    // },
    // {
    //   verb: "צוֹיֵם", // to draw
    //   objects: [
    //     "דְּמוּיוֹת", // (d'muyot) - pictures
    //     "סִמְלִים", // (simlim) - symbols
    //     "צוּרוֹת", // (tzurot) - shapes
    //     "קְוִיּוֹנוֹת", // (k'viyonot) - outlines
    //     "שִׁמּוּשַׂי", // (shimmusai) - utensils
    //     "סִמָּנִים", // (simanim) - signs
    //     "כְּרִיתוֹת", // (k'ritot) - patterns
    //     "חֶקְלִין", // (cheqlin) - sketches
    //     "מַרְקֵי", // (markay) - markers
    //     "מַרְבֵּצֵי", // (marbetzei) - crayons
    //   ],
    // },
    // {
    //   verb: "נֹהֵם", // to drive
    //   objects: [
    //     "רֶכֶב", // (rechev) - car
    //     "דֶּרֶךְ", // (derech) - road
    //     "מַכְלִיתַּה", // (machlitah) - bus
    //     "שַׁעֲרִים", // (sha'arim) - gates
    //     "חַיִים", // (chayim) - life
    //     "גַּג", // (gag) - roof
    //     "טוֹבִים", // (tovim) - good
    //     "אַבְטַחַן", // (avtachan) - parking lot
    //     "נְגִיעָה", // (ngi'ah) - touch
    //     "עִקָּרוֹנוֹת", // (ikaronot) - priorities
    //   ],
    // },
    // {
    //   verb: "מוֹסִיף", // to drop
    //   objects: [
    //     "מִטָּה", // (mittah) - bed
    //     "עֵץ", // (etz) - tree
    //     "כַּלִּים", // (kalim) - tools
    //     "עָץ", // (etz) - wood
    //     "כְּסִיתָּה", // (ksitah) - blanket
    //     "חַגִּים", // (chagim) - holidays
    //     "קוֹרֵס", // (kores) - mattress
    //     "צָמִידִים", // (tzamidim) - bracelets
    //     "סִפָּה", // (sifah) - rug
    //     "שַׁמַּעַתָּה", // (shama'atah) - mattress
    //   ],
    // },
    // {
    //   verb: "מְסִיר", // to explain
    //   objects: [
    //     "תַּשְׁבֵּץ", // (tashbetz) - puzzle
    //     "מִסְבָּר", // (misbar) - explanation
    //     "הִסְבֵּר", // (hisber) - explained
    //     "חָלֽק־חֵלֶק", // (chalak-chelek) - piece by piece
    //     "סִיפֵּר", // (siper) - explained
    //     "הִסִּבֵּר", // (hisiber) - explained
    //     "גְּלַרְיָה", // (g'laryah) - gallery
    //     "אַרְעֵי", // (ar'ei) - items
    //     "מַעֲלִימָה", // (ma'alimah) - hiding
    //     "חַשְׁבֵּי", // (chashbei) - thought
    //   ],
    // },
    // {
    //   verb: "מְאַרֵב", // to ambush
    //   objects: [
    //     "אַרְבֵּל", // (arbel) - ambush
    //     "אַרְבֵּלוֹת", // (arbelot) - ambushes
    //     "אַרְבֵּלִים", // (arbelim) - ambushers
    //     "סַּרְבֵּטִים", // (sarbetim) - saboteurs
    //     "מַרְגֵּזִים", // (marg'zim) - agitators
    //     "אַרְבֵּלַי", // (arbelay) - ambushers
    //     "חֲבָלֵיהֶם", // (chav'leihem) - their ropes
    //     "אַרְבֵּלוֹתֵיהֶם", // (arbeloteihem) - their ambushes
    //     "טַּרְבֵּלִים", // (tarbelim) - rioters
    //     "עַרְבֵּלָה", // (arbelah) - ambush
    //   ],
    // },
    // {
    //   verb: "פּוֹתֵחַ", // to open
    //   objects: [
    //     "פֶּתַח", // (p'tach) - door
    //     "חַלּוֹן", // (chalon) - window
    //     "שַׁעַר", // (sha'ar) - gate
    //     "סְפָרִים", // (sfarim) - books
    //     "אָרְחוֹת", // (orchot) - paths
    //     "מַפְּתֵחוֹת", // (map'teichot) - locks
    //     "רֶ֫שֶׁת", // (reshe) - net
    //     "גַּלִּים", // (galim) - waves
    //     "כְּנִים", // (kenim) - nests
    //     "מַלְגֵּזוֹת", // (mal'gezot) - folders
    //   ],
    // },
    // {
    //   verb: "רוֹצֵה", // to want
    //   objects: [
    //     "פַּרְעוּת", // (par'ut) - freedom
    //     "טוֹב", // (tov) - good
    //     "שָׁלוֹם", // (shalom) - peace
    //     "חֵרוּת", // (cherut) - liberty
    //     "הַצָּלָה", // (hatzalah) - rescue
    //     "שִׁדוּף", // (shiduf) - match
    //     "תְּרוּמָה", // (trumah) - donation
    //     "פְּרוּתָה", // (prutah) - coin
    //     "תַּשְׁמִישֵׁי", // (tashmisei) - services
    //     "חֶ֫רֶב", // (cherev) - sword
    //   ],
    // },
  ]

  const subject = chooseRandomElement(hebrewSubjects)
  const action = chooseRandomElement(hebrewActions)

  return `${subject} ${conjugateHebrewVerb(
    subject,
    action.verb
  )} ${chooseRandomElement(action.objects)}.`
}

export const generateRandomCopy = (
  sentenceFunc = chooseRandomElement([
    generateRandomArabicSentence,
    generateRandomEnglishSentence,
    generateRandomFinnishSentence,
    generateRandomGreekSentence,
    generateRandomHebrewSentence,
    generateRandomJapaneseSentence,
  ]),
  i: number = randomNumber(),
  copy: string = ""
): string =>
  i <= 0
    ? copy.trim()
    : generateRandomCopy(sentenceFunc, i - 1, `${copy} ${sentenceFunc()}`)

// generate names
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

  return `${chooseRandomElement(americanFirstNames)} ${chooseRandomElement(
    americanLastNames
  )}`
}

export const generateRandomName = () =>
  chooseRandomElement([generateAmericanName, generateFinnishName])()

const toEmail = (name: string) => {
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

console.info(randomName)
console.info(toEmail(randomName))
console.info(generateRandomCopy())
