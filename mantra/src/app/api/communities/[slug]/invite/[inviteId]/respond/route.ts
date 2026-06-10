import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { slug: string; inviteId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json();
  if (!["accept", "decline"].includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const invite = await prisma.communityInvite.findFirst({
    where: { id: params.inviteId, invitedUserId: session.user.id, status: "PENDING" },
    include: { community: true },
  });
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });

  if (action === "accept") {
    await prisma.$transaction([
      prisma.communityInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED" },
      }),
      prisma.communityMember.upsert({
        where: { communityId_userId: { communityId: invite.communityId, userId: session.user.id } },
        create: { communityId: invite.communityId, userId: session.user.id, role: "MEMBER" },
        update: {},
      }),
      prisma.notification.create({
        data: {
          userId: invite.invitedBy,
          type: "COMMUNITY_JOIN",
          title: `${session.user.name} joined ${invite.community.name}`,
          body: `${session.user.name} accepted your invite and joined ${invite.community.name}.`,
          link: `/communities/${invite.community.slug}`,
        },
      }),
    ]);
  } else {
    await prisma.communityInvite.update({
      where: { id: invite.id },
      data: { status: "DECLINED" },
    });
  }

  return NextResponse.json({ ok: true });
}
