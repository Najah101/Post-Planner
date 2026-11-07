import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Account, Post, PostInput } from "./types";

/**
 * Data store. Uses Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set,
 * otherwise a local JSON file (.data/db.json) so the app runs with zero setup in dev.
 */
export interface Store {
  listAccounts(): Promise<Account[]>;
  createAccount(name: string, emoji: string): Promise<Account>;
  updateAccount(id: string, patch: { name?: string; emoji?: string }): Promise<void>;
  listPosts(accountId: string): Promise<Post[]>;
  upsertPost(input: PostInput): Promise<Post>;
  deletePost(id: string): Promise<void>;
  saveImage(file: File): Promise<string>;
}

const now = () => new Date().toISOString();

function newPost(input: PostInput): Post {
  return {
    id: randomUUID(),
    title: "",
    status: "idea",
    post_type: "reel",
    planned_at: null,
    caption: "",
    hashtags: "",
    audio_note: "",
    edit_notes: "",
    inspo_url: "",
    inspo_image_url: "",
    thumbnail_url: "",
    ...input,
    created_at: now(),
    updated_at: now(),
  } as Post;
}

/* ------------------------------ local JSON ------------------------------ */

const DB_FILE = path.join(process.cwd(), ".data", "db.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

interface LocalDb {
  accounts: Account[];
  posts: Post[];
}

async function readDb(): Promise<LocalDb> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8"));
  } catch {
    return { accounts: [], posts: [] };
  }
}

async function writeDb(db: LocalDb) {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

const localStore: Store = {
  async listAccounts() {
    return (await readDb()).accounts.sort((a, b) => a.created_at.localeCompare(b.created_at));
  },
  async createAccount(name, emoji) {
    const db = await readDb();
    const acc: Account = { id: randomUUID(), name, emoji, created_at: now() };
    db.accounts.push(acc);
    await writeDb(db);
    return acc;
  },
  async updateAccount(id, patch) {
    const db = await readDb();
    const acc = db.accounts.find((a) => a.id === id);
    if (acc) Object.assign(acc, patch);
    await writeDb(db);
  },
  async listPosts(accountId) {
    return (await readDb()).posts.filter((p) => p.account_id === accountId);
  },
  async upsertPost(input) {
    const db = await readDb();
    const i = input.id ? db.posts.findIndex((p) => p.id === input.id) : -1;
    let post: Post;
    if (i >= 0) {
      post = { ...db.posts[i], ...input, updated_at: now() } as Post;
      db.posts[i] = post;
    } else {
      post = newPost(input);
      db.posts.push(post);
    }
    await writeDb(db);
    return post;
  },
  async deletePost(id) {
    const db = await readDb();
    db.posts = db.posts.filter((p) => p.id !== id);
    await writeDb(db);
  },
  async saveImage(file) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${randomUUID()}.jpg`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
    return `/uploads/${name}`;
  },
};

/* ------------------------------- Supabase ------------------------------- */

const BUCKET = "post-images";

function supabaseStore(url: string, key: string): Store {
  const db = createClient(url, key, { auth: { persistSession: false } });
  const check = <T,>(res: { data: T | null; error: { message: string } | null }): T => {
    if (res.error) throw new Error(res.error.message);
    return res.data as T;
  };
  return {
    async listAccounts() {
      return check(await db.from("accounts").select("*").order("created_at"));
    },
    async createAccount(name, emoji) {
      return check(await db.from("accounts").insert({ name, emoji }).select().single());
    },
    async updateAccount(id, patch) {
      check(await db.from("accounts").update(patch).eq("id", id));
    },
    async listPosts(accountId) {
      return check(await db.from("posts").select("*").eq("account_id", accountId));
    },
    async upsertPost(input) {
      if (input.id) {
        return check(
          await db
            .from("posts")
            .update({ ...input, updated_at: now() })
            .eq("id", input.id)
            .select()
            .single(),
        );
      }
      const { id: _ignored, ...rest } = input;
      void _ignored;
      return check(await db.from("posts").insert(rest).select().single());
    },
    async deletePost(id) {
      check(await db.from("posts").delete().eq("id", id));
    },
    async saveImage(file) {
      const name = `${randomUUID()}.jpg`;
      const { error } = await db.storage
        .from(BUCKET)
        .upload(name, Buffer.from(await file.arrayBuffer()), { contentType: "image/jpeg" });
      if (error) throw new Error(error.message);
      return db.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
    },
  };
}

/* -------------------------------- export -------------------------------- */

const g = globalThis as unknown as { __store?: Store };

export function getStore(): Store {
  if (!g.__store) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    g.__store = url && key ? supabaseStore(url, key) : localStore;
  }
  return g.__store;
}

/** Make sure at least one account exists (the bakery) and return all accounts. */
export async function ensureAccounts(): Promise<Account[]> {
  const store = getStore();
  let accounts = await store.listAccounts();
  if (accounts.length === 0) {
    await store.createAccount("Bakery", "🥐");
    accounts = await store.listAccounts();
  }
  return accounts;
}
