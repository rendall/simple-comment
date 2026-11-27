import { writeFile } from "node:fs/promises"
import { getStore } from "@netlify/blobs"

const termsFile = "moderation-terms.txt"

const fetchModerationTerms = async () => {
  if (process.env.SIMPLE_COMMENT_FETCH_MODERATION_TERMS !== "true") return

  const siteID = process.env.SITE_ID
  const token = process.env.SIMPLE_COMMENT_MODERATION_BLOBS_TOKEN
  if (!siteID || !token) {
    console.error(
      "Fetching moderation terms requires SITE_ID and SIMPLE_COMMENT_MODERATION_BLOBS_TOKEN."
    )
    process.exitCode = 1
    return
  }

  try {
    const store = getStore({ name: "moderation", siteID, token })
    // API access obtains a signed URL for GET. Check existence with HEAD first.
    if ((await store.getMetadata(termsFile)) === null) return

    const terms = await store.get(termsFile, { type: "arrayBuffer" })
    if (terms !== null) await writeFile(termsFile, new Uint8Array(terms))
  } catch {
    console.error(
      "Could not fetch or write the private moderation terms file. Check the Netlify site, build token, and build directory."
    )
    process.exitCode = 1
  }
}

await fetchModerationTerms()
