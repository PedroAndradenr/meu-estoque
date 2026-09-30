// Acesso à tabela `products`: consultas, cadastro/edição de catálogo e ajustes de estoque.
// Saídas de estoque (vendas/uso) não passam por aqui, e sim por registerExit em movements.ts.
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Product, ProductInput } from './types';

/** Lista todos os produtos em ordem alfabética (sem diferenciar maiúsculas/minúsculas). */
export function listProducts(db: SQLiteDatabase) {
  return db.getAllAsync<Product>('SELECT * FROM products ORDER BY name COLLATE NOCASE');
}

/** Busca um produto pelo id; resolve `null` se não existir. */
export function getProduct(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', id);
}

/** Produtos novos começam com estoque zero; as unidades entram depois via addStock. Retorna o id. */
export async function createProduct(db: SQLiteDatabase, input: ProductInput) {
  const result = await db.runAsync(
    `INSERT INTO products (name, code, price, cost, stock, created_at) VALUES (?, ?, ?, ?, 0, ?)`,
    input.name,
    input.code,
    input.price,
    input.cost,
    new Date().toISOString(),
  );
  return result.lastInsertRowId;
}

/**
 * Atualiza só os dados de catálogo; o estoque não é alterado. Movimentações antigas mantêm o
 * preço/custo copiados na época.
 */
export async function updateProduct(db: SQLiteDatabase, id: number, input: ProductInput) {
  await db.runAsync(
    `UPDATE products SET name = ?, code = ?, price = ?, cost = ? WHERE id = ?`,
    input.name,
    input.code,
    input.price,
    input.cost,
    id,
  );
}

/** Soma `quantity` unidades ao estoque (entrada de mercadoria). */
export async function addStock(db: SQLiteDatabase, id: number, quantity: number) {
  // Incremento feito no SQL para não depender de um valor de estoque lido antes (possivelmente defasado).
  await db.runAsync('UPDATE products SET stock = stock + ? WHERE id = ?', quantity, id);
}

/** Define o estoque mínimo abaixo do qual o produto é sinalizado como estoque baixo. */
export async function setMinStock(db: SQLiteDatabase, id: number, minStock: number) {
  await db.runAsync('UPDATE products SET min_stock = ? WHERE id = ?', minStock, id);
}

/** Exclui o produto; as movimentações dele são apagadas junto (ON DELETE CASCADE). */
export async function deleteProduct(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM products WHERE id = ?', id);
}
