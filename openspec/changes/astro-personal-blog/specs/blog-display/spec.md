## ADDED Requirements

### Requirement: Article list on homepage

首页 SHALL 显示所有已发布文章的列表，按日期降序排列，每篇文章显示标题、日期、标签和摘要（如有）。

#### Scenario: Visitor opens homepage

- **WHEN** 访客访问首页 `/`
- **THEN** 看到按日期从新到旧排列的文章列表，草稿文章不在其中

#### Scenario: Empty blog

- **WHEN** 没有任何已发布文章
- **THEN** 首页显示友好的空状态提示

### Requirement: Article detail page

每篇文章 SHALL 有一个独立的详情页，URL 路径为 `/posts/[slug]/`，其中 slug 为文件名去除日期前缀和 `.md` 扩展名。

#### Scenario: Visitor reads an article

- **WHEN** 访客访问 `/posts/hello-world/`
- **THEN** 看到标题、日期、标签、正文内容，页面导航可返回首页

#### Scenario: Visitor accesses non-existent article

- **WHEN** 访客访问不存在的文章路径
- **THEN** 显示 404 页面

### Requirement: Tag filtering

系统 SHALL 提供按标签筛选文章的功能。`/tags/` 页面列出所有标签及对应文章数，`/tags/[tag]/` 页面显示该标签下的所有文章。

#### Scenario: Visitor browses all tags

- **WHEN** 访客访问 `/tags/`
- **THEN** 看到所有标签列表，每个标签旁显示文章数量

#### Scenario: Visitor filters by tag

- **WHEN** 访客点击某标签或访问 `/tags/javascript/`
- **THEN** 看到所有标记为 "javascript" 的文章列表

### Requirement: Archive page

系统 SHALL 提供按时间归档的页面 `/archive/`，将文章按年/月分组显示。

#### Scenario: Visitor browses archive

- **WHEN** 访客访问 `/archive/`
- **THEN** 看到按年-月分组的文章链接列表

### Requirement: Responsive layout

所有页面 SHALL 在移动端（宽度 < 768px）和桌面端都能正常显示，文章正文字体大小适合阅读。

#### Scenario: Reading on mobile

- **WHEN** 访客在手机浏览器上打开一篇文章
- **THEN** 页面宽度适配屏幕，正文可读，无需横向滚动

#### Scenario: Reading on desktop

- **WHEN** 访客在桌面浏览器上打开一篇文章
- **THEN** 文章内容区域宽度适中（建议 65-75ch），居中显示

### Requirement: Navigation

所有页面 SHALL 包含导航栏，提供首页、标签、归档的链接入口。

#### Scenario: Visitor navigates between pages

- **WHEN** 访客在任意页面点击导航栏链接
- **THEN** 跳转到对应页面，当前页面链接在导航中有视觉区分
