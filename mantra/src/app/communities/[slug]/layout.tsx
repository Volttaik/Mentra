import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "https://mentra.app";
    const res = await fetch(`${baseUrl}/api/communities/${params.slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("not found");
    const community = await res.json();
    if (community.error) throw new Error(community.error);

    const title = `${community.name} — Mentra Community`;
    const description = community.description ?? `Join the ${community.name} community on Mentra.`;
    const image = community.banner ?? community.profile ?? "/icons/icon-192.png";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        siteName: "Mentra",
        images: [{ url: image, width: 1200, height: 630, alt: community.name }],
      },
      twitter: {
        card: (community.banner || community.profile) ? "summary_large_image" : "summary",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Community — Mentra",
      description: "A community on Mentra.",
    };
  }
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
