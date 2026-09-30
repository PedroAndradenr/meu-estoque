// Formatação e leitura de valores no padrão pt-BR: dinheiro (centavos inteiros), percentuais
// (pontos-base, 499 = 4,99%) e datas no fuso local do aparelho.

/** Formata um valor inteiro em centavos como "R$ 1.234,56". */
export function formatMoney(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  // Insere "." como separador de milhar.
  const reais = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centavos = (abs % 100).toString().padStart(2, '0');
  return `${negative ? '-' : ''}R$ ${reais},${centavos}`;
}

/** Converte texto digitado como "249,90", "1.234,5" ou "59" em centavos. Retorna null se for inválido. */
export function parseMoney(input: string): number | null {
  // "." é tratado como separador de milhar e removido; a "," vira o separador decimal.
  const cleaned = input.replace(/[R$\s.]/g, '').replace(',', '.');
  if (cleaned === '' || !/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  // Arredonda para evitar erro de ponto flutuante (ex.: 0.29 * 100 = 28.999...).
  return Math.round(parseFloat(cleaned) * 100);
}

/** Formata centavos para um campo de texto editável ("249,90"). */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Hora local de uma data ISO: "14:15". */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Data e hora locais de uma data ISO: "17/09/2026, 14:15". */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}, ${formatTime(iso)}`;
}

/** Chave do dia no calendário local ("2026-09-17") usada para agrupar registros por dia. */
export function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "Hoje" / "Ontem" / "17/09" (inclui o ano quando não é o ano atual). */
export function formatDayLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  // Math.round compensa dias de 23/25 h em mudanças de horário de verão.
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  const label = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
  return date.getFullYear() === now.getFullYear() ? label : `${label}/${date.getFullYear()}`;
}

/** Data local no formato "01/09/2026". */
export function formatDate(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Formata pontos-base como "4,99%". */
export function formatPercent(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(2).replace('.', ',')}%`;
}

/** Formata pontos-base para um campo de texto editável ("4,99"). */
export function percentToInput(basisPoints: number): string {
  return (basisPoints / 100).toFixed(2).replace('.', ',');
}

/** Converte "4,99" / "4.99" / "5" em pontos-base (499). Retorna null se for inválido ou acima de 100%. */
export function parsePercent(input: string): number | null {
  const cleaned = input.replace(/[%\s]/g, '').replace(',', '.');
  // Campo vazio significa "sem taxa".
  if (cleaned === '') return 0;
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const value = Math.round(parseFloat(cleaned) * 100);
  return value <= 10_000 ? value : null;
}
