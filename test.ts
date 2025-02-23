// test.ts
import { Database } from "./src/db";

async function runTests() {
  const db = new Database("test.json");
  await db.init();

  console.log("== Running Tests ==");

  // Insert data
  await db.insert("users", { id: 1, name: "Alice", age: 25 });
  await db.insert("users", { id: 2, name: "Bob", age: 30 });

  console.log("Users after insert:", await db.getAll("users"));

  // Get by ID
  console.log("Get user by ID:", await db.getById("users", 1));

  // Update user
  await db.update("users", 1, { age: 26 });
  console.log("Users after update:", await db.getAll("users"));

  // Delete user
  await db.delete("users", 2);
  console.log("Users after delete:", await db.getAll("users"));

  // Pagination
  console.log("Paginated Users:", await db.paginate("users", 1, 1));

  // Sorting
  console.log("Sorted Users:", await db.sort("users", "age", "desc"));

  // Search
  console.log("Search Users:", await db.search("users", "name", "Alice"));

  // Backup & Restore
  await db.backup("backup.json");
  await db.clearCollection("users");
  console.log("Users after clear:", await db.getAll("users"));
  await db.restore("backup.json");
  console.log("Users after restore:", await db.getAll("users"));

  // Transactions
  await db.startTransaction();
  await db.insert("users", { id: 3, name: "Charlie", age: 28 });
  console.log("Users in transaction:", await db.getAll("users"));
  await db.rollbackTransaction();
  console.log("Users after rollback:", await db.getAll("users"));

  console.log("== Tests Completed ==");
}

runTests().catch(console.error);
