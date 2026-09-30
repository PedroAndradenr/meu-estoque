// Configurações do app na tabela chave/valor `settings` (hoje, as taxas da maquininha de cartão).
import type { SQLiteDatabase } from 'expo-sqlite';

import type { CardFees } from './types';

const FEE_KEYS = { debito: 'fee_debito', credito: 'fee_credito' } as const;

/** Lê as taxas de débito e crédito em pontos-base; uma taxa nunca salva vale 0. */
export async function getCardFees(db: SQLiteDatabase): Promise<CardFees> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings WHERE key IN (?, ?)',
    FEE_KEYS.debito,
    FEE_KEYS.credito,
  );
  // `value` é TEXT na tabela, por isso a conversão para número.
  const get = (key: string) => Number(rows.find((r) => r.key === key)?.value ?? 0);
  return { debito: get(FEE_KEYS.debito), credito: get(FEE_KEYS.credito) };
}

/**
 * Salva as taxas (pontos-base) numa única transação. Só afeta vendas futuras: as vendas já
 * registradas guardam a própria cópia da taxa.
 */
export async function saveCardFees(db: SQLiteDatabase, fees: CardFees) {
  await db.withTransactionAsync(async () => {
    for (const method of ['debito', 'credito'] as const) {
      // Upsert: insere a chave ou sobrescreve o valor se ela já existir.
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        FEE_KEYS[method],
        String(fees[method]),
      );
    }
  });
}
