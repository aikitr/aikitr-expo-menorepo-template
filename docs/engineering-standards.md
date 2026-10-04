# Expo + Taro 多端 Monorepo 团队工程规范

适用范围：pnpm Workspace + Turborepo + TypeScript；Android/iOS 使用 Expo Router + HeroUI Native + Uniwind；微信小程序使用 Taro React + Taroify + Sass。

版本：1.1。资料核对日期：2026-10-04。本文是面向多人协作、长期维护和持续交付的推荐标准，不声称所有“大厂”使用同一规范。本文是目标规范，示例目录和目标命令不等于当前项目已经落地。

## 目录

1. 规则等级与工程原则
2. 架构分层与依赖矩阵
3. 完整目录结构
4. 文件归属与模块演进
5. 命名与导入规范
6. 组件、页面与交互规范
7. TypeScript 与代码规范
8. API、校验与错误契约
9. 状态、持久化与异步生命周期
10. 设计变量、主题与样式
11. Expo 原生端规范
12. Taro 微信小程序规范
13. 工作区、版本与工具管理
14. 任务编排、开发监听与缓存
15. 环境配置、安全与日志
16. 测试与验收
17. CI、构建与发布
18. Git、评审与团队治理
19. 可执行门禁与完成清单
20. 现有项目的渐进落地
21. 组件接口契约
22. 异常隔离与恢复
23. 平台支持矩阵
24. 公共契约演进与迁移
25. 数据协议与缓存细则
26. 发布观察与故障处理

## 1. 规则等级与工程原则

| 等级              | 含义                                     | 例外处理                                   |
| ----------------- | ---------------------------------------- | ------------------------------------------ |
| MUST / 必须       | 正确性、平台边界、数据安全或交付的硬约束 | 变更规则本身需要风险与验证证据；不静默绕过 |
| SHOULD / 默认推荐 | 为团队一致性选择的默认方案               | 有明确收益或兼容原因可例外，评审中说明     |
| MAY / 按需        | 业务规模、平台限制或测量结果触发的扩展   | 不预先安装、创建空目录或增加抽象           |

下文“必须/禁止”表示 MUST，“默认/建议”表示 SHOULD，“可/按需”表示 MAY。例外说明包含范围、原因、验证证据、负责人和复查/移除条件；依赖边界的例外不能导致平台实现泄漏到纯共享运行时。

- 一个业务能力有明确所有者，一个可变状态有明确写入点，一个跨包契约有明确公开入口。
- 先按业务功能组织，再在功能内部拆职责，避免所有页面依赖庞大的 services/hooks/utils 目录。
- 两端共享业务含义与契约，分别实现体验。外观相似不证明可以共享 JSX、生命周期或样式单位。
- 让 lint、类型、任务图和 CI 检查可证明的规则；将需要判断的取舍留给评审与 ADR。
- 抽象以真实消费者和变化原因决定，不用目录深度、类数量或覆盖率衡量成熟度。
- 制定规范不隐含升级框架、迁移业务、增加后端或发布授权。

## 2. 架构分层与依赖矩阵

```text
app/mobile ─┬─→ packages/api ─→ packages/core
            ├─→ packages/core
            └─→ packages/tokens
app/weapp ──┬─→ packages/api ─→ packages/core
            ├─→ packages/core
            └─→ packages/tokens
各工作区 ──→ tooling/*              仅工程 / 开发依赖
packages/tokens                    无业务包依赖
```

| 模块         | 职责                             | 可依赖                      | 禁止                                    |
| ------------ | -------------------------------- | --------------------------- | --------------------------------------- |
| core         | 领域类型、规则、解析、平台端口   | 纯 TS、经评估的跨运行时纯库 | React/平台 UI、实际 HTTP/存储、应用配置 |
| api          | 客户端工厂、服务、DTO 映射、Mock | core、兼容两端的纯库        | 平台传输、Toast、导航、React Hooks      |
| tokens       | 基础值、语义变量、两端样式产物   | 无业务包依赖                | React UI、平台运行时、业务服务          |
| mobile/weapp | 页面、交互、设备能力、依赖装配   | api/core/tokens、各自平台库 | 另一个应用、跨包内部路径                |
| tooling      | lint/TS 配置、依赖检查等构建工具 | Node、开发工具              | 被应用 runtime 导入                     |

约束的是生产运行时。配置、生成脚本与测试可依赖 Node/测试框架，但必须通过目录、TS 配置和 exports 隔离；devDependencies 不能自行保证代码不进入运行时。

公共端口由 core 定义，平台实现由应用提供，实例在 bootstrap/provider 装配。例如 api 接收 HttpTransport，不能自行选择 fetch/Taro.request。

应用级服务 Context 的声明、Provider 与消费 Hook 归 shared，bootstrap 只创建实例并装配这些 Provider；shared 中的 Hook 不反向导入 bootstrap，也不从 feature 内部获取状态。

应用默认方向：路由/bootstrap → features → shared UI/Hooks/导航/主题 → shared lib/adapters/config 与公共包。它不是强制经过每层的调用链，UI 可直接使用 tokens。

必须遵守：

- shared 不引用 features 或路由；通用 UI 不硬编码业务端点/实体/跳转。
- adapters 不引用页面、feature 或可视组件；平台能力不隐藏在 UI 工具函数中。
- feature 内可相对导入，对外暴露页面/屏幕或少量用例入口；禁止调用 sibling feature 的内部文件。
- 跨 feature 默认由路由组合。长业务流程确有需要时增加 workflows 装配层，使用 feature 公开入口；feature 不反向依赖 workflows。
- 跨领域共享规则可提到 core，不能为消除一次重复把整个 feature 塞进 core。
- 不出现循环依赖，包括 type-only、re-export 和别名解析后的循环。

## 3. 完整目录结构

这是可扩展的目标目录。examples 展示完整功能切片，home/settings 按实际复杂度拆分；只有存在真实代码/配置才创建目录，不需要建齐所有示例文件。

```text
.
├── app/
│   ├── mobile/
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   ├── fonts/
│   │   │   └── icons/
│   │   ├── src/
│   │   │   ├── app/                         # 仅 Expo Router 入口
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── +not-found.tsx
│   │   │   │   ├── (tabs)/
│   │   │   │   │   ├── _layout.tsx
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── examples.tsx
│   │   │   │   │   └── settings.tsx
│   │   │   │   └── examples/[id].tsx
│   │   │   ├── bootstrap/
│   │   │   │   ├── app-providers.tsx
│   │   │   │   └── create-app-services.ts
│   │   │   ├── features/
│   │   │   │   ├── home/
│   │   │   │   │   ├── screens/home-screen.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── examples/
│   │   │   │   │   ├── screens/
│   │   │   │   │   │   ├── example-list-screen.tsx
│   │   │   │   │   │   └── example-detail-screen.tsx
│   │   │   │   │   ├── components/example-card.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── use-example-list.ts
│   │   │   │   │   │   └── use-example-detail.ts
│   │   │   │   │   ├── model/
│   │   │   │   │   │   ├── example-view-model.ts
│   │   │   │   │   │   └── example-view-model.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── settings/
│   │   │   │       ├── screens/settings-screen.tsx
│   │   │   │       └── index.ts
│   │   │   ├── shared/                      # 仅当前应用内复用
│   │   │   │   ├── ui/
│   │   │   │   │   ├── screen.tsx
│   │   │   │   │   ├── async-state.tsx
│   │   │   │   │   └── app-button.tsx        # 有团队语义才封装
│   │   │   │   ├── hooks/use-app-services.ts
│   │   │   │   ├── navigation/
│   │   │   │   │   ├── routes.ts
│   │   │   │   │   ├── glass-tab-bar.tsx
│   │   │   │   │   └── tab-bar-layout.ts
│   │   │   │   ├── providers/theme-provider.tsx
│   │   │   │   ├── providers/app-services-provider.tsx
│   │   │   │   ├── theme/navigation-theme.ts
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── fetch-transport.ts
│   │   │   │   │   ├── fetch-transport.test.ts
│   │   │   │   │   └── async-storage-port.ts
│   │   │   │   ├── config/env.ts
│   │   │   │   └── lib/create-cancellation.ts
│   │   │   └── types/uniwind-types.d.ts
│   │   ├── plugins/                         # 按需 CNG config plugins
│   │   ├── global.css
│   │   ├── app.config.ts
│   │   ├── eas.json
│   │   ├── metro.config.js
│   │   ├── eslint.config.mjs
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   └── package.json
│   └── weapp/
│       ├── config/
│       │   ├── index.ts
│       │   ├── dev.ts
│       │   └── prod.ts
│       ├── src/
│       │   ├── app.ts                       # 非可视 Context / 生命周期
│       │   ├── app.config.ts                # 页面 / TabBar / 分包注册
│       │   ├── app.scss
│       │   ├── pages/                       # 主包路由入口
│       │   │   ├── home/
│       │   │   │   ├── index.tsx
│       │   │   │   └── index.config.ts
│       │   │   ├── examples/
│       │   │   │   ├── index.tsx
│       │   │   │   ├── index.config.ts
│       │   │   │   ├── detail.tsx
│       │   │   │   └── detail.config.ts
│       │   │   └── settings/
│       │   │       ├── index.tsx
│       │   │       └── index.config.ts
│       │   ├── bootstrap/
│       │   │   ├── app-providers.tsx
│       │   │   └── create-app-services.ts
│       │   ├── features/
│       │   │   ├── home/
│       │   │   │   ├── pages/home-page.tsx
│       │   │   │   └── index.ts
│       │   │   ├── examples/
│       │   │   │   ├── pages/
│       │   │   │   │   ├── example-list-page.tsx
│       │   │   │   │   └── example-detail-page.tsx
│       │   │   │   ├── components/
│       │   │   │   │   ├── example-card.tsx
│       │   │   │   │   └── example-card.module.scss
│       │   │   │   ├── hooks/use-example-list.ts
│       │   │   │   ├── model/example-view-model.ts
│       │   │   │   └── index.ts
│       │   │   └── settings/
│       │   │       ├── pages/settings-page.tsx
│       │   │       └── index.ts
│       │   ├── shared/
│       │   │   ├── ui/
│       │   │   │   ├── page-shell.tsx        # 每页可视 ConfigProvider
│       │   │   │   ├── async-state.tsx
│       │   │   │   └── app-button.tsx
│       │   │   ├── hooks/use-app-services.ts
│       │   │   ├── navigation/routes.ts
│       │   │   ├── providers/theme-provider.tsx
│       │   │   ├── providers/app-services-provider.tsx
│       │   │   ├── theme/taroify-theme.ts
│       │   │   ├── adapters/
│       │   │   │   ├── taro-transport.ts
│       │   │   │   ├── taro-transport.test.ts
│       │   │   │   └── taro-storage-port.ts
│       │   │   ├── config/env.ts
│       │   │   └── lib/create-cancellation.ts
│       │   ├── assets/
│       │   │   ├── images/
│       │   │   └── tabbar/
│       │   └── types/global.d.ts
│       ├── project.config.json
│       ├── babel.config.js
│       ├── eslint.config.mjs
│       ├── tsconfig.json
│       ├── .env.example
│       └── package.json
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── examples/
│   │   │   │   ├── example.types.ts
│   │   │   │   ├── parse-example.ts
│   │   │   │   ├── parse-example.test.ts
│   │   │   │   └── index.ts
│   │   │   ├── ports/
│   │   │   │   ├── http-transport.ts
│   │   │   │   ├── storage-port.ts
│   │   │   │   ├── cancellation-signal.ts
│   │   │   │   └── index.ts
│   │   │   ├── errors/api-error.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   ├── eslint.config.mjs
│   │   └── package.json
│   ├── api/
│   │   ├── src/
│   │   │   ├── client/create-api-client.ts
│   │   │   ├── examples/
│   │   │   │   ├── example-service.ts
│   │   │   │   ├── example.dto.ts
│   │   │   │   └── example-service.test.ts
│   │   │   ├── mock/
│   │   │   │   ├── create-mock-transport.ts
│   │   │   │   ├── example.fixtures.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   ├── eslint.config.mjs
│   │   └── package.json
│   └── tokens/
│       ├── src/
│       │   ├── primitives.ts
│       │   ├── semantic.ts
│       │   └── index.ts
│       ├── scripts/generate-styles.mjs      # 构建期 Node，不进入 runtime
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       ├── eslint.config.mjs
│       └── package.json
├── tooling/
│   ├── eslint-config/
│   │   ├── base.mjs
│   │   ├── react.mjs
│   │   ├── platform-agnostic.mjs
│   │   └── package.json
│   ├── typescript-config/
│   │   ├── base.json
│   │   ├── library.json
│   │   ├── expo.json
│   │   ├── taro.json
│   │   └── package.json
│   └── checks/                             # 按需依赖图/AST 检查
│       ├── check-boundaries.mjs
│       └── package.json
├── tests/e2e/                              # 有稳定运行环境后按需启用
│   ├── mobile/
│   └── weapp/
├── docs/
│   ├── engineering-standards.md
│   ├── architecture.md
│   ├── adr/0001-shared-package-boundaries.md
│   └── runbooks/
│       ├── local-development.md
│       ├── ios-real-device.md
│       ├── android-build.md
│       └── weapp-release.md
├── .github/
│   ├── workflows/ci.yml
│   ├── CODEOWNERS                          # 实际团队负责人
│   └── pull_request_template.md
├── AGENTS.md                               # 简短入口，链接规范
├── .editorconfig
├── .gitignore
├── .prettierignore
├── prettier.config.mjs
├── .mise.toml
├── .nvmrc                                  # 保留时与 mise/CI 一致
├── pnpm-workspace.yaml
├── pnpm-lock.yaml                          # 唯一依赖锁文件
├── turbo.json
├── package.json
└── README.md
```

默认不提交 node_modules、dist、coverage、.turbo、应用 .expo 本机状态、CNG 生成的 mobile/android 与 ios、小程序 project.private.config.json、真实 .env 与签名文件。

Uniwind/Expo Router 生成声明要有明确提交策略：若不提交，fresh clone/CI 必须在 typecheck 前能生成。不要一律忽略所有 .d.ts，也不手写空声明掩盖缺失产物。

小程序普通分包按需增加 `src/subpackages/<业务>/pages`，同步页面注册、资源归属与构建验收。独立分包有额外加载限制，不能直接照搬主包 shared 的导入方式。

## 4. 文件归属与模块演进

| 判断                             | 归属                           |
| -------------------------------- | ------------------------------ |
| 平台无关的业务契约、校验、纯规则 | core/src/领域                  |
| 请求端点、DTO 映射、客户端、Mock | api/src/领域                   |
| 语义颜色、间距、圆角等尺度       | tokens                         |
| 仅某业务使用的 UI/Hook/展示模型  | 应用 features/业务             |
| 同一应用多个业务复用的无业务 UI  | 应用 shared/ui                 |
| 平台请求、存储、权限等实现       | 应用 shared/adapters           |
| 客户端创建、环境选择、端口注入   | 应用 bootstrap                 |
| 当前路由、参数、页面配置         | 原生 src/app；小程序 src/pages |

简单 feature 可以只有页面和少量 Hook；不强制每个 feature 同时建 services/stores/schemas/types/utils。出现独立变化原因或多个真实调用点再拆分。

index.ts 是公开面，不是每个目录必备文件。禁止 export * 无差别公开内部实现；内部文件直接相对导入，避免通过自己的 index 形成循环。包按领域提供显式子路径入口，减少 API 面积。

第二个同技术栈应用确实需要复用组件时，再评估 mobile-ui/weapp-ui 平台包，不能混入纯共享层。React 等依赖由消费者通过已验证的 peerDependencies 兼容范围提供。

## 5. 命名与导入规范

| 对象                 | 默认规则                        | 示例                                       |
| -------------------- | ------------------------------- | ------------------------------------------ |
| 目录、普通源文件     | 英文 kebab-case，表达具体能力   | user-profile/、example-card.tsx            |
| 业务模块             | 领域名，不用 common/module1     | examples、settings                         |
| React 组件/类型/接口 | PascalCase，接口不加 I          | ExampleCard、ExampleCardProps、StoragePort |
| 原生页面实现         | *-screen.tsx                    | example-detail-screen.tsx                  |
| 小程序页面实现       | *-page.tsx                      | example-detail-page.tsx                    |
| Hook                 | 文件 use-*.ts；函数 useX        | use-example-list.ts / useExampleList       |
| 纯函数、变量         | camelCase，动词/具体名词        | parseExampleItem、selectedExampleId        |
| 布尔值               | is/has/can/should，避免双重否定 | isLoading、hasMore、canSubmit              |
| 外部事件/内部处理器  | onX / handleX                   | onSelect / handleSelect                    |
| 模块不变配置         | UPPER_SNAKE_CASE，包含单位      | REQUEST_TIMEOUT_MS                         |
| 数据对象             | camelCase                       | colorTokens、exampleFixtures               |
| DTO/协议             | 明确语义、缩写一致              | ExampleDto、ListExamplesResponse           |
| 单元/组件测试        | 同名 .test.ts/.test.tsx         | parse-example.test.ts                      |
| E2E                  | 工具原生扩展；TS 可 .spec.ts    | example-navigation.spec.ts                 |
| Sass 模块            | 与组件同名 .module.scss         | example-card.module.scss                   |
| 环境变量             | 平台前缀 + UPPER_SNAKE_CASE     | EXPO_PUBLIC_API_BASE_URL                   |
| 工作区包             | 相同 namespace + kebab-case     | @repo/core、@repo/mobile                   |
| 文档/ADR             | kebab-case；ADR 递增编号        | ios-real-device.md、0002-theme-mapping.md  |
| 平台差异文件         | .ios/.android 扩展              | device-info.ios.ts                         |

工具规定的 _layout.tsx、[id].tsx、+not-found.tsx、app.config.ts、index.config.ts 保留官方名称。路由入口可 default export；普通组件和工具默认命名导出。

异步函数不普遍加 Async，存在同步对应实现才区分。parseX 失败抛明确错误；isX 返回 boolean/type predicate；validateX 返回约定结果对象，同名不混用返回 undefined/吞错/抛异常。

```ts
// 包消费者只用真实 exports
import { createApiClient } from '@repo/api';
import type { ExampleItem } from '@repo/core/examples';
// 应用 @/ 只映射当前 src
import { ExampleDetailScreen } from '@/features/examples';
// NodeNext 编译库内部，TS 源引用运行时 .js 路径
import { parseExampleItem } from './parse-example.js';
```

示例子路径必须真正写入 exports，不能认为现有包已有该入口。禁止 @repo/core/src/_、@repo/core/dist/_、跨包相对路径、跨应用 alias、通过 TS paths 指向其他包 src。

导入默认按第三方/平台、工作区、应用别名、当前模块相对路径、样式分组；样式副作用顺序不能被自动排序破坏。端内事件保留 onPress/onClick 等惯用接口，不为形式统一强行改写。

## 6. 组件、页面与交互规范

组件公开接口与状态验收见第 21 章；异常隔离见第 22 章。

| 层级                | 内容                         | 不应包含                          |
| ------------------- | ---------------------------- | --------------------------------- |
| 路由入口            | 参数校验、导航配置、装配     | 业务请求、持久化实现、UI 细节     |
| feature screen/page | 组合 UI、调用 Hook、业务状态 | 原始 fetch/Taro.request、平台密钥 |
| feature component   | 领域展示与事件，明确 Props   | 其他 feature 内部 state           |
| shared UI           | 布局、反馈、稳定团队交互语义 | 端点、业务单例、固定业务路由      |
| UI 库组件           | HeroUI/Taroify 已提供的能力  | 无需求的二次包装                  |

AppButton 的包装理由应是稳定品牌 intent、防重复提交或无障碍契约等；仅转发所有 props/改名不创造边界。组件库满足需求时直接使用，不能借规范任务批量替换按钮。保留 ref、loading/disabled、无障碍行为。

复杂 UI 优先组合 children/slots；互斥模式用 union，不用多个矛盾 boolean。不要让一个超级组件同时处理请求、主题、路由、布局和所有业务模式。

请求页面必须区分加载、空、可恢复错误、成功；后台刷新保留可用旧内容。主动取消/离页不显示网络失败；写操作有防重复策略和真实提交状态。

详情参数先验证，以 id 获取数据，不把完整对象放 URL。表单规则共享、展示与键盘/焦点由平台处理；客户端校验不能替代后端。日期/金额明确时区、货币、单位，协议数据与显示转换分离。

按钮和图标有意义的标签/角色/选中禁用状态；支持字体缩放、读屏和降低动态效果。常规文字默认以 WCAG AA 4.5:1 为设计参考；透明背景按真实叠加画面检查。[W3C Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

安全区、键盘、返回手势、Android 硬件返回、小程序胶囊与底部指示器纳入验收。固定底栏的占位统一处理，不每页复制魔法 padding。浅/深主题、长文本、小屏、大字、加载和错误都有视觉验证案例。

## 7. TypeScript 与代码规范

- 开启 strict、noUncheckedIndexedAccess、forceConsistentCasingInFileNames、noFallthroughCasesInSwitch。新代码默认采用 exactOptionalPropertyTypes，旧代码开启时单独处理 undefined/缺省语义，不添加大量断言应付。
- 各工作区有独立 tsconfig。应用采用平台兼容基线，公共库采用 ESM 编译基线，不把同一 NodeNext 配置不加区别地强加所有 bundler。
- 公共 runtime 不自动引入 DOM/Node 全局声明；应用、配置、测试类型环境分别配置。TS、lint、exports 共同验证边界。
- 外部 JSON、存储、路由输入先用 unknown，再解析；请求泛型或 as ExampleItem 不是运行时校验。
- any、非空断言、双重断言要有具体边界理由；不用 globalThis 双重断言掩盖平台兼容。Mock 确需时间能力时可注入最小 scheduler/clock 端口。
- DTO、领域对象、视图模型语义不同才分别映射；结构与语义相同不为分层复制三份类型。
- 优先 readonly 输入、union 与类型收窄；enum 在协议/互操作等确有收益时采用。
- catch unknown 先归一化；不空 catch，不把所有异常伪装成网络失败。render 不发请求、写存储或改全局主题。
- Hooks 遵守调用与依赖规则；不关闭 exhaustive-deps 来压制未理解的重复请求。
- Prettier 管格式，ESLint 管正确性/边界。默认两空格、UTF-8、LF、末尾换行；不让人工评审纠缠可自动处理的格式。
- 注释解释原因、限制、不变量；兼容补丁注明版本范围、复现/验证和移除条件。

utils.ts/helpers.ts/constants.ts 不成为永久堆积区；按用途命名，如 format-price.ts、parse-route-id.ts。不机械限定文件/函数行数，以职责和可理解性决定拆分。

## 8. API、校验与错误契约

契约演进见第 24 章；字段、分页与缓存细则见第 25 章。

| 公共契约           | 约定                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| HttpTransport      | URL/method/headers/JSON body/timeout/取消信号；返回 status/headers/未知数据 |
| StoragePort        | 异步 get/set/remove 字符串；不存在返回 null；失败拒绝 Promise               |
| CancellationSignal | 平台无关的 aborted/订阅接口；应用连接实际 abort 能力                        |
| ApiError           | 至少 network/timeout/http/invalid-response/cancelled，保留必要 status/cause |
| createApiClient    | 注入 transport/baseUrl/明确可选配置；不在模块导入时发请求/读取存储          |

现有 transport 可保留泛型兼容，但服务必须将收到的数据当未知值解析。泛型只能说明编译期预期，不能验证远端内容。

```text
页面 → feature hook/用例 → API service → 注入的 transport
                    ↓
             parse DTO / 领域规则
错误在边界归一化，提示方式由页面决定。
```

- HTTP 非 2xx、业务失败码、网络连接失败分别处理；不提前设计万能错误框架。
- 响应通过校验后进入业务状态。非法 JSON/结构归为 invalid-response；404 可映射业务“未找到”。
- timeout/主动 abort 可区分；已 aborted 的请求不得发送；任何终止路径只 settle 一次，清理计时器/监听器。
- RN fetch 连接 AbortController，Taro 连接 RequestTask.abort；不能只拒绝 Promise 而留下后台请求。
- 编码 id/query，启动时校验基础 URL，显式设置超时，不依赖平台隐含默认值。
- 默认不自动重试。确需重试时限定错误、次数、退避与取消；写请求需要服务端幂等保证。401/403/格式错误不无脑重试。
- Mock/HTTP 遵循相同请求、错误、取消契约，覆盖成功/空/网络失败/超时/异常响应/取消；不用真实客户数据做 fixture。
- Mock 可用 @repo/api/mock 独立入口。开发默认无后端可跑，生产明确 HTTP；生产意外启用 Mock 应失败。

复杂契约可引入校验库，但先验证两端 runtime 与体积；小型契约的明确解析函数足够，不强制引入 Zod/Axios。

## 9. 状态、持久化与异步生命周期

启动恢复见第 22 章，持久化迁移见第 24 章，查询缓存与分页竞态见第 25 章。

| 状态                       | 默认所有者                           | 演进条件                            |
| -------------------------- | ------------------------------------ | ----------------------------------- |
| 展开、选中、表单草稿       | 组件/feature hook                    | 真正跨页面共享再提升                |
| 主题、低频配置、服务实例   | 应用 Context/bootstrap               | 不混入高频列表/动画帧 state         |
| 请求结果、加载、错误、分页 | feature hook                         | 重复缓存/去重/失效需求再评估查询库  |
| 多页业务状态               | feature provider/纯控制器 + 端内订阅 | 复杂度实测需要再选状态库            |
| 导航位置                   | 平台路由 state                       | 不另建竞争的 selectedTab 全局 state |
| 已保存设置                 | storage + 应用内存 state             | 远端同步需要独立产品/协议设计       |

一次请求不需要全局 store。TanStack Query/Zustand 等按需求评估，不是“大厂标配”；使用前验证当前 Expo/Taro/React 兼容与收益。两端相似 Hook 仍不放 core/api。

- 卸载、参数变化、业务取消清理任务与监听；无法真正取消时，用请求序号等机制丢弃过期结果。
- mount/unmount 与平台显示/隐藏不同；被缓存页面隐藏不等于卸载，刷新/暂停策略使用正确平台生命周期。
- 最后用户意图不等于最后返回响应；搜索、筛选、详情切换防竞态。
- 主题初始化有 ready/hydration，避免覆盖存储值或闪错主题；读取失败有默认值与可观测记录。
- 同一共享设置有明确写入者；连续异步写入必要时串行化，防止旧值覆盖新值；失败不能宣称保存成功。

存储键默认“产品:能力:数据:v版本”，如 `aikitr:settings:theme:v1`。版本化 JSON 必须校验，损坏数据可恢复；结构变化定义迁移，不任意清空用户数据。

| 读取结果               | 边界处理                                                 |
| ---------------------- | -------------------------------------------------------- |
| 键确实不存在           | StoragePort 返回 null，业务采用初始值                    |
| 平台 I/O/权限/系统失败 | StoragePort 拒绝 Promise，不能伪装为空并覆盖原数据       |
| JSON/字段损坏          | 业务解析层识别；设置可安全回退，重要用户数据提供恢复策略 |
| 未知未来版本           | 不静默写入旧格式，保留原数据并提示/记录兼容问题          |

具体“键不存在”错误形态由已装平台版本验证，不能用 catch 所有错误来识别。修正适配器时同步检查调用者 finally/ready 状态，防止错误路径永远卡在加载。

两端分别注入 AsyncStorage/Taro Storage。同 key 不会在 iPhone 与微信间同步；本地收藏明确是本地数据，远端同步属于额外需求。

普通设置不存敏感凭据。认证需要独立凭据端口；RN 可评估安全存储，小程序普通 Storage 不能宣称等同 Keychain，服务端控制会话有效期/权限。

## 10. 设计变量、主题与样式

### 10.1 单一来源与映射

tokens 分为基础值与语义角色；页面默认使用 primary/background/surface/text/muted/border/danger/success，不把 blue500 当业务语义。

| 内容                | 原生端                       | 小程序端                         |
| ------------------- | ---------------------------- | -------------------------------- |
| 背景/文字/强调/表面 | 映射 HeroUI/Uniwind 主题变量 | 映射 Taroify ConfigProvider 变量 |
| 间距/圆角/字号      | 原生 logical points/字体体系 | 750 设计宽度的转换策略           |
| 动效语义            | Reanimated/平台动画          | 微信/Taro 支持的动画             |

JS、mobile CSS、weapp Sass 从同一权威 token 源生成。生成器可用 Node，runtime 不用；产物进 dist/exports，在应用启动/构建前生成并检验一致性，不手工维护三份颜色。

共享数字必须定义量纲。原生 16 logical points 不等于 750 设计稿的 16 px；若想在 375 宽设备都显示约 16 logical px，小程序业务样式可能对应 32 设计 px。Taroify 自身还有适配机制，映射要结合真实产物核对，防止重复转换/两倍缩放。

首版浅/深主题与选择持久化；跟随系统按需增加，验证系统事件、导航栏、TabBar 和页面内容一致。

### 10.2 Uniwind

Uniwind 使用 Tailwind v4，CSS 入口由 Metro cssEntryFile 指向，在根 React 布局导入。默认顺序：Tailwind → Uniwind → HeroUI Native → 团队 token 映射。withUniwindConfig 默认为最外层 wrapper，兼容例外需复现和证据。[Uniwind Quickstart](https://docs.uniwind.dev/quickstart)

global.css 推荐 mobile 根；保留 src 位置时核对扫描根。扫描实际使用 className 的目录；未来提取同栈组件包时用精确 @source，路径相对 CSS，不抄另一目录的相对路径。[Uniwind Monorepos](https://docs.uniwind.dev/monorepos)

```ts
const intentClasses = {
  primary: 'bg-accent text-accent-foreground',
  danger: 'bg-danger text-danger-foreground',
} as const;
// 完整静态字符串；具体语义 class 以当前主题映射为准。
```

禁止 `bg-${color}-500` 式运行时拼 class；有限变体用完整字符串映射，连续值用平台 style/动画值。Tailwind 按文本扫描，不解析运行时拼接。[Tailwind Source Detection](https://tailwindcss.com/docs/detecting-classes-in-source-files)

HeroUI Native 从 1.0.8 起文档说明自行注册 source；按已装版本核对，不对所有版本强制加 node_modules 扫描。[HeroUI Native Quick Start](https://heroui.com/en/docs/native/getting-started/quick-start)

### 10.3 小程序 Sass

业务组件默认 CSS Modules，与组件共置。现有命名空间 class 可在功能范围继续，全面切换属于单独迁移。全局只放 page 基础、token 和必要库样式，不堆积业务页面 CSS。

每个 PageShell 内放可视 ConfigProvider，它只影响后代；小程序无 DOM :root，全局变量用 page。覆盖第三方内部 class 要局部、记录版本，不散用 !important。[Taroify ConfigProvider](https://taroify.com/components/config-provider/index.html)

## 11. Expo 原生端规范

### 11.1 路由与 Provider

- src/app 只放 Expo Router 入口/布局，不放普通 Hook、组件、测试或配置，以免识别成路由。
- 根装配 GestureHandlerRootView、安全区、服务/主题 Provider、HeroUINativeProvider；手势根占满屏幕，Portal/overlay/安全区依已装库配置，不重复添加 host。[HeroUI Native Quick Start](https://heroui.com/en/docs/native/getting-started/quick-start)
- 参数边界校验后交给 feature。默认使用类型化路由能力，导航 helper 留在应用，不能将 Expo Router 导入纯共享层。
- 导航、状态栏、页面与组件主题来自同一语义来源。

### 11.2 Metro 与平台能力

基于 expo/metro-config 默认配置，支持工作区的 SDK 使用自动 monorepo 配置，默认不添加旧版 watchFolders/extraNodeModules 补丁。[Expo Monorepos](https://docs.expo.dev/guides/monorepos/)

默认建议不是删除现有兼容补丁的证据。本项目已存在解析补丁时，记录触发版本/库，复现并对比移除行为；没有证据不删。不用 broad hoisting、全局 React alias 或每次清空全部缓存代替根因修复。

各 App 保证一个有效 React/React Native/原生模块版本，两端 React 可以不同。新增原生依赖按当前 SDK 校验，在 development build 验证；热重载 JS 不能替代重新编译新原生依赖。

默认 Android/iOS 同一实现，确需差异才用 .android/.ios 或小范围 Platform 分支，不复制整个 feature。权限与设备能力进 adapter，在用户需要时申请，拒绝后仍有明确反馈。

### 11.3 玻璃底栏与动效

- 选中 Tab 来自导航 state；点击走正规导航事件、发出 tabPress，支持 history/back/deep link，不另外维护竞争索引。
- 滑块依据真实布局、安全区、菜单项数计算，不硬编码屏宽/菜单数/刘海高度。
- 连续点击中断旧动画，最终落在正确 Tab；清理手势/监听，降低动态效果时简化过渡。
- 模糊/透明/涟漪在真实背景与双主题验收，低性能 Android 可明确 fallback；iOS 模拟器通过不等于跨端通过。
- 长列表采用窗口化，动画不在 JS 每帧触发全局 Context 重渲染；先测量再选优化措施。

### 11.4 CNG 与签名

默认 CNG，生成 android/ios 不提交；持久修改写 app.config/config plugins。临时修改 generated pbxproj 要转成可再生配置。若改为提交原生工程，单独 ADR 和维护责任。[Expo CNG](https://docs.expo.dev/workflow/continuous-native-generation/)

prebuild --clean 会重建目录，先确认临时原生修改已保存/转为插件；规范本身不授权清理未保存工作。

真机 Debug 需要设备/SDK 支持、Developer Mode、合法签名和包含设备的 profile。编译、安装、启动分别报告；设备信任/联网验证失败不直接当 JS bug。

development build 用于开发；脱离 Metro 的测试包交付含内置 JS 的 preview/release。iOS 分发需匹配账号/设备/签名条件的正规渠道；不能承诺随便发一个 IPA 就能装到任意 iPhone。

## 12. Taro 微信小程序规范

- 所有 @tarojs/* 框架/CLI/构建依赖保持同一确切版本；React/Taroify 使用已验证的组合。
- 明确 React、Webpack5、weapp 目标与 designWidth 750。编译 config 与运行配置分离，Node API 不进入业务 src。[Taro 编译配置](https://docs.taro.zone/docs/config-detail/)
- src/pages 与 app.config 注册路径一致；入口只解析参数、组合 PageShell/feature，页面配置放配对 .config.ts。
- app.ts 负责非可视 Context/生命周期，不承载 ConfigProvider/弹窗/布局；每页有可视主题边界。[Taroify ConfigProvider](https://taroify.com/components/config-provider/index.html)
- 页面显示/隐藏使用对应 Taro 生命周期，不假定 useEffect 在每次显示时重新执行。
- navigateTo/switchTab/redirectTo 使用正确语义；集中路由 helper 编码并验证 path/query。

Taroify 选择自动按需或显式按需样式引入，保持一致，不因方便导入全部样式。新组件检查构建产物中样式存在、尺寸正确。[Taroify 快速上手](https://taroify.com/quickstart/index.html)

Taroify 设计宽度为 750；改为 375 时按已装版本适配 Sass 变量与入口，不能只改业务 designWidth/抄旧版 $hd 注入。不对已转换尺寸重复乘除。[Taroify 快速上手](https://taroify.com/quickstart/index.html)

不用 window/document/DOM 测量/backdrop-filter 实现微信能力；使用平台支持的元素/查询/样式。玻璃效果采用接受的兼容方案，不共享 RN blur 组件。

首版默认原生 TabBar，颜色/背景在合法 API 范围同步主题；自定义 TabBar 只有明确需求且导航/返回验证充分时增加。首页/Tab/公共启动留主包，非高频业务按真实体积与访问路径拆普通分包。

按需启用自定义 TabBar 时增加 src/custom-tab-bar，配置 custom 与对应页面组件注册。每个 Tab 页会创建独立底栏实例，不能把某实例内 selected 当全应用导航真相；页面显示时从真实路由同步，点击使用 switchTab，失败后保持正确选中状态。首次显示闪烁和跨页滑块连续性需真实平台验证。[Taro 自定义 TabBar](https://docs.taro.zone/docs/custom-tabbar)

底栏还要验证自己的 React Context/样式作用域，不能假定继承 app 的 Provider 或页面 ConfigProvider。必要时通过端内单一控制器/显式状态同步接主题，底栏配置自己的可视主题边界；持久化仍只有一个写入者。不能为解决多实例问题将 Taro/React 状态推到纯 core。

分包注册、资源、预加载一起设计；shared 导入不意味着产物只占一份，检查真实 bundle，防止主包拉入所有 feature/组件库。包体上限、基础库兼容和发布规则发布前查当前官方文档/开发者工具，不能永久冻结未经核实数值。

发布验收开启 HTTPS 合法域名校验；关闭域名校验只用于本地调试。开发者工具编译成功不替代真机网络、返回、主题和尺寸验证。

## 13. 工作区、版本与工具管理

### 13.1 项目版本

本项目当前约定 Node **22.23.3**、pnpm **12.7.0**；packageManager、mise、保留的 .nvmrc 与 CI 一致。其他仓库遵循其明确锁定值，不因 Skill 自动切换。

```toml
# 项目 .mise.toml 约定示例
[tools]
node = "22.23.3"
pnpm = "12.7.0"
```

框架版本以应用 manifest、唯一锁文件、官方兼容组合为准。允许 Expo 推荐 ~ 区间，但 lock 锁定安装；不每次开发追 latest。升级单独变更，验证两端组合。

本机工具按用户约定用 mise；需要 Ruby/CocoaPods 时先确认 mise 当前后端和锁定配置，不擅自全局 Homebrew/gem 安装。Xcode/Android SDK 按平台方式管理。仅交付规范不安装/卸载工具。

### 13.2 依赖

- 根只声明工程工具，应用声明 runtime，各包声明真实 runtime/dev/peer 依赖，禁止幽灵依赖。
- 工作区用 workspace:*，只提交根 pnpm-lock.yaml，不在 app 独立生成锁文件。
- pnpm 默认隔离安装；具体第三方兼容问题才能调整并记录范围。不能根级 overrides 强制两端 React 相同。[Expo Monorepos](https://docs.expo.dev/guides/monorepos/)
- 新依赖检查兼容、体积、权限、维护/许可证与真实收益，Node-only/UI 依赖不能进入纯 runtime。
- 安装脚本批准具体必要包，不全局放行所有 postinstall。依赖变化带 lock，CI frozen-lockfile。

### 13.3 公共包编译

采用 compiled package：先生成 ESM JS 和类型声明，显式 exports。默认 type:module，tsc 与 declaration/declarationMap，应用 bundler 处理最终输出，通常无需再给纯 TS 库 bundling。[Turborepo Internal Packages](https://turborepo.dev/docs/core-concepts/internal-packages)

```json
{
  "name": "@repo/core",
  "private": true,
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./examples": {
      "types": "./dist/examples/index.d.ts",
      "import": "./dist/examples/index.js"
    }
  },
  "files": ["dist"]
}
```

tokens 另 exports ./mobile.css、./weapp.scss 到生成文件。内部相对 import 写输出 .js 路径，避免不会被 tsc 改写的 app alias。测试真实公开入口和双端消费。

sideEffects:false 仅在确实无副作用时添加，样式入口在 sideEffects 规则保留；不要 wildcard exports 到所有 src 实现来省事。

## 14. 任务编排、开发监听与缓存

### 14.1 目标命令契约

这些是采用规范后的接口，当前不存在的命令需另行实现，不能报告已经通过。

| 根命令              | 行为                                                |
| ------------------- | --------------------------------------------------- |
| pnpm dev:mobile     | 先准备共享产物，运行依赖编译监听 + Expo dev server  |
| pnpm dev:weapp      | 先准备共享产物，运行依赖编译监听 + Taro weapp watch |
| pnpm build:packages | 构建 core/api/tokens 与必要依赖                     |
| pnpm build:mobile   | Android/iOS JS/资源导出，明确不是原生安装包         |
| pnpm build:weapp    | 微信生产产物                                        |
| pnpm lint           | 代码规则与完整依赖边界检查                          |
| pnpm typecheck      | 严格类型，先准备公共/生成声明                       |
| pnpm test           | 有意义测试；无测试包明确不参与                      |
| pnpm format:check   | 只检查格式                                          |
| pnpm check          | 聚合质量，真实失败退出码                            |

原生安装/构建单独在应用 ios/android 或 EAS profile 表达；新项目可将 JS 导出名为 export:mobile，保留 build:mobile 时 README 明确产物。

### 14.2 task graph / watch

- build 依赖 ^build；lint/typecheck/test 如需依赖编译声明也先 build。
- dev/watch 为 persistent:true、cache:false，不能 dependsOn:['^dev']；长驻任务不退出，依赖者不能等它完成。[Turborepo Configuration](https://turborepo.dev/docs/reference/configuration)
- 选择“先 ^build + 应用 dev 与共享 tsc --watch 并行”或“turbo watch 调度有限 build + 必要可重启应用任务”。一种明确调度，避免双 watcher 写同一 dist。
- 通过当前 Turbo 的 filter/with 能力启动共享监听；只运行 Expo/Taro 会读取陈旧 dist。
- 两端同时开发时使用统一任务图/进程管理，公共包 watcher 只启动一组；不要分别运行两个根 dev 脚本而重复开启同一包监听。
- turbo watch 按需 interruptible；无需重启的 Metro 交给自身 HMR。工具版本变更重新验证 task graph，不直接抄样例。[Turborepo Configuration](https://turborepo.dev/docs/reference/configuration)
- 必验 fresh clone/无产物启动；修改 core 解析和 token 色值，两端观察变化；退出不残留本次 watcher。

token 更新链需同时覆盖 TypeScript 与样式生成。目标 build 配方可用 `tsc -p tsconfig.build.json && node scripts/generate-styles.mjs`；watch 由单一 supervisor 按源变化调度有限的编译→生成，或监听编译完成事件后触发生成。合并快速变更，保证最后一次输出一致，输出变化通知两端。生成器进程/模块缓存不能留下旧 token 值，发生错误需显示且不宣称已更新。

仅 tsc --watch 不会自动执行样式生成；`tsc --watch && node ...` 的第二步也不会在长驻进程运行期间执行。此配方是目标实现契约，生成/监听脚本需要在后续工程任务中实现并验证，本文未新增这些运行脚本。

### 14.3 缓存

只缓存确定可再生输出：公共 dist、JS export、小程序 dist；不缓存整个 .expo 本机状态、签名密钥、用户数据、node_modules。

影响构建的 app config/plugins、token 源/生成器、env 文件/变量进入 inputs/env。manifest 真正建立 api→core 等 task graph；自定义 inputs 保留正常源码输入。

明确 APP_ENV、EXPO_PUBLIC__、TARO_APP__ 的参与变量，使缓存能区分 API/Mock/应用标识变化。公开构建配置与凭据分开；远程缓存权限由 CI 管理，签名步骤默认不缓存。

用 warm-cache 和更改 env/token 后产物对照验证；显示 cached 本身不能证明正确。

## 15. 环境配置、安全与日志

- .env.example 只提交公开样例，真实 .env.local/证书私钥/签名包/访问 token 不进 git、日志或远程缓存。
- EXPO_PUBLIC__、注入客户端的 TARO_APP__ 都是公开信息；APP_ENV/build-time 名称不自动保密，任何写进 bundle 的值都能提取。
- shared/config/env.ts 统一读取/解析/校验，业务组件不散读 process.env；公共库不依赖 Node process。平台支持的 env 用法留在应用。
- HTTP 模式缺 API 地址则启动/构建失败；生产 HTTPS/正确域名、关闭 Mock。dev/staging/prod 的 AppID/图标/名称/API 对应，防止测试包操作生产。
- 日志记录环境、操作、耗时、status/error kind、可用 request ID；默认不记录 Authorization、完整用户数据或敏感 body。用户文案与诊断信息分开。
- 有业务需求才接错误/崩溃监控，附 version/build/runtime/environment；平台 SDK 留应用，不入纯共享层，上报失败不阻断页面或无限重试。
- 权限/隐私配置随实际能力增加，不预申请尚未使用的定位/通讯录/推送等。

资源文件使用含义明确的 kebab-case，按来源/许可记录第三方素材。平台图片/字体体积经过构建评估，不能把同一图片多个未经用途区分的副本放 shared。SVG 渲染组件不跨 RN/Taro 复用；按平台使用支持的资源形式。

用户文案默认集中在 feature 或应用文案模块，错误类型不携带写死的 UI 文案。多语言需求出现后再采用 i18n；避免事后难迁移的句子拼接，保留变量替换与日期/货币格式化边界。

## 16. 测试与验收

支持范围与设备矩阵见第 23 章；新增专项验收见第 21—26 章。

### 16.1 自动测试层级

| 层级            | 工具/策略                                                  | 关键行为                               |
| --------------- | ---------------------------------------------------------- | -------------------------------------- |
| core/api        | Vitest                                                     | 解析、领域边界、错误、URL、Mock 契约   |
| adapters        | Vitest + 平台边界替身                                      | timeout/cancel 竞态、cleanup、存储异常 |
| 原生组件        | 经 Expo/RN 验证的 renderer/React Native Testing Library 等 | 用户交互、无障碍、提交状态、导航装配   |
| 小程序组件/页面 | 兼容隔离测试 + 微信开发者工具                              | 交互/生命周期、真实 Provider/style     |
| E2E             | 稳定环境后选平台工具                                       | 列表→详情→返回、持久化、错误恢复       |

Vitest 适合纯 TS/adapter，不代表直接能渲染所有 RN 原生组件；组件测试需要单独兼容的 renderer/transforms，不用大量 native mock 伪装真机通过。

测试断言可观察结果，不重复实现。高风险逻辑优先，复杂 bug 有回归用例；低风险样式不机械添加测试，不为覆盖率写无意义断言。覆盖率阈值按真实业务风险定，不编造统一 100% 指标。

Mock/HTTP 用相同行为集验证成功、空、HTTP/网络错误、timeout、非法响应、发起前/途中取消。底层工作真正终止，监听/计时器清理，过期响应不覆盖新意图。

### 16.2 平台验收

- fresh clone、固定 lock 安装，两端从根启动，共享改动可见。
- 原生列表→详情→返回，主题重启保留，底栏选中/动效，键盘/安全区/Android 返回/降低动态效果。
- 微信工具和真机验证页面/Tab 路由、返回、ConfigProvider 双主题、尺寸、合法域名和真实包体。
- 请求成功/空/网络失败/超时/异常响应/取消有预期状态，离页无多余错误。
- Android 实际原生构建、安装、启动；iOS 在 Xcode/EAS 与签名条件具备时同样验证。

JS 导出仅验证 JS/资源层，微信编译仅验证构建层；模拟器、签名或真机条件缺失时报告限制，不认定通过。性能先记录基线，按代表性低端设备/内容规模设置启动、列表、动画与包体预算；具体阈值由测量决定，不用未经验证的统一数字。

## 17. CI、构建与发布

旧客户端兼容见第 24 章；发布观察、停止条件与恢复见第 26 章。

### 17.1 PR 门禁

固定工具 → frozen-lockfile 安装 → 格式 → lint/模块图 → typecheck → 核心/adapter 测试 → 微信生产构建 → Android/iOS JS 导出。可共享缓存，但保留真实失败状态。

文档变更可仅检查文档格式/链接/结构；平台依赖、构建、公共包变化执行受影响消费者验证。按影响缩范围时包含传递依赖，不能只检查被改文件所属包。

CI 最小权限、fork PR 不使用发布凭据。外部 Actions 默认锁定经核实 commit SHA，并由更新工具维护；artifact/日志保留策略匹配调试需要。

### 17.2 原生与可再生构建

EAS 使用 mobile 应用目录配置，安装后在预编译/打包前生成公共包产物。根 workspace/lock/config 与所需源码必须随构建上传，不能依赖本机已有 dist 或 ignored 原生目录。[Expo EAS Monorepos](https://docs.expo.dev/build-reference/build-with-monorepos/)

development/preview/production 分别对应可开发客户端、独立内测包、发布包。匹配 env/AppID/签名/内置 JS 或 Metro 行为；clean/CNG 重建能再生所有持久配置。

Android APK 用于直接安装、AAB 用于适合的商店发布；iOS 开发设备包/ad hoc/TestFlight 按账号/设备/签名条件区分。证书/profile/设备范围/有效期进 runbook，凭据由 CI/平台管理，不在模板源码固定个人 Team ID 或私钥。

### 17.3 OTA 与微信发布

OTA 仅明确接入时设计 runtimeVersion、二进制兼容和回滚；新增原生模块必须匹配新二进制，不能靠 JS OTA 补齐。JS 回滚不等于原生回滚，API 需考虑旧客户端。

微信编译、上传、体验版、审核、发布分开记录；真实 AppID/合法域名/体验成员/包体完整验收。规范制定或普通开发不隐含上传、审核、生产发布授权。

## 18. Git、评审与团队治理

- main 保持可验证；短生命周期功能分支。本环境新建分支用 codex/<topic>，其他团队遵循明确约定。
- 默认 Conventional Commits，如 feat(mobile): add example favorite action、fix(weapp): cancel request on page unload；scope 有意义，不用 update/fix bugs。
- PR 围绕一个可审查目的；业务、框架升级、大量移动文件默认分开，不混入无关全仓格式化。
- 描述用户可见前后行为、关键取舍、实际验证和限制；样式附截图，动画/手势附录屏，不写未跑检查已通过。
- main 的保护与必要检查匹配团队；公共契约、构建/签名、tokens 由实际 owner 审查，CODEOWNERS 不伪造账号。
- ADR 记录共享策略、构建模式、引入状态库、提取平台包等长期决定，普通命名修改无需 ADR。
- 内部包不独立发布时可同 PR 修改契约和消费者；真实独立发布才采用语义版本/Changesets，不预设所有内部包发布流水线。
- 本次规范交付不自动 commit/merge/push；实际任务遵循用户已授权的 Git 范围。

## 19. 可执行门禁与完成清单

### 19.1 规则—检查映射

| 规则                        | 自动检查                                               | 人工/平台补充         |
| --------------------------- | ------------------------------------------------------ | --------------------- |
| 公开入口、无跨应用 import   | 解析 import/export/dynamic import + exports            | 公开面是否合理        |
| 纯共享 runtime              | 含传递依赖的模块图、限制 imports/globals、独立 TS 环境 | 第三方真实平台兼容    |
| routes/features/shared 方向 | alias/相对路径解析后的依赖图、循环检查                 | 过度提取判断          |
| 真实依赖声明                | manifest 对照已解析模块、fresh install                 | 原生 peer/autolinking |
| 工具版本/唯一 lock          | manifest/mise/CI 一致、frozen install                  | shell 实际版本        |
| 命名/格式/Hooks             | ESLint/Prettier/TS/路径检查                            | 领域语义              |
| token 唯一来源              | 再生成/结构一致性                                      | 真正颜色/单位/对比度  |
| 公共产物更新                | clean build、公开入口消费、watch 改动                  | 双端真实样式          |
| env/缓存完整                | 配置校验、改 env/token 后产物对照                      | staging/prod 对应     |
| 请求/存储行为               | 契约/竞态测试                                          | 真实网络/系统条件     |
| 发布产物类型                | 构建/安装/启动 gate 分列                               | 签名/真机/微信域名    |

no-restricted-imports glob 不能完整捕获 alias、相对路径绕过、传递依赖；基础 lint 先落地，完整门禁使用真正模块解析，涵盖 re-export/dynamic import，并为测试/config 设置合理边界。

新增规则按实际功能选择证据，不要求每次文档/样式改动执行全部专项检查：

| 补充规则        | 可自动验证的部分                            | 评审/平台证据                |
| --------------- | ------------------------------------------- | ---------------------------- |
| 组件契约（21）  | Props 类型、事件/重置/提交行为测试          | 平台 ref、读屏、示例状态     |
| 异常恢复（22）  | render/异步/初始化故障注入与恢复测试        | 真机 fallback、原生诊断      |
| 支持矩阵（23）  | 配置与依赖要求一致性                        | 支持范围实测与降级           |
| 契约演进（24）  | 消费者检查、历史 fixture、迁移中断/回滚测试 | 弃用条件、数据恢复与旧客户端 |
| 协议/缓存（25） | 分页、字段语义、查询隔离与竞态测试          | 服务端排序/游标、真实网络    |
| 发布运行（26）  | 产物标识与恢复候选关联                      | 观测口径、停止条件、受控演练 |

### 19.2 功能完成

- 文件归属、公开入口、依赖声明正确。
- 外部数据与路由校验；异步终止、过期响应有行为契约。
- 加载/空/错误/成功、主题/无障碍/返回满足本次需求。
- 新依赖不破坏隔离安装、React 实例、CNG、产物更新。
- 执行匹配风险的质量检查/消费者构建，需真机的行为有证据。
- 文档/PR 明确本次验证、未测范围和必要使用方式。

清单是评审契约，不强制每个小改动做全部原生发布；按变化影响选证据。

## 20. 现有项目的渐进落地

21. 组件接口契约
22. 异常隔离与恢复
23. 平台支持矩阵
24. 公共契约演进与迁移
25. 数据协议与缓存细则
26. 发布观察与故障处理

目标架构可以不受当前目录限制；迁移代码是另一个明确任务。默认顺序：

1. 记录团队标准，README/AGENTS 用可随仓库分享的相对文档链接，确定 owners/例外方式。
2. 先落实工具/lock/exports/共享平台边界/CI；兼容补丁到有证据才移除。
3. 验证 fresh clone、共享 build/watch、token 改动、云端产物；避免移动完目录仍读陈旧 dist。
4. 按 feature 迁移薄路由、adapter、稳定 shared；每个 PR 保持公开行为和消费者可用。
5. 完善双端主题、请求状态、存储恢复、导航/动效与真机验收。
6. 有需求才加入缓存库、认证、分包、平台 UI 包、E2E、OTA、独立发布。

当前 src/components/providers/adapters 的平铺结构可以工作；shared 是增长目标，文件夹名字不同不代表运行 bug。迁移收益来自降低耦合、消除缺陷或降低变化成本；不一次“升级最佳实践”同时替换路由、React、UI 库、状态库和原生模式。

每阶段验证已有用户行为，列明未落地条目；目标规范不能被用来声称现有仓库已经符合全部要求。

## 21. 组件接口契约

本章补充第 6 章，优先用于团队自建组件及具有稳定语义的包装层。直接使用 HeroUI Native/Taroify 时遵循对应版本的真实接口，不为统一命名改变平台行为。

### 21.1 契约记录与公开面

每个可复用组件必须能从 Props、说明或示例中确定：用途、状态所有者、默认行为、事件载荷、不可用状态、无障碍语义和必要的平台差异。简单组件通过类型与同目录示例表达即可，复杂组件补充使用说明，不强制每个组件建立独立文档。

| 契约项   | 要明确的内容                                                             |
| -------- | ------------------------------------------------------------------------ |
| 值与空值 | value/checked/selectedId 等实际属性；空字符串、null、空集合的含义        |
| 事件     | onPress/onClick/onValueChange 等实际接口；触发条件、参数和是否允许重复值 |
| 状态     | controlled/uncontrolled、loading、disabled、readOnly、invalid            |
| 组合     | children/slots、尺寸、intent/variant 的合法组合                          |
| 可访问性 | 标签、角色、选中/展开/禁用状态、焦点或读屏操作                           |
| 平台能力 | ref 指向的实例与可调用方法；两端分别声明能力                             |

公开 Props 默认只暴露真实需求，不能先创建任意字符串 variant 或大而全的配置对象。采用组件库接口时保留类型约束；包装层需改变语义时明确映射与不支持的能力。

### 21.2 受控与非受控

对每项重要状态明确单一所有者。受控组件展示父组件给定的值，事件表示修改意图；父组件未接受新值时，不得长期展示内部副本。非受控组件内部维护状态，默认值仅用于初始化。[React 状态所有权](https://react.dev/learn/sharing-state-between-components)

- 必须说明支持哪种模式；无需内部状态的组件只提供受控模式即可。
- 同一状态不同时接受受控值与默认值。团队新组件默认禁止挂载期间切换模式；确需切换时定义迁移语义并测试。
- 空值使用明确领域值，不通过临时传入 undefined 切换模式。默认值改变不隐含重置用户输入。
- 初始挂载、父组件同步值、主题变化默认不触发用户修改事件，避免反馈循环。
- 不把 RN/Taro 的平台事件对象带入 core/api；有业务需要时在端内将事件转换成值或领域意图。

例如，自建单选组件可采用下面的互斥契约。它不是现有 UI 库的 Props，也不是跨端共享 JSX 的授权：

```ts
type SelectionProps =
  | {
      value: string | null;
      onValueChange: (value: string | null) => void;
      defaultValue?: never;
    }
  | {
      value?: never;
      defaultValue?: string | null;
      onValueChange?: (value: string | null) => void;
    };
```

### 21.3 默认值、重置与表单

- 必须定义默认值的有效范围；非法业务值由输入边界校验，不能静默变成另一个选项。
- 受控重置由父组件写入约定初始值；非受控重置需约定 reset 方法、resetKey 或重新挂载之一。不能假设修改 defaultValue 会重置。
- 默认 reset 恢复值并清理本地校验、dirty/touched；这些状态由父组件持有时，父组件负责同步重置。值已等于初始值时仍要能重置其余状态，不能仅监听 value 是否变化。业务要求保留其中状态时明确说明。
- 自建组件的 reset 默认不触发 onValueChange 或提交事件，可通过明确的 onReset 通知；若产品需要修改通知，说明触发顺序及载荷并测试。直接使用组件库时遵循其实际回调契约。
- 切换实体、关闭弹窗和导航返回是否保留草稿由 feature 决定，shared 组件不猜测业务策略。
- 服务端字段错误映射到字段/表单层，不由通用输入组件发请求；提交失败保留可编辑草稿。

### 21.4 状态与交互优先级

提交按钮默认在 disabled 或 loading 时阻止激活；非提交组件在 loading 时是否仍可操作要明确。视觉、事件与无障碍状态必须一致，不能只降低透明度。readOnly 与 disabled 不混用，按平台定义复制、选择、焦点与读屏行为。

防重复提交同时需要 feature 层的执行锁；仅等待下一帧 disabled 渲染不能可靠阻止连续点击。锁在成功、失败和取消路径释放，后端幂等仍遵循第 8 章。

### 21.5 示例与验收

默认在所属应用提供按需开发示例页或现有开发入口，展示有意义的变体及默认/选中/禁用/加载/错误、双主题、长文本和大字体。示例使用 Mock，不把调试路由暴露为生产业务入口。不强制安装 Storybook，也不共享两端组件渲染实现。

验收重点：父组件拒绝修改时显示正确；默认值更新不意外重置；reset 行为一致；禁用/加载期间不会提交；正常事件载荷正确；读屏可操作。测试以行为为依据，不快照全部 Props 组合。

## 22. 异常隔离与恢复

本章补充第 8、9、15 章。请求错误、React 渲染错误、启动失败和原生崩溃属于不同层级，不统一归为 ApiError。

### 22.1 分类与责任

| 故障                   | 处理位置                         | 用户恢复                     | 诊断                          |
| ---------------------- | -------------------------------- | ---------------------------- | ----------------------------- |
| 请求/业务失败          | service 归一化，feature 决定提示 | 重试、修正输入、保留旧内容   | error kind/status/请求标识    |
| 子树渲染异常           | 路由/页面或有独立恢复意义的边界  | 重建子树、返回安全页面       | component stack/版本/路由标识 |
| 点击、异步回调失败     | 发起操作的 handler/hook          | 解锁操作、保留草稿、明确提示 | 操作类型与脱敏原因            |
| 启动配置/存储/迁移失败 | bootstrap 状态机                 | 有条件重试或降级             | 初始化阶段与 schema 版本      |
| 原生崩溃、进程退出     | 平台诊断与发布流程               | 修复构建、暂停发布           | 原生符号/设备/构建标识        |

错误边界处理子树渲染异常，不能代替事件回调、普通异步 Promise、原生崩溃的处理；边界自身失败也需要更外层兜底。[React Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

### 22.2 两端边界

- Expo 默认在根路由布局提供最终兜底，在可独立恢复的页面/业务区域设置必要边界。路由可导出 ErrorBoundary 并提供 retry；重试前需处理导致失败的状态，不能自动循环重渲染。[Expo 路由错误处理](https://docs.expo.dev/router/error-handling/)
- Taro 在实际页面渲染树中设置边界，包括必要的页面 Provider；app 入口的 onError/useError 用于诊断，不承担页面兜底 UI。[Taro 错误处理](https://docs.taro.zone/docs/react-error-handling)
- 最终兜底须在需要保护的 Provider/初始化组件外层；位于 Provider 内部的边界不能捕获该 Provider 自身失败。启动失败入口在尚未就绪时也必须可渲染。
- fallback 尽量仅依赖稳定的平台基础组件和最低限度样式，不再次调用故障服务或依赖失败的主题 Provider。不是每个图标/文本都单独设置边界。
- 保留可用导航；安全返回目的地必须已注册。微信 Tab 页面使用 switchTab；没有可返回历史时提供首页入口。找不到路由不能无限跳转到同一坏路由。

### 22.3 启动状态与降级

bootstrap 默认显式区分 initializing、ready、degraded、failed。需要完成的初始化定义就绪条件、超时/取消及失败策略，不能无限停留在启动画面。

- 配置非法或必需服务不可用时进入 failed，展示可理解的提示；重试无法修正编译时错误配置时，不展示无效重试按钮。
- 非关键设置读取失败可进入 degraded，使用内存中的安全默认值并提供恢复路径；必须保留原始存储，不因读取失败回写默认值。
- 存储迁移失败保留原数据和恢复信息；未知更高 schema 版本采用第 24 章策略，不直接清空。
- 每次重试只启动一组初始化任务；忽略旧轮次的结果。注册监听、创建服务与迁移应能防止重复执行，退出时清理本轮资源。
- 存储能否重新写入需在恢复或用户明确选择后判定；主题默认值可用不代表存储恢复成功。

### 22.4 文案、日志与恢复边界

用户提示描述当前影响和可执行动作，生产页面不直接展示 stack、内部 URL、证书或原始响应。诊断至少区分故障类别、阶段、环境、版本/build 和可用的错误标识；路由参数、日志内容遵循第 15 章脱敏。

一次故障可经过多个监听层；上报按故障实例或关联标识去重，限制重复上报频率。没有外部监控时保留可获取的诊断路径；不为此强制安装某个厂商 SDK。监控失败不触发新一轮 UI 故障。

retry 不默认重发支付/提交等写操作，不清空整个应用存储；可恢复请求、重新初始化和重建组件分别提供明确入口。

### 22.5 验收

注入页面 render 抛错、事件回调拒绝、初始化超时、存储读取/迁移失败，分别验证兜底、操作解锁、日志分类和恢复。主动取消不作为失败提示。验证 fallback 不依赖故障模块、返回正确、重复重试无监听/任务泄漏。JS 异常测试不能替代原生崩溃验证。

## 23. 平台支持矩阵

本章补充第 11、12、16 章。框架安装成功或模拟器可运行不等于支持全部系统与设备。当前规范不预设未经核实的最低 OS/微信版本。

### 23.1 范围与维护

正式发布前必须在发布文档记录支持矩阵；开发模板可以先记录“尚未验证”，但不能据此宣称对应设备受支持。移动端最低版本至少满足已锁定 Expo/RN/原生依赖的要求，微信范围同时考虑 Taro、Taroify、实际 API 和真机表现。

| 记录项   | 必须记录的依据/证据                                                              |
| -------- | -------------------------------------------------------------------------------- |
| iOS      | 最低系统与当前主要系统；deployment target/app config/plugin 来源；设备与构建测试 |
| Android  | 最低系统/API；minSdk 配置来源；target/compile SDK 分开记录；设备与构建测试       |
| 微信     | 最低基础库、实测基础库与微信客户端版本；开发者工具版本；iOS/Android 真机         |
| 框架组合 | lock 中 Expo/RN/React/HeroUI/Uniwind 或 Taro/React/Taroify 的实际组合            |
| 设备特征 | 小屏、大字体、低性能 Android、主流 iPhone；必要时平板/折叠屏                     |
| 环境     | 网络/权限状态、主题、构建类型、测试日期和负责人                                  |
| 结果     | 已通过/失败/未验证/明确不支持；已知限制与降级                                    |

matrix 的“配置最低值”和“实测覆盖”分别记录，不把测试过的一个系统版本当作完整区间验证。设备选择依据用户分布、功能风险与性能基线；暂无用户数据时使用覆盖主要平台和边界条件的代表设备，不强制购买固定型号。

### 23.2 能力检测与降级

- 必需能力缺失时提供明确阻断/替代流程；装饰性能力缺失时维持业务可用。
- 微信 API/组件参数可按官方 schema 使用 Taro.canIUse；它不证明 CSS 模糊、GPU 性能或第三方组件行为符合预期，后者必须实测。[Taro.canIUse](https://docs.taro.zone/docs/apis/base/canIUse)
- 玻璃底栏默认有实色或半透明 surface 降级，保持选中标识、对比度和点击区域；滑块/涟漪可简化，但不能丢失导航反馈。
- 系统降低动态效果时采用静态或减弱动画；低性能设备降级依据测量或明确配置，不仅凭品牌/机型字符串猜测。
- 适配器封装平台能力判断与失败语义，UI 选择表现；core 不读取 OS/设备全局变量。

### 23.3 验收与范围变更

框架/原生依赖升级、提高最低版本、新增设备能力、变更玻璃/手势等交互时重新评估受影响矩阵；每次发布执行关键路径冒烟，其余稳定覆盖按风险轮换。

验收组合包含最低支持范围、当前主要系统、微信两类真机、双主题、大字体和代表性低端设备；不要求所有特征做无意义的全笛卡尔组合。性能记录使用接近生产的构建与一致内容/网络条件，记录启动、滚动、动画和包体指标的测量方式。

提高最低支持版本属于用户可见变更，说明受影响范围、替代路径与发布沟通。不能只在某个页面加判断，遗漏安装配置、商店说明和其他功能。

## 24. 公共契约演进与迁移

本章补充第 4、8、9、10、17、18 章。源代码在同一 PR 更新，并不能更新用户已经安装的原生二进制、离线数据或缓存的小程序代码。

### 24.1 变更分类

| 契约                       | 典型破坏性变更                              | 默认策略                                           |
| -------------------------- | ------------------------------------------- | -------------------------------------------------- |
| 包 exports/类型/组件 Props | 删除入口、必填新参数、修改事件含义          | 仓库内消费者同 PR 更新并验证；独立消费者提供迁移期 |
| API/业务协议               | 字段更名/类型变化、旧端点停止、枚举语义变化 | 服务端先兼容，再迁移客户端，最后收缩旧协议         |
| Storage schema             | 字段重解释、删数据、新版无法被旧代码读取    | 版本化、纯迁移、保留恢复依据，验证回滚             |
| tokens                     | 删除语义名、改单位/含义、失去对比度         | 更新两端映射与消费者，视觉验收                     |
| 原生运行时                 | 新增/变更原生模块或配置能力                 | 新二进制与兼容 runtime；不能只发 JS                |

可选字段增加也需检查实际解析器与旧端行为，不能仅因类型“可选”就认定兼容。token 普通值调整一般不需要契约主版本，但仍需验证两端布局、对比度与交互。

### 24.2 契约变更记录与弃用

影响公开消费者的变更必须说明：owner、消费者范围、前后契约、旧版本行为、迁移步骤、验证证据、失败恢复及可移除旧接口的条件。小型仓库内改动可写 PR；跨发布周期或影响已安装客户端时形成 ADR/迁移说明。

未独立发布的内部包不强制引入 SemVer/Changesets。存在独立发布消费者时遵循公开版本策略，破坏性变更有明确版本与迁移说明。

弃用窗口由实际支持的客户端版本、发布/审核时延、离线使用和采用率确定，记录最早移除时间及验证条件，不任意规定“保留两版”。移除前确认受支持旧客户端已不依赖旧能力，或已有明确升级/阻断方案；网络不可用时升级提示仍需可理解。

### 24.3 API 的扩展—迁移—收缩

1. 服务端先支持旧/新契约，明确字段和枚举的兼容语义。
2. 新客户端在服务兼容后启用新行为；只有真实需求才引入能力协商或功能开关。
3. 使用代表性旧客户端与新客户端验证，观察采用率与错误。
4. 达到记录的移除条件后收缩旧契约，保留故障恢复路径。

解析器默认接受协议允许的额外字段，不盲目将对象所有未知键认作错误；必需字段、类型和值域仍校验。可扩展枚举明确 unknown 展示/降级策略；涉及关键业务不变量时拒绝未知值并提示升级，不能映射成已有但含义不同的值。

后端协议迁移必须由服务端实现配合；模板只有 Mock 时记录目标契约与 fixture，不能宣称已验证后端兼容。

### 24.4 持久化迁移与降级读取

需要演进的数据默认使用带 schemaVersion 的存储封套；具体结构属于领域契约。迁移函数为纯转换，输入旧版本已校验数据，输出新版本已校验数据；平台 I/O 留适配器/端内协调层。

key 版本与 payload schemaVersion 分别定义寻址与内容格式，不能互相替代。迁移说明必须列明旧/新客户端的读写 key、查找优先级、提交标记与弃用条件；使用新 key 隔离时，核对旧客户端是否会读到陈旧副本。要支持代码回退，默认先发布可理解新数据的兼容版本并验证，再迁移数据，以该兼容版本作为回退候选；无需回退到不兼容的任意历史版本。

- 已知旧版逐步迁移，验证每一步；同一迁移不能在重复启动时重复追加或丢数据。
- 缺失、I/O 失败、格式损坏和未知未来版本分别处理；未来版本保留原值，暂停不安全写入，提供只读/受限模式或明确恢复入口。
- 替换前完整生成并校验新数据。StoragePort 不承诺多 key 事务；复杂迁移需定义暂存/检查点/提交与断电恢复，不把多次 set 当原子提交。
- 用户不可重建的数据在破坏性迁移前保留可恢复副本；备份最小化、保护与过期清理遵循原数据要求，不能泄漏敏感数据。
- 回滚应用代码不等于回滚数据。迁移设计明确旧客户端是否可读、是否使用新 key 隔离、如何保留未同步修改；不可逆迁移优先前向修复，不能盲目发布旧代码。
- 缓存与用户数据分开。可重建缓存可按版本失效，但不能以“清缓存”名义删除草稿、收藏或用户设置。

### 24.5 验收

公共包变更验证全部实际消费者；协议变更用代表性旧响应/新响应、旧请求/新请求做兼容检查。持久化覆盖历史 schema、未知未来版本、损坏、写失败、迁移中断与重复启动；按声明的恢复方案检查新版→旧版或前向修复。OTA/原生构建兼容与数据兼容分别记录。

## 25. 数据协议与缓存细则

本章细化第 8、9 章；有真实分页/缓存需求时启用对应规则，不提前安装查询库或修改后端。

### 25.1 字段与标量语义

| 数据            | 默认契约                                                                      |
| --------------- | ----------------------------------------------------------------------------- |
| 标识            | 不透明字符串，保留大小写/前导零；现有数值协议先验证安全范围再映射             |
| 缺省字段        | 未提供或未参与操作；与显式 null 分开定义                                      |
| null            | 字段契约允许的空值/清除意图；不是通用“保持原值”                               |
| 空字符串/空数组 | 合法业务值或明确无效；不与缺省/null 自动合并                                  |
| 时间点          | 明确格式与时区，默认带 Z 的 UTC ISO 8601；展示时转换                          |
| 日历日期        | 如生日，使用明确日期格式，不当作 UTC 时间点任意换时区                         |
| 金额            | 货币及单位/精度明确；默认安全范围内整数最小货币单位，超范围用约定十进制字符串 |

金额不可一律假设乘除 100，货币精度以协议约定为准；禁止浮点金额直接做关键计算。协议中不直接传 JS Date、BigInt、undefined 等非 JSON 值。历史协议按兼容映射，不为规范单独改变现有后端格式。

PATCH 类更新必须说明“缺省保持、null 清除或禁止、值替换”的具体规则；PUT 类整体替换另行定义。不依赖 JSON.stringify 隐式丢弃 undefined 完成业务判断。时间格式、空值与错误码在 Mock/解析/服务保持一致。

### 25.2 分页、排序与筛选

端点必须选择并记录 cursor 或 offset/page 协议，不在同一参数上混用。记录参数名、默认/最大页大小、排序、筛选、是否提供 total，以及空页、末页和失效游标的行为。

动态内容流默认优先 cursor；稳定管理列表且需要跳页时可采用 page/offset，说明数据变化可能造成的重复/遗漏。稳定排序默认包含唯一标识作同值 tie-breaker；真正排序和游标逻辑由服务端实现，客户端不能假装修复服务端遗漏。

以下仅是新增 cursor 端点的推荐响应，不要求重写已有协议：

```ts
interface CursorPage<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}
```

- 本契约约定 hasMore 为 true 时 nextCursor 必须有效，false 时为 null；现有端点不同则在 service 中映射并明确解析规则。
- 游标是不透明值，正确编码并传回服务端，不自行解析、生成或当全局持久标识。
- 不以 items.length < limit 判断结束；空页可能仍有有效 nextCursor。游标不推进或重复时停止自动加载并归类异常响应，避免无限循环。
- 筛选/搜索/排序变化产生新的查询身份，切换当前活动列表/游标并取消或隔离旧请求；不能将前一身份的下一页附加进来。未命中缓存时从第一页开始；命中相同身份缓存时按缓存策略恢复已有页与游标。这不要求删除其他查询身份的有效缓存。
- 同一查询/游标默认只允许一个加载任务；追加结果按稳定 id 去重并定义更新覆盖策略。去重不能保证服务端漏项恢复。
- 加载更多失败保留已加载内容、允许按同一游标重试；游标过期采用协议指定恢复路径，不自动无限清空并重试第一页。
- 筛选参数缺省与空值的含义、大小写、时区、搜索规范化由协议决定；防抖在 feature，编码/校验在 service，不能擅自 trim 或重排有顺序含义的数组。

### 25.3 缓存身份与所有权

首版默认保持 feature 本地请求状态；出现跨页面去重、失效或离线需求时再选择缓存方案。默认 key 包含资源、规范化筛选/排序、页大小和影响数据的环境/身份范围；分页模型明确基准 key 与每页 cursor 的关系。

key 不包含访问 token 或敏感原文。引入账号后缓存按账号/租户隔离，切换身份清理或隔离相关缓存；不能仅改请求头后沿用上个账号的数据。

定义缓存 owner、有效期、何时刷新、失效触发和内存上限。staleTime/TTL 与保留时间不同；当前示例未采用查询库时不添加无实际用途的参数。默认不持久化请求缓存，确需离线时补充容量、schema、敏感性与清理策略。

### 25.4 刷新、写入与竞态

- 初始加载、刷新、加载更多分别表示；后台刷新可保留同一查询的旧数据，明确刷新状态。新查询要显示旧内容时标明其归属，不能当作新结果。
- 按查询身份与请求轮次决定可提交结果，过期响应不覆盖新意图。是否中断共享请求需考虑其他订阅者，不能由一个离页组件取消所有消费者。
- 写入成功明确受影响实体、详情、列表/排序/统计缓存，选择更新或失效；不能默认清空所有缓存。
- 乐观更新按操作记录回滚依据，处理并发修改；失败时不能用旧快照覆盖较新的成功写入。高风险写操作默认等待服务端确认。
- 离线写队列只有业务明确要求才设计，另行定义幂等、冲突和重放；失败请求不偷偷排队。

### 25.5 验收

覆盖首/末/空页、重复 id、重复游标、游标失效、快速换筛选/排序、慢响应晚到、加载更多失败重试与写后失效。已有缓存时补充身份/环境隔离、容量清理、并发乐观回滚；没有缓存不为形式编造测试。Mock fixture 使用同一协议和语义校验。

## 26. 发布观察与故障处理

本章细化第 17、18 章。开发模板只维护流程；首次正式发布前必须确定负责人、诊断路径和可执行恢复方案。不强制引入付费监控、独立运维团队或尚未采用的 OTA 系统。

### 26.1 发布记录与职责

每次正式发布记录版本/build、Git commit、环境、应用标识、产物类型、公共配置、矩阵验证结果、已知限制、发布负责人及观察/恢复负责人；小团队可由同一人承担。涉及 OTA 时另记录 runtimeVersion、channel、update 标识与对应原生构建。

发布记录必须可关联构建日志、脱敏诊断、符号/Source Map 与验证证据。Source Map/符号按诊断权限保存，不将内部源码/凭据误设为公开资源。发布与故障通知只向已有授权的对象/渠道发送，规范不授权自动联系外部人员。

### 26.2 发布前与分阶段观察

1. 在目标环境验证相同候选产物，完成安装、冷启动、关键路径与迁移；preview 指向测试配置，与 production 的差异明确。
2. 确认恢复候选、签名/权限、API 兼容和存储迁移后果；高风险迁移先验证恢复。
3. 默认先内部/体验用户验证，再按平台支持的机制分阶段发布。分阶段比例、观察时长、最小样本及阈值依据基线和风险设定，不能照搬统一百分比。
4. 满足观察条件后扩大范围；记录决策与实际覆盖。没有平台灰度能力时采用内测、人工观察和明确暂停路径，不能声称已实施自动灰度。

首次发布无历史基线时，以内测数据、平台矩阵和明确的绝对失败条件作为依据，记录样本不足；低流量场景不能仅凭“零上报”判定安全。

### 26.3 指标与停止条件

| 观察项        | 统计口径/判断                                             |
| ------------- | --------------------------------------------------------- |
| 启动          | 成功到达 ready/degraded 的次数与尝试次数、耗时；失败阶段  |
| 崩溃/页面故障 | 受影响用户/会话和事件数分开；JS 与原生分别观察            |
| 关键操作      | 明确成功/尝试口径及取消、业务拒绝如何计数                 |
| 请求          | network/timeout/http/invalid-response、延迟；区分后端变化 |
| 性能/资源     | 同类设备和内容条件下的启动、滚动、内存、包体变化          |
| 数据兼容      | 迁移失败、未来 schema、异常丢失/覆盖报告                  |

正式发布前定义可执行的暂停条件：关键路径不可用、数据丢失/跨身份泄漏、启动失败，或指标超出约定预算。按版本/build/runtime、设备与环境分组比较，说明分母、采样与观察窗口。无可用观测数据时暂停扩量并进行人工复核，不能无限等待或自动认定通过。

### 26.4 按产物选择恢复

| 故障对象          | 优先恢复路径                                         | 限制                                                    |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| API/配置          | 服务端兼容修复或已有功能开关                         | 开关需真实接入、有权限；不能修复客户端启动前崩溃        |
| Expo JS OTA       | 暂停分发；验证兼容后采用受支持的旧更新/内置版本恢复  | 必须核对 runtime 与已写入数据；已下载更新不保证立即消失 |
| 新原生模块/二进制 | 暂停可暂停的发布，提交修复构建；可用时关闭受影响功能 | JS OTA 不能替换原生二进制，不能假设用户会自动降级       |
| 微信版本          | 按当时平台权限与能力暂停/回退/发布修复版             | 必须核实控制台能力；已经运行的客户端与存储仍需兼容      |
| 不可逆数据迁移    | 前向修复或验证过的数据恢复流程                       | 不盲目重新发布旧代码/清空存储                           |

EAS 的更新运行时兼容、分阶段分发与回退能力需按已接入配置核实。自动错误恢复有触发限制，不保证修复全部故障，数据不兼容时回退可能扩大影响。[Expo 运行时兼容](https://docs.expo.dev/eas-update/runtime-versions/) · [Expo Rollouts](https://docs.expo.dev/eas-update/rollouts/) · [Expo Rollbacks](https://docs.expo.dev/eas-update/rollbacks/) · [Expo 错误恢复](https://docs.expo.dev/eas-update/error-recovery/)

### 26.5 故障处理与复盘

出现严重故障时，指定当次负责人，先确认影响版本/范围并暂停扩大发布，保存必要诊断；优先恢复用户可用性，再定位根因。外部平台变更需验证当时能力，不直接执行旧 runbook 中的危险操作。

按实际情况选择暂停、功能降级、兼容修复、回退或修复构建；执行前确认授权和数据安全条件。记录发现、止损、恢复时间与执行动作，避免多人同时发布互相覆盖。恢复后在原故障设备/状态下复测，并观察约定窗口再结束事件。

重大故障复盘说明影响、时间线、触发原因、检测/恢复不足和有 owner/完成条件的改进项。只记录可验证事实，避免把“开发者粗心”作为最终原因；改进项落实为测试、检查、流程或简化设计，不机械增加审批层级。

### 26.6 验收与实施边界

正式发布前，至少对高风险恢复路径做受控演练：候选坏版本识别、停止扩量、恢复候选验证、数据兼容、原设备重测。没有已接入 OTA/灰度时验证实际可执行的人工流程，不为演练创建生产故障。

本次规范补充没有实现错误边界、迁移器、缓存、监控、灰度或自动门禁；这些能力作为后续明确工程任务按风险逐项落地。登录、支付、上传、推送出现后再补专项规范。
