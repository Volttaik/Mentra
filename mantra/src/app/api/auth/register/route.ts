import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, email, password, bio, userType,
      imageBase64,
      university, department, level,
      niche, platform,
      field, experience, company,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const base = name.toLowerCase().replace(/[^a-z0-9]/g, ".");
    let username = base;
    let attempt = 0;
    while (await prisma.user.findUnique({ where: { username } })) {
      attempt++;
      username = `${base}${attempt}`;
    }

    const hashed = await bcrypt.hash(password, 12);

    let imageUrl: string | null = null;
    if (imageBase64 && typeof imageBase64 === "string") {
      try {
        const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1].split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
          const buffer = Buffer.from(matches[2], "base64");
          const safeName = `avatar_${Date.now()}.${ext}`;
          const uploadDir = path.join(process.cwd(), "public", "avatars");
          await mkdir(uploadDir, { recursive: true });
          await writeFile(path.join(uploadDir, safeName), buffer);
          imageUrl = `/avatars/${safeName}`;
        }
      } catch {
        imageUrl = null;
      }
    }

    let resolvedDept = department || null;
    if (userType === "creator" && niche) resolvedDept = niche;
    if (userType === "freelancer" && field) resolvedDept = field;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password: hashed,
        bio: bio || null,
        image: imageUrl,
        university: university || (userType === "freelancer" && company ? company : null) || null,
        department: resolvedDept,
        level: level || experience || platform || null,
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
    }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
