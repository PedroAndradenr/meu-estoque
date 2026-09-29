import type { SQLiteDatabase } from 'expo-sqlite';

import type { Product, ProductInput } from './types';

export function listProducts(db: SQLiteDatabase) {
  return db.getAllAsync<Product>('SELECT * FROM products ORDER BY name COLLATE NOCASE');
}

export function getProduct(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', id);
}

export async function createProduct(db: SQLiteDatabase, input: ProductInput) {
  const result = await db.runAsync(
    `INSERT INTO products (name, code, price, cost, stock, min_stock, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.name,
    input.code,
    input.price,
    input.cost,
    input.stock,
    input.min_stock,
    new Date().toISOString(),
  );
  return result.lastInsertRowId;
}

export async function updateProduct(db: SQLiteDatabase, id: number, input: ProductInput) {
  await db.runAsync(
    `UPDATE products SET name = ?, code = ?, price = ?, cost = ?, stock = ?, min_stock = ? WHERE id = ?`,
    input.name,
    input.code,
    input.price,
    input.cost,
    input.stock,
    input.min_stock,
    id,
  );
}

export async function deleteProduct(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM products WHERE id = ?', id);
}
