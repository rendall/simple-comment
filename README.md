# Open Source Comments

A free, self-hosted comment system for any blog or website

## API

The API specification is described thoroughly in [simple-comment-api.json](src\schema\simple-comment-api.json) in Open API 3 format and is designed to be interchangeable with any backend, frontend and authentication system

### discussion

### user

### auth

### admin

## Default build

The default stack uses Netlify + MongoDB for the backend, and a minimal `fetch` based client for the frontend, but it can be readily adapted to use any technology stack, as long as the tests pass.
