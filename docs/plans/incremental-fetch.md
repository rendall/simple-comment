# Incremental discussion fetching

**Draft for review.**

[Incremental loading issue #230](https://github.com/rendall/simple-comment/issues/230) · [Incremental endpoint issue #282](https://github.com/rendall/simple-comment/issues/282) · [Comment sharing issue #240](https://github.com/rendall/simple-comment/issues/240)

## Goal

Reduce the time readers wait to see and reply to existing comments in a large discussion.

## Intent

Loading the entire discussion at once was a good first iteration for Simple Comment. The embed and top-level comment form already render while the request is pending. In larger discussions, downloading the full response and building the comment tree takes longer, so readers wait longer to see or reply to existing comments.

The goal is to reduce that wait. Simple Comment will show a useful first batch of comments, then load the rest in the background.

## In Scope

- Ordinary visits present the existing newest-first comment tree. The embed presents a useful first batch, then continues fetching batches in the background.
- Shared-comment visits fetch and present the linked comment first. The client loads nearby context before resuming ordinary background loading. The presentation of ancestry is an open UX decision.
- The incremental GET route and its continuation and refresh links. The initial load shares one server-issued timestamp cutoff and finishes with a refresh for intervening changes.
- A configurable byte limit with a one-comment minimum, whole comments in each response, and a single-comment exception for an oversized stored comment the server can deliver.
- Partial branch states and stable reading position as the discussion fills in. A reader opening a branch can prioritize its remaining replies.

## Out of Scope

- List view, search, filtering, alternate sort modes, personal reply prioritization, notifications for unread activity, and reader loading preferences.
- Persistent reading position, local comment caching, moderator and client budget overrides, and manual or periodic refresh after the initial synchronization.
- Changing comment IDs or retaining historical comment versions.
- Public URL scheme and moderator email links, edit-length enforcement, edit timestamps, soft deletion storage, and the manual invitation are tracked in their own issues. The incremental design specifies what it needs from those changes. [Issue #240](https://github.com/rendall/simple-comment/issues/240) · [Issue #278](https://github.com/rendall/simple-comment/issues/278) · [Issue #279](https://github.com/rendall/simple-comment/issues/279) · [Issue #280](https://github.com/rendall/simple-comment/issues/280) · [Issue #281](https://github.com/rendall/simple-comment/issues/281)

## Design context

Loading a discussion in pieces is straightforward enough. Deciding which pieces to load, and in what order, is harder.

Readers arrive with different intentions. Someone visiting for the first time may want to find the conversations attracting attention. Someone returning after a few days may care most about replies to their own comments. Someone following a shared link wants one particular comment, even if it's buried hundreds of replies deep. The same first batch won't serve all three equally well.

Comments also depend on one another for context. A reply may make little sense without its parent, and a conversation can branch in several directions. Loading comments individually risks presenting disconnected fragments. Loading entire threads avoids that problem, but a single busy branch could be larger than we're willing to fetch at once.

Readers should be able to explore a discussion without losing their place as it fills in. A new reply can arrive while older comments are still loading. If that changes which comments come back in later batches, readers can miss comments or see them move while they’re reading.

The problem isn't simply how to download fewer comments. It's how to get readers to the conversation they came for, show enough context to take part, and let them explore the rest without unnecessary waiting.

## Ways readers arrive

These are examples, not a promise to implement every behavior now. They help us avoid a design that rules out useful options later.

- **First visit.** Show an inviting starting point, perhaps the most active or most recently active threads.

- **Returning visit.** Show recently active threads; older ancestors might be collapsed so newer replies are easy to find.

- **Shared link.** Fetch the exact comment first, even in a very deep branch, then bring in enough ancestry and neighboring replies for context.

- **Replies to me.** Help a returning participant find new direct replies to their own comments, wherever those replies occur.

- **Resume reading.** Restore the reader's place and open branches if saved state is available.

- **Follow a branch.** Let someone keep up with one conversation without downloading all other activity.

- **Browse.** Show top-level comments or previews, then load branches as readers open them.

- **Small discussion.** Deliver everything in one response when it fits comfortably.

- **Notification.** Open a specific reply without marking other activity as read.

- **Search.** Find a comment anywhere in the discussion and navigate directly to it.

- **Changed discussion.** Preserve context when comments have been edited, deleted, or moderated.

- **Slow connection.** Keep already loaded comments usable if the next fetch is delayed or fails.

How readers _arrive_ and how they _choose to browse_ are different things. These scenarios should not become twelve separate loading strategies.

## Views and focus

**Tree view** is the main discussion interface. Comments appear under their parents. A branch can be collapsed to its root or expanded to show replies; some replies may not yet have been fetched.

**List view** presents selected comments without trying to show the whole tree. Search results are one possible use. Later, the same kind of list could show replies to me, recent activity, or moderator work.

**Focus** is a state, not necessarily a third view. A shared link, search result, or notification can focus a particular comment. The embed shows it promptly and lets the reader expand outward into its ancestry and the ordinary tree.

These names are a vocabulary for the design, not a commitment to ship search or multiple browsing modes in the first release. Comment selection, fetch order, and on-screen arrangement should remain separate decisions.

## Loading and presentation

We'll begin with **ordinary visits** and **shared links**.

For an ordinary visit, **keep the current tree order**: newest top-level comments first, with replies under their parents and newer siblings above older siblings. A new reply to an old branch does **not** move the root thread to the top. Fetch in that order until there is enough to display, then keep loading the rest in the background. The first iteration does not need to prioritize recently active old threads.

For a shared link, the requested stable comment ID wins over ordinary loading priorities. Show a loading state, then present and highlight the linked comment as soon as it arrives. Fetch some nearby context (such as parents, siblings, or children) ahead of unrelated material, and then resume ordinary background loading. The linked comment must remain usable without waiting for its entire ancestry. How that ancestry appears is a later UX decision: we might render placeholders for the entire parent chain, load the chain behind a collapsed component that can be expanded, combine those approaches, or find something better. The aim is to provide context without confusion or unexpected movement on screen.

The server must be able to retrieve a comment independently of its position in the current sort order. Ordinary batches can follow a stable cursor in that order, even after a shared-link or branch-expansion fetch jumps ahead. The server need not remember which individual comments that client has already received: some overlap is acceptable, and the client can merge comments by stable ID without showing duplicates. The exact cursor and merge behavior still need technical review, particularly when comments are added or deleted during loading. Future sorting and search must be able to continue within their own result orders.

A small discussion may fit in one response. We don't need progressive loading for its own sake.

### Incremental requests

The embed starts incremental loading with `GET /topic/{topicId}/increment`. The existing `GET /topic/{topicId}` serves the complete discussion. Both apply the current discussion read permissions. The exact request and response schemas for the incremental route remain open. [Incremental endpoint issue #282](https://github.com/rendall/simple-comment/issues/282)

When more initial comments are available, the server includes a `next` URL in the batch. The embed follows it when ready and repeats this for each batch with a `next` URL. Each continuation uses the timestamp cutoff from the first batch.

The last batch omits `next` and includes a `refresh` URL with the original timestamp cutoff. The embed follows that URL for the final synchronization. A discussion that fits in one batch uses the same final-batch behavior.

### Keeping batches consistent

If comments are added, edited, or deleted between fetches, the results can shift from one batch to the next. Without a consistent view of the discussion, a later batch can skip a comment or return one the reader already received.

The first fetch establishes a server-issued timestamp cutoff, `X`. Subsequent incremental fetches include only comments **created at or before `X`**. The client retains that cutoff throughout the initial load, so newly created comments do not shift later batches.

The cutoff defines **which comments belong to the initial load**, not what those comments looked like at that moment. If an existing comment is edited or deleted after `X` but before its batch is fetched, the server can return its **current** edited or deleted state. We do not need to reconstruct historical versions. Once the last initial batch arrives, the client performs a final synchronization for changes since `X`. The precise handling of writes that overlap the cutoff and synchronization windows needs technical review.

### Loading and expanding branches

Background loading continues through the discussion in batches, rather than stopping permanently after the first screenful. Expanding a branch uses already downloaded comments immediately. If some of that branch is still missing, its fetch moves to the front of the queue; when that request completes, background loading resumes. Fetch order is not the same as tree display order.

### Sorting strategies

For the first iteration, keep the current default: **newest first at every level of the tree**, with replies remaining beneath their parents. A new reply does not move its root thread to the top.

Later, readers could switch freely between this default and other sorting strategies, including **oldest first** throughout the tree and **most recently active threads first**, which would order root threads by the newest reply anywhere among their descendants. These are future options, not part of the first implementation. Sorting should remain independent of comment IDs and fetch priority.

## What a partly loaded tree needs to say

A collapsed branch and an unloaded branch are not the same thing. Readers should know when more replies exist without having to fetch them, and a displayed handful of replies shouldn't misleadingly imply those are all the replies.

A promising piece of metadata, not yet a settled requirement, is each comment's **direct-child count**: the number of immediate replies visible to the current reader. With twelve direct children and five loaded, the interface can say “Show 7 more replies.” The count changes as replies appear or are deleted; it is not part of the permanent ID. Counts must honor read permissions. When a refresh brings in a new reply or a deletion, the client can update the counts it already knows, rather than requiring a separate count refresh merely to confirm the change. We still need to decide how the client learns counts for branches it has not loaded.

**Soft deletion applies to all comments.** The storage change is tracked separately. [Soft deletion issue #280](https://github.com/rendall/simple-comment/issues/280)

In the first iteration, deleting a comment permanently removes its text and author information, including the link to the author's account, from the stored comment. Keep a minimal record with the comment ID, parent ID, and deletion time. This applies even to a comment with no replies, so a refresh can tell a browser that already displayed it to remove it. The frontend can omit a deleted comment with no surviving replies and show a placeholder when surviving replies need their parent for context.

For the storage change in #280, start with failing tests for deleting a comment with replies and one without. Inspect the stored records directly to verify that the text and author information are gone and the structural record remains.

A later iteration will let administrators choose whether deletion permanently erases the content and author information or retains them in storage while hiding them from readers. That policy will need to account for the privacy and retention rules that apply to each installation.

The client may also need to distinguish **loaded but collapsed**, **not yet loaded**, **loading**, and **no visible replies**. Failed fetches should leave already loaded comments intact. These states should be designed before choosing the exact controls and labels.

### Existing tree representation and possible alternatives

The current code already has a tree model: each comment carries a stable `id` and a `parentId`, and the frontend `threadComments()` utility groups comments by parent and recursively assembles the tree. `DiscussionDisplay.svelte` supplies the newest-first date comparator. We should start from that working model rather than presume it needs replacing. Codex can assess whether it remains efficient when the client holds only a partial set of comments, and whether extra metadata or indexing would help.

#### Hierarchical comment IDs: an option to investigate

We've discussed compact addresses such as `2r`, `2r.5`, and `2r.5.c`, where segments encode a comment's position beneath its parent, perhaps in base 36 or base 62. A path like this would tell us the parent and ancestry from the ID itself; segments could be assigned once, without renumbering after deletions. Display order could still change independently.

This is **not yet a decision** to replace existing IDs. It raises questions about migration, moving comments between parents, very deep threads, allocation under concurrent writes, and the fact that an address alone does not tell us how many siblings are still visible. A path also doesn't by itself prove that all earlier siblings or ancestors remain accessible. We should compare this approach with keeping existing stable IDs plus parent references or ancestry metadata before making the ID format permanent.

## What deserves the reader’s attention

We don't need to tell someone whenever a stranger posts in an unrelated branch. **New activity** and **activity relevant to the reader** are different things.

Direct replies to the reader's own comments may eventually deserve priority or a badge. General activity can affect how threads are sorted on an ordinary visit without generating alerts. Readers can discover the rest by browsing. Replies further down a conversation they once joined are a possible future preference, not an immediate requirement.

For the first version, avoid building a comprehensive per-comment unread system or notifications for all new activity. Tracking a last-visited time, prioritizing personal replies, and acknowledging badges can wait until we implement those features. Following one shared link should not imply that unrelated comments were read.

## Fetch size

Once we've decided which comments to load first, we need to decide how many to return in a single request.

We could limit the number of comments, but their lengths vary considerably. Fifty short replies might be tiny, while fifty long comments could be substantial. A limit based on response size gives us more predictable control over how much data the reader downloads.

For the first iteration, we'll use a configurable maximum response size, with a default of **1 MB (1,000,000 bytes)**. The server returns complete comments up to that budget, following the current fetch priority. If more remain, the response provides a way to continue. We never split an individual comment across requests.

The configured limit cannot be smaller than the maximum allowed comment plus the response overhead; reject such a setting. **There is one deliberate exception to the response limit:** if a stored comment is itself larger than the budget (for example, an unusually long legacy edit), return that complete comment as a single oversized batch when the server can deliver it. Transport limits still apply.

Later, we may let moderators choose smaller limits for their discussions, and clients request smaller batches to suit their connections. These settings would form a hierarchy: the administrator sets the ceiling, a moderator may lower it, and a client may lower it further. No level can raise the limit set above it, and none can go below the one-comment minimum. **For now, implement only the server setting.**

### Technical considerations

We'll measure the UTF-8 byte length of the **uncompressed JSON response**, rather than the compressed bytes transferred over the network. Calculating a safe one-comment minimum requires accounting for worst-case JSON escaping, metadata, and the response envelope. The current [`maxCommentLengthChars` policy](https://github.com/rendall/simple-comment/blob/master/src/policy.json#L11) defaults to 5,000 UTF-16 code units, but that is not itself a response-size limit. In a worst case where JSON escapes each code unit as a six-byte `\uXXXX` sequence, the text alone could approach **30,000 bytes**, before metadata and the response envelope. This is a theoretical estimate, **not an observed response size**; Codex should verify it against the actual serializer and sample responses. [Issue #278](https://github.com/rendall/simple-comment/issues/278) covers applying the comment-length policy to edits; older saved edits may exceed it. The oversized-single-comment exception handles those records without truncating or skipping them. It should be observable and tested, but we do not need a special presentation for them.

Codex can investigate the precise minimum and enforcement details during implementation. Moderator and client overrides, including where they are configured, remain possible later additions rather than first-iteration requirements.

## Changes during loading and saved state

**After the last batch of the initial load, follow its `refresh` URL to perform a final synchronization.** The URL carries the server-issued initial cutoff `X`. The response reports comments created, edited, or deleted since that point. Merge their current states into the tree while preserving the reader’s place and open branches. Refresh depends on recording when a comment was last edited and retaining deletion records. Retained records let a refresh report deletes directly. [Edit timestamp issue #279](https://github.com/rendall/simple-comment/issues/279) · [Soft deletion issue #280](https://github.com/rendall/simple-comment/issues/280)

Merge incoming comments by ID and keep the newest server state for each comment. A late batch or refresh may have been read before a post, edit, or moderation change that the widget has already applied. Keep a confirmed new comment when an older response omits it, and keep the newer text, publication state, or deletion record when an older response includes the same comment. Apply this rule to results for the same viewer and leave the exact way of determining freshness to the implementation design.

A synchronization response should supply a **new server-issued checkpoint** for the next refresh. It could also return a ready-to-use refresh URL containing that checkpoint, much like a pagination response can return a `next` URL. How to make the checkpoint reliable under concurrent writes remains a technical question. Beyond this required final synchronization, **we have not decided when refreshes should run**; manual refresh, refresh after reader interactions, and periodic refresh are possibilities for later.

Restoring reading position and open branches, local caching, and per-reader reading state are separate experiments. Storage may be unavailable or full; the embed must still work. See [browser storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#web_storage).

## Existing installations and rollout

The project is young and no active external installations are currently known to the maintainer. The manual should invite people who use Simple Comment or build API clients to contact the maintainer. Hearing from adopters helps the maintainer account for their integrations when planning changes. Compatibility still warrants verification. [Manual invitation issue #281](https://github.com/rendall/simple-comment/issues/281)

Before changing ID formats or stored records, verify what existing discussions need. Preserve old links and data or provide an explicit migration, even if adoption appears small.

## Public comment links

The host page includes the Simple Comment script. For issue #240, a namespaced URL fragment is the proposed default, with a query parameter as an option for sites already using fragments. Path-based links require explicit host routing. Exclude Simple Comment's own link marker from URL-derived discussion IDs while preserving the host's routing state. A canonical public page URL on the topic may help generate links in moderator emails.

A link should resolve by stable comment ID, regardless of sort order or current view. Observe existing permissions. Handle missing or inaccessible targets honestly, and keep a placeholder for a deleted ancestor when it is needed to make surviving replies understandable.

## Acceptance Criteria

- An ordinary visit displays a usable first batch in the existing newest-first tree while remaining comments are still loading.
- A shared link presents the target as soon as it arrives, even if its parent arrives later. The target stays in place as surrounding comments are added.
- The existing topic GET returns the full discussion. The incremental GET returns whole-comment batches, each within the configured limit except for the documented single-comment case. The server rejects a configured budget below the minimum required for one whole comment.
- Each `next` link continues the initial load with the original cutoff. The final batch supplies a `refresh` link with that cutoff, including when the discussion fits in one batch.
- A new comment created after the cutoff stays out of the initial batches and appears on final synchronization. A successful refresh brings the tree up to date with edits and deletions without losing the reader’s position or displaying duplicate comments. An older response arriving late preserves any newer confirmed post, edit, or moderation change already shown in the widget.

## Validation Strategy

- **Contract tests.** Exercise the full and incremental GET routes, existing read permissions, the `next` and final `refresh` links, the shared cutoff, and the single-batch case. Requests pass when the full route returns the complete discussion and the incremental route returns the agreed batch and link for each step.
- **Size checks.** Measure UTF-8 JSON before compression using the real serializer. Test worst-case escaping and metadata, rejection of a budget below the one-comment minimum, the normal byte ceiling, and the oversized stored comment exception. Test moderator and client overrides when those options are introduced.
- **Change and continuation tests.** Post, edit, or delete comments while loading, including leaf and parent deletions and overlapping requests. Verify that the client merges current states, finishes without gaps or duplicate entries, and can continue after a failed fetch. Hold an older batch or refresh response until the widget has applied a confirmed post, an edit that changes the hold status, an approval, or a deletion. Then deliver the older response and check that the newer state remains. Check writes that overlap the cutoff and refresh checkpoints once their behavior is settled.
- **Embed tests.** Check newest-first presentation, opening a branch during background fetching, deleted-ancestor placeholders, and deep shared links whose parent arrives later. The linked comment should appear first and remain in view when ancestors load.
- **Performance comparison.** Compare a wide discussion with many short threads and a deep discussion dominated by one long branch against the existing full-fetch behavior. Record transferred bytes, database work, and elapsed time before readers can see a useful exchange. The first batch should shorten that wait in the representative large discussions.

## Things to consider later

These are design possibilities and implementation questions, **not requirements for the first iteration**. Keep them visible so we can make simple choices now without unnecessarily ruling out future improvements.

- **Background bandwidth.** Automatically downloading the rest of a very large discussion may waste bandwidth and database work. A future version could pause or stop background loading after the useful first batches, especially on slow connections or when the page is not being used.

- **Continuation and overlapping fetches.** The simplest model may be an ordinary sorted sequence of batches plus high-priority requests for linked comments or opened branches. Those priority requests may overlap later ordinary batches. The client can merge records by stable ID; the server need not track every comment the reader has received. Codex should evaluate cursor stability, concurrent changes, retry behavior, and how to avoid gaps.

- **Shared-link context.** We need to test how much of the parent chain and nearby conversation to fetch automatically. Options include placeholders for the full ancestry, a collapsed path that becomes expandable after it loads, a combination, or another approach. We want readers to get their context without confusing changes in layout; exact UI behavior can wait for UX design.

- **Tree data.** Existing `parentId` relationships and frontend threading may be entirely sufficient. Hierarchical IDs or child counts are possible improvements, not prerequisites. Investigate them only if a concrete loading or navigation need justifies the change.

- **Future loading strategy.** The initial request could eventually specify a sort order, filter, or other loading preference. Continuation would then follow that view, without assuming the first iteration’s newest-first order forever.

- **Concurrency around cutoffs.** A server timestamp plus creation and modification dates does not guarantee that a write started before the cutoff will become visible before a later query. Codex should investigate how to avoid gaps at the initial cutoff and across refresh checkpoints, including late-committing creations, edits, and deletions. We want correct eventual synchronization, not historical snapshots.

- **Later refresh cadence.** Beyond the required final synchronization, manual refresh, refreshing after interactions, and periodic refresh are candidates. We have not chosen the timing or trigger.

- **Later browsing modes.** Search results, reply lists, oldest-first sorting, activity-ranked threads, and reader-specific preferences should remain possible without being built now.

### UXD

- **Shared links and reading position.** A reader following a shared link came to see a specific comment. Present that comment first, even if the reader left off elsewhere. Consider giving them a way to return to their saved place after reading the linked exchange.

- **Filtering and reading preferences.** Filters can help readers find relevant comments in a long discussion. As more results load, keep the active filter in effect. A reading preference could help someone skim reply previews across several threads or see more of one active exchange. Decide what to fetch first and what to show first based on the reader’s goal.

- **Reply notices.** A brief toast could draw attention to new replies to the reader’s own comments. A badge in the user header would give them a way to find those replies after the toast fades.

## Open Questions

- How much ancestry and nearby context should follow a linked comment automatically, and should the rest appear as placeholders or a collapsed path?

- Which additional sorting modes would readers actually find useful: oldest-first, root threads ranked by descendant activity, or something else?

- Which visual cues best distinguish collapsed, unloaded, loading, and fully loaded branches?

- Should we use hierarchical IDs at all, or retain current IDs with structural metadata? What does migration require?

- How should we log or measure an oversized single-comment response without complicating the UI?

- When we introduce personal reply indicators, what counts as acknowledged, and what happens on a first visit without saved state?

Search, alternative sort orders, unread-reply lists, periodic refresh, persistent reading position, and more elaborate loading preferences can become separate issues. We should leave room for them, not implement them prematurely.
