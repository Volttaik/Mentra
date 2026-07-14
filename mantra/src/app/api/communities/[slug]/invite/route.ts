import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const community = await prisma.community.findUnique({ where: { slug: params.slug } });
  if (!community || community.adminId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existingMemberIds = (await prisma.communityMember.findMany({
    where: { communityId: community.id },
    select: { userId: true },
  })).map(m => m.userId);

  const followers = await prisma.follow.findMany({
    where: { followingId: session.user.id, follower: { name: { contains: q } } },
    include: { follower: { select: { id: true, name: true, username: true, image: true } } },
    take: 10,
  });

  const followerIds = followers.map(f => f.followerId);

  const others = q
    ? await prisma.user.findMany({
        where: {
          id: { notIn: [...existingMemberIds, ...followerIds, session.user.id] },
          OR: [
            { name: { contains: q } },
            { username: { contains: q } },
          ],
        },
        select: { id: true, name: true, username: true, image: true },
        take: 10,
      })
    : [];

  const result = [
    ...followers
      .filter(f => !existingMemberIds.includes(f.followerId))
      .map(f => ({ ...f.follower, isFollower: true })),
    ...others.map(u => ({ ...u, isFollower: false })),
  ];

  return NextResponse.json(result);
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await prisma.community.findUnique({ where: { slug: params.slug } });
  if (!community || community.adminId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const alreadyMember = await prisma.communityMember.findFirst({
    where: { communityId: community.id, userId },
  });
  if (alreadyMember) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  try {
    const invite = await prisma.communityInvite.create({
      data: {
        communityId: community.id,
        invitedUserId: userId,
        invitedBy: session.user.id,
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "COMMUNITY_INVITE",
        title: `You've been invited to ${community.name}`,
        body: `${session.user.name} invited you to join the community "${community.name}".`,
        link: `/communities/${community.slug}?inviteId=${invite.id}`,
      },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invite already sent" }, { status: 409 });
  }
}
