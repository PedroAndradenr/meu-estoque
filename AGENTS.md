# Meu Estoque

App para vendedores autônomos: cadastro de produtos (preço, custo, estoque), registro de saídas (venda com forma de pagamento, ou uso/avulsa) e histórico. O app NÃO processa pagamentos — só registra o método usado. UI em português (pt-BR).

## Project conventions

- Data is local-only (expo-sqlite, no backend). Schema and migrations live in `src/db/migrations.ts`, versioned via `PRAGMA user_version` — add a new `if (currentVersion === N)` step and bump `DATABASE_VERSION`; never edit a shipped migration.
- Money is stored as INTEGER cents. Use `formatMoney` / `parseMoney` from `src/lib/format.ts`; never store floats.
- Percentages (card fees) are stored as INTEGER basis points (499 = 4,99%); use `parsePercent` / `formatPercent`.
- Movements snapshot `product_name`, `unit_price`, `unit_cost`, `fee_rate` and `fee` so history stays correct after product or fee edits. Sale profit = revenue - cost - fee.
- PDF: `buildReportHtml` (`src/lib/report.ts`) → `expo-print` with `base64` → written to `Paths.cache` with expo-file-system → `expo-sharing`. Don't share the `expo-print` URI directly: Expo Go can't read that directory.
- Catalog data (name, code, cost, price) and stock are edited separately: `ProductForm` never touches stock; stock only goes up via `addStock` and down via `registerExit`.
- Stock changes from exits go through `registerExit` (`src/db/movements.ts`), which runs in an exclusive transaction.
- Screens reload data with `useFocusEffect`. Colors/radii come from `src/lib/theme.ts`; icons from `lucide-react-native`.
- Tabs: Estoque, Produtos, Registrar, Histórico. Original design reference had 3 screens (Estoque, Registrar Saída, Histórico).

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
