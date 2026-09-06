import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

function extFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

/** Save an image File from FormData under public/{folder}. Returns public URL path or null. */
export async function saveImageUpload(
  file: FormDataEntryValue | null,
  folder: "uploads" | "covers" = "uploads",
): Promise<string | null> {
  if (!file || typeof file === "string") return null;
  if (!file.size) return null;
  if (!ALLOWED.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP or GIF images are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be under 5MB.");
  }
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${extFor(file.type)}`;
  const dir = path.join(process.cwd(), "public", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/${folder}/${name}`;
}

export function newInviteToken() {
  return randomBytes(12).toString("hex");
}
