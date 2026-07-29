import { PostTable } from "@/components/post-table";
import { getCachedPosts } from "@/lib/posts";

export const revalidate = 86400;

export default async function PostPage() {
  const posts = await getCachedPosts();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <PostTable
            data={posts.map((post) => ({
              id: post.id,
              title: post.title,
              slug: post.slug,
              thumbnail: post.featuredImage,
              category: post.category,
              status: post.status === "published" ? "Published" : "Draft",
              views: post.views.toLocaleString("id-ID"),
              words: post.words.toLocaleString("id-ID"),
              author: post.author,
              createdAt: new Date(post.createdAt).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              updatedAt: new Date(post.updatedAt).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
