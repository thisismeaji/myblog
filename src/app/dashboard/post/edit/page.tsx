import { PostEditorLoader } from "../add/post-editor-loader";

export const dynamic = "force-static";

const editContent = `
  <p>Konten post yang sedang diedit. Gunakan toolbar untuk mengubah format, atau ketik / untuk memilih blok.</p>
`;

export default function EditPostPage() {
  return (
    <PostEditorLoader
      mode="edit"
      initialTitle="Judul post yang diedit"
      initialSlug="judul-post-yang-diedit"
      initialContent={editContent}
    />
  );
}
