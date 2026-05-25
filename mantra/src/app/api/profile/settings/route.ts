import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, bio, university, department, level, website, location } = body;

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      bio: bio?.trim() || null,
      university: university?.trim() || null,
      department: department?.trim() || null,
      level: level?.trim() || null,
      website: website?.trim() || null,
      location: location?.trim() || null,
    },
    select: {
      id: true, name: true, username: true, email: true,
      bio: true, university: true, department: true, level: true,
      website: true, location: true,
    },
  });

  return NextResponse.json({ user: updated });
}
