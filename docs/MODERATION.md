# Moderation installation and operations

Simple Comment checks new comments and edits in which the text changes. A link or a match in the optional private terms list holds the comment for review. Other comments publish immediately. Installations use link filtering even with an empty terms list.

## Set up owner access

1. Set `SIMPLE_COMMENT_MODERATOR_ID` and `SIMPLE_COMMENT_MODERATOR_PASSWORD` in the deployment configuration. Set `SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL` even if email notifications are disabled. Follow the [deployment setup instructions](../README.md#setup) for the rest of the deployment settings.
2. Open your site's `login.html` and sign in with the configured owner's credentials. Then open a discussion. On a held comment from another account, the owner can open the action menu to approve or remove it.
3. If you want email alerts, configure a provider and the recipient list using the [notification guide](NOTIFICATIONS.md). Emails for held submissions or edits include the text, hold reason, comment ID, and parent ID. Use those details to find the comment in its discussion. Treat the email as private because it can contain unpublished text.

## Configure the private terms list

Create a UTF-8 text file named `moderation-terms.txt`. Put one literal word or phrase on each line. Blank lines and lines starting with `#` are ignored. Matching is case-insensitive and can match inside a longer word. Start with the [harmless example](../moderation-terms.example.txt) for a test deployment.

### Local setup

Place the file in the project root and run `yarn run validate:moderation-terms`. Start or restart the local backend to load the updated list. Keep the real file out of Git, the public `dist/` directory, and build logs.

### Netlify setup and updates

1. Validate the local file with `yarn run validate:moderation-terms`. For a verification deployment, use an isolated Netlify project and database with a harmless fixture.
2. Sign in to Netlify CLI and link your checkout to the intended project. Confirm the project before uploading. A site-wide Blob is available to all deploy contexts of that project.
3. Upload the file to the `moderation` store:

   ```sh
   netlify blobs:set moderation moderation-terms.txt --input ./moderation-terms.txt
   ```

4. Trigger a Netlify deploy. The build reads the Blob before validation and writes the file to the project root. Netlify bundles it with the comment function via `included_files`. Each deploy uses the list bundled at build time.
5. To update the list, validate and upload the replacement to the same store and key, then deploy again. To disable term holds, upload an empty list and deploy again. The site-wide Blob persists across deploys, including clean rebuilds of the functions directory.

A missing or empty list leaves link filtering active. An unreadable or invalid file supplied to the build fails validation. If a packaged file is unreadable or invalid at runtime, the function logs a generic configuration error and continues filtering links. See [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/#getstore) and the [CLI reference](https://cli.netlify.com/commands/blobs/).

## Review and remove comments

- **Review a hold.** Open the discussion as the owner or a moderator. The held comment shows its text and the reason it was held. The recognized author can also see their own held text and reason. Other readers see a placeholder only when a visible reply needs it to preserve the thread.
- **Approve.** Open the action menu and select **Approve** after reviewing the text. If the text changes and still requires review, review the updated version before approving. Moderator submissions bypass automatic holds. Authors can edit their own comments, and an edit that clears all hold rules can publish the comment. Moderators cannot edit someone else's text.
- **Remove.** Open the action menu, select **Delete**, and enter a reason when removing someone else's comment. The original text is removed. The reason is visible to the author and moderators. Visible replies stay in the discussion under a placeholder. New direct replies to a held or removed comment are unavailable.

## Verify a deployment

Use an ordinary author account, a second ordinary account, and the owner account on the isolated deployment. Record observed results using harmless fixture text.

| Check                                                                                 | Expected result                                                                                                               |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Post plain text, a link, and a fixture term as the author.                            | Plain text publishes. The link and term submissions are held with their respective reasons.                                   |
| Open the discussion as the second ordinary user and while signed out.                 | Published text is visible. Held text, hold reasons, and moderation controls for another author's comments are absent.         |
| Sign in as the owner and approve the link comment.                                    | The owner can review both holds. The approved link becomes visible to an ordinary reader.                                     |
| Edit the term comment as its author to remove all hold triggers.                      | The edited comment publishes and the hold reason clears.                                                                      |
| Reply to the published link as an ordinary user, then remove the parent as the owner. | A reason is required. The reply remains visible. An unrelated reader sees the deleted placeholder without the private reason. |
| Log out after viewing held content as the owner.                                      | The discussion refreshes and private content and moderation controls disappear.                                               |
| Inspect published assets and request `/moderation-terms.txt`.                         | The terms file and fixture phrase are absent from public assets and client bundles. The URL does not serve the file.          |

For API integrations, see the [OpenAPI contract](../src/schema/simple-comment-openapi3.json). A successful create returns `201`, and a successful edit returns `200`. Both return the saved comment with its publication status so clients can display a hold immediately.
