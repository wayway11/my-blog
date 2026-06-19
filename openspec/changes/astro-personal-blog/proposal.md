## Why

需要一个只属于我的写作空间 —— 我可以安静地写 Markdown 文章，其他人可以流畅地阅读。不需要用户系统、不需要评论审核、不需要复杂的后台。用最简单的方式把文字发布到互联网上。

## What Changes

- 新建 Astro 项目，使用 Content Collections 管理博客文章
- 所有文章以 `.md` 文件形式存放在 `src/content/blog/` 目录下
- 提供文章列表页（首页）、文章详情页、标签/归档页
- 响应式布局，移动端和桌面端都能舒适阅读
- `git push` 到 GitHub 后自动触发 Vercel 部署
- 无需任何后端服务器或数据库
- 无登录系统（单一作者模型，通过 git 控制发布权限）

## Capabilities

### New Capabilities

- `blog-content`: Markdown 文章内容管理，基于 Astro Content Collections，支持 frontmatter 元数据（标题、日期、标签、摘要）
- `blog-display`: 公开博客页面，包括文章列表、文章详情、按标签筛选、归档浏览
- `auto-deploy`: git push 后 Vercel 自动构建部署，生成纯静态站点

### Modified Capabilities

<!-- 无现有 capability 需要修改 -->

## Impact

- 无现有代码，项目从零开始
- 依赖：Astro、Vercel 账户、GitHub 仓库
- 无 API 变更、无破坏性变更
