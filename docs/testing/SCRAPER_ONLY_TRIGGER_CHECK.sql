-- READ-ONLY SCRAPER ISOLATION CHECK: one result set, no changes or HTTP calls.
-- Run in the existing YFIT Supabase SQL Editor. Share the complete result.
-- Checks public.scraped_articles, public.rss_sources, public.automation_logs.
-- No secret values, function bodies, trigger arguments, or table data are returned.
-- Warning flags are lexical hints, not proof that a trigger is safe.
-- This query does NOT invoke the scraper, generation, n8n, or posting.
WITH relevant AS (
  SELECT c.relname AS table_name, t.tgname AS trigger_name,
         t.tgenabled AS enabled_code, t.tgtype::integer AS event_bits,
         fn.nspname AS function_schema, p.proname AS function_name,
         lower(replace(pg_catalog.pg_get_functiondef(p.oid), '"', '')) AS function_text,
         lower(replace(pg_catalog.encode(t.tgargs, 'escape'), '"', '')) AS argument_text
  FROM pg_catalog.pg_trigger t
  JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace tn ON tn.oid = c.relnamespace
  JOIN pg_catalog.pg_proc p ON p.oid = t.tgfoid
  JOIN pg_catalog.pg_namespace fn ON fn.oid = p.pronamespace
  WHERE tn.nspname = 'public'
    AND c.relname IN ('scraped_articles', 'rss_sources', 'automation_logs')
    AND NOT t.tgisinternal
), triggers AS (
  SELECT table_name, trigger_name, enabled_code,
         pg_catalog.array_remove(ARRAY[
           CASE WHEN (event_bits & 4) <> 0 THEN 'INSERT' END,
           CASE WHEN (event_bits & 16) <> 0 THEN 'UPDATE' END,
           CASE WHEN (event_bits & 8) <> 0 THEN 'DELETE' END,
           CASE WHEN (event_bits & 32) <> 0 THEN 'TRUNCATE' END
         ], NULL) AS event_types,
         function_schema, function_name,
         (function_text || argument_text || lower(function_schema || '.' || function_name))
           ~ 'https?://|webhook|http_post|http_get|http_request|pg_net|n8n|generate|publish'
           AS has_network_or_downstream_marker,
         function_text ~ 'realtime|broadcast_changes' AS has_realtime_marker,
         function_text ~ '(^|[^[:alnum:]_])execute([^[:alnum:]_]|$)' AS has_dynamic_sql_marker,
         function_text ~ '(^|[^[:alnum:]_])(insert[[:space:]]+into|update[[:space:]]|delete[[:space:]]+from)'
           AS has_table_write_marker,
         function_text ~ '[[:alpha:]_][[:alnum:]_$]*[[:space:]]*\('
           AS may_call_functions_needs_review
  FROM relevant
), targets(table_name) AS (
  VALUES ('scraped_articles'), ('rss_sources'), ('automation_logs')
), publications AS (
  SELECT targets.table_name,
         pg_catalog.to_regclass('public.' || targets.table_name) IS NOT NULL AS table_exists,
         pt.pubname AS publication_name,
         p.pubinsert AS publishes_insert, p.pubupdate AS publishes_update,
         p.pubdelete AS publishes_delete
  FROM targets
  LEFT JOIN pg_catalog.pg_publication_tables pt
    ON pt.schemaname = 'public' AND pt.tablename = targets.table_name
  LEFT JOIN pg_catalog.pg_publication p ON p.pubname = pt.pubname
), results AS (
  SELECT 'trigger_summary' AS check_type,
         ''::text AS table_name,
         jsonb_build_object('noninternal_trigger_count', count(*)) AS safe_details
  FROM triggers
  UNION ALL
  SELECT 'trigger', triggers.table_name, to_jsonb(triggers) FROM triggers
  UNION ALL
  SELECT 'publication', publications.table_name, to_jsonb(publications) FROM publications
)
SELECT check_type, table_name, safe_details
FROM results
ORDER BY check_type, table_name;
-- Do not click Test/Invoke/Execute/Retry until the result has been reviewed.
-- No trigger rows does not exclude independent polling/scheduled consumers.
