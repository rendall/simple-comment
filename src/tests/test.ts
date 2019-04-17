/**
 * @jest-environment ./tests/mongo-environment.js
 */
/* eslint-disable no-console */
const {MongoClient} = require('mongodb');

const COLLECTION_NAME = "comments"
let connection:any;
let db:any;

beforeAll(async () => {
  connection = await MongoClient.connect(global.__MONGO_URI__, {useNewUrlParser:true});
  db = await connection.db(global.__MONGO_DB_NAME__);
});

afterAll(async () => {
  await connection.close();
  // await db.close();
});

it('should aggregate docs from collection', async () => {
  const comments = db.collection(COLLECTION_NAME);

  await comments.insertMany([
    {type: 'Document'},
    {type: 'Video'},
    {type: 'Image'},
    {type: 'Document'},
    {type: 'Image'},
    {type: 'Document'},
  ]);

  const topFiles = await comments
    .aggregate([
      {$group: {_id: '$type', count: {$sum: 1}}},
      {$sort: {count: -1}},
    ])
    .toArray();

  expect(topFiles).toEqual([
    {_id: 'Document', count: 3},
    {_id: 'Image', count: 2},
    {_id: 'Video', count: 1},
  ]);
});