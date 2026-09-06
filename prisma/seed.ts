import { PrismaClient, GroupType, Role, MembershipRole } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const DEMO_PASS = "password123";
async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASS, 12);
  const groups = [
    ["Carp fishing", "carp-fishing", "For carp anglers: catches, tactics and waters."],
    ["Match fishing", "match-fishing", "Match results, events and competitive angling chat."],
    ["Pleasure fishing", "pleasure-fishing", "Relaxed fishing, local tips and time by the water."]
  ] as const;
  for (const [name, slug, description] of groups) {
    await prisma.group.upsert({ where: { slug }, update: { name, description }, create: { name, slug, description, type: GroupType.GLOBAL } });
  }
  await prisma.user.upsert({ where: { email: "admin@bankside.test" }, update: {}, create: { name: "Bankside Admin", email: "admin@bankside.test", passwordHash, role: Role.ADMIN } });
  const angler = await prisma.user.upsert({ where: { email: "angler@bankside.test" }, update: {}, create: { name: "Alex Angler", email: "angler@bankside.test", passwordHash, role: Role.ANGLER } });
  const owner = await prisma.user.upsert({ where: { email: "owner@bankside.test" }, update: {}, create: { name: "Vera Venue", email: "owner@bankside.test", passwordHash, role: Role.VENUE_OWNER } });
  const carp = await prisma.group.findUniqueOrThrow({ where: { slug: "carp-fishing" } });
  await prisma.membership.upsert({ where: { userId_groupId: { userId: angler.id, groupId: carp.id } }, update: {}, create: { userId: angler.id, groupId: carp.id, role: MembershipRole.MEMBER } });
  let venue = await prisma.venue.findUnique({ where: { slug: "willow-lakes" } });
  if (!venue) {
    venue = await prisma.$transaction(async (tx) => {
      const v = await tx.venue.create({ data: { name: "Willow Lakes", slug: "willow-lakes", location: "Kent, UK", description: "A friendly mixed fishery with carp and silverfish lakes.", ownerId: owner.id } });
      const g = await tx.group.create({ data: { name: "Willow Lakes", slug: "venue-willow-lakes", description: "The official group for Willow Lakes.", type: GroupType.VENUE, venueId: v.id } });
      await tx.membership.create({ data: { userId: owner.id, groupId: g.id, role: MembershipRole.OWNER } });
      await tx.post.create({ data: { body: "Welcome to Willow Lakes. Gates open at dawn - please keep swims tidy.", official: true, pinned: true, authorId: owner.id, groupId: g.id } });
      return v;
    });
  }
  const existing = await prisma.post.findFirst({ where: { groupId: carp.id, authorId: angler.id } });
  if (!existing) {
    await prisma.post.create({ data: { body: "First trip of the season tomorrow - any bait tips for the carp lakes?", authorId: angler.id, groupId: carp.id } });
  }
  console.log("Seeded global groups + demo users");
}
main().finally(() => prisma.$disconnect());
