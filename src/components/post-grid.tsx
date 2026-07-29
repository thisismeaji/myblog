import { PostCard, type PostCardItem } from "@/components/post-card";

export function PostGrid({ posts }: { posts: PostCardItem[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        Belum ada post.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
