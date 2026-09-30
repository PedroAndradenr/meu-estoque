// Relatório de vendas do período: totais (summarize) e o HTML que o expo-print converte em PDF.
// Os cálculos usam as cópias de preço/custo/taxa gravadas em cada movimentação, não os valores atuais.
import { PAYMENT_LABEL, PAYMENT_METHODS, type Movement, type PaymentMethod } from '@/db/types';

import { formatDate, formatDateTime, formatMoney, formatPercent } from './format';

/** Totais do período; todos os valores em dinheiro estão em centavos. */
export type ReportSummary = {
  salesCount: number;
  unitsSold: number;
  revenue: number;
  cost: number;
  fees: number;
  /** revenue - cost - fees (faturamento - custo - taxas) */
  salesProfit: number;
  byPayment: { method: PaymentMethod; count: number; total: number }[];
  withdrawalUnits: number;
  withdrawalCost: number;
  /** salesProfit - withdrawalCost (lucro das vendas menos o custo das retiradas) */
  result: number;
};

/** Calcula os totais de vendas e retiradas ('uso') a partir das movimentações do período. */
export function summarize(movements: Movement[]): ReportSummary {
  const sales = movements.filter((m) => m.type === 'venda');
  const withdrawals = movements.filter((m) => m.type === 'uso');

  const revenue = sales.reduce((sum, m) => sum + m.unit_price * m.quantity, 0);
  const cost = sales.reduce((sum, m) => sum + m.unit_cost * m.quantity, 0);
  const fees = sales.reduce((sum, m) => sum + m.fee, 0);
  const withdrawalCost = withdrawals.reduce((sum, m) => sum + m.unit_cost * m.quantity, 0);

  // Segue a ordem de PAYMENT_METHODS e omite formas sem nenhuma venda.
  const byPayment = PAYMENT_METHODS.map(({ value }) => {
    const ofMethod = sales.filter((m) => m.payment_method === value);
    return {
      method: value,
      count: ofMethod.length,
      total: ofMethod.reduce((sum, m) => sum + m.unit_price * m.quantity, 0),
    };
  }).filter((p) => p.count > 0);

  // Lucro = faturamento - custo - taxas da maquininha; retiradas só entram no `result`.
  const salesProfit = revenue - cost - fees;
  return {
    salesCount: sales.length,
    unitsSold: sales.reduce((sum, m) => sum + m.quantity, 0),
    revenue,
    cost,
    fees,
    salesProfit,
    byPayment,
    withdrawalUnits: withdrawals.reduce((sum, m) => sum + m.quantity, 0),
    withdrawalCost,
    result: salesProfit - withdrawalCost,
  };
}

// Texto digitado pelo usuário (ex.: nome do produto) é escapado para não quebrar nem injetar HTML no PDF.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type ReportInput = {
  movements: Movement[];
  start: Date;
  /** Último dia do período (inclusivo). */
  lastDay: Date;
  generatedAt?: Date;
};

/** Monta o HTML completo do relatório de vendas do período, pronto para o expo-print gerar o PDF. */
export function buildReportHtml({ movements, start, lastDay, generatedAt = new Date() }: ReportInput): string {
  const s = summarize(movements);
  const sales = movements.filter((m) => m.type === 'venda');
  const withdrawals = movements.filter((m) => m.type === 'uso');
  const period =
    formatDate(start) === formatDate(lastDay) ? formatDate(start) : `${formatDate(start)} a ${formatDate(lastDay)}`;

  const saleRows = sales
    .map((m) => {
      const total = m.unit_price * m.quantity;
      // Mesma regra de summarize: valor - custo - taxa.
      const profit = total - m.unit_cost * m.quantity - m.fee;
      return `<tr>
        <td>${formatDateTime(m.created_at)}</td>
        <td>${escapeHtml(m.product_name)}</td>
        <td class="num">${m.quantity}</td>
        <td>${m.payment_method ? PAYMENT_LABEL[m.payment_method] : '-'}</td>
        <td class="num">${formatMoney(total)}</td>
        <td class="num">${formatMoney(m.unit_cost * m.quantity)}</td>
        <td class="num">${m.fee > 0 ? `${formatMoney(m.fee)}<br><small>${formatPercent(m.fee_rate)}</small>` : '-'}</td>
        <td class="num ${profit < 0 ? 'neg' : ''}">${formatMoney(profit)}</td>
      </tr>`;
    })
    .join('');

  const withdrawalRows = withdrawals
    .map(
      (m) => `<tr>
        <td>${formatDateTime(m.created_at)}</td>
        <td>${escapeHtml(m.product_name)}</td>
        <td class="num">${m.quantity}</td>
        <td class="num">${formatMoney(m.unit_cost * m.quantity)}</td>
      </tr>`,
    )
    .join('');

  const paymentRows = s.byPayment
    .map(
      (p) => `<tr><td>${PAYMENT_LABEL[p.method]}</td><td class="num">${p.count}</td><td class="num">${formatMoney(p.total)}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 32px; font-size: 12px; }
  h1 { font-size: 22px; margin: 0; }
  h2 { font-size: 14px; margin: 28px 0 8px; text-transform: uppercase; letter-spacing: .5px; color: #6B7280; }
  .muted { color: #6B7280; }
  .cards { display: flex; gap: 8px; margin-top: 20px; }
  .card { flex: 1; border: 1px solid #E5E7EB; border-radius: 8px; padding: 10px; }
  .card .label { font-size: 10px; color: #6B7280; text-transform: uppercase; }
  .card .value { font-size: 16px; font-weight: 700; margin-top: 4px; }
  .highlight { background: #E4E9FF; border-color: #E4E9FF; color: #2A3FD6; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; padding: 6px 4px; }
  td { border-bottom: 1px solid #F1F2F4; padding: 6px 4px; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  .neg { color: #E5283A; }
  small { color: #9CA3AF; }
  .empty { color: #6B7280; padding: 8px 0; }
  .totals td { font-weight: 700; border-bottom: none; }
</style>
</head>
<body>
  <h1>Relatório de Vendas</h1>
  <div class="muted">Período: ${period} · Gerado em ${formatDateTime(generatedAt.toISOString())}</div>

  <div class="cards">
    <div class="card"><div class="label">Faturamento</div><div class="value">${formatMoney(s.revenue)}</div></div>
    <div class="card"><div class="label">Custo</div><div class="value">${formatMoney(s.cost)}</div></div>
    <div class="card"><div class="label">Taxas</div><div class="value">${formatMoney(s.fees)}</div></div>
    <div class="card highlight"><div class="label">Lucro das vendas</div><div class="value">${formatMoney(s.salesProfit)}</div></div>
  </div>
  <div class="muted" style="margin-top:8px">${s.salesCount} ${s.salesCount === 1 ? 'venda' : 'vendas'} · ${s.unitsSold} ${s.unitsSold === 1 ? 'unidade vendida' : 'unidades vendidas'}</div>

  <h2>Por forma de pagamento</h2>
  ${
    paymentRows
      ? `<table><thead><tr><th>Forma</th><th class="num">Vendas</th><th class="num">Total</th></tr></thead><tbody>${paymentRows}</tbody></table>`
      : '<div class="empty">Nenhuma venda no período.</div>'
  }

  <h2>Vendas</h2>
  ${
    saleRows
      ? `<table><thead><tr><th>Data</th><th>Produto</th><th class="num">Qtd</th><th>Pagamento</th><th class="num">Valor</th><th class="num">Custo</th><th class="num">Taxa</th><th class="num">Lucro</th></tr></thead>
        <tbody>${saleRows}
          <tr class="totals"><td colspan="4">Total</td><td class="num">${formatMoney(s.revenue)}</td><td class="num">${formatMoney(s.cost)}</td><td class="num">${formatMoney(s.fees)}</td><td class="num">${formatMoney(s.salesProfit)}</td></tr>
        </tbody></table>`
      : '<div class="empty">Nenhuma venda no período.</div>'
  }

  <h2>Retiradas (uso interno)</h2>
  ${
    withdrawalRows
      ? `<table><thead><tr><th>Data</th><th>Produto</th><th class="num">Qtd</th><th class="num">Custo</th></tr></thead>
        <tbody>${withdrawalRows}
          <tr class="totals"><td colspan="2">Total</td><td class="num">${s.withdrawalUnits}</td><td class="num">${formatMoney(s.withdrawalCost)}</td></tr>
        </tbody></table>`
      : '<div class="empty">Nenhuma retirada no período.</div>'
  }

  <h2>Resultado</h2>
  <table>
    <tr><td>Lucro das vendas</td><td class="num">${formatMoney(s.salesProfit)}</td></tr>
    <tr><td>(-) Custo das retiradas</td><td class="num">${formatMoney(s.withdrawalCost)}</td></tr>
    <tr class="totals"><td>Resultado do período</td><td class="num ${s.result < 0 ? 'neg' : ''}">${formatMoney(s.result)}</td></tr>
  </table>
</body>
</html>`;
}
