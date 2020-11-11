# Open Source Comments

A free, self-hosted comment system for any blog or website

## Default build

The default stack uses Netlify + MongoDB for the backend, and a minimal `fetch` based client for the frontend, but it can be readily adapted to use any technology stack, as long as the tests pass and the API conforms to the Open API 3 schema file

## API

The API specification is described by the file [simple-comment-api.json](./src/schema/simple-comment-api.json) in Open API 3 format and is designed to be interchangeable with any backend, frontend and identification system

This is an overview of the *Simple Comment API* endpoints

### comment

A `comment` is text that a user posts in reply to either another `comment` or a `topic`, and presenting these replies is the sole reason this project exists!

The comment endpoint is for the creation, reading, updating and deleting (CRUD) of individual comments. All comments must have a parent, that is, something it replies to, whether a `topic` or `comment`

### topic

A topic is a special kind of comment that by default can only be created by admin users, and forms an organizational bucket for comments that reply. It is a kind of root comment, and therefore has no parent

The /topic endpoint handles CRUD for these root comments. A GET operation of `/topic` will get a list of topics and GET on `/topic/{topicId}` will get all comments in reply to that topic and their descendents

### user

By default, comments can be posted by anonymous users, but *Simple Comment* does have a minimal identification scheme so that commenters who choose to do so can have control over their comments after the are posted, according to policy

### auth

Auth is the endpoint for the authentication and identification scheme. A user submits their username and password to the auth endpoint, and receives a JSON Web Token (JWT) that authenticates them as that user for other CRUD operations

## policy

`policy` is an [object holding key-value pairs](./src/policy.ts) that governs how *Simple Comment* behaves, determining for instance maximum comment length or whether ordinary users can delete themselves

## Roadmap

1. Integrating MongoDB Atlas
1. Integrating Netlify functions
1. Add CORS to API
1. Minimal frontend
