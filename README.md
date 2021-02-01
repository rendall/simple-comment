<a href="https://simple-comment.netlify.app"> <img src="/docs/simple-comment-logo.svg" height="72"> </a>

# Simple Comment

_Simple Comment_ enables any website visitor to leave comments. It is serverless, open-source, self-hosted, free, scaleable, and designed to feel unremarkably similar to the dozen or so other excellent solutions.

See the demo: <https://simple-comment.netlify.app>

## Status

[![Netlify Status](https://api.netlify.com/api/v1/badges/fb816766-6f5b-4dff-9c27-3f5948ac9705/deploy-status)](https://app.netlify.com/sites/simple-comment/deploys)
[![David](https://img.shields.io/david/rendall/simple-comment)](https://david-dm.org/rendall/simple-comment)
[![Open API 3.0 Validator](https://img.shields.io/swagger/valid/3.0?label=Open%20API%203.0%20spec&specUrl=https%3A%2F%2Fraw.githubusercontent.com%2Frendall%2Fsimple-comment%2Fmaster%2Fsrc%2Fschema%2Fsimple-comment-api.json)](https://app.swaggerhub.com/apis/rendall-dev/simple-comment_api/1.0.0)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fsimple-comment.netlify.app%2F)](https://simple-comment.netlify.app)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/rendall/simple-comment.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/rendall/simple-comment/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/rendall/simple-comment.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/rendall/simple-comment/context:javascript)
[![Documentation Status](https://readthedocs.org/projects/simple-comment/badge/?version=latest)](https://simple-comment.readthedocs.io/en/latest/?badge=latest)

### MVP is complete!

The minimum functionality is [up and running](https://simple-comment.netlify.app)!

 <details>
  <summary><b>Completed tasks:</b> (click to open)</summary>

- Cross-origin capability
- Script with frontend
- All API endpoint respond as expected
  - `Access-Control-Allow-Origin` responds to `.env` variables
- Authentication and Identification works as expected
- Authenticated users and admins can interact with Simple Comment as expected
- Anonymous user can _create topics_
  - This is useful for sites with lots of pages
  - For security reasons, restrictions apply:
    - The `Referer` header and the `topicId` must map properly
    - The `Origin` must be on the `Access-Control-Allow-Origin` list
- Server-side validation of user-posted data
- Setup instructions
  - Are complicated but work when followed
- Visitor can post anonymously
  - Comment includes guest user
- Designed a beautiful badge!
  - [![Powered by Simple Comment](docs/simple-comment-badge.svg)](https://simple-comment.netlify.app)
- Visitors can read and reply to comments

### Top priority after MVP

- Optional user authentication and identification
- Moderator holds posts for approval
- Spam prevention measures
- Integration with 3rd party authentication
- Email notification & integration
- Framework-friendly frontends
- Extensive helpful comments!
- E2E tests

### Nice to haves

- Moderator change policy on holding posts for approval
- Visitor can claim ownership over anonymous posts
- Edit button
- Delete / edit time windows in policy
- User profiles
  - See comments
  - Avatar
  </details>

## Features

- Easy to use anywhere
- Industry-standard security
- Designed to be fully customizable
- Scalable, from free-tier to enterprise!
- Free (as in "free beer": no cost)
  - Takes advantage of free-tier offerings from DBaaS and website hosts
- Free (as in "libre": open source)
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
  - Users can view and delete their own data without moderator
- Moderators can restrict visitor read and write access
  - IP whitelists, graylists and blacklists
  - User whitelists, graylists and blacklists
- User self-verification
- Optional connection to the Fediverse
- Support for other databases (PostgreSQL, Firestore, CockroachDB, etc) and hosting services (Heroku, AWS Lambda, GCS)
- Support Web Authentication API <https://w3c.github.io/webauthn/>
- User profiles
- Upvoting / Reactions

## Setup

_Simple Comment_ can be run on the same server as your website or on a separate, cross-domain server

It is _necessary_ that _Simple Comment_ is served via _https:_

These instructions assume some devOps skill, but if anything is unclear, please [create a new issue](https://github.com/rendall/simple-comment/issues/new)

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
   1. SIMPLE_COMMENT_API_URL
1. sign up for a free MongoDB Atlas account
   1. [Follow these instructions](docs/MONGODB_ATLAS.md)
   1. In `.env` add the proper `DB_CONNECION_STRING`
1. Sign up for a Netlify account, begin a new website, and link your repository
   to the new website
   1. Navigate to 'Build & Deploy => Environment`
   1. Under `Environmental Variables` click the button `Edit Variables`
   1. For each entry in `.env` add the key and corresponding value for _all_
      variables
   1. For `IS_CROSS_SITE` add the value `production`
1. Modify your website. These are simple instructions, but feel free to hack away
   1. In the HTML for each page on your website where you want Simple Comment to run, add these two tags:
      1. `<script src="[path-to]/simple-comment.js" defer></script>` (`src` must point to the `simple-comment.js` file)
      1. `<div id="simple-comment-display"></div>`
   1. Upload the `simple-comment.js` file to your website's script folder
   1. Upload the `login.html` page on the root of your website (or somewhere accessible)
1. It should now be possible to leave and read comments on your website

### Troubleshooting

- Error: `Refused to connect to 'api/auth' because it violates the following Content Security Policy directive: connect-src 'self'`
  - Add `https://<your-comment-app>.netlify.app` to your Content Security Policy header next to `connect-src` (q.v.
    <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/connect-src>)
- Error:
  `Access to fetch at 'https://<your-comment-app>.netlify.app/.netlify/functions/' from origin '<your-website>' has been blocked by CORS policy...`
  - Add `<your-website>` to the `ALLOW_ORIGIN` key in `.env` and as a Netlify environmental variable

## Moderating

1. Visit the `login.html` page you uploaded in _Setup_ and
1. Log in using the `SIMPLE_COMMENT_MODERATOR_ID` and `SIMPLE_COMMENT_MODERATOR_PASSWORD` values in your `.env` file

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

## Alternatives

Nearly all of these are more mature than Simple Comment, and I would recommend considering one if you are not looking specifically for a serverless, open-source, self-hosted solution. Listed below each are pros and cons that distinguish it from Simple Comment. If _Trust is required_ is listed, it means that using the service requires trust in the company, because they will be serving closed-source code to your users that you do not control and cannot easily inspect. This list is based on public documentation, not experience. If anything is incorrect or missing, please let me know.

- Commentics <https://www.commentics.org/>
  - Open Source: GPL
  - Free tier with logo
  - Requires a server running PHP and MySQL
- Commento <https://commento.io/>
  - Easy setup
  - Privacy focused
  - Closed Source
  - Data is held on 3rd party server
  - No free tier
  - Trust is required
- Disqus <https://disqus.com/>
  - Easy setup
  - Free tier
  - Fully featured
  - Closed Source
  - Data is held on 3rd party server
  - Requires user login
  - Sells user data
  - Trust is required
- Facebook Comments Plugin <https://developers.facebook.com/docs/plugins/comments/>
  - Easy setup
  - Free tier
  - Fully featured
  - Closed Source
  - Data is held on 3rd party server
  - Requires Facebook
  - Requires user login
  - Sells user data
  - Trust is required
- GraphComment <https://graphcomment.com/>
  - Easy setup
  - Fully featured
  - Free tier
  - Closed Source
  - Data is held on 3rd party server
    - Guarantees "full and complete ownership" of data
    - Servers in Europe (France)
  - Requires user login
  - Trust is required
- HTML Comment Box <https://www.htmlcommentbox.com/>
  - Easy setup
  - Free tier
  - Closed Source
  - Data is held on 3rd party server
  - Trust is required
  - Privacy policy? Unknown.
- HashOver <https://www.barkdull.org/software/hashover>
  - Open Source: AGPL
  - Requires a server running PHP and MySQL
- IntenseDebate <https://intensedebate.com/>
  - Fully featured
  - Closed Source
  - Data is held on 3rd party server
  - Requires user login
  - Requires trust
- Isso <https://posativ.org/isso/>
  - Documentation is extensive
  - Open source: MIT
  - Requires a Linux server running Python and SQLite3
- Remark42 <https://remark42.com/>
  - Fully featured
  - Open source: MIT
  - Requires a server
    - Runs a self-contained executable written in Go
- Valine <https://valine.js.org/en/index.html>
  - Open source: GPL
  - Serverless
  - Requires a leancloud account
  - Servers are in China
  - Data safety / privacy is unclear
- schnack! <https://schnack.cool/>
  - Open source: Lil License v1
  - Requires a server running Node and SQLite3
