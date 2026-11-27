#!/usr/bin/env python3
"""Read-only verification of the four owner-approved YFIT Storage PNGs.

No uploads, mutations, generator calls, video assembly, or posting requests.
The November 26 preparation manifest is historical and remains unchanged.
"""
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path

import requests
from PIL import Image

HERE = Path(__file__).resolve().parent
PREP = HERE.parent / "2026-11-26-screenshot-restoration"
PROJECT = "mxggxpoxgqubojvumjlt"
BUCKET = "yfit-videos"
EXPECTED = {
    "assets/app-screens/screen_01_dashboard.png",
    "assets/app-screens/screen_05_fitness.png",
    "assets/app-screens/screen_10_aiCoach.png",
    "assets/app-screens/screen_06_medications.png",
}


def main():
    manifest = json.loads((PREP / "restoration_manifest.json").read_text())
    assert manifest["project_ref"] == PROJECT
    assert manifest["bucket"] == BUCKET
    assert len(manifest["assets"]) == 4
    assert {a["object_path"] for a in manifest["assets"]} == EXPECTED
    results = []
    for asset in manifest["assets"]:
        local = (PREP / asset["local_file"]).read_bytes()
        assert hashlib.sha256(local).hexdigest() == asset["sha256"]
        url = f"https://{PROJECT}.supabase.co/storage/v1/object/public/{BUCKET}/{asset['object_path']}"
        row = {
            "object_path": asset["object_path"],
            "public_url": url,
            "expected_sha256": asset["sha256"],
            "checked_at_utc": datetime.now(timezone.utc).isoformat(),
        }
        try:
            response = requests.get(url, timeout=30, allow_redirects=False)
            row["http_status"] = response.status_code
            row["content_type"] = response.headers.get("Content-Type", "")
            row["bytes"] = len(response.content)
            if response.status_code == 200:
                row["sha256"] = hashlib.sha256(response.content).hexdigest()
                image = Image.open(io.BytesIO(response.content))
                row["image_format"] = image.format
                row["width"], row["height"] = image.size
                image.verify()
                row["verified"] = all([
                    row["content_type"].split(";")[0].strip().lower() == "image/png",
                    row["image_format"] == "PNG",
                    row["width"] == asset["width"],
                    row["height"] == asset["height"],
                    row["bytes"] == asset["bytes"],
                    row["sha256"] == asset["sha256"],
                ])
            else:
                row["verified"] = False
        except Exception as error:
            row["verified"] = False
            row["error_type"] = type(error).__name__
        results.append(row)
        print(f"{asset['object_path']}: HTTP {row.get('http_status', 'unavailable')}; approved-byte match={row['verified']}", flush=True)
    receipt = {
        "schema_version": 1,
        "verified_at_utc": datetime.now(timezone.utc).isoformat(),
        "state": "restored_public_pngs_verified" if all(r["verified"] for r in results) else "verification_incomplete",
        "project_ref": PROJECT,
        "bucket": BUCKET,
        "authorization": {
            "owner_approved_at": "2026-11-27T13:24:00-05:00",
            "owner_message": "Let's use these four for now and deploy them for the next run at 6 am tommorrpw",
            "scope": "Only the four previously prepared and delivered PNGs at their exact existing renderer keys.",
        },
        "upload_actor": "owner, guided through the already signed-in Supabase dashboard",
        "owner_evidence": {
            "2026-11-27T13:32:06-05:00": "Existing authenticated yfit-videos bucket root showed captions and videos, no assets folder; search field empty.",
            "2026-11-27T13:34:35-05:00": "Owner-created assets/app-screens path visible and empty before upload.",
            "2026-11-27T13:43:51-05:00": "Owner screenshot shows the exact four filenames in assets/app-screens.",
            "images_reopened": False,
            "authenticated_api_inventory_or_upload_options_independently_observed": False,
        },
        "read_only_public_gets": 4,
        "assistant_uploads": 0,
        "generator_or_assembly_calls": 0,
        "manual_posts_or_retries": 0,
        "workflow_or_schedule_edits": 0,
        "app_or_admin_or_renderer_functional_source_changes": 0,
        "phone_build": 109,
        "other_catalog_assets": "Seven remain unchecked/unprepared; not restored by this task.",
        "next_normal_run": "2026-11-28T11:00:00Z (6 AM at the owner's agreed fixed UTC-5 schedule)",
        "future_overlay_rendering_verified": False,
        "limitations": "Public PNG readiness is verified separately from a future video. Live runtime cache and encode fallback remain unobserved; no restart or extra execution was requested.",
        "assets": results,
    }
    destination = HERE / "live-restoration-verification.json"
    destination.write_text(json.dumps(receipt, indent=2) + "\n")
    print(f"Receipt: {destination}")
    if not all(row["verified"] for row in results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
