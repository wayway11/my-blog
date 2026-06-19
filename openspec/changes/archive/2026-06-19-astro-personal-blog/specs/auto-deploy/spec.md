## ADDED Requirements

### Requirement: GitHub repository setup

项目代码 SHALL 托管在 GitHub 仓库中，博客文章（Markdown 文件）作为仓库内容的一部分进行版本控制。

#### Scenario: Author pushes new article

- **WHEN** 作者写完文章后执行 `git push` 将变更推送到 GitHub
- **THEN** 仓库中 `src/content/blog/` 目录包含新文章

### Requirement: Vercel automatic deployment

当代码推送到 GitHub 仓库的主分支时，Vercel SHALL 自动触发构建和部署。

#### Scenario: Auto deploy on push

- **WHEN** 作者推送代码到主分支
- **THEN** Vercel 自动运行 `astro build` 并将输出部署到生产环境

#### Scenario: Build failure

- **WHEN** 构建过程出现错误（如 frontmatter 校验失败）
- **THEN** 部署不会更新，作者收到构建失败通知，现有站点不受影响

### Requirement: Astro build configuration

项目 SHALL 配置 `@astrojs/vercel` 适配器，输出模式为静态（static）。

#### Scenario: Build output

- **WHEN** 执行 `astro build`
- **THEN** 在 `dist/` 目录生成纯静态 HTML/CSS/JS 文件，可直接部署
