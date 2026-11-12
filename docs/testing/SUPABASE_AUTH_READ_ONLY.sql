-- YFIT authentication evidence check — November 12, 2026
-- Run only in the existing YFIT Supabase project, not a replacement project.
-- READ ONLY: excludes emails, passwords, tokens, session rows and credentials.
-- Does not classify genuine customers vs test accounts or prove a full UI login.

BEGIN TRANSACTION READ ONLY;

SELECT
  LEFT(u.id::text, 8) AS account_reference,
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(u.raw_user_meta_data ->> 'name', ''),
    NULLIF(TRIM(CONCAT_WS(' ',
      u.raw_user_meta_data ->> 'first_name',
      u.raw_user_meta_data ->> 'last_name'
    )), ''),
    '(name not set)'
  ) AS display_name,
  u.created_at AS account_created_at_utc,
  u.last_sign_in_at AS last_sign_in_at_utc,
  (u.email_confirmed_at IS NOT NULL) AS email_confirmed,
  (
    SELECT STRING_AGG(DISTINCT i.provider, ', ' ORDER BY i.provider)
    FROM auth.identities AS i
    WHERE i.user_id = u.id
  ) AS linked_providers
FROM auth.users AS u
ORDER BY u.created_at DESC
LIMIT 50;

ROLLBACK;

-- A last-sign-in timestamp shows a recorded sign-in event, not completion of
-- onboarding, billing, browser redirects or a retained authenticated session.
-- All listed accounts remain unclassified unless the owner confirms their role.
