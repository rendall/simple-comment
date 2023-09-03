const randomNumber = (min = 1, max = 10) =>
  Math.floor(Math.random() * (max - min)) + min
const chooseRandomElement = array =>
  array[Math.floor(Math.random() * array.length)]
const capitalize = word => word.replace(/^\w/, c => c.toUpperCase())
const generateRandomEnglishSentence = () => {
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
  const isThirdPerson = subject => ["He", "She", "It"].includes(subject)
  const thirdPersonSingular = verb => {
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
  const sentence = `${subject} ${
    isThirdPerson(subject) ? thirdPersonSingular(action.verb) : action.verb
  } ${object}.`
  return sentence
}
const generateRandomFinnishSentence = () => {
  const verbAssociationTuples = [
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
  const conjugateFinnishType1Verb = (subject, verb) => {
    const stem = verb.slice(0, -1)
    const degrade = stem => {
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
        return stem + stem.slice(-1)
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
  const subject = chooseRandomElement(["minä", "sinä", "hän", "me", "te", "he"])
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
const generateRandomArabicSentence = () => {
  const arabicSubjects = [
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
    {
      "verb": "يُتصل",
      "objects": [
        "بشخص",
        "بصديق",
        "بعائلة",
        "برقم هاتف",
        "بمدير",
        "بزبون",
        "بوالدين",
        "بجار",
        "بمستشفى",
        "بمكتب",
      ],
    },
    {
      "verb": "يحمل",
      "objects": [
        "حقيبة",
        "صندوق",
        "طفلًا",
        "شيئًا ثقيلًا",
        "تسوقًا",
        "سلة",
        "أمتعة",
        "أدوات",
        "شنطة",
        "كيس",
      ],
    },
    {
      "verb": "يمسك",
      "objects": [
        "كرة",
        "سمكة",
        "كائن",
        "قطار",
        "فرصة",
        "كلب",
        "بالون",
        "فريسة",
        "جائزة",
        "طائرة",
      ],
    },
    {
      "verb": "يلتقط",
      "objects": [
        "صورة",
        "أنفاس",
        "زهرة",
        "فكرة",
        "ذكريات",
        "لقطة",
        "أشياء",
        "ألوان",
        "فرصة",
        "لمحة",
      ],
    },
    {
      "verb": "يختار",
      "objects": [
        "خيار",
        "مسار",
        "قرار",
        "ملابس",
        "غذاء",
        "هدية",
        "مكان",
        "خيارات",
        "منتج",
        "فرصة",
      ],
    },
    {
      "verb": "ينظّف",
      "objects": [
        "منزل",
        "غرفة",
        "سيارة",
        "ملابس",
        "أواني",
        "شاشة",
        "أثاث",
        "زجاج",
        "حمام",
        "سجادة",
      ],
    },
    {
      "verb": "يُقارِن",
      "objects": [
        "أسعار",
        "منتجات",
        "خصائص",
        "ميزات",
        "تصاميم",
        "أحجام",
        "نتائج",
        "أشكال",
        "أداء",
        "خيارات",
      ],
    },
    {
      "verb": "يُعتَبِر",
      "objects": [
        "فكرة",
        "رأي",
        "خيار",
        "مقترح",
        "حقيقة",
        "أمر",
        "تصرف",
        "رؤية",
        "نتيجة",
        "تأثير",
      ],
    },
    {
      "verb": "يحتوي",
      "objects": [
        "حاوية",
        "صندوق",
        "كيس",
        "زجاجة",
        "منتج",
        "مستودع",
        "حقيبة",
        "محتوى",
        "مطبخ",
        "غرفة",
      ],
    },
    {
      "verb": "يستمرّ",
      "objects": [
        "عمل",
        "دراسة",
        "جهد",
        "نشاط",
        "حركة",
        "حياة",
        "تقدم",
        "تطوير",
        "رحلة",
        "علاقة",
      ],
    },
    {
      "verb": "يدافع",
      "objects": [
        "عن حقوق الإنسان",
        "عن وطنه",
        "عن الضعفاء",
        "عن نفسه",
        "عن الحقيقة",
        "عن الحياة",
        "عن المستقبل",
        "عن الحرية",
        "عن العدالة",
        "عن الديمقراطية",
      ],
    },
    {
      "verb": "يوصل",
      "objects": [
        "إلى الوجهة",
        "إلى المطار",
        "إلى الفندق",
        "إلى المدرسة",
        "إلى المكتب",
        "إلى المستشفى",
        "إلى المحطة",
        "إلى المنزل",
        "إلى الشاطئ",
        "إلى الجامعة",
      ],
    },
    {
      "verb": "يوصل",
      "objects": [
        "بطرد",
        "برسالة",
        "بمنتج",
        "بطلب",
        "بخبر",
        "بزمان",
        "بوجبة",
        "ببضعة أيام",
        "بوثيقة",
        "بهدية",
      ],
    },
    {
      "verb": "يصف",
      "objects": [
        "بمكان",
        "بشخص",
        "بحدث",
        "بمشهد",
        "بمشاعر",
        "بتجربة",
        "بمظهر",
        "بصوت",
        "بطعام",
        "بمشروع",
      ],
    },
    {
      "verb": "يرسم",
      "objects": [
        "صورة",
        "لوحة",
        "رسمة",
        "خريطة",
        "شكل",
        "مخطط",
        "خطوط",
        "كاريكاتير",
        "رمز",
        "أشكال هندسية",
      ],
    },
    {
      "verb": "يقود",
      "objects": [
        "سيارة",
        "دراجة",
        "حافلة",
        "شاحنة",
        "قارب",
        "دراجة نارية",
        "سفينة",
        "طائرة",
        "جرار",
        "قطار",
      ],
    },
    {
      "verb": "يُسقِط",
      "objects": [
        "كرة",
        "مفتاح",
        "ورقة",
        "قلم",
        "حقيبة",
        "زجاجة",
        "صحن",
        "مظلة",
        "قطرة ماء",
        "هاتف محمول",
      ],
    },
    {
      "verb": "يشرح",
      "objects": [
        "فكرة",
        "مفهوم",
        "موضوع",
        "عملية",
        "مفتاح",
        "نظرية",
        "معلومة",
        "سياق",
        "تفصيل",
        "حقيقة",
      ],
    },
    {
      "verb": "يملأ",
      "objects": [
        "كوب",
        "حوض",
        "صحن",
        "حقيبة",
        "حوض استحمام",
        "سطل",
        "صفيحة",
        "كيس",
        "قلب",
        "فم",
      ],
    },
    {
      "verb": "يجد",
      "objects": [
        "مفتاح",
        "كنز",
        "مسار",
        "حل",
        "إجابة",
        "مخرج",
        "خيار",
        "مكان",
        "وظيفة",
        "أخطاء",
      ],
    },
    {
      "verb": "ينهي",
      "objects": [
        "مهمة",
        "عمل",
        "دراسة",
        "فيلم",
        "كتاب",
        "مشروع",
        "تمرين",
        "طعام",
        "سباق",
        "لعبة",
      ],
    },
    {
      "verb": "يطير",
      "objects": [
        "طائرة",
        "طائر",
        "طائرة ورقية",
        "جواز سفر",
        "طائرة حربية",
        "بالون هواء",
        "طائرة شراعية",
        "فراشة",
        "طائرة درون",
        "جمل طائر",
      ],
    },
    {
      "verb": "يُسلّم",
      "objects": [
        "بالسلام",
        "بالتحية",
        "بالابتسامة",
        "بالكلمة الطيبة",
        "بالمصافحة",
        "بالاحترام",
        "بالود",
        "بالترحيب",
        "بالدعوة",
        "بالمرحبا",
      ],
    },
    {
      "verb": "يُرشد",
      "objects": [
        "بالمسار",
        "بالإرشاد",
        "بالتوجيه",
        "بالنصيحة",
        "بالخبرة",
        "بالمعلومات",
        "بالمساعدة",
        "بالإشارة",
        "بالتوجيهات",
        "بالملامح",
      ],
    },
    {
      "verb": "يُسمع",
      "objects": [
        "بالصوت",
        "بالأصوات",
        "بالضجيج",
        "بالموسيقى",
        "بالكلام",
        "بالأخبار",
        "بالتلفزيون",
        "بالمكالمة",
        "بالموسيقى",
        "بالأصوات الطبيعية",
      ],
    },
    {
      "verb": "يُساعد",
      "objects": [
        "بالمشكلة",
        "بالمساعدة",
        "بالنصيحة",
        "بالدعم",
        "بالتوجيه",
        "بالحل",
        "بالتعليم",
        "بالتسهيل",
        "بالفهم",
        "بالعمل",
      ],
    },
    {
      "verb": "يُضرب",
      "objects": [
        "بالقوة",
        "باللكمة",
        "بالضربة",
        "بالجزمة",
        "بالعصا",
        "بالمطرقة",
        "بالمضرب",
        "باليد",
        "بالركلة",
        "باللكمة القاضية",
      ],
    },
    {
      "verb": "يُتخيل",
      "objects": [
        "بالمغامرة",
        "بالأحلام",
        "بالخيال",
        "بالقصص",
        "بالعوالم",
        "بالمستقبل",
        "بالرحلات",
        "بالسفر",
        "بالأفكار",
        "بالتصورات",
      ],
    },
    {
      "verb": "يشمل",
      "objects": [
        "قائمة",
        "مجموعة",
        "عناصر",
        "مكونات",
        "أعضاء",
        "مواد",
        "خيارات",
        "فئات",
        "مستندات",
        "أفراد",
      ],
    },
    {
      "verb": "يدعو",
      "objects": [
        "أصدقاء",
        "ضيوف",
        "عائلة",
        "زملاء",
        "جيران",
        "شركاء",
        "مشجعين",
        "زبائن",
        "زملاء عمل",
        "متحدثين",
      ],
    },
    {
      "verb": "يحتفظ",
      "objects": [
        "مفتاح",
        "سجل",
        "ملف",
        "سرّ",
        "ذاكرة",
        "مقال",
        "سرير",
        "كلمة مرور",
        "صورة",
        "عقد",
      ],
    },
    {
      "verb": "يرمي",
      "objects": [
        "كرة",
        "حجر",
        "قمامة",
        "كرسي",
        "كعب",
        "زجاجة",
        "باب",
        "كلب",
        "صخرة",
        "كرة قدم",
      ],
    },
    {
      "verb": "يعرف",
      "objects": [
        "شخص",
        "مكان",
        "سبب",
        "لغة",
        "علم",
        "تفاصيل",
        "أمور",
        "وقت",
        "حقيقة",
        "حدث",
      ],
    },
    {
      "verb": "يتعلم",
      "objects": [
        "لغة",
        "مهارة",
        "مادة دراسية",
        "فن",
        "علم",
        "درس",
        "تقنية",
        "نظرية",
        "أسلوب",
        "معلومات",
      ],
    },
    {
      "verb": "يرفع",
      "objects": [
        "وزن",
        "أثقال",
        "أشياء",
        "أيدي",
        "أجسام",
        "أمتعة",
        "رأس",
        "سلاح",
        "صوت",
        "علم",
      ],
    },
    {
      "verb": "يحبّ",
      "objects": [
        "زهرة",
        "أهل",
        "أصدقاء",
        "حيوان",
        "فن",
        "أطفال",
        "طعام",
        "موسيقى",
        "طبيعة",
        "ألعاب",
      ],
    },
    {
      "verb": "يدير",
      "objects": [
        "مشروع",
        "شركة",
        "فريق",
        "موارد",
        "عملية",
        "مهمة",
        "أمور",
        "محل",
        "مستودع",
        "موظفين",
      ],
    },
    {
      "verb": "يعني",
      "objects": [
        "كلمة",
        "مفهوم",
        "عبارة",
        "رمز",
        "معنى",
        "إشارة",
        "تفسير",
        "مقصود",
        "نية",
        "تأويل",
      ],
    },
    {
      "verb": "يقيس",
      "objects": [
        "مسافة",
        "زمن",
        "حجم",
        "وزن",
        "سرعة",
        "درجة حرارة",
        "كمية",
        "أبعاد",
        "كفاءة",
        "عمق",
      ],
    },
    {
      "verb": "يلتقي",
      "objects": [
        "صديق",
        "شريك",
        "عائلة",
        "زميل",
        "عميل",
        "زبون",
        "زميل دراسة",
        "زملاء عمل",
        "جار",
        "فريق عمل",
      ],
    },
    {
      "verb": "يتحرّك",
      "objects": [
        "سيارة",
        "شاحنة",
        "جسم",
        "جندي",
        "قافلة",
        "سفينة",
        "قطار",
        "حيوان",
        "رأس",
        "بضائع",
      ],
    },
    {
      "verb": "يحتاج",
      "objects": [
        "مساعدة",
        "وقت",
        "مال",
        "دعم",
        "نصيحة",
        "معلومات",
        "فهم",
        "مساحة",
        "أدوات",
        "فرص",
      ],
    },
    {
      "verb": "يلاحظ",
      "objects": [
        "فرق",
        "تغيير",
        "علامة",
        "خطأ",
        "تفاصيل",
        "ملاحظة",
        "اختلاف",
        "ظاهرة",
        "تحسين",
        "تناقض",
      ],
    },
    {
      "verb": "يقدّم",
      "objects": [
        "مساعدة",
        "اقتراح",
        "طعام",
        "خدمة",
        "هدية",
        "عرض",
        "معلومات",
        "دعم",
        "شكر",
        "مساعدة إنسانية",
      ],
    },
    {
      "verb": "يأمر",
      "objects": [
        "طعام",
        "منتج",
        "خدمة",
        "عمل",
        "مشروب",
        "وجبة",
        "أوامر",
        "أمور",
        "مستلزمات",
        "توجيهات",
      ],
    },
    {
      "verb": "يدين",
      "objects": [
        "مال",
        "دين",
        "خدمة",
        "لصديق",
        "لشركة",
        "لبنك",
        "لعائلة",
        "لحكومة",
        "لزبون",
        "لجامعة",
      ],
    },
    {
      "verb": "يمتلك",
      "objects": [
        "سيارة",
        "منزل",
        "شركة",
        "أرض",
        "هاتف",
        "فندق",
        "أعمال",
        "مصنع",
        "حقوق",
        "تحف",
      ],
    },
    {
      "verb": "يرسم",
      "objects": [
        "لوحة",
        "صورة",
        "جدار",
        "سيارة",
        "باب",
        "مناظر",
        "غرفة",
        "وجه",
        "أظافر",
        "أشكال",
      ],
    },
    {
      "verb": "يختار",
      "objects": [
        "زهرة",
        "ملابس",
        "فاكهة",
        "مكان",
        "فريق",
        "كتاب",
        "ألوان",
        "منتج",
        "قائمة",
        "خيارات",
      ],
    },
    {
      "verb": "يفضل",
      "objects": [
        "شاي",
        "قهوة",
        "طعام",
        "سيارة",
        "جوارب",
        "طقس",
        "أفلام",
        "أصدقاء",
        "مكان",
        "تجربة",
      ],
    },
    {
      "verb": "يعدّ",
      "objects": [
        "وجبة",
        "تقرير",
        "عرض",
        "اختبار",
        "مشروع",
        "خطة",
        "مفاجأة",
        "طعام",
        "مشروب",
        "هدية",
      ],
    },
    {
      "verb": "ينطق",
      "objects": [
        "كلمة",
        "اسم",
        "جملة",
        "حروف",
        "صوت",
        "لغة",
        "حرف",
        "كلمات",
        "عبارة",
        "ألفاظ",
      ],
    },
    {
      "verb": "يحمي",
      "objects": [
        "بيئة",
        "حقوق",
        "أمان",
        "أطفال",
        "معلومات",
        "ممتلكات",
        "مجتمع",
        "ممتلكات شخصية",
        "سرية",
        "بيانات",
      ],
    },
    {
      "verb": "يسحب",
      "objects": [
        "ستارة",
        "جسم",
        "زنجير",
        "كرسي",
        "سيارة",
        "أغطية",
        "ماء",
        "ملف",
        "أمتعة",
        "رف",
      ],
    },
    {
      "verb": "يدفع",
      "objects": [
        "باب",
        "سيارة",
        "كرسي",
        "زنجير",
        "موقع",
        "دراجة",
        "لوح",
        "مكتب",
        "صندوق",
        "زر",
      ],
    },
    {
      "verb": "يستلم",
      "objects": [
        "بريد",
        "طرد",
        "هدية",
        "أموال",
        "طلب",
        "إشعار",
        "رسالة",
        "جواب",
        "شهادة",
        "تحديث",
      ],
    },
    {
      "verb": "يتعرّف",
      "objects": [
        "وجوه",
        "أصوات",
        "أماكن",
        "رموز",
        "ألوان",
        "أشخاص",
        "علامات",
        "عيوب",
        "نماذج",
        "ملامح",
      ],
    },
    {
      "verb": "يتذكّر",
      "objects": [
        "ذكريات",
        "أحداث",
        "أسماء",
        "مواعيد",
        "تفاصيل",
        "أرقام",
        "كلمات",
        "أماكن",
        "وعود",
        "أفكار",
      ],
    },
    {
      "verb": "يُبلّغ",
      "objects": [
        "أخبار",
        "معلومات",
        "أحداث",
        "تقارير",
        "نتائج",
        "شكاوى",
        "ملاحظات",
        "تطورات",
        "مشاكل",
        "إجراءات",
      ],
    },
    {
      "verb": "يحترم",
      "objects": [
        "قوانين",
        "قيم",
        "حقوق",
        "عادات",
        "ثقافات",
        "رؤساء",
        "أصول",
        "تقاليد",
        "معتقدات",
        "فعاليات",
      ],
    },
    {
      "verb": "يعود",
      "objects": [
        "منتج",
        "زائر",
        "سفر",
        "استثمار",
        "أموال",
        "فصل دراسي",
        "ملف",
        "هدية",
        "كتاب",
        "صديق",
      ],
    },
    {
      "verb": "يركب",
      "objects": [
        "سيارة",
        "دراجة",
        "حصان",
        "حافلة",
        "دراجة نارية",
        "قطار",
        "طائرة",
        "زلاجة",
        "قارب",
        "ألعاب",
      ],
    },
    {
      "verb": "يحكم",
      "objects": [
        "بلد",
        "مجتمع",
        "قانون",
        "حكومة",
        "مملكة",
        "مدينة",
        "قرار",
        "فريق",
        "شركة",
        "منطقة",
      ],
    },
    {
      "verb": "يوفِّر",
      "objects": [
        "وقت",
        "مال",
        "جهد",
        "موارد",
        "فرصة",
        "فاتورة",
        "مساحة",
        "حياة",
        "طاقة",
        "بيانات",
      ],
    },
    {
      "verb": "يحفظ",
      "objects": [
        "معلومات",
        "صور",
        "ملفات",
        "ذكريات",
        "أمان",
        "مستندات",
        "أسرار",
        "أموال",
        "كلمات مرور",
        "مفاتيح",
      ],
    },
    {
      "verb": "يرى",
      "objects": [
        "مشهد",
        "صورة",
        "رؤية",
        "شاشة",
        "عرض",
        "فيلم",
        "نتيجة",
        "حقيقة",
        "ظاهرة",
        "أشباح",
      ],
    },
    {
      "verb": "يبيع",
      "objects": [
        "سلعة",
        "منتج",
        "خدمة",
        "عقار",
        "ملكية",
        "سيارة",
        "منزل",
        "أسهم",
        "جواهر",
        "تذاكر",
      ],
    },
    {
      "verb": "يرسل",
      "objects": [
        "رسالة",
        "بريد إلكتروني",
        "طلب",
        "هدية",
        "ملف",
        "طرد",
        "صورة",
        "رسميات",
        "بيانات",
        "صوت",
      ],
    },
    {
      "verb": "يخدم",
      "objects": [
        "زبون",
        "مجتمع",
        "ضيوف",
        "عملاء",
        "مريض",
        "جمهور",
        "جيش",
        "مستخدم",
        "أعضاء",
        "عائلة",
      ],
    },
    {
      "verb": "يظهر",
      "objects": [
        "فيلم",
        "صورة",
        "شاشة",
        "برنامج",
        "معلومات",
        "حقائق",
        "خيارات",
        "إعلان",
        "عرض",
        "موهبة",
      ],
    },
    {
      "verb": "يتهجى",
      "objects": [
        "كلمة",
        "اسم",
        "جملة",
        "حرف",
        "تسجيل",
        "لفظ",
        "نص",
        "سلسلة",
        "شفرة",
        "شعار",
      ],
    },
    {
      "verb": "يبدأ",
      "objects": [
        "مشروع",
        "عمل",
        "فصل",
        "سباق",
        "أحداث",
        "رحلة",
        "عام دراسي",
        "عرض",
        "مهرجان",
        "تدريب",
      ],
    },
    {
      "verb": "يسرق",
      "objects": [
        "مال",
        "مجوهرات",
        "هاتف",
        "سيارة",
        "بيانات",
        "أفكار",
        "هدايا",
        "لوحة فنية",
        "ساعة",
        "ملابس",
      ],
    },
    {
      "verb": "يتوقّف",
      "objects": [
        "سيارة",
        "عملية",
        "حركة",
        "ضوضاء",
        "تنفس",
        "مظهر",
        "مشروع",
        "دموع",
        "عمل",
        "نشاط",
      ],
    },
    {
      "verb": "يدرس",
      "objects": [
        "مادة دراسية",
        "كتاب",
        "دروس",
        "بحث",
        "تقرير",
        "لغة",
        "فصل",
        "مشروع",
        "تاريخ",
        "علوم",
      ],
    },
    {
      "verb": "يدعم",
      "objects": [
        "فريق",
        "مشروع",
        "قضية",
        "مبادرة",
        "مؤسسة",
        "حملة",
        "مبلغ مالي",
        "أسرة",
        "طلاب",
        "فنان",
      ],
    },
    {
      "verb": "يعلم",
      "objects": [
        "طالب",
        "مادة دراسية",
        "لغة",
        "مهارة",
        "درس",
        "فن",
        "علم",
        "تقنية",
        "مبدأ",
        "فصل",
      ],
    },
    {
      "verb": "يخبر",
      "objects": [
        "شخص",
        "قصة",
        "خبر",
        "سر",
        "أحداث",
        "حقيقة",
        "رأي",
        "معلومات",
        "خطة",
        "تفاصيل",
      ],
    },
    {
      "verb": "يفكر",
      "objects": [
        "فكرة",
        "مسألة",
        "قرار",
        "أمر",
        "سيناريو",
        "رؤية",
        "مستقبل",
        "خيار",
        "فلسفة",
        "أحلام",
      ],
    },
    {
      "verb": "يرمي",
      "objects": [
        "كرة",
        "مهمة",
        "قمامة",
        "حجر",
        "سهم",
        "ورقة",
        "قنبلة",
        "سلاح",
        "صاروخ",
        "خطأ",
      ],
    },
    {
      "verb": "يدرب",
      "objects": [
        "فريق",
        "رياضي",
        "موظف",
        "جيش",
        "مجموعة",
        "متدرب",
        "حيوان",
        "فني",
        "ألعاب",
        "فرسان",
      ],
    },
    {
      "verb": "يترجم",
      "objects": [
        "نص",
        "كتاب",
        "مقال",
        "لغة",
        "وثيقة",
        "ترجمة",
        "جملة",
        "كلمة",
        "شعر",
        "فيلم",
      ],
    },
    {
      "verb": "يفهم",
      "objects": [
        "مفهوم",
        "لغة",
        "معنى",
        "سياق",
        "أفكار",
        "شرح",
        "دروس",
        "رموز",
        "تصميم",
        "خيارات",
      ],
    },
    {
      "verb": "يزور",
      "objects": [
        "مدينة",
        "معلم سياحي",
        "عائلة",
        "أصدقاء",
        "متحف",
        "مكان",
        "مريض",
        "مدرسة",
        "بيت",
        "بلد",
      ],
    },
    {
      "verb": "يرغب",
      "objects": [
        "سفر",
        "عمل",
        "منتج",
        "تغيير",
        "تحسين",
        "زواج",
        "مغامرة",
        "مستقبل",
        "تحدي",
        "مرافقة",
      ],
    },
    {
      "verb": "يريد",
      "objects": [
        "شيء",
        "نجاح",
        "سعادة",
        "حب",
        "استقرار",
        "حياة",
        "راحة",
        "تغيير",
        "إصلاح",
        "حلم",
      ],
    },
    {
      "verb": "يزن",
      "objects": [
        "جسم",
        "طعام",
        "حقيبة",
        "ذهب",
        "سائل",
        "حجر كريم",
        "ورقة",
        "كتلة",
        "عينة",
        "أوزان",
      ],
    },
    {
      "verb": "يكتب",
      "objects": [
        "رسالة",
        "مقال",
        "كتاب",
        "مذكرة",
        "تقرير",
        "مدونة",
        "شهادة",
        "قصة",
        "رسم",
        "ملاحظات",
      ],
    },
    {
      "verb": "يرسم",
      "objects": [
        "صورة",
        "رسم",
        "لوحة",
        "مخطط",
        "خارطة",
        "تصميم",
        "شكل",
        "رمز",
        "جرافيك",
        "فن",
      ],
    },
  ]
  const conjugateArabicVerbs = (subject, verb) => {
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
  const hebrewSubjects = [
    "אֲנִי",
    "אַתָּה",
    "אַתְּ",
    "הוּא",
    "הִיא",
    "אֲנַחְנוּ",
    "אַתֶּם",
    "אַתֶּן",
    "הֵם",
    "הֵן",
  ]
  const conjugateHebrewVerb = (subject, verb) => {
    const { ms, fs, mp, fp } = verb
    switch (subject) {
      case "אֲנִי":
        return ms
      case "אַתָּה":
        return ms
      case "אַתְּ":
        return fs
      case "הוּא":
        return ms
      case "הִיא":
        return fs
      case "אֲנַחְנוּ":
        return mp
      case "אַתֶּם":
        return mp
      case "אַתֶּן":
        return fp
      case "הֵם":
        return ms
      case "הֵן":
        return fp
    }
  }
  const hebrewActions = [
    {
      verb: {
        infinitive: "כְּתוֹב",
        ms: "כּוֹתֵב",
        fs: "כּוֹתֶבֶת",
        mp: "כּוֹתְבִים",
        fp: "כּוֹתְבוֹת",
      },
      objects: [
        "סֵפֶר",
        "מַכְתֵּב",
        "דִּבְרֵי תוֹרָה",
        "יוֹםָן",
        "מַגָּזִין",
        "מַשְׁמָעוֹת",
        "שִׁיר",
        "רוֹמָן",
        "מֵאָמַר",
        "פּוֹסְטֶר",
      ],
    },
    {
      verb: {
        infinitive: "לְהוֹסִיף",
        ms: "מוֹסִיף",
        fs: "מוֹסִיפָה",
        mp: "מוֹסִיפִים",
        fp: "מוֹסִיפוֹת",
      },
      objects: [
        "אִפְשָׁרוּת",
        "אֶנֶרְגִיָּה",
        "זְמַן",
        "יַדְעַן",
        "כֹּחַ",
        "מִסְפָּרִים",
        "מֵידָע",
        "מֶלַח",
        "מַסְמֵר",
        "מַסְפֵּר",
        "מַסָּה",
        "פְּרָטִים",
        "פֵּרוֹת",
        "צְבָע",
        "שִׁמְשׁוֹן",
        "שֶׁקֶל",
        "שֵׂיבָה",
        "תַּכְשִׁיטִים",
        "תַּמְרוּץ",
        "תַּמְרוּצִים",
      ],
    },
    {
      verb: {
        infinitive: "לְהַעֲרִיץ",
        ms: "מַעֲרִיץ",
        fs: "מַעֲרִיצָה",
        mp: "מַעֲרִיצִים",
        fp: "מַעֲרִיצוֹת",
      },
      objects: [
        "אָדָם",
        "תַמוּנָה",
        "יֹצֵר",
        "צִיּוּן",
        "יֹופִי",
        "פְרָטִיוּת",
        "גְאוֹנֵךְ",
        "כָּשֵׁר",
        "קְשָׁרֵיהוּת",
        "חוּפָּה",
      ],
    },
    {
      verb: {
        infinitive: "לְאַרְגֵּן",
        ms: "מְאַרְגֵּן",
        fs: "מְאַרְגֶּנֶת",
        mp: "מְאַרְגְּנִים",
        fp: "מְאַרְגְּנוֹת",
      },
      root: "אדן",
      objects: [
        "אִירוּועִים",
        "אִירוּעִים",
        "דַּפָּנוֹת",
        "חִתּוּנוֹת",
        "חֶדֶר",
        "יָמִים",
        "כִּיסוֹאִין",
        "כְּנִסְיָה",
        "מִסְדְרִים",
        "סִדְרֵי",
        "סִדּוּר",
        "סֵפֶר",
        "עֵץ",
        "פַּרְחֵי",
        "פַּרְטִים",
        "פְּעֻלּוֹת",
        "שֻׁלְחָן",
        "שׁוֹלֵי",
        "תְּמוּנָה",
        "תַּכְנִים",
      ],
    },
    {
      verb: {
        infinitive: "מַאֲמִין",
        ms: "מַאֲמִין",
        fs: "מַאֲמִינָה",
        mp: "מַאֲמִינִים",
        fp: "מַאֲמִינוֹת",
      },
      objects: [
        "אֱמוּנָה",
        "אַדְמִירְצָה",
        "אַמּוּנָה",
        "אָהַבְתָּ",
        "גִּאוּלָּה",
        "דְּבָקוּת",
        "הַבִּטָּחוֹן",
        "חִיל",
        "טְמוּנוּת",
        "תְּקִיָּה",
        "תְּשׁוּעָה",
      ],
    },
    {
      verb: {
        infinitive: "לְהִשְׁתַּייֵּךְ",
        ms: "מִשְׁתַּיֵּךְ",
        fs: "מִשְׁתַּיֶּכֶת",
        mp: "מִשְׁתַּיְּכִים",
        fp: "מִשְׁתַּיְּכוֹת",
      },
      objects: [
        "דְּת",
        "זְמַן",
        "לֵב",
        "מִשְפָּחָה",
        "מָקוֹם",
        "עַם",
        "קֶהֶל",
        "קָהָל",
        "קָהָלִים",
        "תִּקוּפָה",
      ],
    },
    {
      verb: {
        infinitive: "לְהַבְרִישׁ",
        ms: "מַבְרִישׁ",
        fs: "מַבְרִישָׁה",
        mp: "מַבְרִישִׁים",
        fp: "מַבְרִישׁוֹת",
      },
      objects: [
        "שֵׁיעַר",
        "שִׁנַּיִם",
        "בֶּרֶזֶל",
        "פַּיִס",
        "מָסָן",
        "מַשְׁטֵג",
        "כַּפָּיוֹן",
        "סַמְרֵטוּט",
        "צְעֵרֵי",
        "לַחֲצֵנֵי",
      ],
    },
    {
      verb: {
        infinitive: "בוֹנֶה",
        ms: "בּוֹנֶה",
        fs: "בּוֹנָה",
        mp: "בּוֹנִים",
        fp: "בּוֹנוֹת",
      },
      objects: [
        "בַּיִת",
        "גַּג",
        "חָדֵר",
        "קִיר",
        "פֶּתַח",
        "חַלּוֹן",
        "מִדְרָגָה",
        "בְּנִיָּין",
        "עִיצוּב",
        "מְקוֹמָהוּת",
      ],
    },
    {
      verb: {
        infinitive: "קוֹנֶה",
        ms: "קוֹנֶה",
        fs: "קוֹנָה",
        mp: "קוֹנִים",
        fp: "קוֹנוֹת",
      },
      objects: [
        "אֶלֶפַנִים",
        "אוֹתָנִי",
        "בַּגֶּדֶ",
        "דֶּירָה",
        "חֲגִים",
        "חוֹל",
        "כָּרָמִים",
        "מִצְבֵּר",
        "מַזְרֵן",
        "מַכְלֵל",
        "מַלְחֶם",
        "מָשֵׁק",
        "סֵפֶר",
        "פֶּרַח",
        "קְטַנִּיּוֹת",
        "קְנִיּוֹן",
        "רֶכֶב",
        "תְּכוּנָה",
        "תֵּקֶף",
      ],
    },
    {
      verb: {
        infinitive: "קוֹרֵא",
        ms: "קוֹרֵא",
        fs: "קוֹרֵאת",
        mp: "קוֹרְאִים",
        fp: "קוֹרְאוֹת",
      },
      objects: [
        "אָדָם",
        "שֵׁם",
        "טֵלֵפוֹן",
        "חֲבֵר",
        "רַחֵל",
        "מְסִיבָה",
        "זְמַן",
        "מִנְיָן",
        "מְבוֹצָר",
        "קוֹל",
      ],
    },
    {
      verb: {
        infinitive: "לָשֵׂאת",
        ms: "נוֹשֵׂא",
        fs: "נוֹשֵׂאת",
        mp: "נוֹשְׂאִים",
        fp: "נוֹשְׂאוֹת",
      },
      objects: [
        "אֶבֶן",
        "אֶגְרוֹף",
        "דְּבַרִים",
        "חָפֶז",
        "כִּיסֵא",
        "כַּרְטִיס",
        "מַזְלֵג",
        "מַשְׁאוֹת",
        "סֵפֶר",
        "סֶלַע",
        "קַרְטוֹן",
        "קוֹרֵץ",
        "תְּיקוּ",
        "תַּיק",
        "תַּיקָה",
        "תַּמְרוּת",
      ],
    },
    {
      verb: {
        infinitive: "לִלְכּוֹד",
        ms: "לוֹכֵד",
        fs: "לוֹכֶדֶת",
        mp: "לוֹכְדִים",
        fp: "לוֹכְדוֹת",
      },
      objects: [
        "בַּיָּעִים",
        "גַּנָּב",
        "דַּג",
        "דָּגִים",
        "זְמַנִּים",
        "חִטָּה",
        "חֶבֶר",
        "חַזִּיר",
        "חַיָּה",
        "חַרְקִי",
        "טֶרֶף",
        "יָרֵק",
        "לַקִּידָרוֹן",
        "עֲטַלֵּף",
        "פַּרְפַּרֵים",
        "פּוֹקֵד",
        "צִפּוֹר",
        "תַּז",
        "תַּזְרֵים",
        "תַּפְרִיטִים",
      ],
    },
    {
      verb: {
        infinitive: "לִבְחוֹר",
        ms: "בּוֹחֵר",
        fs: "בּוֹחֶרֶת",
        mp: "בּוֹחֲרִים",
        fp: "בּוֹחֲרוֹת",
      },
      objects: [
        "אֲפִלּוּ",
        "בְּאָפְשָׁרוּת",
        "בְּדֶרֶךְ",
        "בְּחִבְרִים",
        "בְּחִרּוּת",
        "בְּחִרּוּת",
        "בְּחֵירָה",
        "בְּמָקוֹם",
        "בְּסֵפֶר",
        "בְּצַדִּיקִים",
        "בְּרֵעִים",
        "בְּשָׁפְעָה",
        "דְּרָכִים",
        "דִּגְלִים",
        "הַסְּכָּמוֹת",
        "חַבְרֵי",
        "מְדַרְגּוֹת",
        "עִקָּרוֹנוֹת",
        "צַדִּיקִים",
        "שְׁפָע",
      ],
    },
    {
      verb: {
        infinitive: "מַשְׁוִיעֵר",
        ms: "מְנַקֶּה",
        fs: "מְנַקָּה",
        mp: "מְנַקִּים",
        fp: "מְנַקּוֹת",
      },
      objects: [
        "בַּיִת",
        "חֶדֶר",
        "שֻׁלְחָן",
        "כִּסֵּא",
        "אָדָם",
        "צַלֵּחַת",
        "כַּף",
        "מָטְרֵסָה",
        "כְּרֵיוֹן",
        "תַּפְרִיטִים",
      ],
    },
    {
      verb: {
        infinitive: "לְהַשְׁווֹת",
        ms: "מַשְׁוֶה",
        fs: "מַשְׁוָה",
        mp: "מַשְׁוִים",
        fp: "מַשְׁווֹת",
      },
      objects: [
        "מְחִירִים",
        "גוֹדְלִים",
        "מַרְכֵּזִים",
        "מִשְׁקָלוֹת",
        "טַעֲמִים",
        "קְטַנִּיּוֹת",
        "מַסִּיבוֹת",
        "צְבָעִים",
        "מַסְכְּנוֹת",
        "סַכָּנוֹת",
      ],
    },
    {
      verb: {
        infinitive: "לִשְׁקוֹל",
        ms: "שׁוֹקֵל",
        fs: "שׁוֹקֶלֶת",
        mp: "שׁוֹקְלִים",
        fp: "שׁוֹקְלוֹת",
      },
      objects: [
        "אֵבֶן",
        "אוֹכֶל",
        "דֶּגֶם",
        "דֶּרֶךְ",
        "דַּבָּרִים",
        "דַּעַת",
        "הַבַּגָּרָה",
        "זְמַן",
        "חָמֵר",
        "טוֹב",
        "כְּלִי",
        "מַטְרֵס",
        "מַסָּכָה",
        "מָזָל",
        "עֵץ",
        "עֵץִים",
        "צְבָע",
        "קְטַנִּיּוֹת",
        "קַדְמִי",
        "תַּפְרִיט",
      ],
    },
    {
      verb: {
        infinitive: "לְהָכִיל",
        ms: "מֵכִיל",
        fs: "מְכִילָה",
        mp: "מְכִילִים",
        fp: "מְכִילוֹת",
      },
      objects: [
        "אֲוִיר",
        "אִגְרֵף",
        "אֵשׁ",
        "אֹכֶל",
        "חַיִּים",
        "חָמֵר",
        "כַּלִּים",
        "כֹּחוֹת",
        "מַחְזֵק",
        "מַחְצֵב",
        "מַים",
        "מָקוֹם",
        "נַפְט",
        "פֶּטַח",
        "קְטַנִּיּוֹת",
        "קֶדֶר",
        "קָנֶה",
        "רוּחוֹת",
        "שָׁמֶן",
        "תַּפְרִיטִים",
      ],
    },
    {
      verb: {
        infinitive: "לְהַמְשִׁיךְ",
        ms: "מַמְשִׁיךְ",
        fs: "מַמְשִׁיכָה",
        mp: "מַמְשִׁיכִים",
        fp: "מַמְשִׁיכוֹת",
      },
      objects: [
        "דְּרֶךְ",
        "זְמַן",
        "חַיִים",
        "טוֹבָה",
        "יוֹם",
        "מְבוּצַּר",
        "מַחֲרוּז",
        "מַכְתִּימִים",
        "מַרְקוֹם",
        "מַשְׁתֵּה",
        "מַשְׂקִיעַ",
        "נְסִיעָה",
        "סְרַט",
        "סִפְרָה",
        "סוּף",
        "שִׁיחָה",
        "תְּקוּפָה",
        "תַּהֲלִיךְ",
      ],
    },
    {
      verb: {
        infinitive: "לַעֲלוֹת",
        ms: "עוֹלֶה",
        fs: "עוֹלָה",
        mp: "עוֹלִים",
        fp: "עוֹלוֹת",
      },
      objects: [
        "אֲבַקֵּשׁ",
        "אֲרֻכָּה",
        "אָפֵּשׁ",
        "הָזְמָן",
        "יָקָר",
        "כֶּסֶף",
        "מַחֲרוּת",
        "מַסָּג",
        "שִׁנָּיִם",
        "תַּחֲבֵרֵי",
      ],
    },
    {
      verb: {
        infinitive: "יוֹצֵר",
        ms: "יוֹצֵר",
        fs: "יוֹצֵר",
        mp: "יוֹצֵר",
        fp: "יוֹצֵר",
      },
      objects: [
        "עוֹלָם",
        "יְצִירָה",
        "דַּעַת",
        "בְּרִיאוּת",
        "חֵיִם",
        "יְצִירוֹת",
        "מִסְגְּרָה",
        "יֹוצְרֵי",
        "שֵׁם",
        "עֵשֶׂה",
      ],
    },
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
  i = randomNumber(),
  copy = ""
) =>
  i <= 0
    ? copy.trim()
    : generateRandomCopy(sentenceFunc, i - 1, `${copy} ${sentenceFunc()}`)
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
const toEmail = name => {
  const normalized = name.normalize("NFD")
  const replacedSpecialChars = normalized.replace(/[\u0300-\u036f]/g, "")
  const lowercaseName = replacedSpecialChars.toLowerCase()
  const formattedName = lowercaseName
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, ".")
  return formattedName + "@example.com"
}
const randomName = generateRandomName()
console.info(randomName)
console.info(toEmail(randomName))
console.info(generateRandomCopy())
