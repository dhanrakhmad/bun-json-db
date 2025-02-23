# Bun JSON Database

Bun JSON Database adalah database sederhana berbasis JSON yang berjalan di atas Bun. Database ini mendukung fitur CRUD, filtering, pagination, sorting, searching, agregasi, backup & restore, serta transaksi.

## Fitur Utama

- ✅ CRUD (Create, Read, Update, Delete)
- ✅ Filtering & Searching
- ✅ Pagination & Sorting
- ✅ Agregasi (Sum, Average, Min, Max)
- ✅ Backup & Restore
- ✅ Transaksi (Start, Commit, Rollback)
- ✅ Mendukung TTL (Time-To-Live) untuk data

## Instalasi

Pastikan Anda telah menginstal Bun di sistem Anda. Jika belum, Anda dapat menginstalnya dengan:

```sh
curl -fsSL https://bun.sh/install | bash
```

Kemudian, clone repository ini dan install dependensi:

```sh
git clone https://github.com/dhanrakhmad/bun-json-db.git
cd bun-json-db
bun install
```

## Cara Penggunaan

### 1. Import dan Inisialisasi Database

```ts
import { Database } from "./src/db";

const db = new Database("data.json");
await db.init();
```

### 2. Menambahkan Data

```ts
await db.insert("users", { id: 1, name: "Alice", age: 25 });
```

### 3. Mengambil Semua Data

```ts
const users = await db.getAll("users");
console.log(users);
```

### 4. Mengambil Data Berdasarkan ID

```ts
const user = await db.getById("users", 1);
console.log(user);
```

### 5. Memperbarui Data

```ts
await db.update("users", 1, { age: 26 });
```

### 6. Menghapus Data

```ts
await db.delete("users", 1);
```

### 7. Filtering Data

```ts
const adults = await db.filter("users", (user) => user.age > 18);
console.log(adults);
```

### 8. Sorting Data

```ts
const sortedUsers = await db.sort("users", "age", "desc");
console.log(sortedUsers);
```

### 9. Pagination Data

```ts
const paginatedUsers = await db.paginate("users", 1, 10);
console.log(paginatedUsers);
```

### 10. Agregasi Data

```ts
const totalAge = await db.aggregate("users", "age", "sum");
console.log(totalAge);
```

### 11. Backup & Restore

```ts
await db.backup("backup.json");
await db.restore("backup.json");
```

### 12. Transaksi (Rollback & Commit)

```ts
await db.startTransaction();
await db.insert("users", { id: 2, name: "Bob", age: 30 });
await db.rollbackTransaction();
```

## Lisensi

Proyek ini menggunakan lisensi **MIT**.

## Kontribusi

Pull request dipersilakan! Jika ingin menambahkan fitur atau memperbaiki bug, silakan buat issue terlebih dahulu.
