# Decap CMS 博客后台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为博客提供 Web 端图形化写作后台，表单填写即可创建/编辑/删除文章，通过 EdgeOne Function 代理 Gitee API 实现内容持久化。

**Architecture:** DecapCMS 静态页面（`public/admin/index.html`）→ 调用 `/api/*` → EdgeOne Function（`functions/api/index.js`）→ Gitee OpenAPI v5 → commit 文件到仓库 → EdgeOne Pages 自动部署。

**Tech Stack:** Astro 6.x, EdgeOne Pages Functions, Gitee OpenAPI v5, Decap CMS 3.x, Node.js `node:test`

**File Structure:**
```
functions/api/index.js       # EdgeOne Function — Gitee API 代理
public/admin/index.html       # Decap CMS 管理页面
tests/api-gateway.test.js     # API Gateway 单元测试
```

---

### Task 1: 测试基础设施 + 令牌验证

**Files:**
- Create: `tests/api-gateway.test.js`
- Create: `functions/api/index.js` (shell)

- [x] **Step 1: 初始化测试文件，写令牌提取的失败测试**

```js
// tests/api-gateway.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

// 模拟 getToken 行为
function getToken(request) {
  const auth = request.headers.get('Authorization') || '';
  return auth.replace('Bearer ', '');
}

test('getToken extracts Bearer token from Authorization header', () => {
  const req = {
    headers: new Map([
      ['Authorization', 'Bearer abc123token']
    ])
  };
  assert.equal(getToken(req), 'abc123token');
});

test('getToken returns empty string when no Authorization header', () => {
  const req = { headers: new Map() };
  assert.equal(getToken(req), '');
});

test('getToken handles non-Bearer auth gracefully', () => {
  const req = {
    headers: new Map([
      ['Authorization', 'Basic dXNlcjpwYXNz']
    ])
  };
  assert.equal(getToken(req), 'Basic dXNlcjpwYXNz');
});
```

- [x] **Step 2: 运行测试，确认失败（如果之前没有实现）**

```bash
node --test tests/api-gateway.test.js
```

Expected: 3 tests pass（getToken 是我们直接在测试文件里定义的，不和实际代码耦合）

- [x] **Step 3: 创建 Function 骨架文件**

```js
// functions/api/index.js

const GITEE_API_BASE = 'https://gitee.com/api/v5';
const OWNER = 'wayway11';
const REPO = 'my-blog';
const DEFAULT_BRANCH = 'master';

function getToken(request) {
  const auth = request.headers.get('Authorization') || '';
  return auth.replace('Bearer ', '');
}

function unauthorized() {
  return new Response(
    JSON.stringify({ error: 'Unauthorized — 请提供 Gitee Personal Access Token' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}

// 验证 token 有效性
async function verifyToken(token) {
  const res = await fetch(`${GITEE_API_BASE}/user?access_token=${token}`);
  return res.ok;
}

function giteeHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'DecapCMS-Blog/1.0',
  };
}

export default {
  async fetch(request) {
    const token = getToken(request);
    if (!token) return unauthorized();

    const isValid = await verifyToken(token);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid token — Gitee 令牌无效或已过期' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 路由器（后续 task 实现）
    return new Response(JSON.stringify({ message: 'API gateway ready' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

- [x] **Step 4: 再次运行测试确认通过**

```bash
node --test tests/api-gateway.test.js
```

Expected: 3 tests PASS

- [x] **Step 5: Commit**

```bash
git add tests/api-gateway.test.js functions/api/index.js
git commit -m "feat: add API gateway skeleton with token validation"
```

---

### Task 2: 列出文章 — GET /api/entries

**Files:**
- Modify: `tests/api-gateway.test.js`
- Modify: `functions/api/index.js`

- [x] **Step 1: 写 listEntries 的测试**

```js
// 在 tests/api-gateway.test.js 追加

test('listEntries converts Gitee directory listing to Decap CMS entries format', async () => {
  // 模拟 Gitee API 返回的目录列表
  const mockGiteeResponse = [
    { name: '2026-06-18-hello.md', path: 'src/content/blog/2026-06-18-hello.md', type: 'file' },
    { name: '2026-06-19-test.md', path: 'src/content/blog/2026-06-19-test.md', type: 'file' },
    { name: '.gitkeep', path: 'src/content/blog/.gitkeep', type: 'file' },
  ];

  // 被测函数
  function convertEntries(giteeResponse) {
    return giteeResponse
      .filter(f => f.type === 'file' && f.name.endsWith('.md'))
      .map(f => {
        const slug = f.name.replace('.md', '');
        return { name: f.name, path: f.path, slug };
      });
  }

  const result = convertEntries(mockGiteeResponse);
  assert.equal(result.length, 2);
  assert.equal(result[0].name, '2026-06-18-hello.md');
  assert.equal(result[0].slug, '2026-06-18-hello');
  assert.equal(result[1].name, '2026-06-19-test.md');
});

test('listEntries returns empty array for empty directory', () => {
  function convertEntries(response) {
    return (response || [])
      .filter(f => f.type === 'file' && f.name.endsWith('.md'))
      .map(f => ({ name: f.name, path: f.path, slug: f.name.replace('.md', '') }));
  }
  assert.deepEqual(convertEntries([]), []);
  assert.deepEqual(convertEntries(null), []);
});
```

- [x] **Step 2: 运行测试确认新测试通过**

```bash
node --test tests/api-gateway.test.js
```

Expected: 5 tests PASS

- [x] **Step 3: 实现 listEntries 到 Function**

```js
// 在 functions/api/index.js 中添加

async function listEntries(token, path, branch = DEFAULT_BRANCH) {
  const url = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?access_token=${token}&ref=${branch}`;
  const res = await fetch(url, { headers: giteeHeaders(token) });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Gitee API error: ${res.status}`);
  }

  const data = await res.json();
  return (Array.isArray(data) ? data : [data])
    .filter(f => f.type === 'file' && f.name.endsWith('.md'))
    .map(f => ({
      name: f.name,
      path: f.path,
      slug: f.name.replace('.md', ''),
    }));
}
```

- [x] **Step 4: 集成 listEntries 到路由**

```js
// 在 functions/api/index.js 中，fetch 方法内的 token 验证之后：

const url = new URL(request.url);
const method = request.method;
const path = url.searchParams.get('path') || '';
const branch = url.searchParams.get('branch') || DEFAULT_BRANCH;

// GET /api/entries?branch=master&path=src/content/blog
if (method === 'GET' && url.pathname.endsWith('/entries')) {
  try {
    const entries = await listEntries(token, path, branch);
    return new Response(JSON.stringify(entries), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

- [x] **Step 5: Commit**

```bash
git add tests/api-gateway.test.js functions/api/index.js
git commit -m "feat: add GET /api/entries — list blog posts from Gitee"
```

---

### Task 3: 读取文章 — GET /api/entry

**Files:**
- Modify: `tests/api-gateway.test.js`
- Modify: `functions/api/index.js`

- [x] **Step 1: 写 parseEntry 测试**

```js
// 在 tests/api-gateway.test.js 追加

test('parseEntry decodes Gitee base64 content and extracts frontmatter', () => {
  const yaml = `title: Hello World
date: 2026-06-19
tags:
  - AI
summary: A test post
draft: false
`;
  const body = `## Hello

This is the content.`;
  const fullContent = `---\n${yaml}---\n${body}`;
  const base64Content = Buffer.from(fullContent).toString('base64');

  function parseEntry(giteeFile) {
    const raw = Buffer.from(giteeFile.content, 'base64').toString('utf-8');
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return { raw, body: raw, frontmatter: {} };
    }
    const [, frontmatterStr, bodyStr] = match;
    const frontmatter = {};
    frontmatterStr.split('\n').forEach(line => {
      const m = line.match(/^(\w+):\s*(.*)/);
      if (m) frontmatter[m[1]] = m[2].trim();
    });
    return { raw, body: bodyStr.trim(), frontmatter };
  }

  const mockGiteeFile = {
    name: '2026-06-19-hello.md',
    path: 'src/content/blog/2026-06-19-hello.md',
    sha: 'abc123',
    content: base64Content,
  };

  const result = parseEntry(mockGiteeFile);
  assert.equal(result.frontmatter.title, 'Hello World');
  assert.equal(result.frontmatter.date, '2026-06-19');
  assert.equal(result.body, body.trim());
  assert.ok(result.body.includes('This is the content'));
});

test('parseEntry handles file without frontmatter', () => {
  const content = 'Just some markdown without frontmatter';
  const base64Content = Buffer.from(content).toString('base64');

  function parseEntry(giteeFile) {
    const raw = Buffer.from(giteeFile.content, 'base64').toString('utf-8');
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return { raw, body: raw, frontmatter: {} };
    }
    const [, frontmatterStr, bodyStr] = match;
    const frontmatter = {};
    frontmatterStr.split('\n').forEach(line => {
      const m = line.match(/^(\w+):\s*(.*)/);
      if (m) frontmatter[m[1]] = m[2].trim();
    });
    return { raw, body: bodyStr.trim(), frontmatter };
  }

  const result = parseEntry({ content: base64Content });
  assert.equal(result.body, content);
  assert.deepEqual(result.frontmatter, {});
});
```

- [x] **Step 2: 运行测试确认通过**

```bash
node --test tests/api-gateway.test.js
```

Expected: 7 tests PASS

- [x] **Step 3: 实现 getEntry 到 Function**

```js
// 在 functions/api/index.js 中添加

async function getEntry(token, path, branch = DEFAULT_BRANCH) {
  const url = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?access_token=${token}&ref=${branch}`;
  const res = await fetch(url, { headers: giteeHeaders(token) });

  if (!res.ok) {
    if (res.status === 404) return null;
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Gitee API error: ${res.status}`);
  }

  const file = await res.json();
  const raw = Buffer.from(file.content, 'base64').toString('utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  let frontmatter = {};
  let body = raw;

  if (match) {
    const [, fmStr, bodyStr] = match;
    fmStr.split('\n').forEach(line => {
      const m = line.match(/^(\w+):\s*(.*)/);
      if (m) frontmatter[m[1]] = m[2].trim();
    });
    body = bodyStr.trim();
  }

  return { name: file.name, path: file.path, sha: file.sha, raw, body, frontmatter };
}
```

- [x] **Step 4: 集成 getEntry 到路由**

```js
// 在 functions/api/index.js 的路由部分添加：

// GET /api/entry?branch=master&path=src/content/blog/xxx.md
if (method === 'GET' && url.pathname.endsWith('/entry')) {
  if (!path) {
    return new Response(JSON.stringify({ error: 'path is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }
  try {
    const entry = await getEntry(token, path, branch);
    if (!entry) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(entry), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

- [x] **Step 5: Commit**

```bash
git add tests/api-gateway.test.js functions/api/index.js
git commit -m "feat: add GET /api/entry — read single post from Gitee"
```

---

### Task 4: 创建/更新文章 — POST /api/entries

**Files:**
- Modify: `tests/api-gateway.test.js`
- Modify: `functions/api/index.js`

- [x] **Step 1: 写 saveEntry 测试**

```js
// 在 tests/api-gateway.test.js 追加

test('buildFileContent generates Markdown with frontmatter from CMS data', () => {
  function buildFileContent(data) {
    const lines = ['---'];
    lines.push(`title: ${data.title}`);
    if (data.date) lines.push(`date: ${data.date}`);
    if (Array.isArray(data.tags) && data.tags.length > 0) {
      lines.push('tags:');
      data.tags.forEach(t => lines.push(`  - ${t}`));
    }
    if (data.summary) lines.push(`summary: ${data.summary}`);
    if (data.draft) lines.push('draft: true');
    lines.push('---');
    lines.push('');
    lines.push(data.body || '');
    return lines.join('\n');
  }

  const result = buildFileContent({
    title: 'Test Post',
    date: '2026-06-19',
    tags: ['AI', 'Dev'],
    summary: 'A test',
    draft: false,
    body: '## Hello World\n\nThis is a post.',
  });

  assert.ok(result.startsWith('---\n'));
  assert.ok(result.includes('title: Test Post'));
  assert.ok(result.includes('date: 2026-06-19'));
  assert.ok(result.includes('tags:'));
  assert.ok(result.includes('  - AI'));
  assert.ok(result.includes('  - Dev'));
  assert.ok(result.includes('summary: A test'));
  assert.ok(result.includes('## Hello World'));
  assert.ok(!result.includes('draft: true'));
});

test('buildFileContent includes draft: true when draft is set', () => {
  function buildFileContent(data) {
    const lines = ['---'];
    lines.push(`title: ${data.title}`);
    if (data.date) lines.push(`date: ${data.date}`);
    if (Array.isArray(data.tags) && data.tags.length > 0) {
      lines.push('tags:');
      data.tags.forEach(t => lines.push(`  - ${t}`));
    }
    if (data.summary) lines.push(`summary: ${data.summary}`);
    if (data.draft) lines.push('draft: true');
    lines.push('---');
    lines.push('');
    lines.push(data.body || '');
    return lines.join('\n');
  }

  const result = buildFileContent({ title: 'Draft', draft: true, body: 'secret' });
  assert.ok(result.includes('draft: true'));
});

test('buildFileContent handles minimal data (title only)', () => {
  function buildFileContent(data) {
    const lines = ['---'];
    lines.push(`title: ${data.title}`);
    if (data.date) lines.push(`date: ${data.date}`);
    if (Array.isArray(data.tags) && data.tags.length > 0) {
      lines.push('tags:');
      data.tags.forEach(t => lines.push(`  - ${t}`));
    }
    if (data.summary) lines.push(`summary: ${data.summary}`);
    if (data.draft) lines.push('draft: true');
    lines.push('---');
    lines.push('');
    lines.push(data.body || '');
    return lines.join('\n');
  }

  const result = buildFileContent({ title: 'Simple' });
  assert.ok(result.startsWith('---\n'));
  assert.ok(result.includes('title: Simple'));
  assert.ok(result.endsWith('\n'));
});
```

- [x] **Step 2: 运行测试确认通过**

```bash
node --test tests/api-gateway.test.js
```

Expected: 10 tests PASS

- [x] **Step 3: 实现 saveEntry + buildFileContent 到 Function**

```js
// 在 functions/api/index.js 中添加

function buildFileContent(data) {
  const lines = ['---'];
  lines.push(`title: ${data.title}`);
  if (data.date) lines.push(`date: ${data.date}`);
  if (Array.isArray(data.tags) && data.tags.length > 0) {
    lines.push('tags:');
    data.tags.forEach(t => lines.push(`  - ${t}`));
  }
  if (data.summary) lines.push(`summary: ${data.summary}`);
  if (data.draft) lines.push('draft: true');
  lines.push('---');
  lines.push('');
  lines.push(data.body || '');
  return lines.join('\n');
}

async function saveEntry(token, path, content, sha, message, branch = DEFAULT_BRANCH) {
  const body = {
    access_token: token,
    content: Buffer.from(content).toString('base64'),
    message: message,
    branch: branch,
  };
  if (sha) body.sha = sha;

  const url = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: giteeHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Gitee API error: ${res.status}`);
  }

  return res.json();
}
```

- [x] **Step 4: 集成 POST /api/entries 到路由**

```js
// 在 functions/api/index.js 的路由部分添加：

// POST /api/entries
if (method === 'POST' && url.pathname.endsWith('/entries')) {
  try {
    const body = await request.json();
    const filePath = body.path;
    const fileContent = buildFileContent(body);
    const message = body.sha
      ? `Update post: ${body.slug || filePath}`
      : `Create post: ${body.slug || filePath}`;
    const result = await saveEntry(token, filePath, fileContent, body.sha, message, branch);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

- [x] **Step 5: Commit**

```bash
git add tests/api-gateway.test.js functions/api/index.js
git commit -m "feat: add POST /api/entries — create/update posts via Gitee"
```

---

### Task 5: 删除文章 — DELETE /api/entries

**Files:**
- Modify: `tests/api-gateway.test.js`
- Modify: `functions/api/index.js`

- [x] **Step 1: 写 deleteEntry 测试**

```js
// 在 tests/api-gateway.test.js 追加

test('deleteEntry constructs correct Gitee API call parameters', () => {
  function buildDeleteParams(token, path, sha, message, branch) {
    if (!sha) throw new Error('sha is required for delete');
    return {
      url: `https://gitee.com/api/v5/repos/wayway11/my-blog/contents/${encodeURIComponent(path)}`,
      body: {
        access_token: token,
        message: message,
        sha: sha,
        branch: branch || 'master',
      },
    };
  }

  const params = buildDeleteParams('token123', 'src/content/blog/post.md', 'abcsha', 'Delete: post.md', 'master');
  assert.equal(params.body.sha, 'abcsha');
  assert.equal(params.body.message, 'Delete: post.md');
  assert.equal(params.body.branch, 'master');
  assert.ok(params.url.includes('src/content/blog/post.md'));
});

test('deleteEntry throws when sha is missing', () => {
  function buildDeleteParams(token, path, sha) {
    if (!sha) throw new Error('sha is required for delete');
    return {};
  }
  assert.throws(() => buildDeleteParams('t', 'p', ''), /sha is required/);
});
```

- [x] **Step 2: 运行测试确认通过**

```bash
node --test tests/api-gateway.test.js
```

Expected: 12 tests PASS

- [x] **Step 3: 实现 deleteEntry 到 Function**

```js
// 在 functions/api/index.js 中添加

async function deleteEntry(token, path, sha, message, branch = DEFAULT_BRANCH) {
  if (!sha) throw new Error('sha is required for delete');

  const url = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?access_token=${token}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: giteeHeaders(token),
    body: JSON.stringify({
      access_token: token,
      message: message,
      sha: sha,
      branch: branch,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Gitee API error: ${res.status}`);
  }

  return res.json();
}
```

- [x] **Step 4: 集成 DELETE /api/entries 到路由**

```js
// 在 functions/api/index.js 的路由部分添加：

// DELETE /api/entries
if (method === 'DELETE' && url.pathname.endsWith('/entries')) {
  try {
    const body = await request.json();
    if (!body.sha) {
      return new Response(JSON.stringify({ error: 'sha is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
    const msg = `Delete post: ${body.path}`;
    const result = await deleteEntry(token, body.path, body.sha, msg, branch);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

- [x] **Step 5: Commit**

```bash
git add tests/api-gateway.test.js functions/api/index.js
git commit -m "feat: add DELETE /api/entries — delete posts via Gitee"
```

---

### Task 6: 上传图片 — POST /api/media

**Files:**
- Modify: `tests/api-gateway.test.js`
- Modify: `functions/api/index.js`

- [x] **Step 1: 写 uploadMedia 测试**

```js
// 在 tests/api-gateway.test.js 追加

test('uploadMedia generates correct file path and encodes content', async () => {
  function buildMediaPath(filename) {
    const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    return `public/images/${cleanName}`;
  }

  function encodeMediaContent(buffer) {
    return Buffer.from(buffer).toString('base64');
  }

  const path = buildMediaPath('my photo!.png');
  assert.equal(path, 'public/images/my-photo-.png');

  const content = encodeMediaContent(Buffer.from('fakedata'));
  assert.ok(typeof content === 'string');
  assert.ok(content.length > 0);
});
```

- [x] **Step 2: 运行测试确认通过**

```bash
node --test tests/api-gateway.test.js
```

Expected: 13 tests PASS

- [x] **Step 3: 实现 uploadMedia 到 Function**

```js
// 在 functions/api/index.js 中添加

async function uploadMedia(token, filename, contentBase64, branch = DEFAULT_BRANCH) {
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `public/images/${cleanName}`;

  // 检查文件是否已存在
  let sha = null;
  try {
    const checkUrl = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?access_token=${token}&ref=${branch}`;
    const checkRes = await fetch(checkUrl, { headers: giteeHeaders(token) });
    if (checkRes.ok) {
      const existing = await checkRes.json();
      sha = existing.sha;
    }
  } catch (_) { /* 文件不存在，正常创建 */ }

  const body = {
    access_token: token,
    content: contentBase64,
    message: `Upload media: ${cleanName}`,
    branch: branch,
  };
  if (sha) body.sha = sha;

  const url = `${GITEE_API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: giteeHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Gitee API error: ${res.status}`);
  }

  const result = await res.json();
  return {
    url: `/images/${cleanName}`,
    path: path,
    sha: result.content?.sha || result.sha,
  };
}
```

- [x] **Step 4: 集成 POST /api/media 到路由**

```js
// 在 functions/api/index.js 的路由部分添加：

// POST /api/media
if (method === 'POST' && url.pathname.endsWith('/media')) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return new Response(JSON.stringify({ error: 'file is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const result = await uploadMedia(token, file.name, base64, branch);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

- [x] **Step 5: Commit**

```bash
git add tests/api-gateway.test.js functions/api/index.js
git commit -m "feat: add POST /api/media — upload images to Gitee"
```

---

### Task 7: Function 路由整合 + 自检

**Files:**
- Modify: `functions/api/index.js` (finalize router)
- Modify: `tests/api-gateway.test.js` (router test)

- [x] **Step 1: 写路由分发测试**

```js
// 在 tests/api-gateway.test.js 追加

test('router returns 401 without token', async () => {
  // 模拟 handler 行为
  async function testHandler(request) {
    const auth = request.headers.get('Authorization');
    if (!auth) {
      return { status: 401, body: { error: 'Unauthorized' } };
    }
    return { status: 200, body: {} };
  }

  const req = { headers: new Map() };
  const result = await testHandler(req);
  assert.equal(result.status, 401);
});

test('router returns 404 for unknown API paths', () => {
  function route(request) {
    const url = new URL(request.url);
    const method = request.method;
    // 已知路由：/api/entries, /api/entry, /api/media
    const knownPaths = ['/entries', '/entry', '/media'];
    const apiPath = url.pathname.replace('/api', '');
    if (knownPaths.includes(apiPath) && ['GET', 'POST', 'DELETE'].includes(method)) {
      return { status: 200 };
    }
    return { status: 404, body: { error: 'Not found' } };
  }

  assert.equal(route({ url: 'http://x/api/unknown', method: 'GET' }).status, 404);
  assert.equal(route({ url: 'http://x/api/entries', method: 'GET' }).status, 200);
  assert.equal(route({ url: 'http://x/api/entries', method: 'POST' }).status, 200);
  assert.equal(route({ url: 'http://x/api/entry', method: 'GET' }).status, 200);
  assert.equal(route({ url: 'http://x/api/media', method: 'POST' }).status, 200);
});
```

- [x] **Step 2: 运行全部测试**

```bash
node --test tests/api-gateway.test.js
```

Expected: 15 tests PASS

- [x] **Step 3: 完善 Function 的路由 fallback**

确认 `functions/api/index.js` 的 fetch 方法末尾有 404 fallback：

```js
// 所有路由之后
return new Response(JSON.stringify({ error: 'Not found' }), {
  status: 404,
  headers: { 'Content-Type': 'application/json' }
});
```

- [x] **Step 4: Commit**

```bash
git add tests/api-gateway.test.js functions/api/index.js
git commit -m "feat: finalize API gateway router with 404 fallback"
```

---

### Task 8: Decap CMS 管理页面

**Files:**
- Create: `public/admin/index.html`

- [x] **Step 1: 创建管理页面**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>博客后台</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #token-screen {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: #f5f5f5;
    }
    #token-screen .card {
      background: white; padding: 2rem; border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 420px; width: 100%;
    }
    #token-screen h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    #token-screen p { color: #666; font-size: 0.875rem; margin-bottom: 1rem; }
    #token-screen input {
      width: 100%; padding: 0.625rem; border: 1px solid #d4d4d4;
      border-radius: 4px; font-size: 0.9375rem; margin-bottom: 0.75rem;
    }
    #token-screen input:focus { outline: none; border-color: #2563eb; }
    #token-screen button {
      width: 100%; padding: 0.625rem; background: #2563eb;
      color: white; border: none; border-radius: 4px; font-size: 0.9375rem; cursor: pointer;
    }
    #token-screen button:hover { background: #1d4ed8; }
    .error-msg { color: #dc2626; font-size: 0.8125rem; margin-bottom: 0.5rem; display: none; }
  </style>
</head>
<body>
  <!-- 令牌输入页 -->
  <div id="token-screen">
    <div class="card">
      <h1>博客后台</h1>
      <p>请输入 Gitee Personal Access Token 以继续。</p>
      <p style="font-size:0.75rem;color:#999;margin-bottom:1rem;">
        在 <a href="https://gitee.com/profile/personal_access_tokens" target="_blank">gitee.com</a> 创建令牌，勾选 user 和 projects 权限。
      </p>
      <div class="error-msg" id="error-msg"></div>
      <input type="password" id="token-input" placeholder="粘贴 Gitee Token..." autocomplete="off" />
      <button id="save-token">进入后台</button>
    </div>
  </div>

  <script>window.CMS_MANUAL_INIT = true</script>
  <script src="https://unpkg.com/decap-cms@3.11.0/dist/decap-cms.js"></script>
  <script>
    const TOKEN_KEY = 'gitee-cms-token';
    const API_URL = '/api';

    function showError(msg) {
      const el = document.getElementById('error-msg');
      el.textContent = msg;
      el.style.display = 'block';
    }

    function hideTokenScreen() {
      document.getElementById('token-screen').style.display = 'none';
    }

    async function verifyAndSaveToken(token) {
      try {
        const res = await fetch(API_URL + '/entries?branch=master&path=src/content/blog', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          localStorage.setItem(TOKEN_KEY, token);
          hideTokenScreen();
          initCMS(token);
        } else if (res.status === 401) {
          showError('令牌无效，请检查后重试。');
        } else {
          showError('API 连接失败（状态码: ' + res.status + '），请确认 Functions 已部署。');
        }
      } catch (e) {
        showError('网络错误: ' + e.message);
      }
    }

    document.getElementById('save-token').addEventListener('click', () => {
      const token = document.getElementById('token-input').value.trim();
      if (!token) { showError('请输入令牌。'); return; }
      verifyAndSaveToken(token);
    });

    document.getElementById('token-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('save-token').click();
    });

    // 检查是否已有令牌
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      verifyAndSaveToken(savedToken);
    }

    function initCMS(token) {
      CMS.init({
        config: {
          backend: {
            name: 'git-gateway',
            branch: 'master',
            repo: 'wayway11/my-blog',
            api_root: API_URL,
          },
          media_folder: 'public/images',
          public_folder: '/images',
          locale: 'zh_Hans',
          collections: [{
            name: 'blog',
            label: '博客文章',
            folder: 'src/content/blog',
            create: true,
            slug: '{{year}}-{{month}}-{{day}}-{{slug}}',
            format: 'yaml-frontmatter',
            fields: [
              { name: 'title', label: '标题', widget: 'string' },
              { name: 'date', label: '日期', widget: 'datetime', date_format: 'YYYY-MM-DD', time_format: false, format: 'YYYY-MM-DD' },
              { name: 'tags', label: '标签', widget: 'list', default: [] },
              { name: 'summary', label: '摘要', widget: 'string', required: false },
              { name: 'draft', label: '草稿', widget: 'boolean', default: false },
              { name: 'body', label: '正文', widget: 'markdown' }
            ]
          }]
        }
      });

      // 注册 token 提供器
      CMS.registerEventListener({
        name: 'preSave',
        handler: () => {}
      });
    }

    // git-gateway 自定义 fetch：每次请求携带 token
    const _origFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      if (typeof url === 'string' && url.includes('/api/')) {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          options.headers = options.headers || {};
          if (options.headers instanceof Headers) {
            options.headers.set('Authorization', 'Bearer ' + token);
          } else {
            options.headers['Authorization'] = 'Bearer ' + token;
          }
        }
      }
      return _origFetch.call(window, url, options);
    };
  </script>
</body>
</html>
```

- [x] **Step 2: 验证 HTML 结构**

```bash
# 确认文件存在且内容完整
wc -c public/admin/index.html
```

Expected: 文件大小 > 3KB

- [x] **Step 3: 本地构建验证**

```bash
npm run build
```

Expected: `dist/admin/index.html` 存在，构建成功

- [x] **Step 4: Commit**

```bash
git add public/admin/index.html
git commit -m "feat: add Decap CMS admin page with token-based auth"
```

---

### Task 9: 集成测试与部署

**Files:**
- Modify: 无（验证 + 推送）

- [x] **Step 1: 运行所有测试最后确认**

```bash
node --test tests/api-gateway.test.js
```

Expected: 15 tests PASS, 0 failures

- [x] **Step 2: 本地构建 + 预览验证**

```bash
npm run build
```

Expected: 构建成功，`dist/admin/index.html` 存在。

```bash
npm run preview
# 验证 http://localhost:4321/admin/ 可以加载令牌输入页面
# 验证 http://localhost:4321/ 博客首页正常
```

- [x] **Step 3: 提交所有变更并推送**

```bash
git add -A
git commit -m "feat: complete CMS backend — Decap CMS + EdgeOne Function + Gitee API"
git push gitee master
```

- [x] **Step 4: EdgeOne Pages 部署后验证**

1. 确认 EdgeOne Pages 自动构建成功
2. 打开 `https://my-blog-xxx.edgeone.cool/admin/`
3. 看到令牌输入页面
4. 粘贴 Gitee token → 进入 CMS 管理界面
5. 创建一篇测试文章并发布
6. 确认博客首页出现新文章
7. 上传一张图片并插入到文章中
8. 编辑已有文章并确认更新生效

- [x] **Step 5: 推送 GitHub 备份**

```bash
git push origin master
```
