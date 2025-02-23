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
    if (await Bun.file(this.file).exists()) {
      this.data = JSON.parse(await readFile(this.file, "utf-8"));
    } else {
      await this.save();
    }
  }

  private async save() {
    await writeFile(this.file, JSON.stringify(this.data, null, 2));
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
      throw new Error("Item with the same ID already exists.");
    }
    this.data[collection].push(item);
    await this.save();
  }

  async getAll<T>(collection: string): Promise<T[]> {
    return this.cleanExpiredItems(collection);
  }

  async getById<T>(collection: string, id: number): Promise<T | undefined> {
    await this.cleanExpiredItems(collection);
    return this.data[collection]?.find((item) => item.id === id) as T | undefined;
  }

  async update<T>(collection: string, id: number, updatedItem: Partial<T>) {
    await this.ensureCollection(collection);
    const index = this.data[collection].findIndex((item) => item.id === id);
    if (index >= 0) {
      this.data[collection][index] = { ...this.data[collection][index], ...updatedItem };
      await this.save();
    } else {
      throw new Error("Item not found.");
    }
  }

  async delete(collection: string, id: number) {
    await this.ensureCollection(collection);
    this.data[collection] = this.data[collection].filter((item) => item.id !== id);
    await this.save();
  }

  async clearCollection(collection: string) {
    await this.ensureCollection(collection);
    this.data[collection] = [];
    await this.save();
  }

  async getCount(collection: string): Promise<number> {
    await this.ensureCollection(collection);
    return this.data[collection].length;
  }

  // Utility Functions
  async filter<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    await this.ensureCollection(collection);
    return (this.data[collection]?.filter(predicate as unknown as (item: DataItem) => boolean) as unknown) as T[] || [];
  }

  async exists(collection: string, id: number): Promise<boolean> {
    await this.ensureCollection(collection);
    return this.data[collection].some((item) => item.id === id);
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

  async aggregate(collection: string, key: string, operation: "sum" | "avg" | "min" | "max"): Promise<number> {
    const values = (await this.cleanExpiredItems(collection)).map((item) => (item as Record<string, any>)[key]).filter((v) => typeof v === "number");
    if (values.length === 0) throw new Error("No numeric values found.");
    return operation === "sum" ? values.reduce((acc, curr) => acc + curr, 0) :
      operation === "avg" ? values.reduce((acc, curr) => acc + curr, 0) / values.length :
        operation === "min" ? Math.min(...values) :
          Math.max(...values);
  }

  // Backup & Restore
  async backup(backupFile: string) {
    await copyFile(this.file, backupFile);
  }

  async restore(backupFile: string) {
    if (await Bun.file(backupFile).exists()) {
      this.data = JSON.parse(await readFile(backupFile, "utf-8"));
      await this.save();
    } else {
      throw new Error("Backup file not found.");
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
      this.data = JSON.parse(JSON.stringify(this.transactionBackup));
      this.transactionBackup = null;
      await this.save();
    }
  }
}
