<a href="https://simple-comment.netlify.app"> <img src="/docs/simple-comment-logo.svg" height="72"> </a>

# Simple Comment

_Simple Comment_ is a commenting platform for any website. Free, flexible, open-source, private, and scalable.

See the demo: <https://simple-comment.netlify.app>

## Status

_NB:_ Moderation tools are not yet adequate. There is no notification when a user has posted a comment, nor any way to hold it in moderation before approval. If you like this project and would like to see it developed further on a specific timeline, contact me. Otherwise, this project is still on the road, but on the slow road.

[![Netlify Status](https://api.netlify.com/api/v1/badges/fb816766-6f5b-4dff-9c27-3f5948ac9705/deploy-status)](https://app.netlify.com/sites/simple-comment/deploys)
[![Open API 3.0 Validator](https://img.shields.io/swagger/valid/3.0?label=Open%20API%203.0%20spec&specUrl=https%3A%2F%2Fraw.githubusercontent.com%2Frendall%2Fsimple-comment%2Fmaster%2Fsrc%2Fschema%2Fsimple-comment-openapi3.json)](https://app.swaggerhub.com/apis/rendall-dev/simple-comment_api/1.0.0)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fsimple-comment.netlify.app%2F)](https://simple-comment.netlify.app)
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
- Takes advantage of free-tier offerings from DBaaS and website hosts
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

Follow these instructions. If anything is unclear, please [create a new issue](https://github.com/rendall/simple-comment/issues/new)

1. [Fork this repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo) to your own account
1. [Clone your fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo#cloning-your-forked-repository)
1. Copy [`example.env`](example.env) into the same, project root directory and rename it to be `.env`
1. In `.env`, enter your own (made up or randomly generated), secret values for these entries (i.e. replace everything to the right of `=` in each line).
   - SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL
   - SIMPLE_COMMENT_MODERATOR_ID
   - SIMPLE_COMMENT_MODERATOR_PASSWORD
   - JWT_SECRET
1. sign up for a free MongoDB Atlas account
   1. [Follow these instructions](docs/MONGODB_ATLAS.md)
   1. In `.env` add the proper `DB_CONNECION_STRING`
1. Sign up for a Netlify account, begin a new website, and link your repository
   to the new website
   1. Review [Netlify's Build environment variables](https://docs.netlify.com/configure-builds/environment-variables/#environment-variables-in-the-build-environment) page
   1. Navigate to 'Build & Deploy => Environment`
   1. Under `Environmental Variables` click the button `Edit Variables`
   1. For each entry in `.env` add the key and corresponding value for _all_
      variables
   1. For `IS_CROSS_SITE` add the value `true` if the comment system is hosted in its own domain and `false` if it is the same domain.
1. Modify your website. These are simple instructions, but feel free to hack away
   1. In the HTML for each page on your website where you want Simple Comment to run, add these two tags:
      1. `<script src="[path-to]/simple-comment.js" defer></script>` (`src` must point to the `simple-comment.js` file)
      1. `<div id="simple-comment-display"></div>`
   1. Upload the `simple-comment.js` file to your website's script folder
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

## Local development

Assumes a unix-like environment, like Ubuntu.

### Installation

1. Install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
1. `nvm install`
1. `npm install -g yarn`
1. `yarn install`
1. `yarn run build`
1. Install and run [MongoDB Community Edition](https://www.mongodb.com/docs/manual/administration/install-community/)

### Test

1. `yarn run test`
1. `yarn run test:e2e`

### Usage

1. `sudo systemctl start mongod` (q.v. [Linux](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/#run-mongodb-community-edition))
1. `yarn run start`
1. open http://localhost:7070/

## API

The API specification is described by the file [simple-comment-openapi3.json](./src/schema/simple-comment-openapi3.json) in Open API 3 format and is designed to be interchangeable with any backend, frontend and identification system

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

`policy` is an [object holding key-value pairs](./src/policy.json) that governs how _Simple Comment_ behaves, determining for instance maximum comment length or whether ordinary users can delete themselves.

```ts
{
  isGuestAccountAllowed : boolean, // if true, a visitor can post anonymously using a guest account. if false, only authenticated users can comment.
  canFirstVisitCreateTopic : boolean, // if a discussion does not exist for a page, shall it be created when visited for the first time, or does admin create all topics?
  canGuestCreateUser : boolean, // can a user with guest credentials create (their own) user profile? if 'canPublicCreateUser' is set to 'true' this setting is ignored
  canGuestReadDiscussion : boolean, // can a user with guest credentials browse and read discussions? if 'canPublicReadDiscussion' is set to 'true' this setting is ignored
  canGuestReadUser : boolean, // can a user with guest credentials view user profiles? if 'canPublicReadUser' is true, this setting is ignored
  canPublicCreateUser : boolean, // can a user with no credentials create (their own) user profile?
  canPublicReadDiscussion : boolean, // can a user with no credentials browse and read discussions?
  canPublicReadUser : boolean, // can an anonymous visitor view any user's profile?
  canUserDeleteSelf : boolean, // can a user delete their own profile?
  maxCommentLengthChars : number, // Attempting to post a comment longer than this number of characters will be rejected by the API
}
```

## Alternatives

There are 34 solutions that are not Simple Comment listed here. Nearly all of these are more mature than Simple Comment, and I would recommend considering one if you are not looking specifically for a serverless, open-source, self-hosted solution. Listed below each are pros and cons that distinguish it from Simple Comment. If _Trust is required_ is listed, it means that using the service requires trust in the company, because they will be serving closed-source code to your users that you do not control and cannot easily inspect; as well, user data will be held on servers they control. This list is based on public documentation, not experience. If anything is incorrect or missing, please let me know.

- Comment Box <https://commentbox.io/>
  - Free tier
  - Privacy focused
  - Data is held on 3rd party server
    - "No lock-in"
  - Trust is required
- Commentics <https://www.commentics.org/>
  - Open Source: GPL
  - Free tier with logo
  - Requires a server running PHP and MySQL
- Commento <https://commento.io/>
  - Privacy focused
  - [Open Source](https://gitlab.com/commento/commento): MIT
  - Self-host OR pay-to-host
- Discourse <https://www.discourse.org/>
  - Open source: GPL
  - Fully featured
  - Self-host OR paid version
  - No free tier
- Disqus <https://disqus.com/> - The 400 pound gorilla of e
  - Free tier
  - Fully featured
  - Closed Source
  - Data is held on 3rd party server
  - Requires user login
  - Sells user data
  - Trust is required
- Facebook Comments Plugin <https://developers.facebook.com/docs/plugins/comments/>
  - Free tier
  - Fully featured
  - Closed Source
  - Data is held on 3rd party server
  - Requires Facebook
  - Requires user login
  - Sells user data
  - Trust is required
- FastComments <https://fastcomments.com/>
  - Fully featured
  - Privacy focused
  - Real-time chatting
  - HMAC authentication
  - No free tier
  - Trust is required
- GraphComment <https://graphcomment.com/>
  - Fully featured
  - Free tier
  - Closed Source
  - Data is held on 3rd party server
    - Guarantees "full and complete ownership" of data
    - Servers in Europe (France)
  - Requires user login
  - Trust is required
- HTML Comment Box <https://www.htmlcommentbox.com/>
  - Free tier
  - Closed Source
  - Data is held on 3rd party server
  - Trust is required
  - Privacy policy? Unknown.
- HashOver <https://www.barkdull.org/software/hashover>
  - Open Source: AGPL
  - Requires a server running PHP and MySQL
- Hyvor Talk <https://talk.hyvor.com/>
  - Privacy focused
  - No free tier
  - Requires user login
  - Trust is required
- IntenseDebate <https://intensedebate.com/>
  - Fully featured
  - Closed Source
  - Data is held on 3rd party server
  - Requires user login
  - Trust is required
- Isso <https://posativ.org/isso/>
  - Documentation is extensive
  - Open source: MIT
  - Requires a Linux server running Python and SQLite3
- Just Comments <https://just-comments.com/>
  - Defunct <https://just-comments.com/blog/2020-03-06-just-comments-is-shutting-down.html>
- Muut <https://muut.com>
  - Developer-friendly <https://muut.io>
  - Fully featured
  - No free tier
  - Trust is required
- Remark42 <https://remark42.com/>
  - Fully featured
  - Open source: MIT
  - Requires a server
    - Runs a self-contained executable written in Go
- Talkyard <https://www.talkyard.io/>
  - [Open source](https://github.com/debiki/talkyard): AGPL
  - Self-host OR paid hosting
  - Almost free tier (€1.90/mo + optional add-ons)
  - Discounts for non-profits and developing countries
- Valine <https://valine.js.org/en/index.html>
  - Open source: GPL
  - Serverless
  - Requires a leancloud account
  - Servers are in China
  - Data safety / privacy is unclear
- schnack! <https://schnack.cool/>
  - Open source: Lil License v1
  - Requires a server running Node and SQLite3

* More: a list of commenting systems that I have not evaluated
  - Cactus comments <https://gitlab.com/cactus-comments>
  - Commentator <https://github.com/mcorbin/commentator>
  - Comntr <https://github.com/comntr>
  - Coral Project <https://github.com/coralproject/talk>
  - Github comments <http://donw.io/post/github-comments/>
  - Glosa <https://github.com/glosa>
  - Hypercomments <https://www.hypercomments.com/>
  - Mastadon <https://carlschwan.eu/2020/12/29/adding-comments-to-your-static-blog-with-mastodon/>
  - Netlify forms <https://bsdnerds.org/comments-static-site/>
  - Remarkbox <https://www.remarkbox.com/>
  - ReplyBox <https://getreplybox.com/>
  - Social media <https://brid.gy/>
  - Staticman <https://github.com/eduardoboucas/staticman>
  - Webmention <https://webmention.io/>
    - more detail <https://news.ycombinator.com/item?id=25571253>
  - utterances <https://github.com/utterance/utterances>
