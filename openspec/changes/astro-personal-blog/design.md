## Context

从零开始构建个人博客。唯一作者通过 Markdown 文件写文章，git push 后自动部署。访客只读。无后端、无数据库、无用户系统。

## Goals / Non-Goals

**Goals:**
- 零 JS 的博客阅读体验（文章页纯 HTML/CSS）
- Markdown 写作，git 版本控制内容
- push 即发布，全自动部署
- 移动端和桌面端都有良好的可读性
- 支持标签分类和按时间归档

**Non-Goals:**
- 评论系统
- 点赞/阅读统计（后续可加，当前版本不做）
- 管理后台 / 在线编辑器
- RSS 订阅（后续可加）
- 搜索功能（后续可加）
- 暗色模式（后续可加）

## Decisions

### 框架：Astro

选择 Astro 而非 Next.js 或 Hugo：

- Astro 默认输出零 JS，对博客场景最合适。Next.js 每页默认都会发 JS bundle。
- Content Collections 提供类型安全的 Markdown 数据层，比 Hugo 的 frontmatter 解析更可靠。
- 内置 Markdown 渲染，支持代码高亮、GFM 表格等。
- 未来如需添加互动功能（点赞等），Astro 的 Islands 架构可以精确加载交互组件，不影响静态页面性能。
- 构建速度在中等文章量下足够快（< 30s）。

### 样式方案：纯 CSS

不引入 Tailwind 或 CSS-in-JS：

- 博客的样式需求简单（排版、间距、颜色），CSS 变量 + 原生 CSS 完全够用。
- 避免构建依赖膨胀。对于一个以内容为主的站点，CSS 不会经常改动。
- 使用 CSS `@layer` 组织样式结构。

### 内容结构：Astro Content Collections

```
src/
├── content/
│   └── blog/
│       ├── 2024-01-01-hello-world.md
│       ├── 2024-01-15-another-post.md
│       └── ...
├── pages/
│   ├── index.astro          # 文章列表（首页）
│   ├── posts/
│   │   └── [slug].astro     # 文章详情
│   ├── tags/
│   │   ├── index.astro      # 标签总览
│   │   └── [tag].astro      # 按标签筛选
│   └── archive.astro        # 按时间归档
├── components/
│   ├── PostCard.astro       # 文章卡片
│   ├── PostList.astro       # 文章列表
│   ├── TagBadge.astro       # 标签徽章
│   └── Layout.astro         # 全局布局
├── layouts/
│   └── BaseLayout.astro     # 基础布局（header, footer）
└── styles/
    └── global.css           # 全局样式
```

### Content Collection Schema

```ts
// src/content/config.ts
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    summary: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});
```

`draft: true` 的文章在开发环境可见，生产构建时排除。

### 部署：Vercel

选择 Vercel 而非 GitHub Pages 或 Cloudflare Pages：

- 与 GitHub 集成最流畅，push 即触发部署
- 免费额度对个人博客绰绰有余
- 对 Astro 有一流支持，内置适配器 `@astrojs/vercel`
- 后续如需加 Serverless 功能（Vercel KV / Functions），无需迁移平台

### 路由设计

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 最新文章列表，分页 |
| `/posts/[slug]` | 文章详情 | Markdown 渲染 |
| `/tags` | 标签总览 | 所有标签及文章数 |
| `/tags/[tag]` | 标签页 | 该标签下的文章列表 |
| `/archive` | 归档 | 按年/月分组的文章列表 |

## Risks / Trade-offs

- **构建时间随文章增长** → 当前规模（< 100篇）无影响，Astro 增量构建在计划中
- **无 RSS** → 后续通过 Astro 集成或手写 RSS 路由补充
- **无搜索** → 后续可加 Pagefind（纯静态搜索，零后端）
- **Content Collections 学习成本** → Astro 文档完善，概念简单，上手快
