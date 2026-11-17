# YFIT platform-to-Go link checks — November 17, 2026

The owner approved repairing the current Pinterest Pin's missing Website and future automatic Pinterest destinations at **17:39 EST**. At **17:41 EST**, the owner also authorized checking the six platforms **one at a time, after Pinterest is repaired**, to see whether their actual link surfaces open the Go page. Do not run those platform tests concurrently or claim they are complete from earlier profile screenshots.

## Pinterest comes first

Current Pin: **1089730441275778376**, “Overcoming QL Pain: My Fix.” The owner's editor screenshots show Website empty while the description contains a Go URL. The approved Website value is:

`https://yfitai.com/go?utm_source=pinterest&utm_medium=social&utm_campaign=organic#quick-setup`

The recurring repair must inspect the existing deployed n8n workflow's Pinterest video upload and supply the documented `pinterest_link` destination. Keep all other platforms, the UTC schedule, media, title, descriptions, board, AI disclosures and comment/recommendation settings unchanged. No old-Pin bulk edits, deletion, republishing, backfill or duplicate test posts are authorized. Historical workflow exports are not a substitute for the deployed configuration.

**Current blocker:** the connected My Browser Pinterest page explicitly showed “You are signed out” and a login dialog at 17:40 and 17:42. Its owner editor is inaccessible. The connected n8n workflow visit also redirected to Sign in earlier. No Website save or live workflow edit has been made. The user's existing manually opened signed-in Pin editor offers a direct alternative for the approved Website-only save; the exact saved value must then be verified. No passwords, keys or authorization headers may be provided in chat or retained in evidence.

## Then check each remaining platform

Proposed order is **Instagram → Facebook → LinkedIn → YouTube → TikTok**, after Pinterest. Use the current verified YFIT accounts and November 17 post identities from the saved audit. If the owner prefers another order, follow it.

For each platform, identify the actual clickable surface available to a viewer—post destination, caption/comment link, profile Website/link, or platform-specific button. Do not call text containing a URL a clickable link without testing or inspecting that surface. Record any platform restriction, login gate or missing link separately from a website error.

Open the actual supported link once in the authorized viewer/browser context and record its redirect chain, final host and path, retained attribution and whether the expected Go feature-exploration page renders. A link that opens marketing, signup or a retired domain instead should not pass as Go. Do not create an account, submit a signup, make a payment or publish a post as part of link checking. Existing owner-browser sessions and logged-out behavior are different test contexts; record the context used, and do not silently use an admin-only surface as proof for a new visitor.

Record each test's UTC timestamp, platform, exact originating URL/surface and actual destination. These are **owner/assistant test visits**, not customer traffic. Preserve the real link and its original UTM values rather than rewriting it to force the desired outcome. Do not estimate historical visits from these tests or claim an unavailable tracker collected the test. Additional app edits, account reconnects or public link changes on other platforms require approval once their defects and exact repairs are known.

## Evidence and preservation

The prior [native screenshot comparison](NATIVE_SCREENSHOT_COMPARISON_2026-11-17.md) contains the confirmed empty Website input and the analytical limitations. The main app remains `yfitai/yfit-app` at `/home/ubuntu/yfit-app-full`; admin remains `yfitai/yfit-admin` at misleading `/home/ubuntu/yfit-marketing` with managed S3 origin preserved; the private docs hub is `yfitai/yfit-ai`. Build 109 is unchanged. This plan records authorization and blockers only; none of the six destination-opening tests or Pinterest saves has been completed by the assistant.
