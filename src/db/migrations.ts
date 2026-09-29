import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  // Per-connection setting; required for ON DELETE CASCADE.
  await db.execAsync('PRAGMA foreign_keys = ON');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE products (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        code TEXT NOT NULL DEFAULT '',
        price INTEGER NOT NULL DEFAULT 0,
        cost INTEGER NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 3,
        created_at TEXT NOT NULL
      );
      CREATE TABLE movements (
        id INTEGER PRIMARY KEY NOT NULL,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        product_name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('venda', 'uso')),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price INTEGER NOT NULL,
        unit_cost INTEGER NOT NULL,
        payment_method TEXT CHECK (payment_method IN ('pix', 'dinheiro', 'credito', 'debito', 'fiado')),
        created_at TEXT NOT NULL
      );
      CREATE INDEX movements_created_at ON movements (created_at DESC);
    `);
    currentVersion = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
