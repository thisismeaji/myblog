"use client";

import dynamic from "next/dynamic";

const PostEditor = dynamic(
  () => import("./post-editor").then((module) => module.PostEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen min-h-0 flex-col gap-4 overflow-hidden bg-muted/30 p-4">
        <div className="h-10 rounded-md bg-muted" />
        <div className="min-h-0 flex-1 rounded-md border bg-card" />
      </div>
    ),
  }
);

type PostEditorLoaderProps = {
  mode?: "add" | "edit";
  postId?: string;
  initialTitle?: string;
  initialSlug?: string;
  initialContent?: string;
  initialExcerpt?: string;
  initialPublishDate?: string | null;
  initialFeaturedImage?: string | null;
  initialAuthor?: string;
  initialCategory?: string;
  initialTag?: string;
  initialSeoTitle?: string;
  initialSeoDescription?: string;
  initialSchemaType?: string;
};

export function PostEditorLoader(props: PostEditorLoaderProps) {
  return <PostEditor {...props} />;
}
