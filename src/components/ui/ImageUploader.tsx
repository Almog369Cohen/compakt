"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { uploadImage, deleteImage } from "@/lib/storage";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  userId: string;
  maxImages?: number;
  folder?: "gallery" | "screenshots";
}

export function ImageUploader({
  images,
  onChange,
  userId,
  maxImages = 10,
  folder = "gallery",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArr.length === 0) return;

      const remaining = maxImages - images.length;
      if (remaining <= 0) {
        setError(`ניתן להעלות עד ${maxImages} תמונות`);
        return;
      }

      const toUpload = fileArr.slice(0, remaining);
      setUploading(true);
      setError(null);

      const newUrls: string[] = [];
      for (const file of toUpload) {
        try {
          const url = await uploadImage(file, userId, folder);
          newUrls.push(url);
        } catch (e) {
          setError(e instanceof Error ? e.message : "שגיאה בהעלאה");
        }
      }

      if (newUrls.length > 0) {
        onChange([...images, ...newUrls]);
      }
      setUploading(false);
    },
    [images, onChange, userId, maxImages, folder]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleRemove = async (index: number) => {
    const url = images[index];
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
    // Try to delete from storage (best-effort)
    try {
      await deleteImage(url);
    } catch {
      // ignore
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    const updated = [...images];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="relative group rounded-xl overflow-hidden border border-glass">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`תמונה ${i + 1}`}
                className="w-full h-24 object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              {/* Controls overlay */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleRemove(i)}
                  className="p-1 rounded-full bg-red-500/90 text-white hover:bg-red-600 transition-colors"
                  title="הסר"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {images.length > 1 && (
                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3 text-white/60" />
                  {i > 0 && (
                    <button
                      onClick={() => handleMove(i, "up")}
                      className="p-0.5 rounded bg-black/60 text-white hover:bg-black/80"
                      title="הזז שמאלה"
                    >
                      <ChevronUp className="w-3 h-3 -rotate-90" />
                    </button>
                  )}
                  {i < images.length - 1 && (
                    <button
                      onClick={() => handleMove(i, "down")}
                      className="p-0.5 rounded bg-black/60 text-white hover:bg-black/80"
                      title="הזז ימינה"
                    >
                      <ChevronDown className="w-3 h-3 -rotate-90" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            dragOver
              ? "border-brand-blue bg-brand-blue/5"
              : "border-glass hover:border-brand-blue/50"
          }`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-muted" />
          )}
          <span className="text-xs text-muted text-center">
            {uploading
              ? "מעלה..."
              : `גררו תמונות לכאן או לחצו לבחירה (${images.length}/${maxImages})`}
          </span>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
