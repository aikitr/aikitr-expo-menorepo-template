# Expo + Taro 多端 Monorepo 模板

一个可直接运行的 Android、iOS 与微信小程序模板。移动端使用 Expo Router、HeroUI Native 与 Uniwind，小程序使用 Taro React 与 Taroify；类型、数据校验、API 客户端和设计变量由纯 TypeScript 包共享。

## 技术栈

| 范围          | 技术                                                |
| ------------- | --------------------------------------------------- |
| Android / iOS | Expo 57、Expo Router、HeroUI Native、Uniwind        |
| 微信小程序    | Taro 4、React 18、Webpack 5、Taroify、Sass          |
| 共享代码      | TypeScript ESM、显式 `exports`                      |
| 工程          | pnpm Workspace、Turborepo、ESLint、Prettier、Vitest |

## 环境要求

- Node.js `22.23.3`
- pnpm `10.34.6`
- iOS 原生构建需要 macOS 与 Xcode；也可使用 EAS Build
- 小程序预览和真机调试需要微信开发者工具

```bash
corepack enable
corepack prepare pnpm@10.34.6 --activate
pnpm install --frozen-lockfile
```

默认启用 Mock 数据，无需后端即可运行。若要使用 HTTP 服务，分别复制应用的环境变量示例，把 `USE_MOCK` 改为 `false` 并填写公开 API 地址：

```bash
cp app/mobile/.env.example app/mobile/.env.local
cp app/weapp/.env.example app/weapp/.env.local
```

客户端环境变量会进入安装包，请勿放置密钥、证书或发布凭据。

## 启动

所有命令都从仓库根目录执行。Turbo 会先编译共享包，再启动对应应用，并在开发过程中监听共享包变化。

```bash
pnpm dev:mobile
pnpm dev:weapp
```

移动端开发命令启动 Development Build 服务。首次运行本地原生工程时执行：

```bash
pnpm --filter @repo/mobile native:prebuild
pnpm --filter @repo/mobile android
# 或
pnpm --filter @repo/mobile ios
```

`android/` 与 `ios/` 由 Expo CNG 生成并已忽略，不应提交。微信开发者工具应导入 `app/weapp`，构建输出目录为 `app/weapp/dist`；发布前请在 `project.config.json` 中替换正式 AppID。

## 页面与功能

- 首页：说明模板能力并连接示例与设置页面
- 示例列表与详情：演示共享 API、加载、空数据、错误、超时和取消请求
- 设置：浅色/深色主题切换并持久化到各平台本地存储
- 原生端使用 Expo Router；小程序使用标准页面注册和原生 TabBar

Mock 场景由 `@repo/api` 的 `createMockTransport` 提供，可在测试或功能开发时选择 `success`、`empty`、`network`、`timeout`、`invalid-response`。

## 常用命令

| 命令                | 作用                                 |
| ------------------- | ------------------------------------ |
| `pnpm dev:mobile`   | 启动 Expo Development Build 开发服务 |
| `pnpm dev:weapp`    | 持续构建微信小程序                   |
| `pnpm build:mobile` | 导出 Android 与 iOS JavaScript 产物  |
| `pnpm build:weapp`  | 生产构建微信小程序                   |
| `pnpm lint`         | 检查代码规范与依赖边界               |
| `pnpm typecheck`    | 严格 TypeScript 检查                 |
| `pnpm test`         | 运行共享契约与平台适配器测试         |
| `pnpm format:check` | 检查格式                             |

`pnpm build:mobile` 验证 JavaScript 和资源可以被 Metro 导出，不等同于完整原生安装包构建。Android 安装包应再通过 Gradle 或 EAS 验证；iOS 应在 Xcode 或 EAS 环境中验证。EAS 安装依赖后会自动编译共享包。

## 代码边界

应用只能通过 `@repo/*` 的公开入口使用共享代码。`core`、`api` 和 `tokens` 不依赖 React、React Native、Taro、DOM 或 Node 专属 API；路由、组件、生命周期和平台能力保留在应用内。详细约束见 [架构说明](docs/architecture.md)。
