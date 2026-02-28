import {
  type User, type InsertUser,
  type AccessCode, type InsertAccessCode,
  type Fragrance, type InsertFragrance,
  type VaultItem, type InsertVaultItem,
  type ToTryItem, type InsertToTryItem,
  type WearLog, type InsertWearLog,
  type FeedPost, type InsertFeedPost,
  type PostLike, type InsertPostLike,
  users, accessCodes, fragrances, vaultItems, toTryItems,
  wearLogs, feedPosts, postLikes,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  validateAccessCode(code: string): Promise<AccessCode | undefined>;
  incrementAccessCodeUses(id: string): Promise<void>;
  createAccessCode(data: InsertAccessCode): Promise<AccessCode>;

  getFragrances(): Promise<Fragrance[]>;
  getFragrance(id: string): Promise<Fragrance | undefined>;
  searchFragrances(query: string): Promise<Fragrance[]>;
  createFragrance(data: InsertFragrance): Promise<Fragrance>;

  getVaultItems(userId: string): Promise<VaultItem[]>;
  getVaultItem(id: string): Promise<VaultItem | undefined>;
  createVaultItem(data: InsertVaultItem): Promise<VaultItem>;
  updateVaultItem(id: string, data: Partial<VaultItem>): Promise<VaultItem | undefined>;
  deleteVaultItem(id: string): Promise<void>;

  getToTryItems(userId: string): Promise<ToTryItem[]>;
  createToTryItem(data: InsertToTryItem): Promise<ToTryItem>;
  updateToTryItem(id: string, data: Partial<ToTryItem>): Promise<ToTryItem | undefined>;
  deleteToTryItem(id: string): Promise<void>;

  getWearLogs(userId: string): Promise<WearLog[]>;
  createWearLog(data: InsertWearLog): Promise<WearLog>;

  getFeedPosts(): Promise<FeedPost[]>;
  getFeedPost(id: string): Promise<FeedPost | undefined>;
  createFeedPost(data: InsertFeedPost): Promise<FeedPost>;
  deleteFeedPost(id: string): Promise<void>;
  updateFeedPostLikeCount(id: string, delta: number): Promise<void>;

  getPostLike(postId: string, userId: string): Promise<PostLike | undefined>;
  createPostLike(data: InsertPostLike): Promise<PostLike>;
  deletePostLike(postId: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async validateAccessCode(code: string): Promise<AccessCode | undefined> {
    const [ac] = await db.select().from(accessCodes).where(and(eq(accessCodes.code, code.toUpperCase()), eq(accessCodes.active, true)));
    return ac;
  }

  async incrementAccessCodeUses(id: string): Promise<void> {
    const [ac] = await db.select().from(accessCodes).where(eq(accessCodes.id, id));
    if (ac) {
      await db.update(accessCodes).set({ usesCount: (ac.usesCount || 0) + 1 }).where(eq(accessCodes.id, id));
    }
  }

  async createAccessCode(data: InsertAccessCode): Promise<AccessCode> {
    const [ac] = await db.insert(accessCodes).values({ ...data, code: data.code.toUpperCase() }).returning();
    return ac;
  }

  async getFragrances(): Promise<Fragrance[]> {
    return db.select().from(fragrances);
  }

  async getFragrance(id: string): Promise<Fragrance | undefined> {
    const [f] = await db.select().from(fragrances).where(eq(fragrances.id, id));
    return f;
  }

  async searchFragrances(query: string): Promise<Fragrance[]> {
    return db.select().from(fragrances).where(
      or(
        ilike(fragrances.name, `%${query}%`),
        ilike(fragrances.house, `%${query}%`),
        ilike(fragrances.family, `%${query}%`),
      )
    );
  }

  async createFragrance(data: InsertFragrance): Promise<Fragrance> {
    const [f] = await db.insert(fragrances).values(data).returning();
    return f;
  }

  async getVaultItems(userId: string): Promise<VaultItem[]> {
    return db.select().from(vaultItems).where(eq(vaultItems.userId, userId));
  }

  async getVaultItem(id: string): Promise<VaultItem | undefined> {
    const [item] = await db.select().from(vaultItems).where(eq(vaultItems.id, id));
    return item;
  }

  async createVaultItem(data: InsertVaultItem): Promise<VaultItem> {
    const [item] = await db.insert(vaultItems).values(data).returning();
    return item;
  }

  async updateVaultItem(id: string, data: Partial<VaultItem>): Promise<VaultItem | undefined> {
    const [item] = await db.update(vaultItems).set(data).where(eq(vaultItems.id, id)).returning();
    return item;
  }

  async deleteVaultItem(id: string): Promise<void> {
    await db.delete(vaultItems).where(eq(vaultItems.id, id));
  }

  async getToTryItems(userId: string): Promise<ToTryItem[]> {
    return db.select().from(toTryItems).where(eq(toTryItems.userId, userId));
  }

  async createToTryItem(data: InsertToTryItem): Promise<ToTryItem> {
    const [item] = await db.insert(toTryItems).values(data).returning();
    return item;
  }

  async updateToTryItem(id: string, data: Partial<ToTryItem>): Promise<ToTryItem | undefined> {
    const [item] = await db.update(toTryItems).set(data).where(eq(toTryItems.id, id)).returning();
    return item;
  }

  async deleteToTryItem(id: string): Promise<void> {
    await db.delete(toTryItems).where(eq(toTryItems.id, id));
  }

  async getWearLogs(userId: string): Promise<WearLog[]> {
    return db.select().from(wearLogs).where(eq(wearLogs.userId, userId)).orderBy(desc(wearLogs.wornAt));
  }

  async createWearLog(data: InsertWearLog): Promise<WearLog> {
    const [log] = await db.insert(wearLogs).values(data).returning();
    return log;
  }

  async getFeedPosts(): Promise<FeedPost[]> {
    return db.select().from(feedPosts).orderBy(desc(feedPosts.createdAt));
  }

  async getFeedPost(id: string): Promise<FeedPost | undefined> {
    const [post] = await db.select().from(feedPosts).where(eq(feedPosts.id, id));
    return post;
  }

  async createFeedPost(data: InsertFeedPost): Promise<FeedPost> {
    const [post] = await db.insert(feedPosts).values(data).returning();
    return post;
  }

  async deleteFeedPost(id: string): Promise<void> {
    await db.delete(postLikes).where(eq(postLikes.postId, id));
    await db.delete(feedPosts).where(eq(feedPosts.id, id));
  }

  async updateFeedPostLikeCount(id: string, delta: number): Promise<void> {
    const post = await this.getFeedPost(id);
    if (post) {
      await db.update(feedPosts).set({ likeCount: Math.max(0, (post.likeCount || 0) + delta) }).where(eq(feedPosts.id, id));
    }
  }

  async getPostLike(postId: string, userId: string): Promise<PostLike | undefined> {
    const [like] = await db.select().from(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    return like;
  }

  async createPostLike(data: InsertPostLike): Promise<PostLike> {
    const [like] = await db.insert(postLikes).values(data).returning();
    return like;
  }

  async deletePostLike(postId: string, userId: string): Promise<void> {
    await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
