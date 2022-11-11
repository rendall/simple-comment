/*
 * Simple Comment demo
 *
 * This illustrates a prototypical user flow
 *
 * - Visitor visits page
 * - A request to `/verify` endpont returns a claim (status code 200  and login) or not (401)
 * - A request to `/topic/{id}` returns a topic (200) or not (404). A topic is a "root" comment, to which top-level comments are made
 *   - If 404, submit a POST (create) request
 *     - If the user has permissions OR policy allows, the topic is created
 *     - Typically, policy is allowed to be created by non-privs under specific situations
 *       - Designed so that admin does not have to create every topic
 *       - (Typically) Allowed only if the topic id is based on the URL and the Referer header is correct
 *     - If the create request is granted, continue:
 * - What is returned is a Discussion, which is a Topic (root comment) + all replies (child comments)
 *
 * If the user submits a comment and credentials do not exist:
 *   - Validate information client-side
 *   - Visit to `/gauth` acquires a guest credential
 *   - POST to /user with guest credential and user info creates a guest user
 *     - Validate information server-side
 *   - POST to /comment with guest credential
 *
 * This file relies on the apiClient library, which is a group of async functions that connect to the API
 *
 */

import { setup } from "./ui"

// setup("some-topic-id") will link this page to "some-topic-id"
setup()
