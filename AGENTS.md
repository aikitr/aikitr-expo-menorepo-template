# 项目开发约定

本项目使用 pnpm Workspace、Turborepo 与 TypeScript。移动端使用 Expo Router、HeroUI Native、Uniwind；微信小程序使用 Taro 与 Taroify。

## 工程规范入口

- 进行架构、功能实现或代码审查前，按任务范围阅读 [团队工程规范](docs/engineering-standards.md) 的相关章节。
- 项目级 Skill 位于 [.agents/skills/expo-taro-monorepo-standards/SKILL.md](.agents/skills/expo-taro-monorepo-standards/SKILL.md)，提供章节索引与核心边界；完整规范以 docs 中的正文为准。
- 用户明确要求优先。区分 MUST、SHOULD、MAY；推荐目录属于目标架构，新增或修改功能时渐进采用，不因此执行无关的全仓重构。
- 保留已有平台兼容修复，变更前验证原因；框架配置以已安装版本为依据。
- 公共运行时代码保持平台无关，通过包公开入口引用；页面、组件、路由和设备能力留在各应用。
- 报告实际完成的检查与未验证条件。JavaScript 导出不等于原生安装包构建或真机验证。
