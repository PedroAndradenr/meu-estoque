// Tipos das tabelas do banco local e regras de negócio puras (taxa da maquininha, estoque baixo).
// Convenção: valores em dinheiro são centavos inteiros e percentuais são pontos-base (499 = 4,99%).

/** Linha da tabela `products`: dados de catálogo e estoque atual. */
export type Product = {
  id: number;
  name: string;
  code: string;
  price: number; // centavos
  cost: number; // centavos
  stock: number;
  min_stock: number;
  created_at: string;
};

/** Dados de catálogo editados na aba Produtos; o estoque é gerenciado à parte (ver addStock). */
export type ProductInput = Pick<Product, 'name' | 'code' | 'price' | 'cost'>;

/** Tipo de saída: 'venda' (com forma de pagamento) ou 'uso' (retirada interna/avulsa). */
export type MovementType = 'venda' | 'uso';

/** Forma de pagamento registrada na venda (o app não processa pagamentos, só anota o método). */
export type PaymentMethod = 'pix' | 'dinheiro' | 'credito' | 'debito' | 'fiado';

/** Formas de pagamento na ordem de exibição, com o rótulo mostrado na UI. */
export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
  { value: 'fiado', label: 'Fiado' },
];

/** Mapa forma de pagamento -> rótulo, derivado de PAYMENT_METHODS. */
export const PAYMENT_LABEL: Record<PaymentMethod, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label]),
) as Record<PaymentMethod, string>;

/**
 * Linha da tabela `movements` (saída de estoque). Nome, preço, custo e taxa são cópias do momento
 * da saída, para que o histórico não mude quando o produto ou as taxas forem editados.
 */
export type Movement = {
  id: number;
  product_id: number;
  product_name: string;
  type: MovementType;
  quantity: number;
  unit_price: number; // centavos, cópia do valor no momento da movimentação
  unit_cost: number; // centavos, cópia do valor no momento da movimentação
  payment_method: PaymentMethod | null; // só para 'venda'
  fee_rate: number; // taxa da maquininha em pontos-base (499 = 4,99%), cópia do momento da venda
  fee: number; // centavos cobrados pela maquininha nesta venda
  created_at: string;
};

/** Taxas da maquininha em pontos-base (199 = 1,99%). */
export type CardFees = { debito: number; credito: number };

/** Taxa (em pontos-base) aplicável à forma de pagamento; só débito e crédito têm taxa, o resto é 0. */
export function feeRateFor(fees: CardFees, method: PaymentMethod | null): number {
  return method === 'debito' || method === 'credito' ? fees[method] : 0;
}

/** Valor da taxa em centavos para `amount` (centavos) e `rate` (pontos-base). */
export function calculateFee(amount: number, rate: number): number {
  // 10_000 pontos-base = 100%; arredonda para o centavo mais próximo para manter tudo inteiro.
  return Math.round((amount * rate) / 10_000);
}

/** Indica se o produto está no estoque mínimo ou abaixo dele. */
export function isLowStock(p: Pick<Product, 'stock' | 'min_stock'>): boolean {
  return p.stock <= p.min_stock;
}
