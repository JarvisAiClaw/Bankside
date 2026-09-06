"use client";

import { useRef, useState } from "react";
import { createPost } from "@/app/actions";
import { Avatar } from "@/components/ui";

export function Composer({
  userName,
  groups,
  fixedGroup,
  canOfficial = false,
  returnTo,
}: {
  userName: string;
  groups?: { id: string; slug: string; name: string }[];
  fixedGroup?: { id: string; slug: string };
  canOfficial?: boolean;
  returnTo?: string;
}) {
  const needsPicker = !fixedGroup && groups && groups.length > 0;
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  if (!fixedGroup && (!groups || !groups.length)) return null;

  return (
    <form action={createPost} className="bg-surface px-4 py-3" encType="multipart/form-data">
      {fixedGroup ? (
        <>
          <input type="hidden" name="groupId" value={fixedGroup.id} />
          <input type="hidden" name="slug" value={fixedGroup.slug} />
        </>
      ) : null}
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <div className="flex gap-3">
        <Avatar name={userName} size={40} />
        <div className="min-w-0 flex-1 space-y-3">
          {needsPicker ? (
            <div>
              <label className="label" htmlFor="composer-group">
                Post to
              </label>
              <select id="composer-group" name="groupId" className="field" required defaultValue="">
                <option value="" disabled>
                  Choose a group
                </option>
                {groups!.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <input type="hidden" name="slug" value="" />
            </div>
          ) : null}
          <div>
            <label className="sr-only" htmlFor="composer-body">
              Post body
            </label>
            <textarea
              id="composer-body"
              name="body"
              className="field min-h-[88px] resize-y py-2.5"
              maxLength={2000}
              required
              placeholder="What’s happening at the water?"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                id="composer-image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFileLabel(f ? f.name : null);
                }}
              />
              <button
                type="button"
                className="btn-secondary !min-h-10"
                onClick={() => fileRef.current?.click()}
              >
                Add photo
              </button>
              {fileLabel ? (
                <span className="max-w-[12rem] truncate text-meta text-muted" title={fileLabel}>
                  {fileLabel}
                </span>
              ) : (
                <span className="text-meta text-muted">Optional</span>
              )}
              {canOfficial ? (
                <label className="ml-1 text-ui text-ink">
                  <input type="checkbox" name="official" className="mr-2 accent-brand" />
                  Official update
                </label>
              ) : null}
            </div>
            <button type="submit" className="btn">
              Post
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
