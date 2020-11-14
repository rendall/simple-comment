import { Db, MongoClient } from "mongodb"
// import * as dotenv from "dotenv"

// dotenv.config()

declare const global: any
const MONGO_URI = global.__MONGO_URI__
const MONGO_DB = global.__MONGO_DB_NAME__
// const MONGO_URI = process.env.DB_CONNECTION_STRING
// const MONGO_DB = process.env.DATABASE_NAME

describe("insert", () => {
  let connection
  let db: Db

  beforeAll(async () => {
    connection = await MongoClient.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    db = await connection.db(MONGO_DB)
  })

  afterAll(async () => {
    await db.dropDatabase()
    await connection.close()
  })

  it("should insert a doc into collection", async () => {
    const users = db.collection("users")

    const mockUser = { id: "some-user-id", name: "John" }
    await users.insertOne(mockUser)

    const insertedUser = await users.findOne({ id: "some-user-id" })
    expect(insertedUser).toEqual(mockUser)
  })
})
