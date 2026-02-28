import {
  type User, type InsertUser,
  type AccessCode, type InsertAccessCode,
  type Fragrance, type InsertFragrance,
  type VaultItem, type InsertVaultItem,
  type ToTryItem, type InsertToTryItem,
  users, accessCodes, fragrances, vaultItems, toTryItems,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike } from "drizzle-orm";

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
  deleteToTryItem(id: string): Promise<void>;
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
    return db.select().from(fragrances).where(ilike(fragrances.name, `%${query}%`));
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

  async deleteToTryItem(id: string): Promise<void> {
    await db.delete(toTryItems).where(eq(toTryItems.id, id));
  }
}

export const storage = new DatabaseStorage();
