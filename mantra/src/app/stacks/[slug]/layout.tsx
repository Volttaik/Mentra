import type { Metadata } from "next";

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "https://mentra.app";
    const res = await fetch(`${baseUrl}/api/stacks/${params.slug}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error("not found");

    const stack = await res.json();
    if (stack.error) throw new Error(stack.error);

    const title = `${stack.title} — Mentra`;
    const description = stack.description ?? "A knowledge stack on Mentra.";
    const image = stack.banner ?? undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        siteName: "Mentra",
        ...(image && { images: [{ url: image, width: 1200, height: 630, alt: stack.title }] }),
        authors: [stack.owner?.name].filter(Boolean),
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        ...(image && { images: [image] }),
      },
    };
  } catch {
    return {
      title: "Stack — Mentra",
      description: "A knowledge stack on Mentra.",
    };
  }
}

export default function StackLayout({ children }: Props) {
  return <>{children}</>;
}
