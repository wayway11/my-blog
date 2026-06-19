## ADDED Requirements

### Requirement: Static output without Vercel adapter

项目 SHALL 使用 Astro 纯静态输出模式（`output: 'static'`），不依赖 `@astrojs/vercel` 或任何平台特定适配器。

#### Scenario: Build produces static files

- **WHEN** 执行 `npm run build`
- **THEN** `dist/` 目录生成完整的纯静态 HTML/CSS/JS 文件，无需任何服务器端运行时

#### Scenario: Local preview works

- **WHEN** 执行 `npx astro preview`
- **THEN** 本地可以预览完整的博客站点，所有页面正常

### Requirement: EdgeOne Pages project creation

项目 SHALL 在腾讯云 EdgeOne Pages 控制台创建，连接到 GitHub 仓库，实现 git push 自动触发构建和部署。

#### Scenario: Push triggers auto deploy

- **WHEN** 作者推送代码到 GitHub 仓库主分支
- **THEN** EdgeOne Pages 自动运行 `npm run build` 并将 `dist/` 目录内容部署到生产环境

#### Scenario: Build failure does not affect existing site

- **WHEN** 构建过程出现错误
- **THEN** 部署不会更新，现有站点不受影响，作者在 EdgeOne Pages 控制台可查看构建日志

### Requirement: Build configuration

EdgeOne Pages 项目 SHALL 配置以下构建参数：构建命令为 `npm run build`，输出目录为 `dist/`。

#### Scenario: Correct build configuration

- **WHEN** EdgeOne Pages 触发构建
- **THEN** 使用配置的构建命令和输出目录，生成并部署正确的静态文件

### Requirement: Framework auto-detection

EdgeOne Pages SHALL 自动检测到 Astro 项目框架，无需在代码仓库中放置 EdgeOne 特定的配置文件。

#### Scenario: No platform config file needed

- **WHEN** 项目代码推送到 GitHub 仓库
- **THEN** EdgeOne Pages 自动识别为 Astro 项目，无需在仓库中存放 `.edgeone` 或类似配置文件

### Requirement: Default domain accessibility

EdgeOne Pages 提供的默认域名（`*.edgeone.app` 或类似格式）SHALL 在国内网络环境下可正常访问。

#### Scenario: China visitor accesses default domain

- **WHEN** 国内访客通过 EdgeOne Pages 提供的默认域名访问博客
- **THEN** 页面正常加载，访问速度在可接受范围内（首屏加载 < 5 秒）

### Requirement: vercel.json removal

项目 SHALL 移除 `vercel.json` 配置文件，因为不再部署到 Vercel。

#### Scenario: vercel.json is removed

- **WHEN** 迁移完成后
- **THEN** 仓库中不再存在 `vercel.json` 文件
