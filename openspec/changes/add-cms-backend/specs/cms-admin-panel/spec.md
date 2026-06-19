## ADDED Requirements

### Requirement: Admin page access

系统 SHALL 在 `/admin/` 路径下提供 Decap CMS 管理页面，作为静态 HTML 页面通过 Astro 的 `public/` 目录直接提供。

#### Scenario: User opens admin page

- **WHEN** 用户访问 `/admin/`
- **THEN** 浏览器显示 Decap CMS 写作界面，包含文章列表、编辑器、媒体管理等模块

#### Scenario: Admin page does not affect blog

- **WHEN** 用户访问博客主站（`/`、`/posts/*` 等）
- **THEN** 管理页面不出现任何 CMS 相关的 UI 元素或脚本

### Requirement: Blog post collection in CMS

CMS SHALL 配置 `blog` collection，对应 `src/content/blog/` 目录，文件命名格式为 `{{year}}-{{month}}-{{day}}-{{slug}}.md`。

#### Scenario: CMS displays existing posts

- **WHEN** CMS 从 Gitee API 加载文章列表
- **THEN** 编辑器左侧显示所有已发布的文章和草稿

#### Scenario: CMS creates new post

- **WHEN** 用户点击「新建文章」并填写表单（标题、正文等）
- **THEN** CMS 自动生成符合命名规范的文件名和 frontmatter，通过 Gitee API 提交到仓库

### Requirement: Post editing fields

每篇文章的编辑表单 SHALL 包含以下字段：标题（必填 string）、日期（必填 datetime，仅日期部分）、标签（可选 list）、摘要（可选 string）、草稿（boolean，默认不勾选）、正文（markdown）。

#### Scenario: User creates a post with all fields

- **WHEN** 用户填写标题、选择日期、添加标签和摘要、取消草稿勾选、写入正文后点击发布
- **THEN** 生成的 Markdown 文件 frontmatter 包含所有对应字段

#### Scenario: User sets post as draft

- **WHEN** 用户在编辑器中勾选「草稿」
- **THEN** 生成的 Markdown 文件 frontmatter 中 `draft: true`

### Requirement: Image upload

CMS SHALL 支持通过媒体管理器上传图片，图片存储到 `public/images/` 目录。

#### Scenario: User uploads an image

- **WHEN** 用户在编辑器中拖拽或选择一张图片上传
- **THEN** 图片被上传到 Gitee 仓库的 `public/images/` 目录，编辑器中可以引用该图片

### Requirement: Token-based authentication

CMS 登录界面 SHALL 使用 Gitee 个人访问令牌（Personal Access Token）进行鉴权，无需 OAuth 流程。

#### Scenario: User enters valid token

- **WHEN** 用户在 CMS 登录界面输入有效的 Gitee token
- **THEN** CMS 保存令牌到浏览器 localStorage，进入文章管理界面

#### Scenario: User enters invalid token

- **WHEN** 用户输入无效的令牌
- **THEN** CMS 显示认证失败提示，不允许进入管理界面

#### Scenario: Token persisted across sessions

- **WHEN** 用户之前已输入令牌，再次打开 `/admin/`
- **THEN** CMS 自动使用 localStorage 中的令牌，无需重新输入
