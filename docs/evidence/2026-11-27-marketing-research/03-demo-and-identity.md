# Try-before-signup activation and secure account control

## Current behavior: what is already present

The supplied current snapshots already support a meaningful try-before-signup path. `App.jsx` detects `/demo` or `/go?mode=guest`, initializes a guest session, and renders a full guest app shell without Supabase calls. The shell exposes pre-populated demo pages for dashboard, nutrition, fitness, medications, daily tracking, progress, AI-coach FAQ, predictions, and form analysis. Goal, body-recomposition, and subscription routes redirect back to the guest dashboard. A persistent guest banner and contextual `GuestSignUpModal` appear when a visitor attempts an action such as logging a meal, workout, medication, or progress.

`GoPage.tsx` is currently a long link-in-bio showcase. It presents nine feature cards, static interactive preview tabs, a primary “Explore the app first” CTA that links to `/go?mode=guest`, and a separate signup CTA. The page preserves incoming UTM parameters when sending users to signup and emits consent-dependent Umami events when available. This is an existing preview-plus-demo design, not merely a proposed concept. However, the preview is broad and feature-catalogue oriented: it asks visitors to inspect many capabilities before they perform one focused job.

`Auth.jsx` and `GuestSignUpModal.jsx` confirm that Google OAuth is already available, alongside email/password signup and login. Google is a faster account-entry mechanism, not a no-signup experience: it still redirects to Google consent and returns an authenticated Supabase user. The modal also retains “Sign up with Email,” “I already have an account,” and “Continue exploring demo.” OAuth currently redirects to `/dashboard`; any future continuation of guest work would need an explicitly safe, allow-listed return path rather than an arbitrary URL.

## Recommended activation shape

The strongest near-term recommendation is not an open production database and not unrestricted paid AI. Keep the existing local, sample-data guest preview, but make the first screen task-led: “Try one useful thing now.” For example, let a visitor adjust a sample workout or nutrition entry, inspect the resulting summary, or complete a short form-analysis walkthrough using synthetic content. Use clearly labelled sample data and avoid collecting personal health information before account creation. Local temporary inputs can demonstrate interaction without creating an account, persistent health record, cross-device promise, or server-side cost.

The first valuable action should be narrow and observable: for example, “complete a sample workout and see a useful next-step summary,” or “edit a sample meal and see how the dashboard changes.” This is a YFIT hypothesis, not a verified outcome. The current `/go` page’s many feature claims and tabs may be useful for exploration, but the activation test should compare them with a shorter path that puts one job before the feature catalogue. A visitor who reaches a concrete result can then be asked to create an account to save it, use personal data, access history, sync between devices, or use costly AI.

The save gate should explain the exchange plainly: “Create your free account to save this to your profile and use it on another device.” Do not imply that a local guest session will survive device changes. Keep the free-plan and no-credit-card language only where the offer is operationally true, and continue to show privacy/terms consent at the account step. Existing guest work should not silently become a permanent record; if a migration is later designed, it should require an explicit confirmation and a defined conflict policy.

## Local guest state versus anonymous Supabase users

Local temporary state is the safer default for a low-volume, pre-personal-data preview. It avoids creating an Auth user for every curious visitor, avoids treating sample exploration as a customer identity, and makes the boundary clear: this is a disposable demo. It also means the user cannot recover the state on another device or after clearing browser data. That limitation is acceptable when the preview uses synthetic data and is stated before the save gate.

Supabase anonymous sign-ins are a possible later stage, not a free substitute for local state. Supabase says an anonymous sign-in creates a real user with a user ID and access token, using the `authenticated` Postgres role; it is distinct from the unauthenticated `anon` role. Supabase explicitly supports full-feature demos, but warns that anonymous users cannot sign back in as the same user after sign-out, cleared browsing data, or a different device [1]. Anonymous users therefore create identity rows, cleanup obligations, and abuse surface even if no email is collected. They also require carefully differentiated RLS policies using the JWT `is_anonymous` claim, restrictive server-side controls, and abuse protection such as CAPTCHA or Turnstile; Supabase documents an IP-based anonymous-sign-in rate limit and warns about database growth from abuse [1].

If YFIT later needs server-backed temporary work, use a tightly bounded anonymous identity only for non-sensitive sample or user-entered draft state, with server-enforced quotas, expiry/cleanup, and no personal health record or paid-AI entitlement by default. Conversion to a permanent account should be an explicit “save and continue” action. Supabase documents converting an anonymous user by linking an email or OAuth identity, and notes that conflicts with an existing account require a deliberate merge or reassignment policy [1]. That is a product and data-integrity decision, not a UI-only tweak.

## Account control, OAuth, and cross-device identity

The account model should remain one Supabase identity per person, not one customer per browser or one customer per phone. A web session and a phone session may be different devices and sessions, but after sign-in they should resolve to the same Supabase user ID. Supabase describes permanent users as tied to email, phone, or third-party identities, and supports multiple identities on one user [2]. It documents automatic linking for identities with the same email and manual linking for an already signed-in user [3]. Therefore, Google and email should be presented as alternative ways to access the same account when the provider/email matches—not as separate customer counts. Reporting should deduplicate by Supabase user ID, while separately measuring sessions, devices, and acquisition sources.

Retain Google OAuth as the low-friction account path and retain email fallback. Do not describe Google as “no signup.” Preserve explicit consent, show where the user will land, and retain a safe recovery path. Supabase requires OAuth `redirectTo` values to match the configured redirect allow list and recommends exact production paths rather than broad wildcards [4]. The current fixed `/dashboard` destination is safer than accepting arbitrary return URLs; a future “continue where you left off” flow should validate a relative path or map a small set of known routes before redirecting.

Entitlements and abuse gates must be enforced server-side. A guest or anonymous browser must not be able to unlock medication records, cross-device history, paid AI, unlimited form analysis, or subscription features by changing client state. The current source already shows authenticated ProRoute and usage-limited routes; the research recommendation is to preserve that security boundary, not weaken it for a smoother demo.

## Measurement and staged test hypothesis

Measure the funnel as separate events: qualified `/go` arrival; guest-demo start; first meaningful interaction; first valuable result; save-gate view; signup start; authenticated account completion; and return on day 7. Define activation as the first valuable action, not signup alone. Activation guidance commonly distinguishes activation rate, time to first key action, and retention; it also warns that an action can produce false positives if it does not predict continued use [5]. For YFIT, the primary metric should be the share of qualified demo starters who reach the selected first valuable result, followed by signup-after-value and seven-day return among those who do and do not sign up. These are proposed measurement definitions, not current outcomes.

Run a low-volume, docs-only planning test before changing production: compare the existing feature-rich `/go` page against a shorter, one-job explanation that sends visitors directly to the existing guest shell. Keep source, consent, UTM, and platform scopes stable. Do not claim an uplift until the same date window, source, device, and denominator are available. Google’s airSlate case study reports that adding guest mode preceded a 10% registration increase and more than 5% growth in new paid subscriptions, but it is one company’s case and explicitly not a guarantee for YFIT [6].

The bounded recommendation is therefore: keep the current sample-data guest route; make its first valuable action more focused; gate saving, personal data, cross-device sync, and costly AI behind account control; retain Google plus email; use anonymous Supabase users only if a server-backed temporary draft is truly needed; and count customers by the shared Supabase identity, not by device or provider.

## References

[1]: https://supabase.com/docs/guides/auth/auth-anonymous "Anonymous Sign-Ins | Supabase Docs"
[2]: https://supabase.com/docs/guides/auth/users "Users | Supabase Docs"
[3]: https://supabase.com/docs/guides/auth/auth-identity-linking "Identity Linking | Supabase Docs"
[4]: https://supabase.com/docs/guides/auth/redirect-urls "Redirect URLs | Supabase Docs"
[5]: https://userguiding.com/blog/activation-metrics "8 Metrics to Track and Improve User Activation"
[6]: https://business.google.com/en-all/think/future-of-marketing/mobile-app-ux/ "How to optimise app UX to boost conversions | Think with Google"
