# Honest free-beta or time-limited Pro trial positioning

## Bottom line

YFIT should not replace its current offer with an app-wide “beta” or a new paid trial yet. The current main `LandingPage.tsx` already presents a permanent $0 free plan, Pro at $12.99 USD/month, $99.99 USD/year, and $249.99 USD one-time lifetime, plus a separately labeled “1 Month FREE” signup offer. It also advertises an ungated “Explore the app first — no account needed” path. Adding another broad “free Pro beta” would make the promise ambiguous and could conflict with the existing one-month offer. The safer recommendation is a small, clearly bounded founder cohort or reverse-trial experiment: keep the permanent free/basic plan and existing prices unchanged, offer selected new users temporary access to a named set of Pro capabilities without a card, and end by downgrading them to the existing free plan unless they explicitly choose a published paid plan.

This is a positioning and measurement recommendation, not a pricing, Stripe, entitlement, or mobile-release change.

## What the evidence says—and does not say

A free plan and a free trial optimize different things. Freemium means indefinite access to a limited product; a free trial means full or broader access for a defined time [1]. Product-led guidance cautions that the right model depends on time-to-value, audience, product complexity, and acquisition strategy, not on a universal “best” model. Its Tettra case describes more upgrades after moving from a 15-day trial to freemium, but this is a company case, not causal evidence that freemium wins generally [1].

The strongest causal evidence located is a 2025 randomized field experiment of 680,588 users of a global image-editing SaaS product across 190 countries. It compared three-day and seven-day trials in a freemium setting over two years. Longer trials increased trial adoption and delayed conversion, but did not significantly improve immediate conversion. The authors also say the findings may not generalize to higher-learning-cost products or trials of a month or longer [2]. This supports testing the timing of access, not promising that a particular duration will increase paid conversion.

A 2026 ChartMogul/ProductLed survey of 200 software products reports that 57% lead with a free trial, 26% with freemium, and 7% with a reverse trial; 14 days is the most common trial length [3]. It reports a median free-to-paid conversion of 8%, but the sample is a January 2026 survey of mostly $1–10 million ARR B2B software companies, with respondents estimating their own funnel metrics. The report explicitly says trial conversion advantages disappear after accounting for signup rates and gives different patterns for SaaS, AI-native, and B2C/hybrid products [3]. These figures are directional category evidence, not a forecast for YFIT. The card-required group is especially selection-biased: requiring a card filters for higher intent and can reduce starts, so its higher trial-to-paid rate cannot be read as higher total customers or revenue.

## Recommended YFIT offer

Use a **founder access cohort**, not “the whole app is beta.” “Beta” is honest only if YFIT is testing a specific experience, accepting feedback, and can explain what may change. The app already presents a mature multi-feature product and published plans. Calling the entire product beta could lower trust, imply instability, or make existing prices look provisional. A truthful label would be: “Founding-user Pro preview” or “Limited pilot: help us improve [specific capability].” Do not state a numeric availability cap unless it is real, enforced, and maintained. “Limited” should mean a documented cohort window or eligibility rule, not invented scarcity or social proof.

For a first test, let a new account receive a short, time-limited preview of the specific Pro features most likely to demonstrate value. A 7–14 day window is a test hypothesis informed by common industry practice, not an evidence-backed optimum for YFIT. Keep the existing free/basic plan available permanently, including its currently displayed AI allowance of 3/month and other free-tier limits. Avoid giving unlimited paid AI during the preview. Use an explicit per-user AI allowance or feature cap, publish what is included, and show remaining usage where practical. AI usage has real variable cost, and ChartMogul’s 2026 report specifically highlights that supporting free users is more expensive when AI token costs remain high [3]. The cap is therefore both an economic control and a trust promise.

A no-card trial is the better first research instrument for YFIT’s low-volume context. It reduces payment friction and avoids a surprise charge in a health-related app that may handle personal information. It will also attract tire-kickers, so evaluate the complete funnel: preview start, first meaningful action, AI usage, feedback completion, return use, signup, and paid selection—not trial-to-paid percentage alone. A founder cohort can add human support and feedback without claiming that support is available to everyone forever. Offer a named feedback channel and one or two specific questions, then state response expectations honestly.

## End-of-trial handling and trust safeguards

The default should be a clear downgrade to the existing free plan, not automatic billing. Tell users at enrollment: the exact start/end dates, features included, AI or other usage caps, whether saved records remain available, what becomes read-only or unavailable, and the current paid options ($12.99 monthly, $99.99 yearly, $249.99 lifetime) without implying that any price is temporary. Send reminders before expiry and at expiry. Give users an export/delete path and make it easy to continue on free or choose a published plan. Do not delete personal health data merely because Pro access ends.

Stripe’s documentation confirms that no-payment-method trials can be configured to cancel or pause when they end, and that a `trial_will_end` event can support reminders [4]. If a later flow ever collects a payment method, the UI must make the post-trial amount, renewal timing, cancellation path, and end behavior prominent. Apple’s subscription guidance likewise requires the subscription duration, full renewal price, and clear trial length and post-trial price in the purchase flow [5]. These are implementation requirements for a future paid trial, not authorization to alter current billing.

Do not assume a website offer can be copied into a native app. Apple says digital subscriptions sold in an iOS app use Apple In-App Purchase and requires clear purchase terms; Google Play’s rules vary by program and geography. The current Google external-payments page describes a Japan-specific program with enrollment, side-by-side Play Billing, reporting requirements including $0 free-trial transactions, support/refund duties, and restrictions [6]. Therefore, if YFIT later introduces paid upgrade prompts inside iOS or Android, obtain current platform-specific review before shipping. Keep the proposed pilot web/account-based and informational until channel entitlements and policy are deliberately designed.

## Suggested bounded test and decision rule

Run one cohort with a single message and one duration, while leaving the current landing-page plans unchanged. Compare it with the existing free/basic path rather than changing all traffic. Use truthful copy such as: “Try selected Pro tools for 14 days—no card. At the end, you keep the free plan unless you choose a paid plan. Usage limits apply.” Do not call the cohort “the last spots,” display fabricated participant counts, or claim a conversion lift.

Track: eligible visitors; Go arrivals; preview starts; first successful setup/action; AI-cap encounters; feedback response; day-7/day-14 return; free-plan continuation; paid-plan click and completed purchase; support contacts; refunds/complaints; and cost per preview user. Separate web and mobile-store cohorts. Predefine a stop rule for unexpected AI cost, abuse, privacy/support burden, or confusing end-of-trial complaints. Treat any observed conversion as a YFIT outcome requiring enough volume and a comparable control, not as a benchmark.

The recommendation is therefore **preserve the current free/basic plus one-month offer, then test a no-card, time-limited, feature-specific founder preview with capped AI and automatic downgrade to free**. Only after users can reach value, understand the cap, and give usable feedback should YFIT consider a broader reverse trial. The biggest unknown is not which model is fashionable; it is whether YFIT users reach a meaningful health-tracking or coaching outcome quickly enough to understand why Pro is worth paying for.

## References

[1]: https://productled.com/blog/freemium-vs-free-trial "Freemium vs. Free Trial: How to choose the right model"

[2]: https://pmc.ncbi.nlm.nih.gov/articles/PMC12217587/ "Longer or shorter? A large-scale randomized field experiment on the impact of free trial duration on sustainable user conversion in the Freemium model"

[3]: https://chartmogul.com/reports/saas-conversion-report/ "The SaaS Conversion Report: A new look at free-to-paid conversion"

[4]: https://docs.stripe.com/billing/subscriptions/trials "Stripe subscription trials"

[5]: https://developer.apple.com/app-store/subscriptions/ "Auto-renewable subscriptions — App Store"

[6]: https://support.google.com/googleplay/android-developer/answer/16787536?hl=en "Enrolling in the external payments program"
