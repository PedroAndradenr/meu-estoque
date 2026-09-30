# Meu Estoque

App mobile para vendedores autônomos controlarem o estoque e registrarem vendas.

- Cadastro de produtos (aba Produtos) com código, custo e valor de venda
- Entrada de estoque e alerta de estoque mínimo por produto (tocando no produto em Estoque)
- Registro de saídas: **Venda** (com forma de pagamento) ou **Uso / Avulsa**
- Formas de pagamento registradas: Pix, Dinheiro, Crédito, Débito e Fiado
- Histórico de saídas agrupado por dia, com custo, taxa e lucro de cada venda
- Taxas da maquininha (débito e crédito) nas Configurações, descontadas do lucro
- Relatório de vendas em PDF por período (vendas, formas de pagamento, taxas, lucro e retiradas)

> O app **não processa pagamentos** — apenas registra como cada venda foi paga.

Os dados ficam salvos localmente no aparelho (SQLite), sem servidor e funcionando offline.

## Stack

- [Expo](https://expo.dev) SDK 57 + React Native + TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) (rotas em `src/app/`)
- [expo-sqlite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/) para persistência local
- [lucide-react-native](https://lucide.dev) para ícones

## Rodando

```bash
npm install
npx expo start
```

Abra no celular com o app **Expo Go** (escaneie o QR code) ou em um emulador Android/iOS.

## Scripts

```bash
npx expo lint      # lint
npm run typecheck  # checagem de tipos
npx expo-doctor    # diagnóstico de dependências
npm run pdfs       # copia os PDFs salvos em Documents no emulador para ~/Downloads
```

## Estrutura

```
src/
  app/                 # rotas (Expo Router)
    _layout.tsx        # SQLiteProvider + Stack raiz
    estoque.tsx        # modal de entrada de estoque / alerta (?id=)
    produto.tsx        # modal de edição de produto (?id=)
    configuracoes.tsx  # taxas da maquininha
    relatorio.tsx      # relatório de vendas em PDF
    (tabs)/
      index.tsx        # Estoque (precisa repor / em estoque)
      produtos.tsx     # cadastro de produtos
      registrar.tsx    # Registrar Saída
      historico.tsx    # Histórico
  components/          # componentes de UI reutilizáveis
  db/                  # schema, migrações e consultas SQLite
  lib/                 # tema, formatação (moeda, datas, %) e HTML do relatório
```
