# Website and phone authentication — November 13, 2026

## One account backend, separate sign-in sessions

The active website code, secondary Supabase client and retained Build 108 mobile-update archive refer to the same Supabase project. They are intended to use the same YFIT account registry and account-linked data. Customers should not need a separate account merely because they switch between website and phone.

A desktop browser, another browser profile, each website origin and an installed Capacitor APK have independent local session storage. A phone home-screen PWA is a browser-installed website; it is not the same runtime as the Android APK. Signing in on a computer therefore does not automatically sign in the phone. Matching email addresses also do not by themselves prove Google/email identities are linked to one user; provider linking and a designated account check remain necessary.

The internal admin/accounting app is a third, different authentication surface: it uses Manus OAuth and a separate admin backend. The n8n login and Railway dashboard login are administrative service accounts, not YFIT customer sign-ins.

## Concrete phone risks found in current source

The current Capacitor configuration points its remote shell to the legacy `https://yfit-deploy.vercel.app` host. It does not automatically become `app.yfitai.com`. The app creates Google, signup-confirmation and recovery redirects from its current origin; different hosted origins may need separate provider allow-list entries and have separate local sessions. No phone URL/provider setting was changed in this repair batch.

The active Google button uses the browser Supabase OAuth flow. No active native Google token exchange, registered Android callback intent filter, `appUrlOpen` handler or session transfer from external browser to APK WebView was found. Source therefore indicates a native return/integration risk: completing Google in an external browser may not deliver that session back into the app. This is not a proven failure of the user's installed phone, because its APK/version, loaded origin and active bundle were not inspected.

The retained mobile archive is Build 108, while Android binary version metadata is a separate layer. A remote URL and an OTA-update service coexist in source, so neither a new web deployment nor an archived ZIP proves what an installed phone is displaying. No phone data was cleared and no APK/AAB or update archive was created or installed.

## Changes made in the approved web repair

Web builds now use root-relative assets, fixing direct nested callback bootstrap. Explicit Capacitor builds retain relative assets. All discovered executable Android/OTA asset-build entrypoints now select the Capacitor mode; the rebuild-only script prepares native assets before sync so it cannot accidentally consume the last website-target build. These script commands were not executed to build/install a phone app. The normal Vercel web deployment no longer increments phone metadata without a corresponding new archive.

The existing PWA or a phone shell loading the updated hosted website may receive the web entry repair. A phone using old packaged assets may not. Native OAuth callbacks and provider allow-lists still require a separate device-aware test and approved repair plan.

## Safe next device test

First determine whether the phone icon opens a browser PWA or an installed APK, record its version and loaded hostname, and compare its public asset/bundle version—without exposing tokens or storage contents. Then use one designated existing test identity to compare website and phone email login, Google consent/return and dashboard arrival. Record whether they share the same user identity, without resetting or impersonating a customer. No native rebuild, provider configuration change or new phone bundle is authorized merely by this investigation.

Detailed source references are preserved in the private hub's `docs/evidence/2026-11-13-repairs/web-mobile-auth.md`. The first web repair and live-check record is `docs/AUTH_ENTRY_REPAIRS_2026-11-13.md`.

## Later hostname comparison

A GET-only check at approximately 15:14 EST found both the configured legacy Vercel host and primary app serving HTTP200 with the same repaired entry asset `index-6OQdqWdw.js`. The older hostname does not currently prove the phone points at stale website code. They remain different origins with independent session storage and potentially different provider redirect allow-list behavior. Native browser-to-WebView return and the actual installed phone runtime remain untested.
