import { createPost } from "@/app/actions";
import { AddPhotoButton } from "@/components/AddPhotoButton";
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
          <div>
            <span className="label">Photo</span>
            <AddPhotoButton inputId="composer-image" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {canOfficial ? (
              <label className="text-ui text-ink">
                <input type="checkbox" name="official" className="mr-2 accent-brand" />
                Official update
              </label>
            ) : (
              <span />
            )}
            <button type="submit" className="btn">
              Post
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
