import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.communityMember.findMany({
    where: { userId: session.user.id },
    include: {
      community: {
        include: {
          _count: { select: { members: true, stacks: true } },
          admin: { select: { name: true, username: true, image: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json(memberships.map(m => ({ ...m.community, myRole: m.role })));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, banner, rules } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const slug = slugify(name);

  const community = await prisma.community.create({
    data: {
      slug,
      name: name.trim(),
      description: description?.trim() || null,
      banner: banner || null,
      rules: rules?.trim() || null,
      adminId: session.user.id,
      members: {
        create: { userId: session.user.id, role: "ADMIN" },
      },
    },
  });

  return NextResponse.json(community, { status: 201 });
}
