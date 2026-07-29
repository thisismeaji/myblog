import { neon } from "@neondatabase/serverless";
import { unstable_cache } from "next/cache";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = neon(databaseUrl);
let postsTableReady: Promise<void> | null = null;

export type PostStatus = "draft" | "published";

export type PostInput = {
  title: string;
  slug: string;
  contentHtml: string;
  excerpt: string;
  status: PostStatus;
  publishedAt: string | null;
  featuredImage: string | null;
  author: string;
  category: string;
  tag: string;
  seoTitle: string;
  seoDescription: string;
  schemaType: string;
};

export type PostRecord = PostInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: PostStatus;
  views: number;
  words: number;
  author: string;
  featuredImage: string | null;
  updatedAt: string;
};

async function ensurePostsTable() {
  postsTableReady ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        content_html TEXT NOT NULL,
        excerpt TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        published_at TIMESTAMPTZ,
        featured_image TEXT,
        author TEXT NOT NULL DEFAULT 'admin',
        category TEXT NOT NULL DEFAULT 'uncategorized',
        tag TEXT NOT NULL DEFAULT 'blog',
        seo_title TEXT NOT NULL DEFAULT '',
        seo_description TEXT NOT NULL DEFAULT '',
        schema_type TEXT NOT NULL DEFAULT 'article',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  })();

  await postsTableReady;
}

function mapPost(row: Record<string, unknown>): PostRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    contentHtml: String(row.content_html),
    excerpt: String(row.excerpt ?? ""),
    status: row.status === "published" ? "published" : "draft",
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
    featuredImage: row.featured_image ? String(row.featured_image) : null,
    author: String(row.author ?? "admin"),
    category: String(row.category ?? "uncategorized"),
    tag: String(row.tag ?? "blog"),
    seoTitle: String(row.seo_title ?? ""),
    seoDescription: String(row.seo_description ?? ""),
    schemaType: String(row.schema_type ?? "article"),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function createPost(input: PostInput) {
  await ensurePostsTable();

  const rows = await sql`
    INSERT INTO posts (
      id,
      title,
      slug,
      content_html,
      excerpt,
      status,
      published_at,
      featured_image,
      author,
      category,
      tag,
      seo_title,
      seo_description,
      schema_type
    )
    VALUES (
      ${crypto.randomUUID()},
      ${input.title},
      ${input.slug},
      ${input.contentHtml},
      ${input.excerpt},
      ${input.status},
      ${input.publishedAt},
      ${input.featuredImage},
      ${input.author},
      ${input.category},
      ${input.tag},
      ${input.seoTitle},
      ${input.seoDescription},
      ${input.schemaType}
    )
    RETURNING *
  `;

  return mapPost(rows[0]);
}

export async function updatePost(id: string, input: PostInput) {
  await ensurePostsTable();

  const rows = await sql`
    UPDATE posts
    SET
      title = ${input.title},
      slug = ${input.slug},
      content_html = ${input.contentHtml},
      excerpt = ${input.excerpt},
      status = ${input.status},
      published_at = ${input.publishedAt},
      featured_image = ${input.featuredImage},
      author = ${input.author},
      category = ${input.category},
      tag = ${input.tag},
      seo_title = ${input.seoTitle},
      seo_description = ${input.seoDescription},
      schema_type = ${input.schemaType},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (!rows[0]) {
    return null;
  }

  return mapPost(rows[0]);
}

export async function getLatestPost() {
  await ensurePostsTable();

  const rows = await sql`
    SELECT *
    FROM posts
    ORDER BY updated_at DESC
    LIMIT 1
  `;

  if (!rows[0]) {
    return null;
  }

  return mapPost(rows[0]);
}

export async function getPostById(id: string) {
  await ensurePostsTable();

  const rows = await sql`
    SELECT *
    FROM posts
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!rows[0]) {
    return null;
  }

  return mapPost(rows[0]);
}

export async function getPosts() {
  await ensurePostsTable();

  const rows = await sql`
    SELECT
      id,
      title,
      slug,
      category,
      status,
      author,
      featured_image,
      updated_at,
      CARDINALITY(
        REGEXP_SPLIT_TO_ARRAY(
          TRIM(REGEXP_REPLACE(content_html, '<[^>]*>', ' ', 'g')),
          '\\s+'
        )
      ) AS words
    FROM posts
    ORDER BY updated_at DESC
  `;

  return rows.map((row): PostListItem => ({
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    category: String(row.category ?? "uncategorized"),
    status: row.status === "published" ? "published" : "draft",
    views: 0,
    words: Number(row.words ?? 0),
    author: String(row.author ?? "admin"),
    featuredImage: row.featured_image ? String(row.featured_image) : null,
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }));
}

export const getCachedLatestPost = unstable_cache(
  getLatestPost,
  ["latest-post"],
  {
    revalidate: 3600,
    tags: ["posts"],
  }
);

export const getCachedPostById = unstable_cache(getPostById, ["post-by-id"], {
  revalidate: 3600,
  tags: ["posts"],
});

export const getCachedPosts = unstable_cache(getPosts, ["posts"], {
  revalidate: 3600,
  tags: ["posts"],
});
