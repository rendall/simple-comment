# Simple Comment

_Simple Comment_ allows visitors to your web pages to leave and read comments. It is _truly free_ (as in no cost) and entirely controlled by you from end to end

## Features

- Visitors can read and reply to comments
- Optional user authentication and identification
- Easy to use anywhere
- Industry-standard security
- Designed to be fully customizable
- Scalable, from free-tier to enterprise!
- Free (as in "free beer": no cost)
  - Takes advantage of free-tier offerings from DBaaS and website hosts
- Free (as in "free speech": open source)
  - The source code is available to be modified and used without restriction
  - Commercial use allowed! Start a business with it! Knock yourself out!
  - MIT licensing available
- Fully documented API
  - Open API 3
- Ethical, no-track, visitor control over data
- Friendly and welcoming developer community

### Upcoming features

- CLI (command-line interface) for
  - installation and setup
  - content moderation
  - user admininstration
- GraphQL endpoint
- GDPR compliance
- Moderators can restrict visitor read and write access
  - IP whitelists, graylists and blacklists
  - User whitelists, graylists and blacklists
- User self-verification
- Optional connection to the Fediverse
- Support for other databases and hosting services

## Setup

The assumption is that the API will run in a separate Netlify website and be accessed cross-origin

1. Fork this repository to your own account
1. `git clone https://github.com/<your-github-profile>/simple-comment` replacing
   `<your-github-profile>`
1. `cd simple-comment`
1. `yarn install` (or `npm install`)
1. Copy and rename `example.env` as `.env`
1. In `.env`, enter your own, secret values, replacing everything to the right
   of the `=` in every case:
   1. SIMPLE_COMMENT_MODERATOR_ID
   1. SIMPLE_COMMENT_MODERATOR_PASSWORD
   1. JWT_SECRET
   1. HASH_SECRET
1. sign up for a free MongoDB Atlas account
   1. [Follow these instructions](docs/MONGODB_ATLAS.md)
   1. In `.env` add the proper `DB_CONNECION_STRING`
1. Sign up for a Netlify account, begin a new website, and link your repository
   to the new website
   1. Navigate to 'Build & Deploy => Environment`
   1. Under `Environmental Variables` click the button `Edit Variables`
   1. For each entry in `.env` add the key and corresponding value for _all_
      variables
   1. For `SIMPLE_COMMENT_MODE` add the value `production`

### Troubleshooting

- Error: `Refused to connect to 'api/auth' because it violates the following Content Security Policy directive: connect-src 'self'`
  - Add `https://<your-comment-app>.netlify.app` to your Content Security Policy
    header next to `connect-src` (q.v.
    <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/connect-src>)
- Error:
  `Access to fetch at 'https://<your-comment-app>.netlify.app/.netlify/functions/' from origin '<your-website>' has been blocked by CORS policy...`
- Add `<your-website>` to

## Default build

The default stack uses Netlify + _MongoDB_ for the backend, and a minimal `fetch` based client for the frontend, but it can be readily adapted to use any technology stack, as long as the tests pass and the API conforms to the Open API 3 schema file

You can get your own free-tier MongoDB-in-the-cloud by [following these instructions](./docs/MONGODB_ATLAS.md)

## API

The API specification is described by the file [simple-comment-api.json](./src/schema/simple-comment-api.json) in Open API 3 format and is designed to be interchangeable with any backend, frontend and identification system

This is an overview of the _Simple Comment API_ endpoints

### `/comment`

A `comment` is text that a user posts in reply to either another `comment` or a `topic`, and presenting these replies is the sole reason this project exists!

The comment endpoint is for the creation, reading, updating and deleting (CRUD) of individual comments. All comments must have a parent, that is, something it replies to, whether a `topic` or `comment`

### `/topic`

A topic is a special kind of comment that by default can only be created by admin users, and forms an organizational bucket for comments that reply. It is a kind of root comment, and therefore has no parent

The /topic endpoint handles CRUD for these root comments. A GET operation of `/topic` will get a list of topics and GET on `/topic/{topicId}` will get all comments in reply to that topic and their descendents

### `/user`

By default, comments can be posted by anonymous users, but _Simple Comment_ does have a minimal identification scheme so that commenters who choose to do so can have control over their comments after the are posted, according to policy

### `/auth`

Auth is the endpoint for the authentication and identification scheme. A user submits their username and password to the auth endpoint, and receives a JSON Web Token (JWT) that authenticates them as that user for other CRUD operations

### `/verify`

Returns the logged-in user id or `401`

## policy

`policy` is an [object holding key-value pairs](./src/policy.ts) that governs how _Simple Comment_ behaves, determining for instance maximum comment length or whether ordinary users can delete themselves
