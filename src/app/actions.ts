"use server";
import bcrypt from "bcryptjs";
import { GroupType, MembershipRole, NotificationType, Role } from "@/generated/prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { newInviteToken, saveImageUpload } from "@/lib/uploads";

function value(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}
async function requireUser() {
  const s = await getSession();
  if (!s.userId) redirect("/login");
  return s.userId;
}
function withError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function canModerateGroup(userId: string, groupId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.role === Role.ADMIN) return true;
  const m = await db.membership.findUnique({ where: { userId_groupId: { userId, groupId } } });
  return !!m && m.role !== MembershipRole.MEMBER;
}

async function notify(opts: {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
  actorId?: string;
  postId?: string;
  groupId?: string;
}) {
  if (opts.actorId && opts.actorId === opts.userId) return;
  await db.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      message: opts.message,
      link: opts.link ?? null,
      actorId: opts.actorId ?? null,
      postId: opts.postId ?? null,
      groupId: opts.groupId ?? null,
    },
  });
}

export async function register(form: FormData) {
  const name = value(form, "name"),
    email = value(form, "email").toLowerCase(),
    password = value(form, "password");
  const isOwner = value(form, "accountType") === "venue_owner";
  if (name.length < 2 || !email.includes("@") || password.length < 8)
    withError("/register", "Use a valid name, email and password of at least 8 characters.");
  if (await db.user.findUnique({ where: { email } }))
    withError("/register", "An account with that email already exists.");
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: isOwner ? Role.VENUE_OWNER : Role.ANGLER,
    },
  });
  const session = await getSession();
  session.userId = user.id;
  await session.save();
  redirect(isOwner ? "/owner?welcome=1" : "/feed");
}

export async function login(form: FormData) {
  const email = value(form, "email").toLowerCase(),
    password = value(form, "password");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    withError("/login", "Email or password is incorrect.");
  const session = await getSession();
  session.userId = user.id;
  await session.save();
  redirect("/feed");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}

export async function createVenue(form: FormData) {
  const userId = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.role !== Role.VENUE_OWNER && user.role !== Role.ADMIN)
    withError("/owner", "Only venue owners can register venues.");
  const name = value(form, "name"),
    location = value(form, "location"),
    description = value(form, "description");
  if (name.length < 2 || location.length < 2 || description.length < 10)
    withError("/owner/new", "Please complete every field (description: 10+ characters).");
  const base = slugify(name) || "venue";
  let slug = base;
  let n = 2;
  while (await db.venue.findUnique({ where: { slug } })) slug = `${base}-${n++}`;
  const venue = await db.$transaction(async (tx) => {
    const venue = await tx.venue.create({
      data: { name, slug, location, description, ownerId: userId },
    });
    const group = await tx.group.create({
      data: {
        name,
        slug: `venue-${slug}`,
        description: `The official group for ${name}.`,
        type: GroupType.VENUE,
        venueId: venue.id,
        inviteToken: newInviteToken(),
      },
    });
    await tx.membership.create({
      data: { userId, groupId: group.id, role: MembershipRole.OWNER },
    });
    return venue;
  });
  redirect(`/owner/venues/${venue.slug}`);
}

export async function joinGroup(form: FormData) {
  const userId = await requireUser(),
    groupId = value(form, "groupId"),
    slug = value(form, "slug");
  const existing = await db.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (!existing) {
    await db.membership.create({ data: { userId, groupId } });
    const [actor, owners] = await Promise.all([
      db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } }),
      db.membership.findMany({
        where: { groupId, role: { in: [MembershipRole.OWNER, MembershipRole.MODERATOR] } },
        select: { userId: true },
      }),
    ]);
    const group = await db.group.findUnique({ where: { id: groupId }, select: { name: true, slug: true } });
    for (const o of owners) {
      await notify({
        userId: o.userId,
        type: NotificationType.MEMBER_JOIN,
        message: `${actor.name} joined ${group?.name ?? "your group"}`,
        link: `/groups/${group?.slug ?? slug}?tab=members`,
        actorId: userId,
        groupId,
      });
    }
  }
  revalidatePath(`/groups/${slug}`);
  revalidatePath("/me/notifications");
}

export async function leaveGroup(form: FormData) {
  const userId = await requireUser(),
    groupId = value(form, "groupId"),
    slug = value(form, "slug");
  await db.membership.deleteMany({
    where: { userId, groupId, role: MembershipRole.MEMBER },
  });
  revalidatePath(`/groups/${slug}`);
}

export async function joinByInvite(form: FormData) {
  const userId = await requireUser();
  const token = value(form, "token");
  const group = await db.group.findUnique({ where: { inviteToken: token } });
  if (!group) withError(`/join/${token}`, "This invite link is invalid or has been regenerated.");
  const existing = await db.membership.findUnique({
    where: { userId_groupId: { userId, groupId: group.id } },
  });
  if (!existing) {
    await db.membership.create({ data: { userId, groupId: group.id } });
    const actor = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true },
    });
    const owners = await db.membership.findMany({
      where: { groupId: group.id, role: { in: [MembershipRole.OWNER, MembershipRole.MODERATOR] } },
      select: { userId: true },
    });
    for (const o of owners) {
      await notify({
        userId: o.userId,
        type: NotificationType.MEMBER_JOIN,
        message: `${actor.name} joined ${group.name} via invite`,
        link: `/groups/${group.slug}?tab=members`,
        actorId: userId,
        groupId: group.id,
      });
    }
  }
  redirect(`/groups/${group.slug}`);
}

export async function regenerateInvite(form: FormData) {
  const userId = await requireUser();
  const groupId = value(form, "groupId");
  const venueSlug = value(form, "venueSlug");
  if (!(await canModerateGroup(userId, groupId)))
    withError(`/owner/venues/${venueSlug}`, "You do not have permission to manage invites.");
  await db.group.update({ where: { id: groupId }, data: { inviteToken: newInviteToken() } });
  revalidatePath(`/owner/venues/${venueSlug}`);
}

export async function createPost(form: FormData) {
  const userId = await requireUser(),
    groupId = value(form, "groupId"),
    body = value(form, "body");
  let slug = value(form, "slug");
  if (!groupId) withError(slug ? `/groups/${slug}` : "/feed", "Choose a group before posting.");
  if (!slug) {
    const g = await db.group.findUnique({ where: { id: groupId }, select: { slug: true } });
    if (!g) withError("/feed", "That group could not be found.");
    slug = g.slug;
  }
  if (!body || body.length > 2000)
    withError(`/groups/${slug}`, "Posts must be between 1 and 2,000 characters.");
  const member = await db.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (!member) withError(`/groups/${slug}`, "Join this group before posting.");
  const official = form.get("official") === "on" && member.role !== MembershipRole.MEMBER;

  let imageUrl: string | null = null;
  try {
    imageUrl = await saveImageUpload(form.get("image"), "uploads");
  } catch (e) {
    withError(slug ? `/groups/${slug}` : "/compose", e instanceof Error ? e.message : "Upload failed.");
  }

  await db.post.create({
    data: { body, groupId, authorId: userId, official, imageUrl },
  });
  revalidatePath(`/groups/${slug}`);
  revalidatePath("/feed");
  revalidatePath("/compose");
  if (value(form, "returnTo") === "compose") redirect("/feed");
}

export async function togglePin(form: FormData) {
  const userId = await requireUser(),
    postId = value(form, "postId"),
    slug = value(form, "slug");
  const post = await db.post.findUniqueOrThrow({
    where: { id: postId },
    include: { group: true },
  });
  if (!(await canModerateGroup(userId, post.groupId)))
    withError(`/groups/${slug || post.group.slug}`, "You do not have permission to pin posts.");
  await db.post.update({ where: { id: postId }, data: { pinned: !post.pinned } });
  revalidatePath(`/groups/${post.group.slug}`);
  const venueSlug = value(form, "venueSlug");
  if (venueSlug) revalidatePath(`/owner/venues/${venueSlug}`);
}

export async function toggleOfficial(form: FormData) {
  const userId = await requireUser(),
    postId = value(form, "postId");
  const post = await db.post.findUniqueOrThrow({
    where: { id: postId },
    include: { group: true },
  });
  if (!(await canModerateGroup(userId, post.groupId)))
    withError(`/groups/${post.group.slug}`, "You do not have permission to mark official posts.");
  await db.post.update({ where: { id: postId }, data: { official: !post.official } });
  revalidatePath(`/groups/${post.group.slug}`);
  const venueSlug = value(form, "venueSlug");
  if (venueSlug) revalidatePath(`/owner/venues/${venueSlug}`);
}

export async function toggleLike(form: FormData) {
  const userId = await requireUser();
  const postId = value(form, "postId");
  const returnPath = value(form, "returnPath") || "/feed";
  const existing = await db.reaction.findUnique({
    where: { userId_postId_type: { userId, postId, type: "LIKE" } },
  });
  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } });
  } else {
    await db.reaction.create({ data: { userId, postId, type: "LIKE" } });
  }
  revalidatePath(returnPath);
  revalidatePath("/feed");
}

export async function createComment(form: FormData) {
  const userId = await requireUser();
  const postId = value(form, "postId");
  const body = value(form, "body");
  const returnPath = value(form, "returnPath") || "/feed";
  if (!body || body.length > 1000)
    withError(returnPath, "Comments must be between 1 and 1,000 characters.");
  const post = await db.post.findUniqueOrThrow({
    where: { id: postId },
    include: { group: { select: { id: true, slug: true } }, author: { select: { id: true } } },
  });
  const member = await db.membership.findUnique({
    where: { userId_groupId: { userId, groupId: post.groupId } },
  });
  if (!member) withError(returnPath, "Join the group before commenting.");
  await db.comment.create({ data: { body, postId, authorId: userId } });
  const actor = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true },
  });
  await notify({
    userId: post.authorId,
    type: NotificationType.COMMENT,
    message: `${actor.name} commented on your post`,
    link: `/groups/${post.group.slug}#post-${postId}`,
    actorId: userId,
    postId,
    groupId: post.groupId,
  });
  revalidatePath(returnPath);
  revalidatePath(`/groups/${post.group.slug}`);
  revalidatePath("/feed");
  revalidatePath("/me/notifications");
}

export async function updateVenue(form: FormData) {
  const userId = await requireUser();
  const venueSlug = value(form, "venueSlug");
  const venue = await db.venue.findUniqueOrThrow({
    where: { slug: venueSlug },
    include: { group: true },
  });
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (venue.ownerId !== userId && user.role !== Role.ADMIN)
    withError(`/owner/venues/${venueSlug}`, "You do not own this venue.");

  const name = value(form, "name");
  const location = value(form, "location");
  const description = value(form, "description");
  const groupDescription = value(form, "groupDescription");
  if (name.length < 2 || location.length < 2 || description.length < 10)
    withError(`/owner/venues/${venueSlug}`, "Please complete every field (description: 10+ characters).");

  let coverUrl: string | undefined;
  try {
    const uploaded = await saveImageUpload(form.get("cover"), "covers");
    if (uploaded) coverUrl = uploaded;
  } catch (e) {
    withError(`/owner/venues/${venueSlug}`, e instanceof Error ? e.message : "Cover upload failed.");
  }

  await db.$transaction(async (tx) => {
    await tx.venue.update({
      where: { id: venue.id },
      data: { name, location, description },
    });
    if (venue.group) {
      await tx.group.update({
        where: { id: venue.group.id },
        data: {
          name,
          description: groupDescription || venue.group.description,
          ...(coverUrl ? { coverUrl } : {}),
        },
      });
    }
  });
  revalidatePath(`/owner/venues/${venueSlug}`);
  if (venue.group) revalidatePath(`/groups/${venue.group.slug}`);
  revalidatePath("/owner");
  revalidatePath("/discover");
}

export async function removeMember(form: FormData) {
  const userId = await requireUser();
  const membershipId = value(form, "membershipId");
  const venueSlug = value(form, "venueSlug");
  const membership = await db.membership.findUniqueOrThrow({
    where: { id: membershipId },
    include: { group: { include: { venue: true } } },
  });
  if (!(await canModerateGroup(userId, membership.groupId)))
    withError(`/owner/venues/${venueSlug}`, "You do not have permission to manage members.");
  if (membership.role === MembershipRole.OWNER)
    withError(`/owner/venues/${venueSlug}`, "You cannot remove the group owner.");
  await db.membership.delete({ where: { id: membershipId } });
  revalidatePath(`/owner/venues/${venueSlug}`);
  revalidatePath(`/groups/${membership.group.slug}`);
}

export async function markNotificationsRead() {
  const userId = await requireUser();
  await db.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  revalidatePath("/me/notifications");
  revalidatePath("/me");
}
