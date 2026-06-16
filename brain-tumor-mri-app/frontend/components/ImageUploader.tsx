"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UploadIcon, ImageIcon, XIcon } from "./Icons";

interface ImageUploaderProps {
  /** Called with the selected file and an object URL for preview. */
  onSelect: (file: File, previewUrl: string) => void;
  onClear: () => void;
  /** Current preview URL (controlled by parent), or null when empty. */
  previewUrl: string | null;
  disabled?: boolean;
}

const ACCEPT = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

/**
 * Drag-and-drop MRI uploader with idle / drag-over / preview states.
 * Purely presentational w.r.t. inference -- it just hands the file up.
 */
export function ImageUploader({
  onSelect,
  onClear,
  previewUrl,
  disabled,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      setError(null);
      if (!file) return;
      if (!ACCEPT.includes(file.type)) {
        setError("Please upload a JPG, PNG or WebP image.");
        return;
      }
      const url = URL.createObjectURL(file);
      onSelect(file, url);
    },
    [onSelect],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      handleFile(e.dataTransfer.files?.[0]);
    },
    [disabled, handleFile],
  );

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        className="sr-only"
        aria-label="Upload MRI image"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={disabled}
      />

      <AnimatePresence mode="wait">
        {previewUrl ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface-2/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected MRI scan preview"
              className="mx-auto max-h-[340px] w-full object-contain"
            />
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-base/70 text-ink-secondary backdrop-blur transition-colors hover:border-danger/60 hover:text-danger disabled:opacity-50"
              aria-label="Remove image"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="dropzone"
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            disabled={disabled}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
              dragOver
                ? "border-cyan bg-cyan/10 shadow-glow-cyan"
                : "border-border/70 bg-surface-2/30 hover:border-cyan/50 hover:bg-surface-2/50"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <motion.span
              animate={{ y: dragOver ? -6 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors ${
                dragOver
                  ? "border-cyan/50 bg-cyan/15 text-cyan"
                  : "border-border/60 bg-surface/60 text-ink-secondary group-hover:text-cyan"
              }`}
            >
              {dragOver ? (
                <ImageIcon className="h-7 w-7" />
              ) : (
                <UploadIcon className="h-7 w-7" />
              )}
            </motion.span>
            <div className="space-y-1">
              <p className="text-base font-semibold text-ink-primary">
                {dragOver ? "Drop to upload" : "Drag & drop an MRI scan"}
              </p>
              <p className="text-sm text-ink-tertiary">
                or <span className="text-cyan">browse files</span> · JPG, PNG,
                WebP
              </p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
