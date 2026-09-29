# Meu Estoque

App mobile para vendedores autônomos controlarem o estoque e registrarem vendas.

- Cadastro de produtos com código, preço de venda, custo e estoque mínimo
- Registro de saídas: **Venda** (com forma de pagamento) ou **Uso / Avulsa**
- Formas de pagamento registradas: Pix, Dinheiro, Crédito, Débito e Fiado
- Histórico de saídas e alerta de estoque baixo

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
```

## Estrutura

```
src/
  app/                 # rotas (Expo Router)
    _layout.tsx        # SQLiteProvider + Stack raiz
    produto.tsx        # modal de cadastro/edição de produto (?id=)
    (tabs)/
      index.tsx        # Estoque
      registrar.tsx    # Registrar Saída
      historico.tsx    # Histórico
  components/          # componentes de UI reutilizáveis
  db/                  # schema, migrações e consultas SQLite
  lib/                 # tema e formatação (moeda, datas)
```
