## Context

博客已从 Vercel 迁移到 EdgeOne Pages，代码仓库从 GitHub 迁移到 Gitee。当前写作流程是手动创建 Markdown 文件并 git push，门槛高。需要在浏览器端提供图形化写作界面。

EdgeOne Pages 支持 Edge Functions（Serverless），可以在代码仓库的 `functions/` 目录放置函数代码，部署后作为 API 端点运行。

Decap CMS（原 Netlify CMS）是一个纯前端 CMS，通过 `git-gateway` 后端协议与 Git 仓库交互。它原生支持 GitHub/GitLab，但不支持 Gitee。因此需要一个适配层——用 EdgeOne Function 实现 Gitee 的 `git-gateway` 协议。

## Goals / Non-Goals

**Goals:**
- 提供 Web 图形化界面，表单填写即可创建/编辑/删除文章
- 文章自动生成正确的 frontmatter（标题、日期、标签、摘要、草稿状态）
- 支持图片上传，自动存入 `public/images/`
- 使用 Gitee API 读写仓库文件，commit 后 EdgeOne Pages 自动部署
- 单用户模式：令牌存储在浏览器，无需 OAuth 登录流程

**Non-Goals:**
- 不实现多用户/协作功能
- 不修改博客本身的页面、样式或构建配置
- 不做草稿的在线预览（依靠 draft 字段控制发布）
- 不替换现有的 git push 工作流（两种写作方式共存）

## Decisions

### API 网关：EdgeOne Function 实现 git-gateway 协议

Decap CMS 的 `git-gateway` 协议定义了以下端点：

| 方法 | 路径 | 用途 | Gitee API 映射 |
|------|------|------|---------------|
| GET | `/api/entries` | 列出目录 | `GET /api/v5/repos/{owner}/{repo}/contents/{path}` |
| GET | `/api/entry` | 读取文件 | `GET /api/v5/repos/{owner}/{repo}/contents/{path}` |
| POST | `/api/entries` | 创建/更新文件 | `POST /api/v5/repos/{owner}/{repo}/contents/{path}` |
| DELETE | `/api/entries` | 删除文件 | `DELETE /api/v5/repos/{owner}/{repo}/contents/{path}` |
| POST | `/api/media` | 上传媒体 | `POST /api/v5/repos/{owner}/{repo}/contents/{media_path}` |

EdgeOne Function 放在 `functions/api/[[catchall]].js`，匹配所有 `/api/*` 请求。

**理由**: EdgeOne Functions 与 Vercel Functions 接口类似，零额外成本。Function 只是纯转发+格式翻译，无状态，无持久化。

### 鉴权：Gitee 个人访问令牌

用户从 Gitee 生成一个 Personal Access Token（`user` scope），粘贴到 CMS 登录页面。令牌存储在浏览器 `localStorage`，每次 API 请求通过 `Authorization: token xxx` 头发送。

```js
// Decap CMS 配置
localStorage.setItem('gitee-token', '<你的令牌>');

// EdgeOne Function 读取
const token = request.headers.get('Authorization').replace('Bearer ', '');
// 调用 Gitee API
fetch(`https://gitee.com/api/v5/repos/${repo}/contents/${path}`, {
  headers: { 'Authorization': `token ${token}` }
});
```

**理由**: 简单直接，无需 OAuth App 注册和复杂的回调流程。令牌存储在用户自己的浏览器中，不经过第三方服务器。EdgeOne Function 无状态，不保存任何凭据。

**安全性**: 令牌只在浏览器和 EdgeOne Function 之间传输，Function 不存储。如果令牌泄露，在 Gitee 控制台吊销即可。

### Decap CMS 配置：inline config

配置文件直接写在 `public/admin/index.html` 的 `<script>` 标签中（inline），不单独使用 `config.yml`。这样避免多一个文件需要维护。

Collection schema 映射到现有的 Astro Content Collection 字段：

```yaml
collections:
  - name: blog
    label: 博客文章
    folder: src/content/blog
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    format: yaml-frontmatter
    fields:
      - { name: title, label: 标题, widget: string }
      - { name: date, label: 日期, widget: datetime, date_format: YYYY-MM-DD, time_format: false }
      - { name: tags, label: 标签, widget: list, default: [] }
      - { name: summary, label: 摘要, widget: string, required: false }
      - { name: draft, label: 草稿, widget: boolean, default: false }
      - { name: body, label: 正文, widget: markdown }
```

### 文件结构

```
project-root/
├── functions/
│   └── api/
│       └── [[catchall]].js    # EdgeOne Function, 代理 Gitee API
├── public/
│   └── admin/
│       └── index.html          # Decap CMS 入口页面
└── src/
    └── content/
        └── blog/               # 文章存储（不变）
```

## Risks / Trade-offs

- **Gitee API 限流** → 5000 次/小时，个人写作远不会触及
- **EdgeOne Functions 冷启动** → 首次调用可能有 1-2 秒延迟，对 CMS 后台操作影响小
- **令牌过期** → Gitee token 默认不过期，但用户可以随时吊销；令牌丢失需要重新生成粘贴
- **EdgeOne Pages Functions 功能限制** → 需确认 EdgeOne Pages 免费额度包含 Functions 调用次数。如有限制，CMS 操作频率低，应不受影响

## Open Questions

- EdgeOne Pages Functions 是否支持 `[[catchall]]` 路由格式？如果不支持，可能需要调整为固定路径或多个 functions 文件
- Gitee API 的文件内容编码方式（Base64）需要正确处理
