-- Prepared 2026-11-13. NOT EXECUTED. Parent runs only in the canonical deployed project.
-- Catalog metadata only: no subscription rows, auth users, PII, sessions or credential values.
-- No policy/function definitions, default expressions or store purchase fields are returned.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '10s';

SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'subscriptions';

SELECT p.policyname, p.cmd, p.permissive, p.roles,
       p.qual IS NULL AS using_is_absent,
       regexp_replace(coalesce(p.qual, ''), '[[:space:]()]', '', 'g') = 'true' AS using_is_unconditional_true,
       p.with_check IS NULL AS check_is_absent,
       regexp_replace(coalesce(p.with_check, ''), '[[:space:]()]', '', 'g') = 'true' AS check_is_unconditional_true,
       coalesce(p.qual, '') LIKE '%auth.uid()%user_id%' AS using_mentions_user_ownership,
       coalesce(p.with_check, '') LIKE '%auth.uid()%user_id%' AS check_mentions_user_ownership
FROM pg_policies p
WHERE p.schemaname = 'public' AND p.tablename = 'subscriptions'
ORDER BY p.policyname;

SELECT r.rolname AS role_name, v.privilege,
       has_table_privilege(r.oid, c.oid, v.privilege) AS effective_table_grant
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN pg_roles r CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) v(privilege)
WHERE n.nspname = 'public' AND c.relname = 'subscriptions'
  AND r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY r.rolname, v.privilege;

SELECT r.rolname AS role_name, a.attname AS column_name,
       has_column_privilege(r.oid, c.oid, a.attnum, 'UPDATE') AS effective_column_update_grant
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
CROSS JOIN pg_roles r
WHERE n.nspname = 'public' AND c.relname = 'subscriptions'
  AND r.rolname IN ('anon', 'authenticated') AND NOT a.attisdropped
  AND a.attname IN ('user_id','plan_type','status','stripe_customer_id','stripe_subscription_id',
                   'stripe_price_id','is_lifetime','trial_end','grace_period_ends_at','current_period_end')
ORDER BY r.rolname, a.attname;

SELECT a.attname AS column_name, format_type(a.atttypid, a.atttypmod) AS data_type,
       a.attnotnull AS not_null
FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'subscriptions' AND NOT a.attisdropped
  AND a.attname IN ('user_id','plan_type','status','stripe_customer_id','stripe_subscription_id',
                   'stripe_price_id','is_lifetime','trial_end','grace_period_ends_at','current_period_end')
ORDER BY a.attnum;

SELECT k.conname AS constraint_name, k.contype AS constraint_type,
       CASE WHEN k.contype = 'c' THEN pg_get_constraintdef(k.oid) LIKE '%status%' END AS checks_status,
       CASE WHEN k.contype = 'c' THEN pg_get_constraintdef(k.oid) LIKE '%incomplete%' END AS permits_incomplete_literal,
       CASE WHEN k.contype = 'c' THEN pg_get_constraintdef(k.oid) LIKE '%unpaid%' END AS permits_unpaid_literal,
       CASE WHEN k.contype = 'c' THEN pg_get_constraintdef(k.oid) LIKE '%paused%' END AS permits_paused_literal
FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'subscriptions'
ORDER BY k.conname;

SELECT p.proname AS function_name, p.prosecdef AS security_definer,
       EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) x WHERE x LIKE 'search_path=%') AS sets_search_path,
       pg_get_functiondef(p.oid) LIKE '%auth.uid()%' AS mentions_authenticated_owner_check,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN ('get_or_create_usage','increment_feature_usage');
ROLLBACK;
