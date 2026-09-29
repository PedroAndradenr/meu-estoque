import type { SQLiteDatabase } from 'expo-sqlite';

import type { Movement, MovementType, PaymentMethod, Product } from './types';

export function listMovements(db: SQLiteDatabase, limit = 100) {
  return db.getAllAsync<Movement>('SELECT * FROM movements ORDER BY created_at DESC LIMIT ?', limit);
}

type RegisterExitInput = {
  productId: number;
  type: MovementType;
  quantity: number;
  paymentMethod: PaymentMethod | null;
};

/** Records a stock exit (sale or internal use) and decrements the product stock atomically. */
export async function registerExit(db: SQLiteDatabase, input: RegisterExitInput) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    const product = await tx.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', input.productId);
    if (!product) throw new Error('Produto não encontrado.');
    if (input.quantity > product.stock) throw new Error('Quantidade maior que o estoque disponível.');

    await tx.runAsync(
      `INSERT INTO movements (product_id, product_name, type, quantity, unit_price, unit_cost, payment_method, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      product.id,
      product.name,
      input.type,
      input.quantity,
      product.price,
      product.cost,
      input.type === 'venda' ? input.paymentMethod : null,
      new Date().toISOString(),
    );
    await tx.runAsync('UPDATE products SET stock = stock - ? WHERE id = ?', input.quantity, product.id);
  });
}
