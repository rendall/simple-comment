/// <reference types="cypress" />
describe("Simple Comment right-to-left rendering", () => {
  beforeEach(() => cy.visit("/"))

  const ltrTopic = {
    "_id": "64549e0e016f5d012c08cb6d",
    "id": "http-localhost-7070",
    "parentId": null,
    "text": null,
    "title": "Simple Comment",
    "user": {},
    "dateCreated": "2023-05-05T06:11:26.781Z",
    "dateDeleted": null,
    "replies": [
      {
        "id": "hvh-21s6-c1m6p_kgf-29l1-c1m6p",
        "text":
          "あなた は レース を 走る。 あなたたち は 寝る。 私 は 書く。 私たち は 仕事する。 あなた は 映画 を 作る。",
        "dateCreated": "2023-09-01T07:57:33.894Z",
        "parentId": "http-localhost-7070_hvh-21s6-c1m6p",
        "user": {
          "id": "guest-eh142-c1m6p",
          "name": "田中 太郎",
        },
      },
      {
        "id": "http-localhost-7070_hvh-21s6-c1m6p",
        "text":
          "Αυτοί κοιτάζουν τις φωτογραφίες μου. Εσύ πλένεις τα πιάτα. Αυτό μαθαίνει σχολικά μαθήματα.",
        "dateCreated": "2023-09-01T06:56:22.102Z",
        "parentId": "http-localhost-7070",
        "user": {
          "id": "guest-eh142-c1m6p",
          "name": "Ελένη Παπαδοπούλου",
        },
      },
    ],
  }
  const hebrewTopic = {
    "_id": "64549e0e016f5d012c08cb6d",
    "id": "http-localhost-7070",
    "parentId": null,
    "text": null,
    "title": "Simple Comment",
    "user": {},
    "dateCreated": "2023-05-05T06:11:26.781Z",
    "dateDeleted": null,
    "replies": [
      {
        "id": "hvh-21s6-c1m6p_kgf-29l1-c1m6p",
        "text":
          "היא כותבת מכתב. אני מזיז רהיטים. הם מאמנים כלב. אני צובע דיגיטל",
        "dateCreated": "2023-09-01T07:57:33.894Z",
        "parentId": "http-localhost-7070_hvh-21s6-c1m6p",
        "user": {
          "id": "guest-eh142-c1m6p",
          "name": "יוֹסֵף כֹּהֵן",
        },
      },
      {
        "id": "http-localhost-7070_hvh-21s6-c1m6p",
        "text":
          "אתה קונה בית. הוא מבקר חבר. הם צריכים תספורת. הם נושאים תיק. אתה מבין מדע. אני נוסע ברכב. אתה שולט בממלכה.",
        "dateCreated": "2023-09-01T06:56:22.102Z",
        "parentId": "http-localhost-7070",
        "user": {
          "id": "guest-eh142-c1m6p",
          "name": "שָׂרָה לֵוִי",
        },
      },
    ],
  }
  const arabicTopic = {
    "_id": "64549e0e016f5d012c08cb6d",
    "id": "http-localhost-7070",
    "parentId": null,
    "text": null,
    "title": "Simple Comment",
    "user": {},
    "dateCreated": "2023-05-05T06:11:26.781Z",
    "dateDeleted": null,
    "replies": [
      {
        "id": "hvh-21s6-c1m6p_kgf-29l1-c1m6p",
        "text":
          "أحتاج إلى استراحة. أنا أقوم بتوصيل بيتزا. إنه يتمهل اختصارًا. هو يطلب بيتزا. هي تقود حافلة. أنت تقوم بإنتاج فيلم.",
        "dateCreated": "2023-09-01T07:57:33.894Z",
        "parentId": "http-localhost-7070_hvh-21s6-c1m6p",
        "user": {
          "id": "guest-eh142-c1m6p",
          "name": "احمد خان.",
        },
      },
      {
        "id": "http-localhost-7070_hvh-21s6-c1m6p",
        "text":
          "میں ایک ٹیم کو تربیت دیتا ہوں۔ وہ ایک اداکار کو تربیت دیتے ہیں۔ یہ ایک نام کو ادائیگی کرتا ہے۔ یہ مقامات کو موازنہ کرتا ہے۔ مجھے فلمیں پسند ہیں۔ تم اختلافات کا احترام کرتے ہو۔",
        "dateCreated": "2023-09-01T06:56:22.102Z",
        "parentId": "http-localhost-7070",
        "user": {
          "id": "guest-eh142-c1m6p",
          "name": "احمد خان.",
        },
      },
    ],
  }

  it("properly renders Hebrew", () => {
    cy.intercept("GET", ".netlify/functions/topic/*", req => {
      req.reply({
        statusCode: 200,
        ok: true,
        body: hebrewTopic,
      })
    })
    cy.visit("/")
    cy.get("li#http-localhost-7070_hvh-21s6-c1m6p")
      .children("article.comment-body")
      .first()
      .should("have.class", "is-rtl")
  })

  it("properly renders Arabic", () => {
    cy.intercept("GET", ".netlify/functions/topic/*", req => {
      req.reply({
        statusCode: 200,
        ok: true,
        body: arabicTopic,
      })
    })
    cy.visit("/")
    cy.get("li#http-localhost-7070_hvh-21s6-c1m6p")
      .children("article.comment-body")
      .first()
      .should("have.class", "is-rtl")
  })

  it("properly renders LTR", () => {
    cy.intercept("GET", ".netlify/functions/topic/*", req => {
      req.reply({
        statusCode: 200,
        ok: true,
        body: ltrTopic,
      })
    })
    cy.visit("/")
    cy.get("li#http-localhost-7070_hvh-21s6-c1m6p")
      .children("article.comment-body")
      .first()
      .should("not.have.class", "is-rtl")
  })
})
