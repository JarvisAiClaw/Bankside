import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, GroupType, Role, MembershipRole } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const DEMO_PASS = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASS, 12);

  // System global groups — add more here (seed upserts by slug). Admin flag stub: featured venues below.
  const groups = [
    ["Carp fishing", "carp-fishing", "For carp anglers: catches, tactics and waters.", "/covers/carp-fishing.jpg"],
    ["Match fishing", "match-fishing", "Match results, events and competitive angling chat.", "/covers/match-fishing.jpg"],
    ["Pleasure fishing", "pleasure-fishing", "Relaxed fishing, local tips and time by the water.", null],
    ["Predator fishing", "predator-fishing", "Pike, perch and zander — lures, deadbaits and winter tactics.", null],
    ["Specimen hunting", "specimen-hunting", "Big fish targets, tactics and venue reports.", null],
  ] as const;

  for (const [name, slug, description, coverUrl] of groups) {
    await prisma.group.upsert({
      where: { slug },
      update: { name, description, coverUrl },
      create: { name, slug, description, type: GroupType.GLOBAL, coverUrl },
    });
  }

  await prisma.user.upsert({
    where: { email: "admin@bankside.test" },
    update: {},
    create: { name: "Bankside Admin", email: "admin@bankside.test", passwordHash, role: Role.ADMIN },
  });
  const angler = await prisma.user.upsert({
    where: { email: "angler@bankside.test" },
    update: {},
    create: { name: "Alex Angler", email: "angler@bankside.test", passwordHash, role: Role.ANGLER },
  });
  const owner = await prisma.user.upsert({
    where: { email: "owner@bankside.test" },
    update: {},
    create: { name: "Vera Venue", email: "owner@bankside.test", passwordHash, role: Role.VENUE_OWNER },
  });
  const mate = await prisma.user.upsert({
    where: { email: "sam@bankside.test" },
    update: {},
    create: { name: "Sam Bank", email: "sam@bankside.test", passwordHash, role: Role.ANGLER },
  });

  const carp = await prisma.group.findUniqueOrThrow({ where: { slug: "carp-fishing" } });
  const match = await prisma.group.findUniqueOrThrow({ where: { slug: "match-fishing" } });

  for (const g of [carp, match]) {
    await prisma.membership.upsert({
      where: { userId_groupId: { userId: angler.id, groupId: g.id } },
      update: {},
      create: { userId: angler.id, groupId: g.id, role: MembershipRole.MEMBER },
    });
    await prisma.membership.upsert({
      where: { userId_groupId: { userId: mate.id, groupId: g.id } },
      update: {},
      create: { userId: mate.id, groupId: g.id, role: MembershipRole.MEMBER },
    });
  }

  let venue = await prisma.venue.findUnique({ where: { slug: "willow-lakes" } });
  // ensure featured stub for demo discover badge

  if (!venue) {
    venue = await prisma.$transaction(async (tx) => {
      const v = await tx.venue.create({
        data: {
          name: "Willow Lakes",
          slug: "willow-lakes",
          location: "Kent, UK",
          description: "A friendly mixed fishery with carp and silverfish lakes.",
          ownerId: owner.id,
          featured: true,
        },
      });
      const g = await tx.group.create({
        data: {
          name: "Willow Lakes",
          slug: "venue-willow-lakes",
          description: "The official group for Willow Lakes.",
          type: GroupType.VENUE,
          venueId: v.id,
          coverUrl: "/covers/willow-lakes.jpg",
          inviteToken: "demo-willow-invite",
        },
      });
      await tx.membership.create({ data: { userId: owner.id, groupId: g.id, role: MembershipRole.OWNER } });
      await tx.membership.create({ data: { userId: angler.id, groupId: g.id, role: MembershipRole.MEMBER } });
      await tx.post.create({
        data: {
          body: "Welcome to Willow Lakes. Gates open at dawn — please keep swims tidy.",
          official: true,
          pinned: true,
          authorId: owner.id,
          groupId: g.id,
          imageUrl: "/uploads/catch-3.jpg",
        },
      });
      return v;
    });
  } else {
    await prisma.group.update({
      where: { slug: "venue-willow-lakes" },
      data: { coverUrl: "/covers/willow-lakes.jpg", inviteToken: "demo-willow-invite" },
    });
    await prisma.venue.update({ where: { slug: "willow-lakes" }, data: { featured: true } });
    const willow = await prisma.group.findUniqueOrThrow({ where: { slug: "venue-willow-lakes" } });
    await prisma.membership.upsert({
      where: { userId_groupId: { userId: angler.id, groupId: willow.id } },
      update: {},
      create: { userId: angler.id, groupId: willow.id, role: MembershipRole.MEMBER },
    });
    // Ensure pinned official has media if missing
    const pinned = await prisma.post.findFirst({ where: { groupId: willow.id, pinned: true } });
    if (pinned && !pinned.imageUrl) {
      await prisma.post.update({ where: { id: pinned.id }, data: { imageUrl: "/uploads/catch-3.jpg" } });
    }
  }

  await prisma.venue.update({
    where: { id: venue!.id },
    data: {
      featured: true,
      rulesText:
        "• Keep to your swim and respect other anglers\n• Take litter home\n• No loud music after dusk\n• Follow all site signage",
      gateCode: "4821#",
      gateNotes: "Shut the main gate behind you. Barrier uses the same code. Codes rotate — check here before each visit.",
    },
  });

  // Media-first demo posts
  const mediaPosts = [
    {
      key: "dawn-on-carp",
      groupId: carp.id,
      authorId: angler.id,
      body: "Dawn session on the big lake — first take just after first light. Margin tactics paying off.",
      imageUrl: "/uploads/catch-2.jpg",
    },
    {
      key: "match-peg",
      groupId: match.id,
      authorId: mate.id,
      body: "Peg 14 at the weekend open. Steady silvers early, then a late carp run. Full result in the comments once they go up.",
      imageUrl: "/uploads/catch-1.jpg",
    },
    {
      key: "golden-hour",
      groupId: carp.id,
      authorId: mate.id,
      body: "Golden hour on the rods. Quiet banks, tidy gear, and one more cast before packing up.",
      imageUrl: "/uploads/catch-3.jpg",
    },
  ] as const;

  for (const mp of mediaPosts) {
    const existing = await prisma.post.findFirst({
      where: { groupId: mp.groupId, authorId: mp.authorId, body: mp.body },
    });
    if (!existing) {
      await prisma.post.create({
        data: {
          body: mp.body,
          imageUrl: mp.imageUrl,
          authorId: mp.authorId,
          groupId: mp.groupId,
        },
      });
    } else if (!existing.imageUrl) {
      await prisma.post.update({ where: { id: existing.id }, data: { imageUrl: mp.imageUrl } });
    }
  }

  const tip = await prisma.post.findFirst({ where: { groupId: carp.id, authorId: angler.id, body: { contains: "bait tips" } } });
  if (!tip) {
    await prisma.post.create({
      data: {
        body: "First trip of the season tomorrow — any bait tips for the carp lakes?",
        authorId: angler.id,
        groupId: carp.id,
      },
    });
  }

  // Demo likes + comments + notification
  const willowGroup = await prisma.group.findUnique({ where: { slug: "venue-willow-lakes" } });
  if (willowGroup) {
    const pinned = await prisma.post.findFirst({ where: { groupId: willowGroup.id, pinned: true } });
    if (pinned) {
      await prisma.reaction.upsert({
        where: { userId_postId_type: { userId: angler.id, postId: pinned.id, type: "LIKE" } },
        update: {},
        create: { userId: angler.id, postId: pinned.id, type: "LIKE" },
      });
      const existingComment = await prisma.comment.findFirst({
        where: { postId: pinned.id, authorId: angler.id, body: { contains: "Looking forward" } },
      });
      if (!existingComment) {
        await prisma.comment.create({
          data: {
            body: "Looking forward to a dawn session — thanks for the gate tip.",
            postId: pinned.id,
            authorId: angler.id,
          },
        });
        const notice = await prisma.notification.findFirst({
          where: { userId: owner.id, postId: pinned.id, type: "COMMENT" },
        });
        if (!notice) {
          await prisma.notification.create({
            data: {
              userId: owner.id,
              type: "COMMENT",
              message: "Alex Angler commented on your post",
              link: "/groups/" + willowGroup.slug + "#post-" + pinned.id,
              actorId: angler.id,
              postId: pinned.id,
              groupId: willowGroup.id,
            },
          });
        }
      }
    }
  }

  const carpPost = await prisma.post.findFirst({
    where: { groupId: carp.id, authorId: angler.id, body: { contains: "Dawn session" } },
  });
  if (carpPost) {
    await prisma.reaction.upsert({
      where: { userId_postId_type: { userId: mate.id, postId: carpPost.id, type: "LIKE" } },
      update: {},
      create: { userId: mate.id, postId: carpPost.id, type: "LIKE" },
    });
    const c = await prisma.comment.findFirst({ where: { postId: carpPost.id, authorId: mate.id } });
    if (!c) {
      await prisma.comment.create({
        data: { body: "Nice one — which bait were you on?", postId: carpPost.id, authorId: mate.id },
      });
    }
  }


  // Wave 2 demos
  const [aId, bId] = angler.id < mate.id ? [angler.id, mate.id] : [mate.id, angler.id];
  const dm = await prisma.dmThread.upsert({
    where: { userAId_userBId: { userAId: aId, userBId: bId } },
    update: {},
    create: { userAId: aId, userBId: bId },
  });
  if (!(await prisma.dmMessage.findFirst({ where: { threadId: dm.id } }))) {
    await prisma.dmMessage.create({
      data: { threadId: dm.id, senderId: mate.id, body: "Fancy a social at Willow this weekend?" },
    });
  }
  if (willowGroup) {
    await prisma.joinRequest.upsert({
      where: { groupId_userId: { groupId: willowGroup.id, userId: mate.id } },
      update: { status: "PENDING", resolvedAt: null },
      create: { groupId: willowGroup.id, userId: mate.id, status: "PENDING" },
    });
    await prisma.membership.deleteMany({
      where: { groupId: willowGroup.id, userId: mate.id, role: "MEMBER" },
    });
  }

  console.log("Seeded Wave1+Wave2 demos");
}

main().finally(() => prisma.$disconnect());
