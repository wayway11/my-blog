## Why

当前写博客需要手动创建 Markdown 文件、手写 frontmatter 元数据、手动 git 操作，门槛太高。需要 Web 端的图形化写作界面——填表单即可发布文章，无需接触 Markdown 格式细节。

## What Changes

- 新增 `public/admin/index.html` 作为博客管理后台入口，使用 Decap CMS
- 新增 EdgeOne Function（`functions/api.js`）作为 API 网关，将 Decap CMS 的请求翻译为 Gitee API 调用
- 管理后台支持创建、编辑、删除文章，表单填写标题/日期/标签/摘要/正文
- 管理后台支持上传图片到 `public/images/`
- 使用 Gitee 个人访问令牌（Personal Access Token）鉴权，令牌存储在浏览器 localStorage

## Capabilities

### New Capabilities

- `cms-admin-panel`: Decap CMS 静态管理页面，在 `/admin/` 路径下提供服务，提供文章 CRUD 和图片上传的图形化界面
- `gitee-api-gateway`: EdgeOne Function 实现 API 代理，将 Decap CMS 的 git-gateway 请求翻译为 Gitee OpenAPI v5 调用，支持文章和媒体文件读写

### Modified Capabilities

无

## Impact

- 新增文件：`public/admin/index.html`、`functions/api.js`（或 `functions/api.ts`）
- 无现有文件修改（博客页面、构建配置均不变）
- 依赖 EdgeOne Pages Functions（需在控制台开启）
- 依赖 Gitee 个人访问令牌（用户自行生成）
- Gitee API 调用频率限制：5000 次/小时（个人使用绰绰有余）
