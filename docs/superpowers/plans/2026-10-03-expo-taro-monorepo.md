# Expo + Taro monorepo implementation plan

## Task 1: Workspace and shared contracts

- Configure pnpm, Turborepo, TypeScript, ESLint and Prettier.
- Add compiled `core`, `api` and `tokens` packages.
- Test validation, API success/error states, timeout and cancellation behavior.

## Task 2: Expo mobile application

- Configure Expo Router, HeroUI Native and Uniwind.
- Add fetch and AsyncStorage adapters, persisted theme selection and four route types.
- Verify adapter tests, TypeScript, lint and Android/iOS production exports.

## Task 3: Taro WeChat application

- Configure Taro React, Webpack 5, Sass and Taroify.
- Add Taro request/storage adapters, page-scoped theme provider and native tab bar.
- Verify adapter tests, TypeScript, lint and the WeChat production build.

## Task 4: CI and documentation

- Add environment examples, CI checks and setup/build documentation.
- Run the complete format, lint, typecheck, test and build matrix.

## Global constraints

- Runtime dependencies stay in the owning application.
- Shared runtime packages remain free of React, React Native, Taro, DOM and Node APIs.
- Workspace imports use public package exports only.
- Mock mode works without a backend; HTTP mode requires a base URL.
