import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const agent = await prisma.customAgent.findFirst({
      where: { id: params.id, isPublished: true },
      select: { name: true, subject: true, description: true, avatarUrl: true },
    });

    if (!agent) throw new Error("not found");

    const title = `${agent.name} — Mentra Agent`;
    const description = agent.description ?? `${agent.name} is an AI study agent for ${agent.subject} on Mentra.`;
    const image = agent.avatarUrl ?? "/icons/icon-192.png";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        siteName: "Mentra",
        images: [{ url: image, width: 512, height: 512, alt: agent.name }],
      },
      twitter: {
        card: agent.avatarUrl ? "summary_large_image" : "summary",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Agent — Mentra",
      description: "An AI study agent on Mentra.",
    };
  }
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
