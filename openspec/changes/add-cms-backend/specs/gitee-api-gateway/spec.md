## ADDED Requirements

### Requirement: API proxy endpoint

EdgeOne Function SHALL 在 `/api/*` 路径下接受 HTTP 请求，作为 Decap CMS git-gateway 协议到 Gitee OpenAPI v5 的翻译层。

#### Scenario: Request routed to function

- **WHEN** Decap CMS 发送请求到 `/api/entries?branch=master&path=src/content/blog`
- **THEN** EdgeOne Function 接收请求并调用 Gitee API 获取目录内容

### Requirement: List entries

Function SHALL 处理 `GET /api/entries` 请求，调用 Gitee API 列出指定目录下的所有 `.md` 文件，并返回 Decap CMS 兼容的 entries 数组格式。

#### Scenario: List all blog posts

- **WHEN** Function 收到 `GET /api/entries?branch=master&path=src/content/blog`
- **THEN** 返回该目录下所有 Markdown 文件的元数据列表，格式符合 Decap CMS entries 规范

#### Scenario: Empty directory

- **WHEN** 目录下没有 `.md` 文件
- **THEN** 返回空数组 `[]`

### Requirement: Read single entry

Function SHALL 处理 `GET /api/entry` 请求，读取单个 Markdown 文件的完整内容，返回 Decap CMS 兼容的 entry 格式（包含 frontmatter 解析后的字段和正文）。

#### Scenario: Read existing post

- **WHEN** Function 收到 `GET /api/entry?branch=master&path=src/content/blog/2026-06-19-hello.md`
- **THEN** 返回该文件的 frontmatter 字段和 Markdown 正文

#### Scenario: Read non-existent file

- **WHEN** 请求的文件路径不存在
- **THEN** 返回 404 错误

### Requirement: Create or update entry

Function SHALL 处理 `POST /api/entries` 请求，创建新文件或更新现有文件，调用 Gitee API `POST /api/v5/repos/{owner}/{repo}/contents/{path}`。

#### Scenario: Create new post

- **WHEN** Function 收到 POST 请求，包含新文件的路径和内容
- **THEN** 调用 Gitee API 创建文件，commit message 设置为 "Create post: <文件名>"，commit 后 EdgeOne Pages 自动部署

#### Scenario: Update existing post

- **WHEN** Function 收到 POST 请求，文件路径已存在且携带 sha 参数
- **THEN** 调用 Gitee API 更新文件，commit message 设置为 "Update post: <文件名>"

### Requirement: Delete entry

Function SHALL 处理 `DELETE /api/entries` 请求，调用 Gitee API 删除指定文件。

#### Scenario: Delete a post

- **WHEN** Function 收到 DELETE 请求，携带文件路径和 sha
- **THEN** 调用 Gitee API 删除文件，commit message 设置为 "Delete post: <文件名>"

### Requirement: Upload media

Function SHALL 处理 `POST /api/media` 请求，将图片文件上传到 Gitee 仓库的 `public/images/` 目录。

#### Scenario: Upload image

- **WHEN** Function 收到 POST 请求，包含图片文件的 Base64 编码内容
- **THEN** 图片被提交到 `public/images/<文件名>`，返回文件 URL

### Requirement: Token forwarding

Function SHALL 从请求头 `Authorization: Bearer <token>` 中提取 Gitee 令牌，并将其作为 `token` query 参数转发给 Gitee API。

#### Scenario: Token forwarded correctly

- **WHEN** Decap CMS 请求携带 `Authorization: Bearer abc123`
- **THEN** Function 调用 Gitee API 时使用 `access_token=abc123` 鉴权

#### Scenario: Missing token

- **WHEN** 请求不包含 Authorization 头
- **THEN** Function 返回 401 Unauthorized

### Requirement: Response error handling

Function SHALL 将 Gitee API 的错误响应转换为 HTTP 标准状态码。

#### Scenario: Gitee API returns error

- **WHEN** Gitee API 返回 422 或其他错误
- **THEN** Function 将错误信息格式化为 Decap CMS 可识别的格式，保留原始 HTTP 状态码
