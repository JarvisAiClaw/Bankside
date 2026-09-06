"use client";

import { useId, useState } from "react";

/** Pepper polish: styled “Add photo” trigger over a visually hidden file input. */
export function AddPhotoButton({
  name = "image",
  inputId,
}: {
  name?: string;
  inputId?: string;
}) {
  const autoId = useId();
  const id = inputId ?? `composer-image-${autoId}`;
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        id={id}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setFileName(f ? f.name : null);
        }}
      />
      <label htmlFor={id} className="btn-secondary !min-h-10 cursor-pointer select-none">
        {fileName ? "Change photo" : "Add photo"}
      </label>
      {fileName ? (
        <span className="max-w-[14rem] truncate text-meta text-muted" title={fileName}>
          {fileName}
        </span>
      ) : (
        <span className="text-meta text-muted">Optional · JPEG, PNG, WebP, GIF</span>
      )}
    </div>
  );
}
