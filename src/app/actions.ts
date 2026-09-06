"use server";
import bcrypt from "bcryptjs";
import { GroupType, MembershipRole, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

function value(form: FormData, key: string) { return String(form.get(key) || "").trim(); }
async function requireUser() { const s = await getSession(); if (!s.userId) redirect("/login"); return s.userId; }
function withError(path: string, message: string): never { redirect(`${path}?error=${encodeURIComponent(message)}`); }

export async function register(form: FormData) {
  const name = value(form, "name"), email = value(form, "email").toLowerCase(), password = value(form, "password");
  const isOwner = value(form, "accountType") === "venue_owner";
  if (name.length < 2 || !email.includes("@") || password.length < 8) withError("/register", "Use a valid name, email and password of at least 8 characters.");
  if (await db.user.findUnique({ where: { email } })) withError("/register", "An account with that email already exists.");
  const user = await db.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12), role: isOwner ? Role.VENUE_OWNER : Role.ANGLER } });
  const session = await getSession(); session.userId = user.id; await session.save();
  redirect(isOwner ? "/owner?welcome=1" : "/discover");
}
export async function login(form: FormData) {
  const email = value(form, "email").toLowerCase(), password = value(form, "password");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) withError("/login", "Email or password is incorrect.");
  const session = await getSession(); session.userId = user.id; await session.save(); redirect("/feed");
}
export async function logout() { const session = await getSession(); session.destroy(); redirect("/"); }
export async function createVenue(form: FormData) {
  const userId = await requireUser(); const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.role !== Role.VENUE_OWNER && user.role !== Role.ADMIN) withError("/owner", "Only venue owners can register venues.");
  const name = value(form, "name"), location = value(form, "location"), description = value(form, "description");
  if (name.length < 2 || location.length < 2 || description.length < 10) withError("/owner/new", "Please complete every field (description: 10+ characters).");
  const base = slugify(name) || "venue"; let slug = base; let n = 2; while (await db.venue.findUnique({ where: { slug } })) slug = `${base}-${n++}`;
  const venue = await db.$transaction(async tx => {
    const venue = await tx.venue.create({ data: { name, slug, location, description, ownerId: userId } });
    const group = await tx.group.create({ data: { name, slug: `venue-${slug}`, description: `The official group for ${name}.`, type: GroupType.VENUE, venueId: venue.id } });
    await tx.membership.create({ data: { userId, groupId: group.id, role: MembershipRole.OWNER } }); return venue;
  });
  redirect(`/owner/venues/${venue.slug}`);
}
export async function joinGroup(form: FormData) {
  const userId = await requireUser(), groupId = value(form, "groupId"), slug = value(form, "slug");
  await db.membership.upsert({ where: { userId_groupId: { userId, groupId } }, update: {}, create: { userId, groupId } });
  revalidatePath(`/groups/${slug}`);
}
export async function leaveGroup(form: FormData) {
  const userId = await requireUser(), groupId = value(form, "groupId"), slug = value(form, "slug");
  await db.membership.deleteMany({ where: { userId, groupId, role: MembershipRole.MEMBER } }); revalidatePath(`/groups/${slug}`);
}
export async function createPost(form: FormData) {
  const userId = await requireUser(), groupId = value(form, "groupId"), slug = value(form, "slug"), body = value(form, "body");
  if (!body || body.length > 2000) withError(`/groups/${slug}`, "Posts must be between 1 and 2,000 characters.");
  const member = await db.membership.findUnique({ where: { userId_groupId: { userId, groupId } } });
  if (!member) withError(`/groups/${slug}`, "Join this group before posting.");
  const official = form.get("official") === "on" && member.role !== MembershipRole.MEMBER;
  await db.post.create({ data: { body, groupId, authorId: userId, official } }); revalidatePath(`/groups/${slug}`); revalidatePath("/feed");
}
export async function togglePin(form: FormData) {
  const userId = await requireUser(), postId = value(form, "postId"), slug = value(form, "slug");
  const post = await db.post.findUniqueOrThrow({ where: { id: postId }, include: { group: { include: { memberships: { where: { userId } } } } } });
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.role !== Role.ADMIN && post.group.memberships[0]?.role === MembershipRole.MEMBER) withError(`/groups/${slug}`, "You do not have permission to pin posts.");
  if (user.role !== Role.ADMIN && !post.group.memberships[0]) withError(`/groups/${slug}`, "You do not have permission to pin posts.");
  await db.post.update({ where: { id: postId }, data: { pinned: !post.pinned } }); revalidatePath(`/groups/${slug}`);
}
