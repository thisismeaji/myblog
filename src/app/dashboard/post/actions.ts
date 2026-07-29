"use server";

import { revalidatePath, updateTag } from "next/cache";

import {
  createPost,
  updatePost,
  type PostInput,
  type PostStatus,
} from "@/lib/posts";

type SavePostPayload = Omit<PostInput, "status"> & {
  id?: string;
  status: PostStatus;
};

export type SavePostResult = {
  ok: boolean;
  message: string;
  id?: string;
};

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validatePayload(payload: SavePostPayload): PostInput {
  const title = payload.title.trim();
  const slug = normalizeSlug(payload.slug || title);

  if (!title) {
    throw new Error("Judul post wajib diisi.");
  }

  if (!slug) {
    throw new Error("Slug post wajib diisi.");
  }

  return {
    title,
    slug,
    contentHtml: payload.contentHtml.trim(),
    excerpt: payload.excerpt.trim(),
    status: payload.status,
    publishedAt: payload.publishedAt,
    featuredImage: payload.featuredImage,
    author: payload.author,
    category: payload.category,
    tag: payload.tag,
    seoTitle: payload.seoTitle.trim(),
    seoDescription: payload.seoDescription.trim(),
    schemaType: payload.schemaType,
  };
}

export async function savePost(payload: SavePostPayload): Promise<SavePostResult> {
  try {
    const input = validatePayload(payload);
    const savedPost = payload.id
      ? await updatePost(payload.id, input)
      : await createPost(input);

    if (!savedPost) {
      return {
        ok: false,
        message: "Post tidak ditemukan untuk diupdate.",
      };
    }

    updateTag("posts");
    revalidatePath("/dashboard/post");
    revalidatePath("/dashboard/post/edit");
    revalidatePath(`/${savedPost.slug}`);

    return {
      ok: true,
      id: savedPost.id,
      message:
        input.status === "published"
          ? "Post berhasil dipublish ke Neon."
          : "Draft berhasil disimpan ke Neon.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyimpan post ke Neon.",
    };
  }
}
