import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { DateField } from '@/components/DateField';
import { listMovementsBetween } from '@/db/movements';
import { PAYMENT_LABEL, type Movement } from '@/db/types';
import { formatMoney } from '@/lib/format';
import { buildReportHtml, summarize } from '@/lib/report';
import { colors, radius } from '@/lib/theme';

type Preset = 'hoje' | '7dias' | 'mes' | 'mesPassado' | 'personalizado';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7dias', label: 'Últimos 7 dias' },
  { value: 'mes', label: 'Este mês' },
  { value: 'mesPassado', label: 'Mês passado' },
  { value: 'personalizado', label: 'Escolher datas' },
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** Primeiro e último dia (inclusive) de um período predefinido. */
function presetRange(preset: Exclude<Preset, 'personalizado'>, today = startOfDay(new Date())) {
  switch (preset) {
    case 'hoje':
      return { first: today, last: today };
    case '7dias':
      return { first: addDays(today, -6), last: today };
    case 'mes':
      return { first: new Date(today.getFullYear(), today.getMonth(), 1), last: today };
    case 'mesPassado':
      return {
        first: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        last: new Date(today.getFullYear(), today.getMonth(), 0),
      };
  }
}

/** Nome do arquivo PDF com o período em AAAA-MM-DD, ex.: vendas_2026-09-01_a_2026-09-30.pdf. */
function reportFileName(first: Date, last: Date) {
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `vendas_${iso(first)}_a_${iso(last)}.pdf`;
}

/**
 * Relatório de vendas (aberto pelo Histórico ou pelas Configurações): escolhe um período, mostra o
 * resumo (vendas, custos, taxas, lucro, retiradas) e gera o PDF para baixar ou compartilhar.
 */
export default function RelatorioScreen() {
  const db = useSQLiteContext();
  const [preset, setPreset] = useState<Preset>('mes');
  const [custom, setCustom] = useState(() => presetRange('mes'));
  const [movements, setMovements] = useState<Movement[]>([]);
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  // Última pasta escolhida para downloads, para o seletor abrir nela da próxima vez.
  const [downloadDirUri, setDownloadDirUri] = useState<string | null>(null);

  const range = preset === 'personalizado' ? custom : presetRange(preset);
  const firstTime = range.first.getTime();
  const lastTime = range.last.getTime();

  // O fim da consulta é exclusivo: soma 1 dia ao último dia para incluir o dia inteiro.
  useEffect(() => {
    listMovementsBetween(db, new Date(firstTime), addDays(new Date(lastTime), 1)).then(setMovements);
  }, [db, firstTime, lastTime]);

  const summary = useMemo(() => summarize(movements), [movements]);

  /** Gera o PDF do período com expo-print e devolve o conteúdo em base64 junto com o nome do arquivo. */
  async function renderPdf() {
    const html = buildReportHtml({ movements, start: range.first, lastDay: range.last });
    const { base64 } = await Print.printToFileAsync({ html, base64: true });
    if (!base64) throw new Error('O PDF gerado veio vazio.');
    return { base64, name: reportFileName(range.first, range.last) };
  }

  /** Gera o PDF e abre a folha de compartilhamento do sistema. */
  async function sharePdf() {
    // O expo-print grava num diretório que o expo-sharing não consegue ler no Expo Go, então o PDF é
    // regravado no cache do próprio app (o que também dá ao arquivo um nome legível).
    const { base64, name } = await renderPdf();
    const file = new File(Paths.cache, name);
    if (file.exists) file.delete();
    file.create();
    file.write(base64, { encoding: 'base64' });
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Relatório de vendas',
    });
  }

  /**
   * Android: salva numa pasta escolhida pelo usuário (ex.: Documents).
   * iOS: usa a folha de compartilhamento, que tem "Salvar em Arquivos".
   */
  async function downloadPdf() {
    if (Platform.OS !== 'android') return sharePdf();
    // No Android 11+ o SAF não permite gravar direto na raiz de Download, por isso o usuário escolhe a pasta.
    let directory: Directory;
    try {
      directory = await Directory.pickDirectoryAsync(downloadDirUri ?? undefined);
    } catch {
      return; // usuário fechou o seletor de pasta
    }
    setDownloadDirUri(directory.uri);
    const { base64, name } = await renderPdf();
    const file = directory.createFile(name, 'application/pdf');
    file.write(base64, { encoding: 'base64' });
    Alert.alert('PDF salvo', `${file.name} foi salvo na pasta escolhida.`);
  }

  /** Executa a ação escolhida controlando o estado de carregamento e exibindo erros num alerta. */
  async function run(action: 'download' | 'share') {
    setBusy(action);
    try {
      await (action === 'download' ? downloadPdf() : sharePdf());
    } catch (e) {
      Alert.alert('Não foi possível gerar o PDF', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }


  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Define o título do cabeçalho a partir da própria tela. */}
      <Stack.Screen options={{ title: 'Relatório de Vendas' }} />
      <Text style={styles.label}>Período</Text>
      <View style={styles.chips}>
        {PRESETS.map((p) => {
          const active = p.value === preset;
          return (
            <Pressable
              key={p.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                // Ao trocar para datas personalizadas, parte do período que estava selecionado.
                if (p.value === 'personalizado') setCustom(range);
                setPreset(p.value);
              }}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {preset === 'personalizado' ? (
        <View style={styles.dates}>
          <DateField
            label="De"
            value={custom.first}
            maximumDate={custom.last}
            onChange={(d) => setCustom((c) => ({ ...c, first: startOfDay(d) }))}
          />
          <DateField
            label="Até"
            value={custom.last}
            minimumDate={custom.first}
            maximumDate={new Date()}
            onChange={(d) => setCustom((c) => ({ ...c, last: startOfDay(d) }))}
          />
        </View>
      ) : null}

      <Text style={styles.label}>Resumo</Text>
      <View style={styles.card}>
        <Row label={`Vendas (${summary.salesCount})`} value={formatMoney(summary.revenue)} />
        <Row label="Custo dos produtos" value={`- ${formatMoney(summary.cost)}`} />
        <Row label="Taxas da maquininha" value={`- ${formatMoney(summary.fees)}`} />
        <Row label="Lucro das vendas" value={formatMoney(summary.salesProfit)} strong />
        {summary.withdrawalUnits > 0 ? (
          <>
            <Row
              label={`Retiradas (${summary.withdrawalUnits} un)`}
              value={`- ${formatMoney(summary.withdrawalCost)}`}
            />
            <Row label="Resultado do período" value={formatMoney(summary.result)} strong />
          </>
        ) : null}
      </View>

      {summary.byPayment.length > 0 ? (
        <View style={[styles.card, { marginTop: 12 }]}>
          {summary.byPayment.map((p) => (
            <Row key={p.method} label={`${PAYMENT_LABEL[p.method]} (${p.count})`} value={formatMoney(p.total)} />
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: 24 }}>
        <Button
          label={busy === 'download' ? 'Gerando...' : 'Baixar PDF'}
          onPress={() => run('download')}
          disabled={busy !== null || movements.length === 0}
        />
        <View style={{ height: 12 }} />
        <Button
          label={busy === 'share' ? 'Gerando...' : 'Compartilhar'}
          variant="secondary"
          onPress={() => run('share')}
          disabled={busy !== null || movements.length === 0}
        />
        {movements.length === 0 ? <Text style={styles.empty}>Nenhuma movimentação neste período.</Text> : null}
      </View>
    </ScrollView>
  );
}

/** Linha rótulo/valor do cartão de resumo; strong destaca totais. */
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={[styles.row, strong && styles.rowStrong]}>
      <Text style={[styles.rowLabel, strong && styles.strongText]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.strongText]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginTop: 8, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  dates: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  rowStrong: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  strongText: { color: colors.primaryText, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 10, fontSize: 13 },
});
