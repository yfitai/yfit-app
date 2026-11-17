# YFIT platform-to-Go link checks — November 17, 2026

## Individual Pin saved; live publishing node identified — 18:16 EST

The owner confirms **Website updated and saved** on Pin1089730441275778376. The screenshot shows the field populated with the beginning of the approved full Go URL; the input is visually truncated, so the image alone does not certify the full persisted value. Public read-only extraction now shows a **Visit** control and yfitai.com label; its extracted HTML did not expose a usable website anchor, so the exact persisted destination/actual click-through still needs viewer verification. No outbound click was made for this check, and no new Pin was created. Current evidence is **owner-confirmed save**, not assistant-performed save or fully verified end-to-end click.

The live n8n screenshot identifies node **Upload-Post — Post Video**, ID/address suffix **upload-post-v**, in existing workflow **h7bRds9UOUfmP36F**, using **POST `https://api.upload-post.com/api/upload`**. Its visible input comes from **Is Dry Run?**, with fields including platform, video_url, caption, hashtags, title, first_comment, srt_url, run_date and content_angle. The shown pane stops in Headers; **Body Parameters have not yet been displayed**, so do not claim the current live node omits `pinterest_link` until those fields are inspected. No current input/output execution was triggered; the left panel warns its preview fields are from a prior successful execution.

Official Upload-Post documentation for this exact video endpoint defines **`pinterest_link`** as the destination, separately from description. [4] The next step is to scroll only the central Parameters pane to **Send Body → Body Content Type → Body Parameters**, hiding/skipping all authorization/header values. Inspect the full list and whether an existing destination parameter is present before adding a single field. Preserve video/title/caption/user/board mappings, current form format, dry-run guard, other platforms, connection settings and daily schedule. Do not click **Execute step**, Execute workflow or Retry as a mapping test: this node can publish real posts. Future automatic links remain **unrepaired/unpublished**, and the verified profile root link remains unchanged/claimed.

[4]: https://docs.upload-post.com/api/upload-video/ "Upload-Post video API: pinterest_link is the video Pin destination"

## Claimed profile Website lock — 18:04–18:06 EST

At17:57EST the owner explicitly approved changing the Pinterest profile Website to **`https://app.yfitai.com/go`**, with no added parameters. No change was saved. Subsequent owner screenshots show Edit profile Website locked at **`www.yfitai.com`**, a green verification mark and a message directing website changes to Link to Pinterest. The claim page then shows **`yfitai.com` already claimed**, with Claim and Unclaim buttons, not a Go-path input. The five unique screenshots from these two messages were read only as displayed, not reopened. The claimed-domain lock is a confirmed platform restriction; it is separate from the prior browser authentication mismatch.

A January2025 Pinterest Business Community response says the existing website must be unclaimed to unlock the profile URL. Pinterest's official website-claim documentation warns that once a claim is removed, associated Pins are no longer connected to the Pinterest account. [1] [2] The ordinary Add your website guide does not document a claim-preserving locked-field edit. [3] We have not established a supported way to change this particular profile's displayed URL without unclaiming. Do not bypass the disabled field through DOM/API manipulation, claim another domain experimentally, delete verification tags, change DNS, redirect the whole marketing root or remove the existing claim.

**Approval boundary:** changing the profile destination is approved; removing domain verification/claim and its existing Pin association is not. Preserve the existing claim and root profile link unless the owner separately approves that consequence after review. Recommended near-term route is to finish the already approved **individual Pin Website and future-upload destination repairs**, which are separate from the locked profile field. If retaining verification and changing the profile link are both required, ask Pinterest Support for a supported procedure. No support request was submitted, no claimed-domain change made, and no individual Pin or workflow save is complete.

## References

[1]: https://community.pinterest.biz/t/why-cant-i-change-the-website-in-my-pinterest-profile/24595 "Pinterest Business Community: locked profile Website change requires unclaiming"
[2]: https://help.pinterest.com/en/business/article/claim-your-website "Pinterest official website claims and consequences of removing a claim"
[3]: https://help.pinterest.com/en/article/add-your-website "Pinterest official profile Website editing instructions"

## Profile link clarification — 17:52–17:54 EST

The owner found a clickable **Pinterest profile** link and reported it opened the app while already signed in. This is a different field from the confirmed empty Website on individual Pin1089730441275778376. Public profile extraction independently shows its website href is **`http://www.yfitai.com/`**, with no `/go`. It is a valid root link, but bypasses the intended initial Go step. No profile edit is approved or made.

Fresh cookie-free HTTP reads showed root `https://yfitai.com/` →308→`https://www.yfitai.com/`→200; root-domain `/go` →308→www `/go`→200; `https://app.yfitai.com/go`→200 without an HTTP redirect. At22:53–22:54UTC isolated-browser direct navigation to the actual profile root href rendered the public **marketing landing page** with Sign In/Get Started, while `https://app.yfitai.com/go` rendered the public feature-exploration **Go page**, no login required. These are assistant direct-destination checks, not clicks through Pinterest, nor proof of a measured referral. They may contribute test traffic; no optional consent accepted, synthetic custom events, forms or account logout performed.

Canonical `src/App.jsx` routes logged-out `/` to LandingPage and logged-in `/` to Goals/Dashboard. Both authenticated and unauthenticated route sets explicitly retain `/go` as GoPage. Thus the owner's already-signed-in app landing is consistent with **root URL routing**, not evidence that new users must sign in or that `/go` automatically skips to the dashboard. The precise owner browser redirect chain wasn't captured. An existing guest/demo session is a separate route context and not covered by these two direct checks.

For the agreed social→Go flow, the Pinterest **profile Website** would also need an explicit Go URL, preferably the canonical `https://app.yfitai.com/go` with Pinterest attribution. That is an additional public-profile change, outside the current Pin/future-post repair approval; ask before changing it. The current Pin save and live automatic destination mapping are still blocked by authenticated browser/n8n access. The local-browser route was marked skipped when the isolated public check began; do not switch back without an explicit user request. Current owner screenshot was not reopened.

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
