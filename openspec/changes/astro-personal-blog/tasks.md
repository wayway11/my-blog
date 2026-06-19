## 1. 项目初始化

- [x] 1.1 初始化 Astro 项目
  运行: `npm create astro@latest . -- --template minimal --typescript strict --skip-houston`
  选择: 空项目、TypeScript strict、不装依赖先
  
- [x] 1.2 安装依赖
  运行: `npm install`
  运行: `npm install @astrojs/vercel`
  预期: package.json 中已有 astro 和 @astrojs/vercel

- [x] 1.3 配置 `astro.config.mjs`
  文件: `astro.config.mjs`
  ```js
  import { defineConfig } from 'astro/config';
  import vercel from '@astrojs/vercel';

  export default defineConfig({
    output: 'static',
    adapter: vercel(),
  });
  ```
  验证: `npx astro check` 无报错

- [x] 1.4 配置 `tsconfig.json` 路径别名
  文件: `tsconfig.json`
  在 `compilerOptions` 中补充:
  ```json
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"]
  }
  ```

## 2. Content Collection

- [x] 2.1 创建 blog collection schema
  创建: `src/content/config.ts`
  ```ts
  import { defineCollection, z } from 'astro:content';

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

  export const collections = { blog: blogCollection };
  ```
  验证: `npx astro check` 无类型错误

- [x] 2.2 创建示例文章（已发布）
  创建: `src/content/blog/2024-06-18-hello-world.md`
  ```md
  ---
  title: "Hello World"
  date: 2024-06-18
  tags: ["随笔"]
  summary: "这是我的第一篇博客文章"
  ---
  
  ## 欢迎
  
  这是我的个人博客。使用 **Astro** 构建，Markdown 写作。
  
  ```js
  console.log("Hello, blog!");
  ```
  ```

- [x] 2.3 创建示例文章（草稿）
  创建: `src/content/blog/2024-06-20-draft-post.md`
  ```md
  ---
  title: "草稿文章"
  date: 2024-06-20
  tags: []
  draft: true
  ---
  
  这篇文章还在写，不会出现在生产环境。
  ```

- [x] 2.4 验证 content collection 可用
  运行: `npx astro dev`
  在浏览器打开 `http://localhost:4321`，暂时看到默认页面
  确认 `src/content/blog/` 下的文件被正确加载（无报错即可，页面还没写）

## 3. 全局样式

- [x] 3.1 创建全局 CSS
  创建: `src/styles/global.css`
  ```css
  @layer reset, base, layout, components, utilities;

  @layer reset {
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    img { max-width: 100%; height: auto; }
  }

  @layer base {
    :root {
      --color-bg: #ffffff;
      --color-text: #1a1a1a;
      --color-text-secondary: #666666;
      --color-border: #e5e5e5;
      --color-accent: #2563eb;
      --color-tag-bg: #f0f4ff;
      --color-tag-text: #1e40af;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "SF Mono", "Fira Code", "Fira Mono", monospace;
      --max-width-content: 65ch;
      --max-width-page: 720px;
      --spacing-xs: 0.25rem;
      --spacing-sm: 0.5rem;
      --spacing-md: 1rem;
      --spacing-lg: 1.5rem;
      --spacing-xl: 2rem;
      --spacing-2xl: 3rem;
    }

    body {
      font-family: var(--font-sans);
      color: var(--color-text);
      background: var(--color-bg);
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }

    a { color: var(--color-accent); text-decoration: none; }
    a:hover { text-decoration: underline; }

    h1, h2, h3, h4, h5, h6 {
      line-height: 1.3;
      margin: var(--spacing-xl) 0 var(--spacing-md);
    }

    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }

    p { margin-bottom: var(--spacing-md); }

    pre {
      background: #f5f5f5;
      border-radius: 6px;
      padding: var(--spacing-md);
      overflow-x: auto;
      font-family: var(--font-mono);
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: var(--spacing-md);
    }

    code {
      font-family: var(--font-mono);
      font-size: 0.875em;
    }

    :not(pre) > code {
      background: #f5f5f5;
      padding: 0.125em 0.375em;
      border-radius: 3px;
    }

    blockquote {
      border-left: 3px solid var(--color-accent);
      padding-left: var(--spacing-md);
      margin: var(--spacing-md) 0;
      color: var(--color-text-secondary);
    }
  }

  @layer layout {
    .container {
      max-width: var(--max-width-page);
      margin: 0 auto;
      padding: 0 var(--spacing-md);
    }

    .prose {
      max-width: var(--max-width-content);
    }
  }
  ```

- [x] 3.2 创建 BaseLayout 组件
  创建: `src/layouts/BaseLayout.astro`
  ```astro
  ---
  interface Props {
    title: string;
    description?: string;
  }

  const { title, description } = Astro.props;
  ---

  <!doctype html>
  <html lang="zh-CN">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content={description || title} />
      <title>{title}</title>
      <link rel="stylesheet" href="/src/styles/global.css" />
    </head>
    <body>
      <header>
        <nav class="container">
          <a href="/" class="site-title">{title.split(" - ")[0] || "Blog"}</a>
          <div class="nav-links">
            <a href="/">首页</a>
            <a href="/tags">标签</a>
            <a href="/archive">归档</a>
          </div>
        </nav>
      </header>
      <main class="container">
        <slot />
      </main>
      <footer>
        <div class="container">
          <p>&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </body>
  </html>

  <style>
    header {
      border-bottom: 1px solid var(--color-border);
      padding: var(--spacing-lg) 0;
      margin-bottom: var(--spacing-2xl);
    }

    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .site-title {
      font-weight: 700;
      font-size: 1.25rem;
      color: var(--color-text);
    }

    .site-title:hover {
      text-decoration: none;
    }

    .nav-links {
      display: flex;
      gap: var(--spacing-lg);
    }

    .nav-links a {
      color: var(--color-text-secondary);
      font-size: 0.9375rem;
    }

    .nav-links a:hover {
      color: var(--color-text);
      text-decoration: none;
    }

    .nav-links a[aria-current="page"] {
      color: var(--color-accent);
    }

    main {
      min-height: calc(100vh - 200px);
    }

    footer {
      border-top: 1px solid var(--color-border);
      padding: var(--spacing-lg) 0;
      margin-top: var(--spacing-2xl);
      text-align: center;
      color: var(--color-text-secondary);
      font-size: 0.875rem;
    }
  </style>
  ```

- [x] 3.3 验证布局
  创建临时文件 `src/pages/test.astro`:
  ```astro
  ---
  import BaseLayout from '../layouts/BaseLayout.astro';
  ---
  <BaseLayout title="Test">
    <h1>布局测试</h1>
    <p>这是一段测试文字，验证布局和样式是否正常工作。</p>
    <pre><code>const x = 42;</code></pre>
  </BaseLayout>
  ```
  运行: `npx astro dev`
  打开 `http://localhost:4321/test`，确认导航栏、footer、排版样式正常
  确认后删除 `src/pages/test.astro`

## 4. 首页 — 文章列表

- [x] 4.1 创建首页
  创建: `src/pages/index.astro`
  ```astro
  ---
  import { getCollection } from 'astro:content';
  import BaseLayout from '../layouts/BaseLayout.astro';

  const allPosts = await getCollection('blog');
  const posts = allPosts
    .filter(p => !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  ---

  <BaseLayout title="我的博客">
    {
      posts.length === 0 ? (
        <div class="empty">
          <h1>还没有文章</h1>
          <p>作者正在抓紧写作中，敬请期待。</p>
        </div>
      ) : (
        <div class="post-list">
          <h1>文章</h1>
          {posts.map(post => (
            <article class="post-card">
              <time>{post.data.date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              <h2><a href={`/posts/${post.slug}`}>{post.data.title}</a></h2>
              {post.data.summary && <p class="summary">{post.data.summary}</p>}
              <div class="tags">
                {post.data.tags.map(tag => (
                  <a href={`/tags/${tag}`} class="tag">{tag}</a>
                ))}
              </div>
            </article>
          ))}
        </div>
      )
    }
  </BaseLayout>

  <style>
    .post-list h1 {
      margin-bottom: var(--spacing-xl);
    }

    .post-card {
      padding: var(--spacing-lg) 0;
      border-bottom: 1px solid var(--color-border);
    }

    .post-card:last-child {
      border-bottom: none;
    }

    .post-card time {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    .post-card h2 {
      margin: var(--spacing-xs) 0;
      font-size: 1.375rem;
    }

    .post-card h2 a {
      color: var(--color-text);
    }

    .post-card h2 a:hover {
      color: var(--color-accent);
      text-decoration: none;
    }

    .summary {
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-sm);
    }

    .tags {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .tag {
      display: inline-block;
      background: var(--color-tag-bg);
      color: var(--color-tag-text);
      padding: 0.125em 0.625em;
      border-radius: 999px;
      font-size: 0.8125rem;
    }

    .tag:hover {
      text-decoration: none;
      filter: brightness(0.95);
    }

    .empty {
      text-align: center;
      padding: var(--spacing-2xl) 0;
      color: var(--color-text-secondary);
    }

    .empty h1 {
      font-size: 1.5rem;
      margin-bottom: var(--spacing-sm);
    }
  </style>
  ```

- [x] 4.2 验证首页
  运行: `npx astro dev`
  打开 `http://localhost:4321/`
  预期: 看到 "Hello World" 文章卡片，草稿文章不出现。日期、标签、摘要都正常显示。

## 5. 文章详情页

- [x] 5.1 创建文章详情页
  创建: `src/pages/posts/[slug].astro`
  ```astro
  ---
  import { getCollection } from 'astro:content';
  import BaseLayout from '../../layouts/BaseLayout.astro';

  export async function getStaticPaths() {
    const posts = await getCollection('blog');
    return posts
      .filter(p => !p.data.draft)
      .map(p => ({ params: { slug: p.slug } }));
  }

  const { slug } = Astro.params;
  const posts = await getCollection('blog');
  const post = posts.find(p => p.slug === slug);

  if (!post) {
    return Astro.redirect('/404');
  }

  const { Content } = await post.render();
  ---

  <BaseLayout title={`${post.data.title} - 我的博客`} description={post.data.summary}>
    <article class="post">
      <header class="post-header">
        <h1>{post.data.title}</h1>
        <time>{post.data.date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
        <div class="tags">
          {post.data.tags.map(tag => (
            <a href={`/tags/${tag}`} class="tag">{tag}</a>
          ))}
        </div>
      </header>
      <div class="prose">
        <Content />
      </div>
      <footer class="post-footer">
        <a href="/">&larr; 返回首页</a>
      </footer>
    </article>
  </BaseLayout>

  <style>
    .post-header {
      margin-bottom: var(--spacing-2xl);
    }

    .post-header h1 {
      margin-top: 0;
      margin-bottom: var(--spacing-sm);
    }

    .post-header time {
      display: block;
      color: var(--color-text-secondary);
      font-size: 0.9375rem;
      margin-bottom: var(--spacing-md);
    }

    .post-header .tags {
      display: flex;
      gap: var(--spacing-sm);
    }

    .tag {
      display: inline-block;
      background: var(--color-tag-bg);
      color: var(--color-tag-text);
      padding: 0.125em 0.625em;
      border-radius: 999px;
      font-size: 0.8125rem;
    }

    .tag:hover {
      text-decoration: none;
      filter: brightness(0.95);
    }

    .post-footer {
      margin-top: var(--spacing-2xl);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--color-border);
    }
  </style>
  ```

- [x] 5.2 Markdown 代码高亮配置
  修改: `astro.config.mjs`，添加 syntaxHighlight:
  ```js
  import { defineConfig } from 'astro/config';
  import vercel from '@astrojs/vercel';

  export default defineConfig({
    output: 'static',
    adapter: vercel(),
    markdown: {
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'github-light',
      },
    },
  });
  ```
  运行: `npm install` (shiki 是 astro 内置的，无需额外安装)

- [x] 5.3 验证文章详情页
  运行: `npx astro dev`
  打开 `http://localhost:4321/posts/hello-world`
  预期: 看到文章标题、日期、标签、渲染后的 Markdown 内容（包括代码高亮块）

- [x] 5.4 验证 404
  访问 `http://localhost:4321/posts/不存在的文章`
  预期: 跳转到 404 页面

## 6. 404 页面

- [x] 6.1 创建 404 页面
  创建: `src/pages/404.astro`
  ```astro
  ---
  import BaseLayout from '../layouts/BaseLayout.astro';
  ---

  <BaseLayout title="404 - 页面不存在">
    <div class="not-found">
      <h1>404</h1>
      <p>你找的页面不存在。</p>
      <a href="/">&larr; 返回首页</a>
    </div>
  </BaseLayout>

  <style>
    .not-found {
      text-align: center;
      padding: var(--spacing-2xl) 0;
    }

    .not-found h1 {
      font-size: 4rem;
      color: var(--color-border);
      margin-bottom: var(--spacing-md);
    }

    .not-found p {
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-xl);
    }
  </style>
  ```

- [x] 6.2 验证
  访问 `http://localhost:4321/non-existent-page`
  预期: 看到 404 页面，不是 Astro 默认错误页

## 7. 标签系统

- [x] 7.1 创建标签总览页
  创建: `src/pages/tags/index.astro`
  ```astro
  ---
  import { getCollection } from 'astro:content';
  import BaseLayout from '../../layouts/BaseLayout.astro';

  const allPosts = await getCollection('blog');
  const publishedPosts = allPosts.filter(p => !p.data.draft);

  // 统计每个标签的文章数
  const tagCounts = new Map<string, number>();
  for (const post of publishedPosts) {
    for (const tag of post.data.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  const tags = [...tagCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  ---

  <BaseLayout title="标签 - 我的博客">
    <h1>标签</h1>
    {
      tags.length === 0 ? (
        <p class="empty-text">暂无标签</p>
      ) : (
        <div class="tag-cloud">
          {tags.map(([tag, count]) => (
            <a href={`/tags/${tag}`} class="tag-item">
              {tag} <span class="count">{count}</span>
            </a>
          ))}
        </div>
      )
    }
  </BaseLayout>

  <style>
    h1 {
      margin-bottom: var(--spacing-xl);
    }

    .tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }

    .tag-item {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      background: var(--color-tag-bg);
      color: var(--color-tag-text);
      padding: 0.375em 0.875em;
      border-radius: 999px;
      font-size: 0.9375rem;
    }

    .tag-item:hover {
      text-decoration: none;
      filter: brightness(0.9);
    }

    .count {
      background: var(--color-accent);
      color: white;
      padding: 0.0625em 0.4375em;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .empty-text {
      color: var(--color-text-secondary);
    }
  </style>
  ```

- [x] 7.2 创建标签筛选页
  创建: `src/pages/tags/[tag].astro`
  ```astro
  ---
  import { getCollection } from 'astro:content';
  import BaseLayout from '../../layouts/BaseLayout.astro';

  export async function getStaticPaths() {
    const posts = await getCollection('blog');
    const publishedPosts = posts.filter(p => !p.data.draft);
    const tagSet = new Set<string>();
    for (const post of publishedPosts) {
      for (const tag of post.data.tags) {
        tagSet.add(tag);
      }
    }
    return [...tagSet].map(tag => ({ params: { tag } }));
  }

  const { tag } = Astro.params;
  const allPosts = await getCollection('blog');
  const posts = allPosts
    .filter(p => !p.data.draft && p.data.tags.includes(tag!))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  ---

  <BaseLayout title={`标签: ${tag} - 我的博客`}>
    <h1>标签: {tag}</h1>
    <p class="count-text">{posts.length} 篇文章</p>
    {
      posts.length === 0 ? (
        <p class="empty-text">该标签下暂无文章</p>
      ) : (
        <div class="post-list">
          {posts.map(post => (
            <article class="post-card">
              <time>{post.data.date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              <h2><a href={`/posts/${post.slug}`}>{post.data.title}</a></h2>
              {post.data.summary && <p class="summary">{post.data.summary}</p>}
            </article>
          ))}
        </div>
      )
    }
  </BaseLayout>

  <style>
    h1 {
      margin-bottom: var(--spacing-xs);
    }

    .count-text {
      color: var(--color-text-secondary);
      font-size: 0.9375rem;
      margin-bottom: var(--spacing-xl);
    }

    .post-card {
      padding: var(--spacing-lg) 0;
      border-bottom: 1px solid var(--color-border);
    }

    .post-card:last-child {
      border-bottom: none;
    }

    .post-card time {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    .post-card h2 {
      margin: var(--spacing-xs) 0;
      font-size: 1.375rem;
    }

    .post-card h2 a {
      color: var(--color-text);
    }

    .post-card h2 a:hover {
      color: var(--color-accent);
      text-decoration: none;
    }

    .summary {
      color: var(--color-text-secondary);
    }

    .empty-text {
      color: var(--color-text-secondary);
    }
  </style>
  ```

- [x] 7.3 验证标签系统
  运行: `npx astro dev`
  - 访问 `http://localhost:4321/tags` — 看到 "随笔" 标签，计数为 1
  - 点击 "随笔" 标签 → 进入 `/tags/随笔` — 看到 "Hello World" 文章
  - 访问 `http://localhost:4321/tags/不存在的标签` — 文章数为 0

## 8. 归档页

- [x] 8.1 创建归档页
  创建: `src/pages/archive.astro`
  ```astro
  ---
  import { getCollection } from 'astro:content';
  import BaseLayout from '../layouts/BaseLayout.astro';

  const allPosts = await getCollection('blog');
  const posts = allPosts
    .filter(p => !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  // 按年-月分组
  type Group = { year: number; month: number; posts: typeof posts };
  const groups: Group[] = [];
  for (const post of posts) {
    const year = post.data.date.getFullYear();
    const month = post.data.date.getMonth() + 1;
    let group = groups.find(g => g.year === year && g.month === month);
    if (!group) {
      group = { year, month, posts: [] };
      groups.push(group);
    }
    group.posts.push(post);
  }
  ---

  <BaseLayout title="归档 - 我的博客">
    <h1>归档</h1>
    {
      groups.length === 0 ? (
        <p class="empty-text">暂无文章</p>
      ) : (
        groups.map(group => (
          <section class="archive-group">
            <h2>{group.year} 年 {group.month} 月</h2>
            <ul>
              {group.posts.map(post => (
                <li>
                  <time>{post.data.date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</time>
                  <a href={`/posts/${post.slug}`}>{post.data.title}</a>
                </li>
              ))}
            </ul>
          </section>
        ))
      )
    }
  </BaseLayout>

  <style>
    h1 {
      margin-bottom: var(--spacing-xl);
    }

    .archive-group {
      margin-bottom: var(--spacing-xl);
    }

    .archive-group h2 {
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--spacing-sm);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .archive-group ul {
      list-style: none;
    }

    .archive-group li {
      display: flex;
      gap: var(--spacing-lg);
      padding: var(--spacing-xs) 0;
      align-items: baseline;
    }

    .archive-group time {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      white-space: nowrap;
      min-width: 5em;
    }

    .archive-group a {
      color: var(--color-text);
    }

    .archive-group a:hover {
      color: var(--color-accent);
    }

    .empty-text {
      color: var(--color-text-secondary);
    }
  </style>
  ```

- [x] 8.2 验证归档页
  访问 `http://localhost:4321/archive`
  预期: 看到 "2024 年 6 月" 分组，下面列出 "Hello World" 文章

## 9. 部署

- [x] 9.1 创建 `vercel.json`
  创建: `vercel.json`
  ```json
  {
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "framework": "astro"
  }
  ```

- [x] 9.2 验证生产构建
  运行: `npm run build`
  预期: 构建成功，`dist/` 目录生成静态文件。草稿文章不出现在任何页面。
  运行: `ls dist/` 确认输出结构正常

- [x] 9.3 本地预览生产构建
  运行: `npx astro preview`
  打开 `http://localhost:4321`，遍历所有页面确认无误：
  - `/` — 首页，只有已发布文章
  - `/posts/hello-world/` — 文章详情，代码块有高亮
  - `/tags/` — 标签总览
  - `/tags/随笔/` — 标签筛选
  - `/archive/` — 归档
  - `/non-existent` — 404

- [ ] 9.4 初始化 Git 并推送到 GitHub
  ```bash
  git init
  git add -A
  git commit -m "feat: init Astro blog project"
  ```
  前往 GitHub 创建新仓库（名称自定，如 `my-blog`），然后:
  ```bash
  git remote add origin git@github.com:<你的用户名>/<仓库名>.git
  git push -u origin main
  ```

- [ ] 9.5 连接 Vercel 自动部署
  1. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录
  2. 点击 "New Project" → 导入刚创建的 GitHub 仓库
  3. Vercel 自动检测到 Astro 项目，无需修改配置
  4. 点击 "Deploy"
  5. 部署完成后，访问 Vercel 分配的域名，确认所有页面上线正常
  6. 回到本地，修改 `src/content/blog/2024-06-18-hello-world.md` 加一句话，git push，确认 Vercel 自动重新部署

## 10. 收尾

- [ ] 10.1 替换示例文章为你的第一篇正式文章
  删除 `src/content/blog/2024-06-18-hello-world.md` 和 `src/content/blog/2024-06-20-draft-post.md`
  创建你的第一篇正式文章，写真实内容

- [ ] 10.2 最终全面检查
  运行: `npm run build`
  确认构建无错误，`dist/` 输出完整
  运行: `npm run dev`
  遍历所有页面，确认无死链、样式正常
