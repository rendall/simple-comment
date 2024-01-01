declare global {
  interface Window {
    getQuestion: (slug: string) => Promise<string>
  }
}
const storageKey = "icebreakerQuestions"
const timeStampKey = "icebreakerQuestionsTimeStamp"

const toSlug = (str: string): string => {
  return str
    .toLowerCase() // Convert to lower case
    .trim() // Remove leading and trailing spaces
    .replace(/_/g, "-") // Replace underscores with dashes
    .replace(/\s+/g, "-") // Replace all spaces with dashes
    .replace(/[^a-z0-9-]/g, "") // Remove characters that are not lowercase letters, numbers, or dashes
    .replace(/-+/g, "-"); // Merge consecutive dashes into a single dash
};

const isSlugMatch = (slug: string, question: string) =>
  slug === toSlug(question)

const reverseSlug = (slug: string, questions: string[]) =>
  questions.find(question => isSlugMatch(slug, question))

const fetchAndStoreQuestions = () =>
  new Promise<string[]>((resolve: (questions: string[]) => void, reject: (reason?: any) => void) => {
    const currentTimestamp: string =
      document?.getElementById("questions-time-stamp")?.innerText || "0";
    const storedTimestamp = localStorage.getItem(timeStampKey);

    const isStoredQuestionsValid =
      storedTimestamp && parseInt(storedTimestamp) >= parseInt(currentTimestamp);

    const storedQuestions = localStorage.getItem(storageKey);
    if (isStoredQuestionsValid && storedQuestions) {
      resolve(JSON.parse(storedQuestions));
      return;
    }

    fetchQuestions(currentTimestamp, resolve, reject);
  });

const fetchQuestions = async (
  currentTimestamp: string,
  resolve: (questions: string[]) => void,
  reject: (reason?: any) => void
) => {
  try {
    const questionFile = await fetch(
      "https://raw.githubusercontent.com/rendall/icebreakers/master/QUESTIONS.md"
    );
    const questionsText = await questionFile.text();
    const questionLines = questionsText.split("\n");
    const questions = questionLines
      .filter(line => /^ {2}\* [A-Z]/.test(line))
      .map(line => line.slice(4));

    localStorage.setItem(storageKey, JSON.stringify(questions));
    localStorage.setItem(timeStampKey, currentTimestamp);
    resolve(questions);
  } catch (error) {
    reject(error);
  }
};

const getQuestion = (slug: string) =>
  new Promise<string>((resolve: (question: string) => void, reject: (reason?: any) => void) => {
    fetchAndStoreQuestions()
      .then(questions => {
        const question = reverseSlug(slug, questions);
        if (question) {
          resolve(question);
        } else {
          reject("No question found");
        }
      })
      .catch(reject);
  });

window.getQuestion = getQuestion;

export default getQuestion;
