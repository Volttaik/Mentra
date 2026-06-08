import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptMtContent, EncryptedMtPacket } from "@/lib/mt-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const session = await auth();

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

    if (stack.isPaid && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden — purchase required to view this content." },
        { status: 403 }
      );
    }

    if (mtContent.isEncrypted && mtContent.encryptedData && mtContent.encryptedIv && mtContent.authTag) {
      const packet: EncryptedMtPacket = {
        version: "MT1",
        encryptedData: mtContent.encryptedData,
        iv: mtContent.encryptedIv,
        authTag: mtContent.authTag,
      };

      const decrypted = decryptMtContent(packet, stack.id);

      return NextResponse.json({
        id: mtContent.id,
        fileName: mtContent.fileName,
        fileType: mtContent.fileType,
        summary: decrypted.summary,
        sections: decrypted.sections,
        concepts: decrypted.concepts,
        references: decrypted.references,
        isEncrypted: true,
      });
    }

    return NextResponse.json({
      id: mtContent.id,
      fileName: mtContent.fileName,
      fileType: mtContent.fileType,
      summary: mtContent.summary,
      sections: mtContent.sections,
      concepts: mtContent.concepts,
      references: mtContent.references,
      isEncrypted: false,
    });
  } catch (err) {
    console.error("[MT Descriptor Engine]", err);
    return NextResponse.json(
      { error: "Failed to decrypt content" },
      { status: 500 }
    );
  }
}
