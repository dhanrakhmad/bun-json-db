// src/db.ts
import { readFile, writeFile, copyFile } from "fs/promises";

interface DataItem {
  id: number;
  expiresAt?: number;
  [key: string]: any;
}

export class Database {
  private file: string;
  private data: Record<string, DataItem[]> = {};
  private transactionBackup: Record<string, DataItem[]> | null = null;

  constructor(file: string) {
    this.file = file;
  }

  async init() {
    try {
      if (await Bun.file(this.file).exists()) {
        this.data = JSON.parse(await readFile(this.file, "utf-8"));
      } else {
        await this.save();
      }
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }
  }

  private async save() {
    try {
      await writeFile(this.file, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error("Failed to save database:", error);
    }
  }

  private async ensureCollection(collection: string) {
    if (!this.data[collection]) this.data[collection] = [];
  }

  private async cleanExpiredItems<T>(collection: string): Promise<T[]> {
    await this.ensureCollection(collection);
    const now = Date.now();
    this.data[collection] = this.data[collection].filter((item) => !item.expiresAt || item.expiresAt > now);
    await this.save();
    return this.data[collection] as T[];
  }

  // CRUD Operations
  async insert<T extends DataItem>(collection: string, item: T) {
    await this.ensureCollection(collection);
    if (this.data[collection].some((existing) => existing.id === item.id)) {
      throw new Error(`Item with ID ${item.id} already exists.`);
    }
    this.data[collection].push(item);
    await this.save();
  }

  async getAll<T>(collection: string): Promise<T[]> {
    return this.cleanExpiredItems(collection);
  }

  async getById<T>(collection: string, id: number): Promise<T | undefined> {
    return (await this.cleanExpiredItems(collection)).find((item) => (item as DataItem).id === id) as T | undefined;
  }

  async update<T>(collection: string, id: number, updatedItem: Partial<T>) {
    await this.ensureCollection(collection);
    const item = this.data[collection].find((item) => item.id === id);
    if (!item) throw new Error(`Item with ID ${id} not found`)
    Object.assign(item, updatedItem)
    await this.save();
  }

  async delete(collection: string, id: number) {
    await this.ensureCollection(collection);
    this.data[collection] = this.data[collection].filter((item) => item.id !== id);
    await this.save();
  }

  async clearCollection(collection: string) {
    this.data[collection] = [];
    await this.save();
  }

  async getCount(collection: string): Promise<number> {
    return (await this.cleanExpiredItems(collection)).length;
  }

  // Utility Functions
  async exists(collection: string, id: number): Promise<boolean> {
    return (await this.cleanExpiredItems(collection)).some((item) => (item as DataItem).id === id);
  }

  async paginate<T>(collection: string, page: number, limit: number): Promise<T[]> {
    const start = (page - 1) * limit;
    return (await this.cleanExpiredItems(collection) as T[]).slice(start, start + limit);
  }

  async sort<T>(collection: string, key: keyof T, order: "asc" | "desc" = "asc"): Promise<T[]> {
    return (await this.cleanExpiredItems(collection) as T[]).sort((a, b) => (a[key] > b[key] ? 1 : -1) * (order === "asc" ? 1 : -1));
  }

  async search<T>(collection: string, key: keyof T, value: any): Promise<T[]> {
    return (await this.cleanExpiredItems(collection) as T[]).filter((item) => item[key] === value);
  }

  // Backup & Restore
  async backup(backupFile: string) {
    try {
      await copyFile(this.file, backupFile);
    } catch (error) {
      console.log("Failed to create backup:", error);
    }
  }

  async restore(backupFile: string) {
    try {
      if (await Bun.file(backupFile).exists()) {
        this.data = JSON.parse(await readFile(backupFile, "utf-8"));
        await this.save();
      } else {
        throw new Error("Backup file not found.");
      }
    } catch (error) {
      console.log("Failed to restore database:", error);
    }
  }

  // Transactions
  async startTransaction() {
    this.transactionBackup = JSON.parse(JSON.stringify(this.data));
  }

  async commitTransaction() {
    this.transactionBackup = null;
    await this.save();
  }

  async rollbackTransaction() {
    if (this.transactionBackup) {
      this.data = this.transactionBackup;
      this.transactionBackup = null;
      await this.save();
    }
  }
}
