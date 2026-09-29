export type Product = {
  id: number;
  name: string;
  code: string;
  price: number; // cents
  cost: number; // cents
  stock: number;
  min_stock: number;
  created_at: string;
};

export type ProductInput = Pick<Product, 'name' | 'code' | 'price' | 'cost' | 'stock' | 'min_stock'>;

export type MovementType = 'venda' | 'uso';

export type PaymentMethod = 'pix' | 'dinheiro' | 'credito' | 'debito' | 'fiado';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
  { value: 'fiado', label: 'Fiado' },
];

export const PAYMENT_LABEL: Record<PaymentMethod, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label]),
) as Record<PaymentMethod, string>;

export type Movement = {
  id: number;
  product_id: number;
  product_name: string;
  type: MovementType;
  quantity: number;
  unit_price: number; // cents, snapshot at the time of the movement
  unit_cost: number; // cents, snapshot at the time of the movement
  payment_method: PaymentMethod | null; // only for 'venda'
  created_at: string;
};

export function isLowStock(p: Pick<Product, 'stock' | 'min_stock'>): boolean {
  return p.stock <= p.min_stock;
}
