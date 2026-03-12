#!/usr/bin/env python3
import json
import subprocess
import sys
from pathlib import Path

PROJECT = "compakt-488215"
REGION = "us-central1"
SERVICE = "compakt"
IMAGE = "us-central1-docker.pkg.dev/compakt-488215/compakt/compakt:3e19ba8-clerkfix3"
GIT_SHA = "3e19ba8-clerkfix3"
ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / ".cloudbuild-manual.yaml"


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, cwd=str(ROOT))


def get_service_env() -> dict[str, str]:
    raw = subprocess.check_output(
        [
            "gcloud",
            "run",
            "services",
            "describe",
            SERVICE,
            f"--project={PROJECT}",
            f"--region={REGION}",
            "--format=json",
        ],
        text=True,
        cwd=str(ROOT),
    )
    service = json.loads(raw)
    return {
        item.get("name"): item.get("value", "")
        for item in service["spec"]["template"]["spec"]["containers"][0].get("env", [])
    }


def main() -> int:
    envs = get_service_env()
    substitutions = {
        "_IMAGE": IMAGE,
        "_NEXT_PUBLIC_GIT_SHA": GIT_SHA,
        "_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": envs.get("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", ""),
        "_CLERK_SECRET_KEY": envs.get("CLERK_SECRET_KEY", ""),
        "_NEXT_PUBLIC_SUPABASE_URL": envs.get("NEXT_PUBLIC_SUPABASE_URL", ""),
        "_NEXT_PUBLIC_SUPABASE_ANON_KEY": envs.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""),
        "_NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET": envs.get("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET", "dj-media"),
        "_SUPABASE_SERVICE_ROLE_KEY": envs.get("SUPABASE_SERVICE_ROLE_KEY", ""),
    }
    serialized = ",".join(f"{key}={value}" for key, value in substitutions.items())

    run([
        "gcloud",
        "builds",
        "submit",
        f"--project={PROJECT}",
        f"--config={CONFIG}",
        f"--substitutions={serialized}",
        ".",
    ])
    run([
        "gcloud",
        "run",
        "deploy",
        SERVICE,
        f"--project={PROJECT}",
        f"--region={REGION}",
        "--image",
        IMAGE,
        "--allow-unauthenticated",
    ])
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        raise SystemExit(exc.returncode)
