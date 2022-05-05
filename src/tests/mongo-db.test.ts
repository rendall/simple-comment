import { Db, MongoClient } from "mongodb"

declare const global: any
const MONGO_URI = global.__MONGO_URI__
const MONGO_DB = global.__MONGO_DB_NAME__

describe("insert", () => {
  let connection
  let db: Db

  beforeAll(async () => {
    connection = await MongoClient.connect(MONGO_URI)
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
