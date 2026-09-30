// Esquema do banco SQLite e migrações, versionadas via `PRAGMA user_version`.
// Para mudar o esquema: adicione um novo passo `if (currentVersion === N)` e incremente DATABASE_VERSION.
// Nunca edite uma migração já publicada — aparelhos que já a rodaram não a executariam de novo.
import type { SQLiteDatabase } from 'expo-sqlite';

// Versão de esquema esperada por este código; gravada em `PRAGMA user_version` ao final da migração.
const DATABASE_VERSION = 2;

/** Configura a conexão e aplica, em ordem, as migrações que faltam até DATABASE_VERSION. */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  // Configuração por conexão (não fica salva no arquivo); necessária para o ON DELETE CASCADE.
  await db.execAsync('PRAGMA foreign_keys = ON');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  // Cada passo leva o banco da versão N para N + 1, então um banco antigo passa por todos em sequência.
  // v0 -> v1: esquema inicial. Valores em dinheiro (price, cost, unit_*) são centavos inteiros.
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

  // v1 -> v2: taxas da maquininha.
  if (currentVersion === 1) {
    // As taxas ficam em settings; cada venda guarda uma cópia da taxa (pontos-base) e do valor cobrado.
    await db.execAsync(`
      CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      ALTER TABLE movements ADD COLUMN fee_rate INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE movements ADD COLUMN fee INTEGER NOT NULL DEFAULT 0;
    `);
    currentVersion = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
