import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

export const runtime = "nodejs";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function sanitizeExt(filename: string): string {
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "";
  return ext.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const bucketName = requireEnv("GCS_BUCKET");
    const form = await req.formData();

    const file = form.get("file");
    if (!(file instanceof File)) {
      return new NextResponse("Missing file", { status: 400 });
    }

    const kind = String(form.get("kind") || "file");
    const safeKind = kind.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20) || "file";

    const ext = sanitizeExt(file.name);
    const objectName = `uploads/${safeKind}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

    const storage = new Storage();
    const bucket = storage.bucket(bucketName);

    const buf = Buffer.from(await file.arrayBuffer());

    await bucket.file(objectName).save(buf, {
      contentType: file.type || "application/octet-stream",
      resumable: false,
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
      },
    });

    return NextResponse.json({ url: `/api/uploads/${objectName}` });
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "Upload failed", { status: 500 });
  }
}
