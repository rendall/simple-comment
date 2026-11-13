# Email notifications

Simple Comment can email your moderators when someone posts a new comment or reply, or edits an existing comment. This helps you keep up with conversations without checking every page of your website.

The notification email body includes the comment text and identifies its author. Edit notifications are clearly marked so moderators know an existing comment has changed. A failed or unchanged edit does not send a notification. Reading or deleting a comment does not send one either.

Notifications are optional. They stay off until you configure an email provider. We recommend Resend for new installations, and you can also use SendGrid.

_If you do configure notifications, we assume receiving them matters to you._ Therefore, deployment will halt if notification configuration is incomplete or misconfigured. Checks run before deployment (in CI) and when Netlify Functions start, with error messages explaining what to fix.

## Get started with Resend

You'll need a Resend account, a domain you control, and the email addresses of the moderators who should receive notifications.

### 1. Add your domain to Resend

Create a [Resend account](https://resend.com), then add the domain you want to send email from.

Resend will give you records to add to your domain's DNS settings. These are the settings, usually managed by your domain or website host, that connect your domain to email and other services. Follow Resend's instructions and wait until the domain is verified.

For example, to send from `notifications@example.com`, verify `example.com`. See [Resend's domain setup guide](https://resend.com/docs/dashboard/domains/introduction).

### 2. Create an API key

An API key lets Simple Comment send email through your Resend account. Keep it private, like a password.

Create a key in Resend's **API Keys** area with permission to send email from your chosen domain. See [Resend's API key guide](https://resend.com/docs/dashboard/api-keys/introduction).

### 3. Add your notification settings

For local development, add these settings to your existing `.env` file in the project's main directory. Replace the example values with your own:

```dotenv
RESEND_API_KEY=your-resend-api-key
RESEND_FROM=notifications@example.com
SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL=moderator@example.com
```

`RESEND_FROM` is the address the notification comes **from**. Use an address belonging to the domain you verified in Resend.

You can optionally include a display name:

```dotenv
RESEND_FROM="Simple Comment <notifications@example.com>"
```

Both formats are supported by [Resend's sending API](https://resend.com/docs/api-reference/emails/send-email). Use only one sender address.

`SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL` is where notifications go **to**. For several moderators, separate their addresses with commas:

```dotenv
SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL=alice@example.com,bob@example.com
```

Use plain addresses for moderators, without display names or angle brackets. Spaces around addresses are fine.

Keep your API key out of frontend scripts, public files, and Git commits. Restart the local backend after changing `.env`.

### 4. Configure your deployed site

Your local `.env` file does not configure your deployed Netlify Functions.

In your Netlify project's environment-variable settings, add the same variable names and their values. Make sure they are available to Functions and apply to the deployment you want to configure.

Enter each name and value separately. For a display name, the value of `RESEND_FROM` would be:

```text
Simple Comment <notifications@example.com>
```

The surrounding quotes used in `.env` are not needed in Netlify's value field. Put these settings in Netlify's environment-variable settings, not in `netlify.toml`.

Create a new deployment after changing the settings. See [Netlify's environment-variable guide for Functions](https://docs.netlify.com/build/functions/environment-variables/).

Configure only one email provider at a time. If you previously used SendGrid, follow the [switching instructions](#switch-providers) below.

### 5. Check that it works

Post a new comment on your site, then check that:

1. The comment appears successfully.
2. Each configured moderator receives an email.
3. The notification contains the comment text and author information.

Edit the comment and check that another notification arrives, clearly marked as an edit.

Check spam folders too. A successfully saved comment, or a provider accepting an email, does not by itself confirm that the email arrived.

### A note about the free plan

Resend currently allows 100 emails per day and 3,000 per month on its free transactional plan. Each recipient counts separately: a notification sent to three moderators uses three emails. Edit notifications also use your allowance.

Other applications using the same account may consume its allowance too. Check [Resend's current limits](https://resend.com/docs/knowledge-base/account-quotas-and-limits) when planning for your site.

## Use SendGrid instead

> Note that only one notification provider can be enabled at a time. A CI build error results if more than one provider is enabled. Choose _either_ Resend _or_ SendGrid, but not both.

You can use SendGrid by configuring its API key and verified sender:

```dotenv
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_VERIFIED_SENDER=notifications@example.com
SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL=moderator@example.com
```

Create a key with permission to use **Mail Send**, and complete SendGrid's sender verification. Its guides explain [API keys](https://www.twilio.com/docs/sendgrid/ui/account-and-settings/api-keys) and [sender identity](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sender-identity).

Add these settings locally or in Netlify as described above, then restart or redeploy and check that a notification arrives. Leave the Resend settings unset.

## Turn notifications off

Remove all provider-specific settings from the environment where Simple Comment runs.

For Resend, remove both:

```text
RESEND_API_KEY
RESEND_FROM
```

For SendGrid, remove both:

```text
SENDGRID_API_KEY
SENDGRID_VERIFIED_SENDER
```

In a local `.env` file, you can also disable a line by putting `#` at its beginning:

```dotenv
# RESEND_API_KEY=...
# RESEND_FROM=notifications@example.com
```

In Netlify, delete the settings and redeploy. For local changes, restart the backend.

**Remove the settings completely; do not leave them with empty values.** Leaving only part of a provider's configuration is treated as a mistake. For example, removing an API key but leaving its sender setting will produce an error.

Keep `SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL`. Simple Comment still requires that contact setting when notifications are off. It does not enable notifications by itself.

## Switch providers

Prepare your account and sender with the new provider first.

Then remove the old provider's settings and add the new provider's settings before restarting or redeploying. Keep the moderator recipient setting unless you also want to change who receives emails.

After the change, post a comment and check every moderator's inbox.

To switch back, remove the new provider's settings and restore the previous configuration. Simple Comment does not automatically switch providers when delivery fails.

## Troubleshooting

### Simple Comment reports a configuration error

> Either _no_ notification provider, or only _one properly configured_ provider, must be configured at a time. Deployment will break if more than one provider is configured or if any provider is configured improperly.

Check that:

- Only one provider is configured.
  - You have not supplied both SendGrid and Resend API-keys.
  - If Resend is the provider, SendGrid environmental variables are not defined.
- Both the API key and sender setting are present for that provider.
- No provider setting is empty or contains only spaces.
- Sender and recipient addresses use the formats described above.
- There are no leftover settings from another provider, even if that provider's setup is incomplete.

> Incomplete or conflicting settings stop the comment function from starting. The error names the settings to fix without printing their values.

### Comments work, but emails do not arrive

Check the recipient addresses and spam folders first. Then check your provider's email activity and your Netlify Function logs.

Common causes include an invalid API key, an unverified sender or domain, account restrictions, and sending limits. A setting can have the right format even when the provider will not accept it.

Simple Comment saves the comment or edit before attempting notification delivery. An email failure does not remove the comment or turn a successful save into an error.

There is no automatic retry queue, so a missed notification is not automatically sent again.

### Can notification emails link directly to a comment?

Not yet. Direct comment links need a reliable connection between each discussion and its public page URL. That work is tracked in [#240](https://github.com/rendall/simple-comment/issues/240).

For now, open the relevant page on your website to find the comment. A logged-in administrator can use the existing delete control there. Receiving notification emails does not itself grant administrator access.

## Configuration reference

| Setting                                  | Purpose                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL` | One or more comma-separated plain moderator addresses; required even with notifications off |
| `RESEND_API_KEY`                         | Resend API key                                                                              |
| `RESEND_FROM`                            | One Resend sender address, optionally with a display name                                   |
| `SENDGRID_API_KEY`                       | SendGrid API key                                                                            |
| `SENDGRID_VERIFIED_SENDER`               | SendGrid's verified sender address                                                          |

Provider settings determine whether notifications are enabled:

| Configuration                               | Result              |
| ------------------------------------------- | ------------------- |
| No provider settings                        | Notifications off   |
| One provider completely configured          | Notifications on    |
| Any provider partly configured or malformed | Configuration error |
| More than one provider configured           | Configuration error |

Missing settings are treated as unconfigured. Defined but empty or whitespace-only provider settings are errors. A complete setup for one provider does not hide an incomplete setup for another.

Moderator addresses are split on commas, surrounding whitespace is trimmed, and empty list entries are ignored. At least one valid recipient must remain when notifications are enabled. Recipients come from this setting, not from a search for administrator accounts.

Resend appears first in the template and setup guide. Simple Comment does not automatically choose it when settings are missing or conflicting. There is no separate provider-selection or notification-enable setting.

## How it works

This section is for contributors who want to understand the design.

### Choosing a provider

Email delivery happens on the server through Netlify Functions. Provider credentials stay there. The supported provider code is included in the backend bundle; choosing a provider does not require a different build.

A small provider resolver reads and checks the environment settings when the function starts. It constructs the configured provider, or returns `undefined` when notifications are off. Each provider's constructor initializes its own service from the validated configuration. The provider's email transport can be supplied separately for testing.

Providers implement the existing `AbstractNotificationService` interface. `MongodbService` receives the optional provider instance, so comment-handling code does not need to choose a provider or know its SDK.

### Saving comments and sending emails

The comment service saves a new comment or an edit before calling `notifyModerators`. Rejected submissions, failed saves, and edits that leave the text unchanged do not send notifications.

Recipient sends run concurrently. The request waits for every recipient's send to finish or reach its five-second deadline. One recipient's failure does not stop attempts to the others. The provider reports success only when every send is accepted, and partial failures include accepted and failed counts.

Delivery failures leave the successful comment response intact. A new comment keeps its `201` response, and an edit keeps its successful update response. A timeout ends the wait; it does not guarantee that the provider has stopped processing the email. An email may still arrive afterward.

Notification results distinguish general provider failures, account or sender restrictions, exhausted allowances, unavailability, timeouts, and internal errors. Providers interpret their own response formats. Mixed failure summaries are consistent regardless of which recipient's send finishes first. Notification error statuses are internal results; they do not replace the response for a successfully saved comment.

### Checking configuration and keeping logs safe

The same configuration validator runs in CI and when Netlify Functions initialize. CI checks its own environment; Netlify checks the settings actually deployed. Tests cover valid and invalid combinations with synthetic settings, without needing real email credentials.

These checks validate the settings locally. They do not make provider requests to verify that an API key works or a sender is authorized. Those problems are handled as delivery failures.

Configuration errors name providers and relevant variable names and explain how to fix the problem. They never print the values or the environment object.

Delivery diagnostics can include the comment ID, notification status, and safe guidance about an account or sending problem. Credentials and raw provider errors stay out of logs and responses. Internal provider messages must not be assumed safe to log.
