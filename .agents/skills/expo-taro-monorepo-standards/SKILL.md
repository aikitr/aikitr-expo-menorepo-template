---
name: expo-taro-monorepo-standards
description: Use when defining or applying engineering standards in a pnpm and Turborepo monorepo containing Expo Router, HeroUI Native, Uniwind, and a Taro/Taroify WeChat app, including feature placement, naming, dependency boundaries, component design, testing, and release reviews.
---

# Expo + Taro Monorepo 工程规范

面向 Android/iOS 共用 Expo 应用、微信小程序使用 Taro 的团队。采用按业务功能组织、端内复用 UI、跨端共享纯 TypeScript 的架构。

规范正文：[docs/engineering-standards.md](../../../docs/engineering-standards.md)。正文以仓库内文档为唯一维护来源，本 Skill 随整个仓库使用。该文件包含完整目录、命名表、平台要求和质量门禁；这些规则是本技术栈的团队默认约定，不代表所有公司的统一标准。

## 如何应用

1. 确认用户要规范文档、方案、审查还是实际实现。只制定规范时交付规范，不顺带迁移代码、安装依赖或改变工具版本。
2. 检查仓库说明、包清单、工作区、任务图、锁文件与相关功能。用户要求和仓库明确约定优先；区分目标架构、现有实现和已验证的事实。
3. 依据下表读取相关章节。完整架构设计/全面审查才通读全部；小改动不强迫加载无关发布流程。
4. 实现前明确文件归属、公开入口、依赖方向、状态所有者和验证方式。沿已有功能做范围内增量改进；旧结构不同不能成为全仓重命名的理由。
5. 框架配置、版本组合和平台行为对照已安装版本及官方文档。不因最新版或通用示例替换已有兼容补丁；先复现和验证，记录补丁的保留/移除条件。
6. 报告实际变化、已运行检查和未验证的平台条件。标准里出现的目录或命令不表示仓库已实现它们。

## 按任务读取

| 任务                                   | 正文章节         |
| -------------------------------------- | ---------------- |
| 新功能、目录、公共包、命名             | 1—5、7—9         |
| 组件封装、主题、玻璃底栏、原生页面     | 6、10—11、21、23 |
| 小程序页面、Taroify 样式、TabBar、分包 | 6、10、12        |
| 工具版本、构建、热更新、环境变量       | 13—15            |
| 测试、审查、团队交付、规范落地         | 16—20、26        |
| 页面异常、启动失败、存储迁移           | 8—9、22、24      |
| 公共契约变更、旧客户端兼容             | 4、8—10、24      |
| 分页、筛选、缓存与数据协议             | 8—9、25          |
| 支持范围、真机矩阵与发布故障           | 16—17、23、26    |

正文目录可定位章节；搜索关键词：依赖矩阵、完整目录、命名、compiled package、ConfigProvider、@source、persistent、CNG、门禁、受控、reset、错误边界、支持矩阵、schemaVersion、游标、缓存、停止条件。

## 不可破坏的边界

- mobile/weapp → api → core；应用另可依赖 core/tokens。core/api/tokens 运行时不引入 React、React Native、Expo、Taro、DOM 或 Node 专属依赖。Node 可用于构建脚本/测试，不可漏入运行时公开入口。
- 跨包只用 workspace:* 和显式 exports，不引用其他包 src/dist 内部路径，不通过 TypeScript alias 绕过边界。
- 路由负责参数与装配；业务属于 feature。端内 shared 不反向引用 feature；跨 feature 优先由页面/应用组合。
- JSX、Hooks、路由、生命周期与 UI 库留在各应用。React 版本由各端兼容组合决定，不能根级强制统一；各应用内部只有一个有效 React 实例。
- 公共包编译为 ESM 与声明；首次启动先 build，开发期间验证源改动能进入应用。长驻 ^dev 不能作为任务依赖。
- Taroify 可视 ConfigProvider 放在每个页面渲染树；app 级 React Context 只负责共享状态，小程序 app 入口不能承载可视 Provider。
- 不强制每个组件加包装层；有稳定团队语义/行为才封装。不因两端都有 Button 创建共享 React UI 包。
- JS 导出、小程序编译、原生签名构建、安装启动、真机体验是不同验收层级，不互相替代。

## 交付形态

- 规范制定：结构、职责、规则等级、例外与检查方式；版本注明依据，明确未实施部分。
- 功能实现：按规模选最少文件，不创建无用途空目录；领域契约、平台适配与 UI 的变化分别可审查。
- 代码审查：指出具体规则及行为/维护风险；命名偏好不能冒充运行缺陷。
- 迁移：由用户明确迁移任务启动，按第 20 章分阶段推进；Skill 本身不是全仓重构授权。
