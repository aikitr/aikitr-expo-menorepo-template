# Expo + Taro 多端 Monorepo 团队工程规范

适用范围：pnpm Workspace + Turborepo + TypeScript；Android/iOS 使用 Expo Router + HeroUI Native + Uniwind；微信小程序使用 Taro React + Taroify + Sass。

版本：1.0。资料核对日期：2026-10-04。本文是面向多人协作、长期维护和持续交付的推荐标准，不声称所有“大厂”使用同一规范。本文是目标规范，示例目录和目标命令不等于当前项目已经落地。

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

### 19.2 功能完成

- 文件归属、公开入口、依赖声明正确。
- 外部数据与路由校验；异步终止、过期响应有行为契约。
- 加载/空/错误/成功、主题/无障碍/返回满足本次需求。
- 新依赖不破坏隔离安装、React 实例、CNG、产物更新。
- 执行匹配风险的质量检查/消费者构建，需真机的行为有证据。
- 文档/PR 明确本次验证、未测范围和必要使用方式。

清单是评审契约，不强制每个小改动做全部原生发布；按变化影响选证据。

## 20. 现有项目的渐进落地

目标架构可以不受当前目录限制；迁移代码是另一个明确任务。默认顺序：

1. 记录团队标准，README/AGENTS 用可随仓库分享的相对文档链接，确定 owners/例外方式。
2. 先落实工具/lock/exports/共享平台边界/CI；兼容补丁到有证据才移除。
3. 验证 fresh clone、共享 build/watch、token 改动、云端产物；避免移动完目录仍读陈旧 dist。
4. 按 feature 迁移薄路由、adapter、稳定 shared；每个 PR 保持公开行为和消费者可用。
5. 完善双端主题、请求状态、存储恢复、导航/动效与真机验收。
6. 有需求才加入缓存库、认证、分包、平台 UI 包、E2E、OTA、独立发布。

当前 src/components/providers/adapters 的平铺结构可以工作；shared 是增长目标，文件夹名字不同不代表运行 bug。迁移收益来自降低耦合、消除缺陷或降低变化成本；不一次“升级最佳实践”同时替换路由、React、UI 库、状态库和原生模式。

每阶段验证已有用户行为，列明未落地条目；目标规范不能被用来声称现有仓库已经符合全部要求。
