import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type PostCardItem = {
  title: string;
  slug: string;
  category: string;
  author: string;
  thumbnail: string | null;
  createdAt: string;
};

export function PostCard({ post }: { post: PostCardItem }) {
  return (
    <Card className="overflow-hidden py-0 shadow-none">
      <Link href={`/${post.slug}`} className="block">
        <div className="flex aspect-video w-full items-center justify-center bg-muted text-sm text-muted-foreground">
          {post.thumbnail ? (
            <img
              src={post.thumbnail}
              alt={post.title}
              className="size-full object-cover"
            />
          ) : (
            "No image"
          )}
        </div>
      </Link>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline">{post.category}</Badge>
          <span className="text-xs text-muted-foreground">{post.createdAt}</span>
        </div>
        <Link href={`/${post.slug}`} className="block">
          <h2 className="line-clamp-2 text-lg font-semibold leading-snug">
            {post.title}
          </h2>
        </Link>
        <p className="text-sm text-muted-foreground">Ditulis oleh {post.author}</p>
      </CardContent>
    </Card>
  );
}
