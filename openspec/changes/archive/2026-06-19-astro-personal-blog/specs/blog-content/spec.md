## ADDED Requirements

### Requirement: Blog post content collection

系统 SHALL 使用 Astro Content Collections 管理博客文章，所有文章以 Markdown 文件形式存放在 `src/content/blog/` 目录下。

#### Scenario: Author creates a new blog post

- **WHEN** 作者在 `src/content/blog/` 下创建一个新的 `.md` 文件，包含有效的 frontmatter
- **THEN** 系统在下次构建时将这篇文章包含在 blog collection 中

#### Scenario: Author sets post as draft

- **WHEN** 作者将 frontmatter 中 `draft` 字段设置为 `true`
- **THEN** 开发环境 (`astro dev`) 中文章可见，生产构建 (`astro build`) 中文章被排除且不在任何列表页中出现

### Requirement: Blog post frontmatter schema

每篇博客文章的 frontmatter SHALL 包含以下字段：`title`（必填字符串）、`date`（必填日期）、`tags`（可选字符串数组，默认空数组）、`summary`（可选字符串）、`draft`（可选布尔值，默认 false）。

#### Scenario: Valid frontmatter

- **WHEN** 文章的 frontmatter 包含 `title: "Hello World"`, `date: 2024-01-15`
- **THEN** Content Collection 校验通过，文章可正常访问

#### Scenario: Missing required field

- **WHEN** 文章的 frontmatter 缺少 `title` 或 `date` 字段
- **THEN** 构建时报错，提示缺少必要字段

### Requirement: Markdown rendering

系统 SHALL 将文章正文的 Markdown 渲染为 HTML，支持标准 Markdown 语法（标题、列表、链接、图片、代码块、引用）。

#### Scenario: Code block with syntax highlighting

- **WHEN** 文章包含带语言标识的围栏代码块（如 `` ```js ``）
- **THEN** 渲染后的页面显示语法高亮的代码块

#### Scenario: Image in post

- **WHEN** 文章引用 `public/` 目录下的图片
- **THEN** 渲染后的页面正确显示该图片
