import { Storage } from "@google-cloud/storage";
import { Readable } from "node:stream";

export const runtime = "nodejs";

function requireBucketName(): string {
  const value = process.env.GCS_BUCKET || process.env.GCS_BUCKET_NAME;
  if (!value) throw new Error("Missing GCS_BUCKET");
  return value;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  try {
    const bucketName = requireBucketName();
    const { path } = await ctx.params;

    const objectName = path.join("/");
    if (!objectName || objectName.includes("..")) {
      return new Response("Invalid path", { status: 400 });
    }

    const storage = new Storage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectName);

    const [meta] = await file.getMetadata();
    const contentType = (meta.contentType as string | undefined) || "application/octet-stream";

    const nodeStream = file.createReadStream();
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Not found", { status: 404 });
  }
}
