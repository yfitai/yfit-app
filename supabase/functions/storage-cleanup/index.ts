// YFIT Storage Cleanup Edge Function
// Deletes files older than 7 days from yfit-videos and yfit-voiceovers buckets
// Scheduled to run daily at 3:00 AM UTC via pg_cron

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKETS = ["yfit-videos", "yfit-voiceovers"];
const MAX_AGE_DAYS = 7;
const BATCH_SIZE = 100;

Deno.serve(async (req: Request) => {
  // Allow manual trigger via POST, or scheduled trigger
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!serviceRoleKey || !supabaseUrl) {
    return new Response(
      JSON.stringify({ error: "Missing environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);

  const results: Record<string, { deleted: number; freed_mb: number; errors: string[] }> = {};
  let totalDeleted = 0;
  let totalFreedBytes = 0;

  for (const bucket of BUCKETS) {
    results[bucket] = { deleted: 0, freed_mb: 0, errors: [] };

    try {
      // List all files in the bucket (paginated)
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: files, error: listError } = await supabase.storage
          .from(bucket)
          .list("", {
            limit: BATCH_SIZE,
            offset,
            sortBy: { column: "created_at", order: "asc" },
          });

        if (listError) {
          results[bucket].errors.push(`List error: ${listError.message}`);
          break;
        }

        if (!files || files.length === 0) {
          hasMore = false;
          break;
        }

        // Filter files older than cutoff
        const oldFiles = files.filter((file) => {
          const createdAt = new Date(file.created_at);
          return createdAt < cutoffDate;
        });

        if (oldFiles.length > 0) {
          const filePaths = oldFiles.map((f) => f.name);
          const totalSize = oldFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);

          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove(filePaths);

          if (deleteError) {
            results[bucket].errors.push(`Delete error: ${deleteError.message}`);
          } else {
            results[bucket].deleted += oldFiles.length;
            results[bucket].freed_mb += totalSize / (1024 * 1024);
            totalDeleted += oldFiles.length;
            totalFreedBytes += totalSize;
          }
        }

        // If we got fewer than BATCH_SIZE, we've reached the end
        if (files.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          offset += BATCH_SIZE;
        }
      }

      // Also check subfolders (videos/ prefix)
      const prefixes = ["videos/", "captions/", "thumbnails/", ""];
      for (const prefix of prefixes) {
        if (prefix === "") continue; // already handled above

        let subOffset = 0;
        let subHasMore = true;

        while (subHasMore) {
          const { data: subFiles, error: subListError } = await supabase.storage
            .from(bucket)
            .list(prefix, {
              limit: BATCH_SIZE,
              offset: subOffset,
              sortBy: { column: "created_at", order: "asc" },
            });

          if (subListError || !subFiles || subFiles.length === 0) {
            subHasMore = false;
            break;
          }

          const oldSubFiles = subFiles.filter((file) => {
            const createdAt = new Date(file.created_at);
            return createdAt < cutoffDate && file.name !== ".emptyFolderPlaceholder";
          });

          if (oldSubFiles.length > 0) {
            const filePaths = oldSubFiles.map((f) => `${prefix}${f.name}`);
            const totalSize = oldSubFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);

            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove(filePaths);

            if (!deleteError) {
              results[bucket].deleted += oldSubFiles.length;
              results[bucket].freed_mb += totalSize / (1024 * 1024);
              totalDeleted += oldSubFiles.length;
              totalFreedBytes += totalSize;
            }
          }

          if (subFiles.length < BATCH_SIZE) {
            subHasMore = false;
          } else {
            subOffset += BATCH_SIZE;
          }
        }
      }

      results[bucket].freed_mb = Math.round(results[bucket].freed_mb * 100) / 100;
    } catch (err) {
      results[bucket].errors.push(`Unexpected error: ${err}`);
    }
  }

  const summary = {
    timestamp: new Date().toISOString(),
    cutoff_date: cutoffDate.toISOString(),
    total_deleted: totalDeleted,
    total_freed_mb: Math.round((totalFreedBytes / (1024 * 1024)) * 100) / 100,
    buckets: results,
    message:
      totalDeleted > 0
        ? `Cleaned up ${totalDeleted} files, freed ${Math.round(totalFreedBytes / (1024 * 1024))} MB`
        : "No files older than 7 days found",
  };

  console.log("Storage cleanup result:", JSON.stringify(summary));

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
