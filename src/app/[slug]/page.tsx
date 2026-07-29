import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCachedPostBySlug } from "@/lib/posts";

export const revalidate = 86400;

type SinglePostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: SinglePostPageProps) {
  const { slug } = await params;
  const post = await getCachedPostBySlug(slug);

  if (!post) {
    return {
      title: "Post tidak ditemukan",
    };
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
  };
}

export default async function SinglePostPage({ params }: SinglePostPageProps) {
  const { slug } = await params;
  const post = await getCachedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt)
    : new Date(post.createdAt);

  return (
    <main className="min-h-dvh bg-muted/30 px-4 py-8 md:py-12">
      <article className="mx-auto w-full max-w-3xl">
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{post.category}</Badge>
            <span className="text-sm text-muted-foreground">
              {publishedDate.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="text-lg text-muted-foreground">{post.excerpt}</p>
          ) : null}
        </div>

        {post.featuredImage ? (
          <div className="mb-6 overflow-hidden rounded-md border bg-background">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="aspect-video w-full object-cover"
            />
          </div>
        ) : null}

        <Card className="py-0 shadow-none">
          <CardContent className="p-6 md:p-10">
            <div
              className="max-w-none text-base leading-7 [&>*]:m-0 [&>*:not(:first-child)]:mt-5 [&_blockquote]:border-l-2 [&_blockquote]:pl-6 [&_blockquote]:italic [&_h2]:mt-8 [&_h2]:border-b [&_h2]:pb-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-7 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-semibold [&_h5]:mt-5 [&_h5]:font-semibold [&_img]:my-6 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-md [&_img]:border [&_ol]:my-6 [&_ol]:ml-6 [&_ol]:list-decimal [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:bg-muted [&_th]:p-2 [&_ul]:my-6 [&_ul]:ml-6 [&_ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
          </CardContent>
        </Card>

        <Separator className="my-6" />
        <p className="text-sm text-muted-foreground">Ditulis oleh {post.author}</p>
      </article>
    </main>
  );
}
