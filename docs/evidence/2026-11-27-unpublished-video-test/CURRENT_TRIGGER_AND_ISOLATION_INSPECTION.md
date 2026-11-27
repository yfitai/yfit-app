# Current trigger and isolation inspection

## Evidence boundary

Inspected only `current-workflow-redacted.json` in this directory, including all 25 node configurations, the complete `connections` object, and workflow-level fields. This is the owner-provided **Download 18:16 Nov 27** export described in the task: `YFIT Social Media Automation v2`, ID `h7bRds9UOUfmP36F`, `active: false`, `versionId: d749db3b-3b3e-4a16-968a-dcdd603b92ea`. The download time/owner-pause attribution comes from the task, not a timestamp or pause event inside the JSON. This supports an inactive exported snapshot, **not a live API status check**, proof of cancelled in-flight executions, or conclusions about historical versions. No other files, live systems, credentials, networks, workflow executions, or source changes were accessed.

**Critical conclusion:** unpublished/inactive is not equivalent to safe manual execution. The exported manual route bypasses the kill-switch, supplies `dry_run: false`, and reaches production-directed generation/upload/post/write nodes. Credential placeholders do not establish isolation of the original workflow.

## Triggers, schedule, and native response flow

- **`Daily Schedule Trigger (6 AM Manitoba / MBT)`** has `parameters.rule.interval[0].field: "cronExpression"` and `expression: "0 11 * * *"`; workflow `settings.timezone: "Etc/UTC"`. This is 11:00 UTC daily, equivalent to **06:00 at the owner's explicitly chosen permanent UTC−5 offset**. It preserves the approved fixed-offset schedule and must not be changed based on traditional seasonal timezone assumptions. A device still displaying UTC−6 would show 05:00; no independent civil-time-law or device update verification was performed. No second schedule exists in this export; conflicts with external/historical schedules cannot be established here.
- The schedule path is `Daily Schedule Trigger (6 AM Manitoba / MBT)` → `Call Supabase — Scrape Articles` → `Call Supabase — Generate Content` → `Schedule Path Complete`. There is **no kill-switch or dry-run gate on this path**. Scraper: POST `/functions/v1/scrape-fitness-articles`, raw JSON `body: "{}"`, timeout `120000`. Generator: POST `/functions/v1/generate-social-content`, `body: ={{ JSON.stringify({ run_date: $now.toFormat('yyyy-MM-dd'), dry_run: false }) }}`, timeout `300000`. Its `infoMessage` says GPT-4 generation fires the n8n webhook; backend behavior/costs/writes were not inspected.
- **`Webhook from Supabase`** is POST, redacted `parameters.path`, `responseMode: "responseNode"`, sanitized `webhookId: "REVIEW_EXPORT_REQUIRES_NEW_WEBHOOK_ID"`. Its route starts at `Pipeline Kill-Switch`. If the generator asynchronously calls this webhook as its message describes, the posting pipeline is a **separate webhook execution**, not downstream data from the generator HTTP response: the schedule HTTP route ends at the no-op.
- The native callback response is **`Log Post Results` → `Webhook Response`**, whose `respondWith: "json"` and `responseBody` unconditionally say `success: true` and `"YFIT content generated and posted to all platforms"`, with `{{ $now.toISO() }}`. It is not an early acknowledgement or reliable confirmation of every publish. Both dry-run loggers terminate without a connection to that response; an exception at the kill-switch also does not route there. No callback URL or asynchronous acknowledgement mechanism is established by the inspected fields.

## Kill-switch and dry-run failures

**`Pipeline Kill-Switch.parameters.jsCode` contains `const PIPELINE_ENABLED = true;`**, despite its comments describing `false` as the current frozen state. Only `if (!PIPELINE_ENABLED) { throw new Error(...) }` stops its input; otherwise it returns `$input.all()`. The webhook traverses it, but the manual and schedule routes do not.

**`Manual Test Trigger` → `Test Data (Sample Payload)` → `Parse Supabase Payload`** is directly connected. The sample explicitly sets `dry_run: false` and selects YouTube, Facebook, and LinkedIn. Its `new Date().toISOString().split('T')[0]` uses a UTC date. The manual-trigger note calling this a “test” provides no isolation.

**`Parse Supabase Payload`** selects `$input.first().json.body || $input.first().json` and normalizes only the literal boolean via **`dry_run: payload.dry_run === true`**. Missing values and string `"true"` become false. It filters six video platforms, including LinkedIn/Pinterest, and hardcodes `const textItems = [];`. `Process ElevenLabs Response` spreads the parse data; `Prepare Assembly Request` again preserves `parseData.dry_run === true`.

However, **`Is Dry Run?` is placed after ElevenLabs, Supabase audio upload, both Railway assemblies, and platform splitting**. It tests `leftValue: ={{ $json.dry_run }}` with boolean `operation: "true"`, `rightValue: true`, loose validation; output 0 goes to `Dry Run Logger`, output 1 to video posting. **`Split by Video Platform` returns no `dry_run` field**, so the gate cannot reliably receive the preserved flag even for boolean-true input. Loose validation is not a substitute for a present flag; exact missing-value runtime behavior was not tested.

The text IF uses the same `leftValue` with strict validation, but **`Prepare Text Posts` also omits `dry_run`**. Additionally, the export connects `Parse Supabase Payload.main[1]` to that node although its Code returns one array of items, not an explicit second output; this is not a same-output fan-out. The text route is therefore not established as a functioning normal branch. Its hardcoded empty `text_items` and literal newlines inside single-quoted `CTA_MAP` strings are additional static defects. None is a safety control to rely on.

## Side-effect surface and full connection inventory

The complete video route is:

`Parse Supabase Payload.main[0]` → `ElevenLabs — Generate Voiceover` → `Process ElevenLabs Response` → `Upload Audio to Supabase Storage` → `Prepare Assembly Request` → `Assemble Video (Railway ffmpeg)` → `Assemble Video — YouTube (No Captions)` → `Split by Video Platform` → `Is Dry Run?` → **true:** `Dry Run Logger` / **false:** `Upload-Post — Post Video` → `Log Post Results` → `Webhook Response`.

The complete exported text route is:

`Parse Supabase Payload.main[1]` → `Prepare Text Posts` → `Is Dry Run? (Text)` → **true:** `Dry Run Logger (Text)` / **false:** `Upload-Post — Post Text` → `Log Post Results` → `Webhook Response`.

Together with the three trigger routes above, this accounts for every connection. Dry-run loggers, `Webhook Response`, and `Schedule Path Complete` have no outgoing connections. `pinData: {}`; no node has an exported `disabled: true` safeguard.

| Node / exact configuration | Risk before or despite dry-run gating |
|---|---|
| `ElevenLabs — Generate Voiceover`: POST `={{ 'https://api.elevenlabs.io/v1/text-to-speech/' + $json.voice_id + '/with-timestamps' }}`, `text: ={{ $json.script }}`, `model_id: eleven_turbo_v2_5` | Production TTS request, potentially paid, before any IF. |
| `Upload Audio to Supabase Storage`: POST storage object in `yfit-voiceovers/voiceovers/`, filename expressions use parse `run_date` and sanitized `content_angle`; `contentType: binaryData`, `inputDataFieldName: data`, header `x-upsert: "true"` | Remote storage write/possible overwrite before any IF. `Prepare Assembly Request` constructs `/storage/v1/object/public/${audioKey}`. |
| Both assembly nodes: POST `https://yfitai-yfit-video-service-production.up.railway.app/assemble`, timeout `180000` | Both are called sequentially before the IF, regardless of which video platforms were supplied. Main `dry_run: ={{ $json.dry_run === true ? 'true' : 'false' }}`; YouTube reads the same flag from `Prepare Assembly Request` and sets `burn_captions: "false"`. Passing a string flag is not proof of no assembly, fetch, upload, or backend writes. |
| `Upload-Post — Post Video`: POST `/api/upload`; `platform[]: ={{ $json.platform }}`, `user: YFIT`, configured production page/board IDs, TikTok `privacy_level: ={{ $json.platform === 'tiktok' ? 'PUBLIC_TO_EVERYONE' : undefined }}` | Actual posting endpoint, not a preview. `continueOnFail: true` allows downstream handling after errors. |
| `Upload-Post — Post Text`: POST `/api/upload_text`, `user: YFIT`, configured page IDs, `continueOnFail: true` | Actual posting endpoint if supplied reachable text items. |
| `Log Post Results.parameters.jsCode`: `await fetch(`${SUPABASE_URL}/rest/v1/social_posts`, { method: 'POST', ... })` | Database insert without a dry-run check. Sets status from response fields (`failed`, `published`, or `submitted`); catches write errors and continues. |

Workflow settings also retain `saveManualExecutions: true`, success/error execution data `"all"`, `errorWorkflow: "kboFMROA3d0sfj2F"`, `executionOrder: "v1"`, `binaryMode: "separate"`, `callerPolicy: "workflowsFromSameOwner"`, and `availableInMCP: false`. These are not no-side-effect controls. The referenced error workflow was not inspected. Node notes claiming a frozen switch, a Supabase assembly endpoint, or that the scraper is the generator conflict with actual code/URL fields; executable fields govern this inspection.

## Review-only preservation boundary

Do not manually execute this current workflow as the isolated test, activate it, reconnect callbacks, or install fixes on the basis of this export. The task-described **two-node Manual Trigger + pure Code planner** is a separately locally prepared, **not installed**, review-only draft; it is not present in the inspected export and was not independently read here. Its bounded acceptance criterion is inactive status, no active webhook/schedule, and no paid calls, network uploads/posts, or database writes—not merely a `dry_run` label.

Preserve the current snapshot, node identities/configurations/connections, and production response contract as evidence; any later authorized change requires a separate decision. The separate weekly report is **not represented in this export** and must remain unchanged. No fixes, deployment, reconnections, or execution were performed in this inspection.
