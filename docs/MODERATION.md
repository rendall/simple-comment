# Moderation installation and operations

Simple Comment checks new comments and edits in which the text changes. A link or a match in the optional private terms list holds the comment for review. Other comments publish immediately. Installations use link filtering even with an empty terms list.

## Set up owner access

1. Set `SIMPLE_COMMENT_MODERATOR_ID` and `SIMPLE_COMMENT_MODERATOR_PASSWORD` in the deployment configuration. Set `SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL` even if email notifications are disabled. Follow the [deployment setup instructions](../README.md#setup) for the rest of the deployment settings.
2. Open your site's `login.html` and sign in with the configured owner's credentials. Then open a discussion. On a held comment from another account, the owner can open the action menu to approve or remove it.
3. If you want email alerts, configure a provider and the recipient list using the [notification guide](NOTIFICATIONS.md). Emails for held submissions or edits include the text, hold reason, comment ID, and parent ID. Use those details to find the comment in its discussion. Treat the email as private because it can contain unpublished text.

## Upgrading an existing installation

The moderation release uses numerical account privileges. Stored values are 0 (ordinary user), 1 (moderator), and 2 (administrator). The configured owner has effective privilege 3, derived from the deployment configuration rather than stored in the database.

- Existing valid stored privileges are preserved. Ordinary accounts without a stored privilege default to 0; existing live comments without an approval flag are treated as published. Neither requires a migration.
- A legacy `isAdmin: true` flag alone no longer grants authority. A non-owner account with that flag and no stored privilege becomes an ordinary user. The configured owner retains full authority without a migration.
- Before upgrading, check the MongoDB `users` collection for non-owner accounts with `isAdmin: true` and no `privilege` field. If an affected account should retain access, the installation owner must explicitly assign stored privilege 1 for comment moderation or 2 for administration as well. There is no automatic migration or role-management interface in this release.
- Only the original author can edit a comment, including when a moderator or administrator is signed in. Account creation and update requests must not supply the read-only role properties `privilege`, `isModerator`, `isAdmin`, or `isOwner`; such requests are rejected.
- API integrations must account for successful comment edits returning HTTP 200 instead of 204, with the authoritative saved comment object including its publication state.

**Rollback warning:** Rolling back to a version predating moderation is not recommended. Older versions do not respect moderation holds and may expose hidden or unpublished comments.

## Configure the private terms list

Create a UTF-8 text file named `moderation-terms.txt`. Put one literal word or phrase on each line. Blank lines and lines starting with `#` are ignored. Matching is case-insensitive and can match inside a longer word. Start with the [harmless example](../moderation-terms.example.txt) for a test deployment.

### Local setup

Place the file in the project root and run `yarn run validate:moderation-terms`. Start or restart the local backend to load the updated list. Keep the real file out of Git, the public `dist/` directory, and build logs.

### Netlify setup and updates

These steps send the moderation terms file from your computer straight to Netlify so your live site can use it. The file stays out of GitHub, keeping the offensive words and phrases it may contain out of the repository and its history.

1. Validate the local file with `yarn run validate:moderation-terms`. For a verification deployment, use an isolated Netlify project and database with a harmless fixture.
2. Sign in to Netlify CLI and link your checkout to the intended project. Confirm the project before uploading. A site-wide Blob is available to all deploy contexts of that project.
3. Upload the file to the `moderation` store:

   ```sh
   netlify blobs:set moderation moderation-terms.txt --input ./moderation-terms.txt
   ```

4. In Netlify, set `SIMPLE_COMMENT_FETCH_MODERATION_TERMS=true` and set `SIMPLE_COMMENT_MODERATION_BLOBS_TOKEN` to a Netlify personal access token with access to this site. Scope both variables to Builds in the trusted deploy contexts where the list should apply. Netlify supplies the build's `SITE_ID`.
5. Trigger a Netlify deploy. When enabled, the build reads the Blob before validation. If the key exists, the build writes it to the project root and Netlify bundles it with the comment function via `included_files`. If the key is missing, the build removes any local copy and continues. A failed read stops the build. With fetching disabled, the build leaves any local list in place.
6. To update the list, validate and upload the replacement to the same store and key, then deploy again. To disable term holds, upload an empty list and deploy again. The site-wide Blob persists across deploys, including clean rebuilds of the functions directory.

Linking this checkout to a Netlify project can cause `yarn start` to fail with `Unauthorized` when the local backend contacts Netlify. Follow the cleanup steps below after uploading the terms if you use this checkout for local development.

#### Return to local development

After uploading, open a terminal in the project folder and run these steps in order.

1. Clear any project ID set in this terminal, then unlink this checkout. Your CLI login stays available for other projects.

   ```sh
   unset NETLIFY_SITE_ID
   yarn netlify unlink
   ```

   If `unlink` returns `Unauthorized`, open `.netlify/state.json` in your editor, delete the `siteId` entry, and save the file. If `siteId` is the only entry, replace the file contents with `{}`.

2. If you also want to sign out of the Netlify CLI, clear any token set in this terminal and run the logout command. The command is hidden from the CLI's top-level help.

   ```sh
   unset NETLIFY_AUTH_TOKEN
   yarn netlify logout
   ```

3. Start local development again in the same terminal.

   ```sh
   yarn start
   ```

A missing or empty list leaves link filtering active. An unreadable or invalid file supplied to the build fails validation. If a packaged file is unreadable or invalid at runtime, the function logs a generic configuration error and continues filtering links. See [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/#getstore) and the [CLI reference](https://cli.netlify.com/commands/blobs/).

## Hide, review, and remove comments

- **Hide a published comment.** As the owner or a moderator, open the comment's action menu, select **Hide**, enter a reason, and select **Hide comment**. The discussion preserves the comment's place and its visible replies. Readers can reply to eligible descendants while the hidden comment itself blocks new direct replies.
- **Review a hold.** The author and moderators can see the text and reason. Other readers see **Hidden pending moderation** on a manually hidden comment, even when it has no replies. An automatically held comment appears as a placeholder when a visible descendant needs it to preserve the thread.
- **Approve.** Open the action menu and select **Approve** after reviewing the text. If the text changes before approval, review the current version. Authors can edit their own held comments. Edits can release an automatic hold, and a manual hold persists through edits until a moderator approves the current text. Moderator submissions bypass automatic holds. Moderators can edit their own comments.
- **Remove.** Open the action menu, select **Delete**, and enter a reason when removing someone else's comment. The original text is removed. The reason is visible to the author and moderators. Visible replies stay in the discussion under a placeholder. New direct replies to a held or removed comment are unavailable.

## Verify a deployment

Use an ordinary author account, a second ordinary account, and the owner account on the isolated deployment. Record observed results using harmless fixture text.

| Check                                                                                 | Expected result                                                                                                               |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Post plain text, a link, and a fixture term as the author.                            | Plain text publishes. The link and term submissions are held with their respective reasons.                                   |
| Open the discussion as the second ordinary user and while signed out.                 | Published text is visible. Held text, hold reasons, and moderation controls for another author's comments are absent.         |
| Sign in as the owner and approve the link comment.                                    | The owner can review both holds. The approved link becomes visible to an ordinary reader.                                     |
| Edit the term comment as its author to remove all hold triggers.                      | The edited comment publishes and the hold reason clears.                                                                      |
| Hide the published plain-text comment as the owner.                                  | An unrelated reader sees the public placeholder. The author and owner see the held text and reason.                             |
| Revise the hidden comment as its author, then approve the current text as the owner.  | The edit preserves the manual hold and reason. Approval publishes the revised text and clears the reason.                        |
| Reply to the published link as an ordinary user, then remove the parent as the owner. | A reason is required. The reply remains visible. An unrelated reader sees the deleted placeholder without the private reason. |
| Log out after viewing held content as the owner.                                      | The discussion refreshes and private content and moderation controls disappear.                                               |
| Inspect published assets and request `/moderation-terms.txt`.                         | The terms file and fixture phrase are absent from public assets and client bundles. The URL does not serve the file.          |

For API integrations, see the [OpenAPI contract](../src/schema/simple-comment-openapi3.json). A successful create returns `201`, and a successful edit returns `200`. Both return the saved comment with its publication status so clients can display a hold immediately.

### Sources for moderation terms

Simple Comment does not distribute a default list of objectionable terms. Installation owners determine which words and phrases warrant moderation according to the language, audience, and policies of their community.

Several publicly available datasets can serve as starting points:

| Project | Contents | License |
| --- | --- | --- |
| [List of Dirty, Naughty, Obscene, and Otherwise Bad Words](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words) | Shutterstock's multilingual list, including Finnish. | CC BY 4.0 |
| [cuss](https://github.com/words/cuss) | English terms rated by likelihood of offensive usage. | MIT |
| [profanity-list](https://github.com/dsojevic/profanity-list) | Categorized terms with severity ratings, spelling variants, and exceptions. | MIT |
| [profanities](https://github.com/words/profanities) | Flat lists of offensive terms, also available as an npm package. | MIT |
| [wordfilter](https://github.com/dariusk/wordfilter) | A curated list emphasizing discriminatory and derogatory language rather than ordinary profanity. | MIT |
| [LDNOOBW V2](https://github.com/LDNOOBWV2/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words_V2) | An expanded multilingual collection of offensive terms. | Check individual source licenses. |

The [IFTAS Reserved Words Resources](https://about.iftas.org/library/reserved-words-resources/) collection provides additional moderation datasets and research, including resources from Bluesky and Ofcom.

#### Selecting terms

The `cuss` and `profanity-list` projects are particularly useful for constructing a selective moderation list. They distinguish between two different considerations: how likely a term is to be offensive in ordinary usage, and how offensive it is when used in that sense.

Consider the following when preparing your list:

- Remember that Simple Comment uses case-insensitive substring matching. Short terms may unintentionally match parts of otherwise harmless words.
  - q.v. the [Scunthorpe Proplem](https://en.wikipedia.org/wiki/Scunthorpe_problem)
- Convert selected entries to the plain-text format described above. Simple Comment does not interpret severity ratings, categories, exceptions, or regular expressions.

A term match holds a comment for human review; it does not automatically reject or remove the comment. The list is a moderation aid, not a substitute for moderator judgment.

We recommend keeping the resulting terms file private and out of version control, regardless of whether its source datasets are publicly available.
