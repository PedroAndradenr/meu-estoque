// Acesso à tabela `movements`: histórico de saídas e registro de novas saídas (venda ou uso),
// que também baixa o estoque do produto.
import type { SQLiteDatabase } from 'expo-sqlite';

import { getCardFees } from './settings';
import { calculateFee, feeRateFor, type Movement, type MovementType, type PaymentMethod, type Product } from './types';

/** Últimas `limit` movimentações, da mais recente para a mais antiga. */
export function listMovements(db: SQLiteDatabase, limit = 100) {
  return db.getAllAsync<Movement>('SELECT * FROM movements ORDER BY created_at DESC LIMIT ?', limit);
}

/** Movimentações com `start <= created_at < end`, da mais antiga para a mais recente. */
export function listMovementsBetween(db: SQLiteDatabase, start: Date, end: Date) {
  // created_at é gravado em ISO 8601 UTC (toISOString), então comparar as strings equivale a comparar datas.
  return db.getAllAsync<Movement>(
    'SELECT * FROM movements WHERE created_at >= ? AND created_at < ? ORDER BY created_at ASC',
    start.toISOString(),
    end.toISOString(),
  );
}

type RegisterExitInput = {
  productId: number;
  type: MovementType;
  quantity: number;
  paymentMethod: PaymentMethod | null;
};

/** Registra uma saída de estoque (venda ou uso interno) e baixa o estoque do produto de forma atômica. */
export async function registerExit(db: SQLiteDatabase, input: RegisterExitInput) {
  // Saídas do tipo 'uso' não têm forma de pagamento (e, portanto, nem taxa).
  const paymentMethod = input.type === 'venda' ? input.paymentMethod : null;
  const feeRate = feeRateFor(await getCardFees(db), paymentMethod);

  // Transação exclusiva: a checagem de estoque e a baixa acontecem juntas, sem outra escrita no meio,
  // evitando estoque negativo; se algo falhar, nada é gravado.
  await db.withExclusiveTransactionAsync(async (tx) => {
    const product = await tx.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', input.productId);
    if (!product) throw new Error('Produto não encontrado.');
    if (input.quantity > product.stock) throw new Error('Quantidade maior que o estoque disponível.');

    const fee = calculateFee(product.price * input.quantity, feeRate);
    // Grava cópias de nome, preço, custo e taxa para o histórico não mudar após edições futuras.
    await tx.runAsync(
      `INSERT INTO movements
         (product_id, product_name, type, quantity, unit_price, unit_cost, payment_method, fee_rate, fee, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      product.id,
      product.name,
      input.type,
      input.quantity,
      product.price,
      product.cost,
      paymentMethod,
      feeRate,
      fee,
      new Date().toISOString(),
    );
    await tx.runAsync('UPDATE products SET stock = stock - ? WHERE id = ?', input.quantity, product.id);
  });
}
