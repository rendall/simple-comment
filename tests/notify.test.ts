import * as dotenv from "dotenv"
import nodemailer, { TestAccount } from "nodemailer"
import type Mail from "nodemailer/lib/mailer"
import { MongodbService } from "../src/lib/MongodbService"
import { Db, MongoClient } from "mongodb"
import { createRandomTopic, createRandomUser, randomString } from "./fake/fakes"
import { Success, Topic, Comment, Error } from "../src/lib/simple-comment"
import { NotifyService } from "../src/lib/NotifyService"
import { handler as commentHandler } from "../src/netlify-functions/comment"
import { APIGatewayEvent, APIGatewayProxyEvent } from "aws-lambda"
import { getAuthToken } from "../src/lib/crypt"

dotenv.config()

declare const global: any

const MONGO_URI = global.__MONGO_URI__
const MONGO_DB = global.__MONGO_DB_NAME__

const simpleTopic = createRandomTopic()
const simpleUser = createRandomUser()

/**
 **/

let transporter: Mail
let testAccount: TestAccount
let service: MongodbService
let client: MongoClient
let db: Db

interface ResponseInfo {
  accepted: string[]
  envelope: {
    from: string
    to: string[]
  }
  envelopeTime: number
  messageId: string
  messageSize: number
  messageTime: number
  rejected: any[]
  response: string
}

describe("Ensure that comments send notices, according to policy", () => {
  beforeAll(async done => {
    const connectionString = MONGO_URI
    const databaseName = MONGO_DB

    service = new MongodbService(connectionString, databaseName)
    client = await service.getClient()
    db = await service.getDb()

    const comments = db.collection<Topic>("comments")
    comments.insertOne(simpleTopic)

    const users = db.collection("users")
    users.insertOne(simpleUser)

    // create a temporary test email account
    nodemailer.createTestAccount((err, account) => {
      // create reusable transporter object using the default SMTP transport
      testAccount = account
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: account.user,
          pass: account.pass
        }
      })
      done()
    })
  })

  afterAll(async () => {
    await db.dropDatabase()
    await service.close()
  }, 120000)

  test("test account receives email", async () => {
    const mailOptions: Mail.Options = {
      to: "simple-comment-admin@example.com",
      text: "Success!"
    }
    expect.assertions(2)
    await transporter
      .sendMail({ ...mailOptions, from: testAccount.user })
      .then((info: ResponseInfo) => {
        expect(info).toHaveProperty("response")
        expect(info.response).toEqual(expect.stringContaining("250 Accepted"))
      })
  })
  // The network is down or transport code is munged somehow

  test("Posting comment should succeed", () => {
    const newComment = {
      text: randomString(),
      parentId: simpleTopic.id,
      userId: simpleUser.id
    }

    return service
      .commentPOST(newComment.parentId, newComment.text, newComment.userId)
      .then((res: Success<Comment> | Error) => {
        const resbody = res.body as Comment
        expect(res).toHaveProperty("statusCode", 201)
        expect(res).toHaveProperty("body")
        expect(res.body).toHaveProperty("text", newComment.text)
        expect(res.body).toHaveProperty("user")
        expect(resbody.user.id).toBe(newComment.userId)
      })
  })

  test("Successful post should notify", () => {
    const newComment = {
      text: randomString(),
      parentId: simpleTopic.id,
      userId: simpleUser.id
    }

    // EmailService
    const testNotifyService: NotifyService = {
      sendNotice: (to: string, subject: string, text: string) => {
        expect(text).toEqual(newComment.text)
      }
    }

    const token = getAuthToken(newComment.userId)

    // Create a fake request event, including auth: 
    const event: Pick<
      APIGatewayEvent,
      "path" | "headers" | "body" | "httpMethod"
    > = {
      path: `/comment/${newComment.parentId}`,
      httpMethod: "POST",
      body: newComment.text,
      headers: { "Cookie": `simple_comment_token=${token}` }
    }

    expect.assertions(1)

    return commentHandler(event, null, service, testNotifyService)
  })
})
