import { supabase } from "@/lib/supabase";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "dj-media";

/**
 * Upload an image file via the server-side API route (bypasses Storage RLS).
 * Returns the public URL on success.
 */
export async function uploadImage(
  file: File,
  userId: string,
  folder: "gallery" | "screenshots" = "gallery",
  onProgress?: (pct: number) => void
): Promise<string> {
  // Basic validation (client-side, before sending)
  if (!file.type.startsWith("image/")) {
    throw new Error("הקובץ חייב להיות תמונה");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("גודל הקובץ חייב להיות עד 5MB");
  }

  onProgress?.(10);

  const form = new FormData();
  form.append("file", file);
  form.append("userId", userId);
  form.append("folder", folder);

  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const data = await res.json();

  onProgress?.(90);

  if (!res.ok) {
    throw new Error(data.error || "שגיאה בהעלאה");
  }

  onProgress?.(100);
  return data.url;
}

/**
 * Delete an image from Supabase Storage by its public URL.
 */
export async function deleteImage(publicUrl: string): Promise<void> {
  if (!supabase) return;

  // Extract path from public URL
  // URL format: https://<project>.supabase.co/storage/v1/object/public/dj-media/<path>
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return; // Not a storage URL, skip

  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
}
