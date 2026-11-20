# Notification configuration design

Status: approved design from [#239](https://github.com/rendall/simple-comment/issues/239), updated by [#242](https://github.com/rendall/simple-comment/issues/242) to separate build-time validation from runtime reading. Deployment verification remains tracked in [#249](https://github.com/rendall/simple-comment/issues/249).

For setup instructions, see the [notification guide](../NOTIFICATIONS.md). This document explains the choices behind those instructions and gives contributors a reference for implementation.

## Goal

Make Resend the recommended provider for new moderator email setups, keep SendGrid available, and allow provider changes through configuration without changing comment-handling code.

## Intent

Notifications stay off until someone configures them. When someone does configure them, we assume receiving them matters: incomplete or conflicting settings should stop deployment with a useful error. Existing SendGrid users must keep using SendGrid until they deliberately switch.

## In Scope

- Environment-variable names, provider selection, and disabling notifications.
- Sender and moderator-recipient formats, including shared email validation.
- Compatibility with the old SendGrid API-key name.
- The boundary between configuration validation, provider construction, and delivery.
- Validation in local CI and deployment checks, and reading settings during function initialization.
- Examples, acceptance criteria, and validation expectations for these decisions.

## Out of Scope

Provider transports, the implementation of CI/deployment checks, notification message content, edit notifications, direct comment links, moderation tools, automatic retries, and automatic provider failover have their own work. This design does not change the public comment API or authorize implementation of those tasks.

## Settings and defaults

| Setting                                  | Purpose                                                              |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `RESEND_API_KEY`                         | Resend API key                                                       |
| `RESEND_FROM`                            | One Resend sender address, optionally with a display name            |
| `SENDGRID_API_KEY`                       | SendGrid API key                                                     |
| `SENDGRID_VERIFIED_SENDER`               | One SendGrid verified-sender address, optionally with a display name |
| `SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL` | One or more comma-separated plain moderator addresses                |

Use each provider's terminology for its settings. Keep the moderator-recipient setting shared. A future provider can use a different credential name if its service calls the credential something other than an API key.

“Resend by default” means Resend appears first in the template and setup documentation. Provider examples in `example.env` stay commented out, so copying the template does not enable notifications. Keep the SendGrid example, including `SENDGRID_VERIFIED_SENDER`.

There is no provider selector, enable switch, or provider precedence. The presence of provider-specific settings determines whether a provider is configured. Resend does not override SendGrid.

`SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL` remains required by the backend even when notifications are off. Its presence alone does not enable notifications. Recipients come from this setting, rather than a search for administrator accounts.

## Provider selection and disabling

An absent setting is unconfigured. A defined but empty or whitespace-only provider setting is an error. Supplying either a provider's key or its sender counts as configuring that provider, even if the other setting is missing.

Check the settings for every supported provider. A complete setup must not hide an incomplete setup for another provider. More than one configured provider is an error; do not send through both, choose one by precedence, or fall back automatically.

The following table assumes the other required backend settings are present. “Complete and valid” includes valid moderator recipients.

| Resend settings      | SendGrid settings    | Outcome             |
| -------------------- | -------------------- | ------------------- |
| Absent               | Absent               | Notifications off   |
| Complete and valid   | Absent               | Use Resend          |
| Absent               | Complete and valid   | Use SendGrid        |
| Partial or malformed | Absent               | Configuration error |
| Absent               | Partial or malformed | Configuration error |
| Complete and valid   | Complete and valid   | Configuration error |
| Complete and valid   | Partial or malformed | Configuration error |
| Partial or malformed | Complete and valid   | Configuration error |
| Partial or malformed | Partial or malformed | Configuration error |

To disable notifications, remove all provider-specific settings. Locally, commenting out those lines in `.env` also works. Removing only an API key while leaving its sender is an incomplete configuration. Keep the required moderator contact setting.

## Address and credential validation

Use the shared `validateEmail()` helper for mailbox validation. The agreed implementation delegates to `validator/lib/isEmail`, with `allow_utf8_local_part: false`, while preserving the helper's result shape and messages. Do not introduce a separate notification-only email validator.

Keep display-name parsing separate from mailbox validation. For either provider, accept one plain sender, or one nonempty display name followed by a mailbox in matching angle brackets:

```dotenv
RESEND_FROM=notifications@example.com
# Alternatively:
RESEND_FROM="Simple Comment <notifications@example.com>"
```

Display names may contain commas, as in `Doe, Jane <notifications@example.com>` or `"Doe, Jane" <notifications@example.com>`. Trim surrounding whitespace from the name and mailbox for validation, including whitespace after the closing bracket. The display-name wrapper must be well formed, and the enclosed mailbox must pass the shared helper. Reject multiple senders, missing brackets, empty names or mailboxes, and line breaks. These single-sender formats apply to both `RESEND_FROM` and `SENDGRID_VERIFIED_SENDER`; pass the original setting through unchanged.

Maintainer clarification (2026-11-19): existing SendGrid display-name senders must continue to work with both the current and legacy API-key names. Requiring users to remove their display names would be a compatibility bug. This supersedes the earlier plain-only SendGrid restriction.

For moderator recipients, split on commas, trim surrounding whitespace, and ignore empty entries. At least one valid address must remain when notifications are enabled. Reject the entire list if any remaining entry is malformed; do not silently discard an invalid address. Reject display names, angle brackets, and line breaks in the recipient list. These notification-specific recipient checks do not add a new address-format requirement when notifications are off.

Examples such as `.alice@example.com`, `alice@example..com`, and `alice@-example.com` must fail for plain senders, mailboxes inside display names, and moderator recipients, including mixed valid/invalid lists. Valid examples include `first.last+moderation@sub.example.com`.

API keys are opaque, nonblank strings. Do not guess whether a key works from its prefix. Local validation does not contact providers, check DNS, prove that a mailbox exists, or verify sender authorization. Those checks cannot guarantee delivery.

## Examples

New Resend setup, with all SendGrid settings absent:

```dotenv
RESEND_API_KEY=your-resend-api-key
RESEND_FROM="Simple Comment <notifications@example.com>"
SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL=alice@example.com,bob@example.com
```

SendGrid setup, with all Resend settings absent:

```dotenv
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_VERIFIED_SENDER=notifications@example.com
SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL=alice@example.com,bob@example.com
```

For notifications off, leave every provider-specific setting absent and retain the moderator contact and other required backend settings.

Invalid examples include a key without its sender, a sender without its key, an empty provider setting, a malformed recipient, or settings for both providers. These are errors even if one provider would otherwise be usable.

## Existing SendGrid installations

This section is for maintainers. Keep the old key name out of user-facing setup documentation, configuration reference tables, and `example.env`.

We are deprecating `NOTIFICATION_SERVICE_API_KEY` because its generic name becomes confusing when more than one notification service is supported: it does not say which provider the credential belongs to. Providers may also call their credentials something else, such as a “secret,” or require additional settings. Provider-specific names let us match the terminology and requirements in each provider's own setup instructions. Both SendGrid and Resend use “API key,” so we use `SENDGRID_API_KEY` and `RESEND_API_KEY`.

Continue accepting `NOTIFICATION_SERVICE_API_KEY` as a SendGrid-only alias for `SENDGRID_API_KEY`. Either name requires `SENDGRID_VERIFIED_SENDER`. The old key must never select Resend or supply its credential.

- Old name alone, with an otherwise valid SendGrid setup: use SendGrid and return a deprecation warning for CI to display. Do not fail solely because the old name is used.
- Both names defined: fail, even if the values match or either is blank. Explicitly tell the operator to remove `NOTIFICATION_SERVICE_API_KEY` and keep `SENDGRID_API_KEY`.
- Partial legacy settings or legacy settings alongside Resend: apply the same incomplete/conflicting-provider rules as other configurations.

Do not print runtime deprecation notices. No removal date has been agreed for the alias. Returning a warning lets CI display it without making the shared validator log anything.

## Configuration and provider construction

Providers live on the server, with supported implementations included in the backend bundle. Select and initialize a provider once when the Netlify Function initializes.

Keep the existing `AbstractNotificationService` and optional injection into `MongodbService`. Reading settings and validating them are separate jobs:

- `readNotificationConfiguration(source)` reads the selected provider, its credentials and sender, and the parsed moderator recipients. It returns `NotificationConfiguration | undefined`; `undefined` means notifications are off. It assumes the settings have passed the build check and does not run configuration or email validation.
- `getNotificationConfiguration(source)` is the build-time validator. It uses the same reading code, checks the configuration rules above, and returns validated settings and any warnings. Invalid configurations throw an actionable `EnvContractError`.

Both use only the supplied environment. They share provider definitions, legacy-key handling, and recipient parsing. Neither mutates the environment, logs, constructs providers, or makes network requests.

A small `getNotificationService()` resolver calls `readNotificationConfiguration()` and constructs the selected implementation. It returns `AbstractNotificationService | undefined`; we do not need a no-op provider. The comment endpoint imports this provider-neutral entry point, so choosing a provider does not belong in comment-handling code. Function initialization and warm requests do not call the build-time validator or revalidate notification email addresses.

Each provider's constructor receives credentials, sender, and recipients that were checked before deployment, replacing its static `createNotificationService()` factory. Keep the transport injectable for tests. A future provider needs an adapter and configuration/resolver support, without changes to comment-handling logic. No plugin framework is needed.

## Configuration errors and delivery failures

Run notification configuration validation before publication, using the ordinary Jest test behind `yarn test:environment`. Local and GitHub CI include it in `yarn test`; Netlify runs `yarn test:environment && yarn build`. The check runs once in each of those validation paths. It is not a `prebuild` hook, and `yarn build` alone does not run it. Do not repeat notification configuration or sender-format validation during function startup or requests.

The test checks the actual `process.env`, loading an optional local `.env` without overriding existing environment values. Keep it separate from backend fixture setup so `example.env` defaults cannot hide missing settings. It does not need a database, construct a provider, or send email.

CI can inspect only settings supplied to it. A successful GitHub check or local `.env` check does not prove that Netlify's deployment settings are correct. For each deployment context, supply identical notification settings to both Netlify **Builds** and **Functions**. The runtime reader trusts the build check; it does not check again for differences between those scopes. [#242](https://github.com/rendall/simple-comment/issues/242) tracks this validation boundary and [#249](https://github.com/rendall/simple-comment/issues/249) tracks deployment verification.

Errors and warnings name providers and variable names and explain how to fix the problem. For a single invalid sender mailbox, use the shared `validateEmail()` explanation, including that rejected email address, in the build error. Keep API keys, address lists, and environment/configuration objects out of diagnostics. A sender containing an API-key value or a list gets a generic error instead. These notification validation errors must not be generated during function initialization or exposed in visitor response bodies. The shared helper's result and ordinary visitor-email validation remain unchanged.

For example:

> Multiple notification providers are configured: Resend and SendGrid. Configure only one provider.

> RESEND_FROM: '.sender@example.com' is not a valid email address.

Configuration errors are different from delivery failures. Save the comment before attempting notification delivery. Provider rejections, exceptions, and timeouts must preserve the successful save and its HTTP response. Retain the existing concurrent recipient attempts, five-second deadlines, and safe diagnostic boundary; configuration work must not change those behaviors.

## Switching providers

Prepare and verify the new account and sender first. Remove the old provider's settings, including a legacy key if present, and supply the new provider's settings before restarting locally or redeploying. Never reinterpret credentials or switch providers automatically.

Verify receipt at every moderator inbox. To roll back, remove the new provider's settings and restore the previous configuration. Provider acceptance alone is not proof of inbox delivery.

## Acceptance Criteria

The configuration design is complete when:

1. This document records the agreed settings, decision table, disabling rules, address formats, compatibility policy, and provider-construction boundary without leaving a configuration choice TBD.
2. The README, template, notification guide, and issue description agree with these decisions. User-facing setup documentation omits the legacy key name.
3. Every configuration state has a checkable provider, disabled, or error outcome, including partial second providers, blank values, mixed legacy/new keys, and malformed recipients.
4. Errors and warnings explain corrections using setting names. Build errors can identify a rejected sender mailbox, while API keys, address lists, and full settings remain private. Legacy warnings are reserved for the configuration check.
5. Deployment wiring and provider implementation remain assigned to their existing issues, with no implication that documenting the design completes them.
6. Maintainer review confirms the intent, scope, acceptance criteria, and explicit follow-ups. Once approved and merged into the integration branch, close #239 as design completed.

## Validation Strategy

- **Configuration unit tests:** Use synthetic environments to cover every decision-table row, missing/blank settings, accepted and rejected address formats, mixed valid/invalid recipients, both SendGrid key names, and legacy warnings. Sender diagnostics include the shared explanation and rejected mailbox, with guards against exposing API keys pasted into the sender. Pass means the expected configuration or safe error is returned without logging, mutation, provider construction, or network requests. The required backend contact remains checked when notifications are off.
- **Shared email tests:** Verify ordinary valid addresses and the malformed-address regressions through `validateEmail()`, preserving its result shape and messages. Cover mailbox validation in both plain and Resend display-name contexts. The validator.js follow-up already contains these regression tests.
- **Provider and endpoint integration:** Exercise both providers and disabled operation with stubbed transports. Pass means correct construction, no calls to notification configuration or email validation during startup or warm requests, no sending client when disabled, persistence before sending, and unchanged successful comment responses after delivery failures.
- **CI and deployment:** In #242, demonstrate that the actual-environment Jest check rejects invalid settings, valid/off configurations pass, and invalid Netlify settings stop publication. Verify matching Builds and Functions settings for each deployment context. Sender errors can identify the rejected mailbox; keys, address lists, and complete settings stay out of output. The legacy-only case warns; both key names fail with the agreed corrective message.
- **Documentation review:** Compare every example and outcome with the decision table and tests. This documentation-only change requires link, formatting, and consistency checks; it does not require sending email or rerunning the application test suite.
- **Deployment smoke:** [#249](https://github.com/rendall/simple-comment/issues/249) owns actual inbox receipt, SendGrid compatibility, disabled behavior, and final documentation consistency. Record non-sensitive evidence for every moderator recipient.

## Follow-ups and implementation status

No high-level configuration decision remains open. Precise mailbox validation is settled by the shared validator.js choice; it is no longer deferred to a future design discussion.

At drafting time (2026-11-14):

- [#243](https://github.com/rendall/simple-comment/issues/243): shared configuration reader merged into the integration branch through PR #253. The validator.js follow-up is pushed as commit `bc6e199` on `use-email-validator` and still needs its own PR and merge.
- [#244](https://github.com/rendall/simple-comment/issues/244), [#245](https://github.com/rendall/simple-comment/issues/245), and [#246](https://github.com/rendall/simple-comment/issues/246): delivered explicit SendGrid construction, the official Resend SDK adapter, and provider-neutral endpoint wiring.
- [#242](https://github.com/rendall/simple-comment/issues/242): validation of the intended deployment environment, checks that block publication, and the build-time/runtime reading boundary described above.
- [#249](https://github.com/rendall/simple-comment/issues/249): deployed behavior and inbox verification.

Implementation requires its approved checklist under the [repository conventions](../norms/checklist.md). Approval of this design does not by itself approve those implementation tasks.
