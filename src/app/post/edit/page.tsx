import { PostEditorLoader } from "../add/post-editor-loader";
import { getCachedLatestPost, getCachedPostById } from "@/lib/posts";

export const revalidate = 86400;

const editContent = `
  <p>Belum ada post di database. Tulis konten baru, lalu simpan untuk menghubungkan halaman edit dengan Neon.</p>
`;

export default async function EditPostPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const post = id ? await getCachedPostById(id) : await getCachedLatestPost();

  return (
    <PostEditorLoader
      mode="edit"
      postId={post?.id}
      initialTitle={post?.title ?? ""}
      initialSlug={post?.slug ?? ""}
      initialContent={post?.contentHtml ?? editContent}
      initialExcerpt={post?.excerpt ?? ""}
      initialPublishDate={post?.publishedAt ?? null}
      initialFeaturedImage={post?.featuredImage ?? null}
      initialAuthor={post?.author ?? "admin"}
      initialCategory={post?.category ?? "uncategorized"}
      initialTag={post?.tag ?? "blog"}
      initialSeoTitle={post?.seoTitle ?? ""}
      initialSeoDescription={post?.seoDescription ?? ""}
      initialSchemaType={post?.schemaType ?? "article"}
    />
  );
}
