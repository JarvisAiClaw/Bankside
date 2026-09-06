"use server";
import bcrypt from "bcryptjs";
import { GroupType, JoinRequestStatus, MembershipRole, NotificationType, Role, UserBlockKind, VenueType } from "@/generated/prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { newInviteToken, saveImageUpload } from "@/lib/uploads";
import { assertNotFlooding, assertNotDuplicateBody } from "@/lib/rate-limit";

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

async function isGroupOwner(userId: string, groupId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.role === Role.ADMIN) return true;
  const m = await db.membership.findUnique({ where: { userId_groupId: { userId, groupId } } });
  return !!m && m.role === MembershipRole.OWNER;
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
  const venueTypeRaw = value(form, "venueType").toUpperCase();
  const venueType = venueTypeRaw === "CLUB" ? VenueType.CLUB : VenueType.FISHERY;
  if (name.length < 2 || location.length < 2 || description.length < 10)
    withError("/owner/new", "Please complete every field (description: 10+ characters).");
  const base = slugify(name) || "venue";
  let slug = base;
  let n = 2;
  while (await db.venue.findUnique({ where: { slug } })) slug = `${base}-${n++}`;
  const venue = await db.$transaction(async (tx) => {
    const venue = await tx.venue.create({
      data: { name, slug, location, description, ownerId: userId, venueType },
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
  const group = await db.group.findUniqueOrThrow({ where: { id: groupId } });
  const existing = await db.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (existing) {
    revalidatePath(`/groups/${slug}`);
    return;
  }

  // Venue groups: join-request queue. Globals: open join.
  if (group.type === GroupType.VENUE) {
    const pending = await db.joinRequest.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (pending?.status === JoinRequestStatus.PENDING) {
      revalidatePath(`/groups/${slug}`);
      return;
    }
    if (pending) {
      await db.joinRequest.update({
        where: { id: pending.id },
        data: { status: JoinRequestStatus.PENDING, resolvedAt: null, note: null },
      });
    } else {
      await db.joinRequest.create({ data: { groupId, userId } });
    }
    const actor = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });
    const owners = await db.membership.findMany({
      where: { groupId, role: { in: [MembershipRole.OWNER, MembershipRole.MODERATOR] } },
      select: { userId: true },
    });
    const venue = group.venueId
      ? await db.venue.findUnique({ where: { id: group.venueId }, select: { slug: true } })
      : null;
    for (const o of owners) {
      await notify({
        userId: o.userId,
        type: NotificationType.JOIN_REQUEST,
        message: `${actor.name} requested to join ${group.name}`,
        link: venue ? `/owner/venues/${venue.slug}` : `/groups/${group.slug}`,
        actorId: userId,
        groupId,
      });
    }
    revalidatePath(`/groups/${slug}`);
    revalidatePath("/me/notifications");
    return;
  }

  await db.membership.create({ data: { userId, groupId } });
  const [actor, owners] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } }),
    db.membership.findMany({
      where: { groupId, role: { in: [MembershipRole.OWNER, MembershipRole.MODERATOR] } },
      select: { userId: true },
    }),
  ]);
  for (const o of owners) {
    await notify({
      userId: o.userId,
      type: NotificationType.MEMBER_JOIN,
      message: `${actor.name} joined ${group.name}`,
      link: `/groups/${group.slug}?tab=members`,
      actorId: userId,
      groupId,
    });
  }
  revalidatePath(`/groups/${slug}`);
  revalidatePath("/me/notifications");
}

export async function leaveGroup(form: FormData) {
  const userId = await requireUser(),
    groupId = value(form, "groupId"),
    slug = value(form, "slug");
  const membership = await db.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (!membership) {
    revalidatePath(`/groups/${slug}`);
    return;
  }
  if (membership.role === MembershipRole.OWNER)
    withError(`/groups/${slug}`, "Owners cannot leave — transfer ownership or close the venue first.");
  await db.membership.delete({ where: { id: membership.id } });
  revalidatePath(`/groups/${slug}`);
  revalidatePath("/feed");
  revalidatePath("/discover");
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
  const flood = assertNotFlooding(`post:${userId}`, { limit: 6, windowMs: 60_000 });
  if (!flood.ok)
    withError(`/groups/${slug}`, `Posting too fast — try again in ${flood.retryAfterSec}s.`);
  const dup = assertNotDuplicateBody(`post-body:${userId}`, body, 30_000);
  if (!dup.ok)
    withError(`/groups/${slug}`, `Identical post within 30s — wait ${dup.retryAfterSec}s.`);
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
  const flood = assertNotFlooding(`comment:${userId}`, { limit: 20, windowMs: 60_000 });
  if (!flood.ok)
    withError(returnPath, `Commenting too fast — try again in ${flood.retryAfterSec}s.`);
  const dup = assertNotDuplicateBody(`comment-body:${userId}`, body, 30_000);
  if (!dup.ok)
    withError(returnPath, `Identical comment within 30s — wait ${dup.retryAfterSec}s.`);
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
  revalidatePath("/feed");
}


export async function markNotificationRead(form: FormData) {
  const userId = await requireUser();
  const id = value(form, "notificationId");
  await db.notification.updateMany({ where: { id, userId }, data: { read: true } });
  revalidatePath("/me/notifications");
  revalidatePath("/me");
  revalidatePath("/feed");
}

export async function resolveJoinRequest(form: FormData) {
  const userId = await requireUser();
  const requestId = value(form, "requestId");
  const decision = value(form, "decision"); // approve | deny
  const venueSlug = value(form, "venueSlug");
  const req = await db.joinRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { group: true, user: { select: { id: true, name: true } } },
  });
  if (!(await canModerateGroup(userId, req.groupId)))
    withError(`/owner/venues/${venueSlug}`, "You do not have permission to manage join requests.");
  if (req.status !== JoinRequestStatus.PENDING)
    withError(`/owner/venues/${venueSlug}`, "This request was already resolved.");

  if (decision === "approve") {
    await db.$transaction(async (tx) => {
      await tx.joinRequest.update({
        where: { id: req.id },
        data: { status: JoinRequestStatus.APPROVED, resolvedAt: new Date() },
      });
      await tx.membership.upsert({
        where: { userId_groupId: { userId: req.userId, groupId: req.groupId } },
        update: {},
        create: { userId: req.userId, groupId: req.groupId },
      });
    });
    await notify({
      userId: req.userId,
      type: NotificationType.JOIN_APPROVED,
      message: `Your request to join ${req.group.name} was approved`,
      link: `/groups/${req.group.slug}`,
      actorId: userId,
      groupId: req.groupId,
    });
  } else {
    await db.joinRequest.update({
      where: { id: req.id },
      data: { status: JoinRequestStatus.DENIED, resolvedAt: new Date() },
    });
    await notify({
      userId: req.userId,
      type: NotificationType.JOIN_DENIED,
      message: `Your request to join ${req.group.name} was declined`,
      link: `/groups/${req.group.slug}`,
      actorId: userId,
      groupId: req.groupId,
    });
  }
  revalidatePath(`/owner/venues/${venueSlug}`);
  revalidatePath(`/groups/${req.group.slug}`);
  revalidatePath("/me/notifications");
}

export async function postNoticeTemplate(form: FormData) {
  const userId = await requireUser();
  const groupId = value(form, "groupId");
  const venueSlug = value(form, "venueSlug");
  const template = value(form, "template"); // rules | gate | update
  const custom = value(form, "body");
  if (!(await canModerateGroup(userId, groupId)))
    withError(`/owner/venues/${venueSlug}`, "You do not have permission to post notices.");
  const group = await db.group.findUniqueOrThrow({ where: { id: groupId } });

  const templates: Record<string, string> = {
    rules:
      "Fishery rules\n\n• Keep to your swim and respect other anglers\n• Take litter home\n• No loud music after dusk\n• Follow all site signage",
    gate:
      "Gate / access codes\n\nMain gate code: ____\nCar park barrier: ____\nPlease shut gates behind you. Codes may rotate — check here before each visit.",
    update:
      "Venue update\n\n" + (custom || "Quick update from the fishery team — more details soon."),
  };
  const body =
    template === "update" && custom
      ? custom
      : templates[template] || custom;
  if (!body) withError(`/owner/venues/${venueSlug}`, "Choose a template or write an update.");

  await db.post.create({
    data: {
      body,
      groupId,
      authorId: userId,
      official: true,
      pinned: template === "rules" || template === "gate",
    },
  });
  revalidatePath(`/owner/venues/${venueSlug}`);
  revalidatePath(`/groups/${group.slug}`);
  revalidatePath("/feed");
}

export async function toggleVenueFeatured(form: FormData) {
  const userId = await requireUser();
  const venueSlug = value(form, "venueSlug");
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const venue = await db.venue.findUniqueOrThrow({ where: { slug: venueSlug } });
  // Stub monetisation: owners can toggle for demo; admins always can
  if (venue.ownerId !== userId && user.role !== Role.ADMIN)
    withError(`/owner/venues/${venueSlug}`, "You do not own this venue.");
  await db.venue.update({ where: { id: venue.id }, data: { featured: !venue.featured } });
  revalidatePath(`/owner/venues/${venueSlug}`);
  revalidatePath("/discover");
  revalidatePath("/owner");
}

function dmPair(a: string, b: string) {
  return a < b ? ([a, b] as const) : ([b, a] as const);
}

export async function startDm(form: FormData) {
  const userId = await requireUser();
  const otherId = value(form, "userId");
  if (!otherId || otherId === userId) withError("/me/messages", "Choose someone to message.");
  const other = await db.user.findUnique({ where: { id: otherId } });
  if (!other) withError("/me/messages", "That user could not be found.");
  const blocked = await db.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherId, kind: UserBlockKind.BLOCK },
        { blockerId: otherId, blockedId: userId, kind: UserBlockKind.BLOCK },
      ],
    },
  });
  if (blocked) withError(`/u/${otherId}`, "Messaging is blocked between these accounts.");
  const [userAId, userBId] = dmPair(userId, otherId);
  const thread = await db.dmThread.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
  });
  redirect(`/me/messages/${thread.id}`);
}

export async function sendDm(form: FormData) {
  const userId = await requireUser();
  const threadId = value(form, "threadId");
  const body = value(form, "body");
  if (!body || body.length > 2000)
    withError(`/me/messages/${threadId}`, "Messages must be between 1 and 2,000 characters.");
  const flood = assertNotFlooding(`dm:${userId}`, { limit: 30, windowMs: 60_000 });
  if (!flood.ok)
    withError(`/me/messages/${threadId}`, `Sending too fast — try again in ${flood.retryAfterSec}s.`);
  const thread = await db.dmThread.findUniqueOrThrow({ where: { id: threadId } });
  if (thread.userAId !== userId && thread.userBId !== userId)
    withError("/me/messages", "You are not part of this conversation.");
  const otherId = thread.userAId === userId ? thread.userBId : thread.userAId;
  const blocked = await db.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherId, kind: UserBlockKind.BLOCK },
        { blockerId: otherId, blockedId: userId, kind: UserBlockKind.BLOCK },
      ],
    },
  });
  if (blocked) withError(`/me/messages/${threadId}`, "Messaging is blocked between these accounts.");
  await db.dmMessage.create({ data: { threadId, senderId: userId, body } });
  await db.dmThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
  const recipientId = thread.userAId === userId ? thread.userBId : thread.userAId;
  const actor = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });
  await notify({
    userId: recipientId,
    type: NotificationType.DM,
    message: `${actor.name} sent you a message`,
    link: `/me/messages/${threadId}`,
    actorId: userId,
  });
  revalidatePath(`/me/messages/${threadId}`);
  revalidatePath("/me/messages");
  revalidatePath("/me/notifications");
}


export async function updateVenueNoticeboard(form: FormData) {
  const userId = await requireUser();
  const venueSlug = value(form, "venueSlug");
  const rulesText = value(form, "rulesText");
  const gateCode = value(form, "gateCode");
  const gateNotes = value(form, "gateNotes");
  const publish = value(form, "publish") === "1";
  const venue = await db.venue.findUniqueOrThrow({
    where: { slug: venueSlug },
    include: { group: true },
  });
  if (venue.ownerId !== userId) {
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.role !== Role.ADMIN)
      withError(`/owner/venues/${venueSlug}`, "You do not own this venue.");
  }
  if (gateCode && gateCode.length > 64)
    withError(`/owner/venues/${venueSlug}`, "Gate code must be 64 characters or fewer.");
  if (rulesText && rulesText.length > 8000)
    withError(`/owner/venues/${venueSlug}`, "Rules text is too long.");
  if (gateNotes && gateNotes.length > 2000)
    withError(`/owner/venues/${venueSlug}`, "Gate notes are too long.");

  await db.venue.update({
    where: { id: venue.id },
    data: {
      rulesText: rulesText || null,
      gateCode: gateCode || null,
      gateNotes: gateNotes || null,
    },
  });

  if (publish && venue.group) {
    const parts: string[] = [];
    if (rulesText) parts.push(`Fishery rules\n\n${rulesText}`);
    if (gateCode || gateNotes) {
      const codeLine = gateCode ? `Main gate code: ${gateCode}` : "Main gate code: (not set)";
      const notesLine = gateNotes ? `\n${gateNotes}` : "";
      parts.push(`Gate / access\n\n${codeLine}${notesLine}\nPlease shut gates behind you.`);
    }
    if (parts.length) {
      await db.post.create({
        data: {
          body: parts.join("\n\n—\n\n"),
          groupId: venue.group.id,
          authorId: userId,
          official: true,
          pinned: true,
        },
      });
      revalidatePath(`/groups/${venue.group.slug}`);
      revalidatePath("/feed");
    }
  }

  revalidatePath(`/owner/venues/${venueSlug}`);
  if (venue.group) revalidatePath(`/groups/${venue.group.slug}`);
}

export async function cancelJoinRequest(form: FormData) {
  const userId = await requireUser();
  const groupId = value(form, "groupId");
  const slug = value(form, "slug");
  const pending = await db.joinRequest.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!pending || pending.status !== JoinRequestStatus.PENDING) {
    revalidatePath(`/groups/${slug}`);
    return;
  }
  await db.joinRequest.delete({ where: { id: pending.id } });
  revalidatePath(`/groups/${slug}`);
  revalidatePath("/me/notifications");
}

async function requireAdmin() {
  const userId = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.role !== Role.ADMIN) withError("/discover", "Admin only.");
  return userId;
}

/** Owner (or platform admin) may promote/demote MEMBER <-> MODERATOR (never OWNER). */
export async function setMemberRole(form: FormData) {
  const userId = await requireUser();
  const membershipId = value(form, "membershipId");
  const venueSlug = value(form, "venueSlug");
  const nextRole = value(form, "role"); // MEMBER | MODERATOR
  const membership = await db.membership.findUniqueOrThrow({
    where: { id: membershipId },
    include: { group: true },
  });
  if (!(await isGroupOwner(userId, membership.groupId)))
    withError(`/owner/venues/${venueSlug}`, "Only the owner can change member roles.");
  if (membership.role === MembershipRole.OWNER)
    withError(`/owner/venues/${venueSlug}`, "You cannot change the owner role.");
  if (nextRole !== "MEMBER" && nextRole !== "MODERATOR")
    withError(`/owner/venues/${venueSlug}`, "Role must be MEMBER or MODERATOR.");
  await db.membership.update({
    where: { id: membershipId },
    data: { role: nextRole === "MODERATOR" ? MembershipRole.MODERATOR : MembershipRole.MEMBER },
  });
  revalidatePath(`/owner/venues/${venueSlug}`);
  revalidatePath(`/groups/${membership.group.slug}`);
}

/** Owner/moderator hide or unhide a post (soft remove from public feeds). */
export async function hidePost(form: FormData) {
  const userId = await requireUser();
  const postId = value(form, "postId");
  const returnPath = value(form, "returnPath") || "/feed";
  const venueSlug = value(form, "venueSlug");
  const post = await db.post.findUniqueOrThrow({
    where: { id: postId },
    include: { group: true },
  });
  if (!(await canModerateGroup(userId, post.groupId)))
    withError(returnPath, "You do not have permission to hide posts.");
  await db.post.update({ where: { id: postId }, data: { hidden: !post.hidden } });
  revalidatePath(`/groups/${post.group.slug}`);
  revalidatePath("/feed");
  if (venueSlug) revalidatePath(`/owner/venues/${venueSlug}`);
  revalidatePath(returnPath);
}

/** Member report stub — notifies owners/mods; no auto-hide. */
export async function reportPost(form: FormData) {
  const userId = await requireUser();
  const postId = value(form, "postId");
  const returnPath = value(form, "returnPath") || "/feed";
  const reason = value(form, "reason") || null;
  const post = await db.post.findUniqueOrThrow({
    where: { id: postId },
    include: { group: { select: { id: true, slug: true, venueId: true } } },
  });
  const member = await db.membership.findUnique({
    where: { userId_groupId: { userId, groupId: post.groupId } },
  });
  if (!member) withError(returnPath, "Join the group before reporting.");
  const existing = await db.postReport.findUnique({
    where: { postId_reporterId: { postId, reporterId: userId } },
  });
  if (existing) {
    revalidatePath(returnPath);
    return;
  }
  await db.postReport.create({ data: { postId, reporterId: userId, reason } });
  const actor = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });
  const mods = await db.membership.findMany({
    where: { groupId: post.groupId, role: { in: [MembershipRole.OWNER, MembershipRole.MODERATOR] } },
    select: { userId: true },
  });
  const venue = post.group.venueId
    ? await db.venue.findUnique({ where: { id: post.group.venueId }, select: { slug: true } })
    : null;
  for (const m of mods) {
    await notify({
      userId: m.userId,
      type: NotificationType.POST_REPORT,
      message: `${actor.name} reported a post`,
      link: venue ? `/owner/venues/${venue.slug}` : `/groups/${post.group.slug}#post-${postId}`,
      actorId: userId,
      postId,
      groupId: post.groupId,
    });
  }
  revalidatePath(returnPath);
  revalidatePath("/me/notifications");
}

/** Admin-only featured toggle (monetisation stub — no payments). */
export async function adminToggleVenueFeatured(form: FormData) {
  await requireAdmin();
  const venueSlug = value(form, "venueSlug");
  const venue = await db.venue.findUniqueOrThrow({ where: { slug: venueSlug } });
  await db.venue.update({ where: { id: venue.id }, data: { featured: !venue.featured } });
  revalidatePath("/admin");
  revalidatePath(`/owner/venues/${venueSlug}`);
  revalidatePath("/discover");
  revalidatePath("/owner");
}

/** Admin upsert for Discover Partner brand spot (stub). */
export async function saveBrandSpot(form: FormData) {
  await requireAdmin();
  const title = value(form, "title") || "Partner";
  const body = value(form, "body");
  const href = value(form, "href");
  const active = value(form, "active") === "1";
  if (title.length > 120) withError("/admin", "Partner title must be 120 characters or fewer.");
  if (body && body.length > 500) withError("/admin", "Partner body must be 500 characters or fewer.");
  if (href && href.length > 500) withError("/admin", "Partner link must be 500 characters or fewer.");
  if (href && !(href.startsWith("/") || href.startsWith("http://") || href.startsWith("https://")))
    withError("/admin", "Partner link must start with / or http(s).");
  const existing = await db.brandSpot.findFirst({ orderBy: { updatedAt: "desc" } });
  if (existing) {
    await db.brandSpot.update({
      where: { id: existing.id },
      data: { title, body: body || null, href: href || null, active },
    });
  } else {
    await db.brandSpot.create({
      data: { title, body: body || null, href: href || null, active },
    });
  }
  revalidatePath("/admin");
  revalidatePath("/discover");
}

/** Author may edit own post body (1–2000 chars). */
export async function editOwnPost(form: FormData) {
  const userId = await requireUser();
  const postId = value(form, "postId");
  const body = value(form, "body");
  const returnPath = value(form, "returnPath") || "/feed";
  if (!body || body.length > 2000) withError(returnPath, "Posts must be between 1 and 2,000 characters.");
  const post = await db.post.findUniqueOrThrow({
    where: { id: postId },
    include: { group: { select: { slug: true } } },
  });
  if (post.authorId !== userId) {
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.role !== Role.ADMIN) withError(returnPath, "You can only edit your own posts.");
  }
  await db.post.update({ where: { id: postId }, data: { body } });
  revalidatePath(returnPath);
  revalidatePath(`/groups/${post.group.slug}`);
  revalidatePath("/feed");
}

/** Author may delete own post (hard delete). Mods use hide instead. */
export async function deleteOwnPost(form: FormData) {
  const userId = await requireUser();
  const postId = value(form, "postId");
  const returnPath = value(form, "returnPath") || "/feed";
  const post = await db.post.findUniqueOrThrow({
    where: { id: postId },
    include: { group: { select: { slug: true, venueId: true } } },
  });
  if (post.authorId !== userId) {
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.role !== Role.ADMIN) withError(returnPath, "You can only delete your own posts.");
  }
  await db.post.delete({ where: { id: postId } });
  revalidatePath(returnPath);
  revalidatePath(`/groups/${post.group.slug}`);
  revalidatePath("/feed");
  if (post.group.venueId) {
    const venue = await db.venue.findUnique({ where: { id: post.group.venueId } });
    if (venue) revalidatePath(`/owner/venues/${venue.slug}`);
  }
}

/** Alias used by PostRow / owner UI. */
export async function togglePostHidden(form: FormData) {
  return hidePost(form);
}

/** Alias for promote/demote UI. */
export async function setMembershipRole(form: FormData) {
  return setMemberRole(form);
}


/** Mute (hide from feed) or block (also stop DMs). Stub — no hard delete of history. */
export async function setUserBlock(form: FormData) {
  const userId = await requireUser();
  const targetId = value(form, "userId");
  const kindRaw = value(form, "kind").toUpperCase();
  const returnPath = value(form, "returnPath") || `/u/${targetId}`;
  if (!targetId || targetId === userId) withError(returnPath, "Choose someone else to mute or block.");
  const kind = kindRaw === "BLOCK" ? UserBlockKind.BLOCK : UserBlockKind.MUTE;
  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) withError(returnPath, "That user could not be found.");
  await db.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
    update: { kind },
    create: { blockerId: userId, blockedId: targetId, kind },
  });
  revalidatePath(returnPath);
  revalidatePath("/feed");
  revalidatePath("/me/messages");
  revalidatePath(`/u/${targetId}`);
}

export async function clearUserBlock(form: FormData) {
  const userId = await requireUser();
  const targetId = value(form, "userId");
  const returnPath = value(form, "returnPath") || `/u/${targetId}`;
  if (!targetId) withError(returnPath, "Missing user.");
  await db.userBlock.deleteMany({ where: { blockerId: userId, blockedId: targetId } });
  revalidatePath(returnPath);
  revalidatePath("/feed");
  revalidatePath("/me/messages");
  revalidatePath(`/u/${targetId}`);
}
