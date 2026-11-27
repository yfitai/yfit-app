# YFIT storage access and official contract

The enabled saved Supabase URL was the dashboard of the correct `mxggxpoxgqubojvumjlt` project, not its API origin. The saved key's public project-reference metadata matched YFIT and its role was anonymous/public. No key value was printed, copied to documents or committed. The official SDK client used the established canonical project API origin, `https://mxggxpoxgqubojvumjlt.supabase.co`; no connector setting or credential was changed.

Official documentation confirms that `storage.from_(bucket).upload(...)` targets an existing bucket. New-object uploads require insert permission; upserting additionally requires select/update permissions. The documented Python options use the string `"upsert": "false"`. The attempted operation used that create-only setting and `content-type: image/png`. No bucket creation, RLS edit, deletion, overwrite, authentication bypass or account/private-record query was attempted. [1]

All eleven exact public objects were checked first. Four valid approved PNGs were preserved and seven returned the structured storage message “Object not found.” The first missing-object upload, Goals, raised `StorageApiError`; the script stopped immediately and retained no arbitrary credential-bearing exception/request output. The exact status/reason was not retained, so a specific HTTP 403 or RLS diagnosis is not claimed. After checks again found exactly the same four valid images and seven missing images. No new image was created. The owner can finish by uploading the seven prepared PNGs in the existing signed-in dashboard, without providing a secret in chat or changing permissions.

The list API documentation was also reviewed for a folder-scoped read. No storage enumeration or private-bucket listing was performed. [2]

## References

[1]: https://supabase.com/docs/reference/python/storage-from-upload "Supabase Python upload a file"
[2]: https://supabase.com/docs/reference/python/storage-from-list "Supabase Python list files in a bucket"
