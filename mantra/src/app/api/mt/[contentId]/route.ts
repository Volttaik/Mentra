import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptMtContent, EncryptedMtPacket } from "@/lib/mt-engine";

const PREVIEW_SECTIONS = 2;

export async function GET(
  req: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const session = await auth();
    const isPreviewMode = req.nextUrl.searchParams.get("preview") === "true";

    const mtContent = await prisma.mtContent.findUnique({
      where: { id: params.contentId },
      include: {
        edition: {
          include: {
            stack: {
              select: {
                id: true,
                ownerId: true,
                isPublic: true,
                isPaid: true,
              },
            },
          },
        },
      },
    });

    if (!mtContent) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const stack = mtContent.edition.stack;
    const isOwner = session?.user?.id === stack.ownerId;

    if (!stack.isPublic && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (stack.isPaid && !isOwner && !isPreviewMode) {
      const hasPurchased = session?.user?.id
        ? await prisma.purchase.findFirst({
            where: { userId: session.user.id, stackId: stack.id, status: "completed" },
          })
        : null;

      if (!hasPurchased) {
        return NextResponse.json(
          { error: "Forbidden — purchase required to view this content." },
          { status: 403 }
        );
      }
    }

    let sections: any[];
    let concepts: any;
    let summary: string | null;
    let references: any;

    if (mtContent.isEncrypted && mtContent.encryptedData && mtContent.encryptedIv && mtContent.authTag) {
      const packet: EncryptedMtPacket = {
        version: "MT1",
        encryptedData: mtContent.encryptedData,
        iv: mtContent.encryptedIv,
        authTag: mtContent.authTag,
      };
      const decrypted = decryptMtContent(packet, stack.id);
      sections = decrypted.sections;
      concepts = decrypted.concepts;
      summary = decrypted.summary;
      references = decrypted.references;
    } else {
      sections = (mtContent.sections as any[]) ?? [];
      concepts = mtContent.concepts;
      summary = mtContent.summary;
      references = mtContent.references;
    }

    if (isPreviewMode && stack.isPaid && !isOwner) {
      return NextResponse.json({
        id: mtContent.id,
        fileName: mtContent.fileName,
        fileType: mtContent.fileType,
        summary,
        sections: sections.slice(0, PREVIEW_SECTIONS),
        concepts: Array.isArray(concepts) ? concepts.slice(0, 5) : [],
        references: [],
        isPreview: true,
      });
    }

    return NextResponse.json({
      id: mtContent.id,
      fileName: mtContent.fileName,
      fileType: mtContent.fileType,
      summary,
      sections,
      concepts,
      references,
      isPreview: false,
    });
  } catch (err) {
    console.error("[MT Descriptor Engine]", err);
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 }
    );
  }
}
