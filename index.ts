import { Database } from "./src/db";

const db = new Database("data.json");
await db.init();