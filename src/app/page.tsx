import { PostGrid } from "@/components/post-grid";
import { getCachedPosts } from "@/lib/posts";

export const revalidate = 86400;

export default async function Home() {
  const posts = await getCachedPosts();

  return (
    <main className="min-h-dvh bg-muted/30 px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold leading-tight">Post Terbaru</h1>
          <p className="text-muted-foreground">
            Kumpulan artikel yang sudah dibuat dari dashboard.
          </p>
        </div>
        <PostGrid
          posts={posts.map((post) => ({
            title: post.title,
            slug: post.slug,
            category: post.category,
            author: post.author,
            thumbnail: post.featuredImage,
            createdAt: new Date(post.createdAt).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
          }))}
        />
      </div>
    </main>
  );
}
