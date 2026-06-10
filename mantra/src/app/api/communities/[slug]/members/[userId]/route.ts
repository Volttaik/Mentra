import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _: Request,
  { params }: { params: { slug: string; userId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await prisma.community.findUnique({ where: { slug: params.slug } });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isSelf = session.user.id === params.userId;
  const isAdmin = community.adminId === session.user.id;

  if (!isSelf && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (params.userId === community.adminId && !isSelf)
    return NextResponse.json({ error: "Cannot remove admin" }, { status: 400 });

  await prisma.communityMember.deleteMany({
    where: { communityId: community.id, userId: params.userId },
  });

  return NextResponse.json({ ok: true });
}
