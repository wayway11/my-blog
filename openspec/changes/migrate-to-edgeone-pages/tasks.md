# Blog 迁移至 EdgeOne Pages 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Astro 静态博客从 Vercel 迁移到腾讯云 EdgeOne Pages，使国内访客可以正常访问。

**Architecture:** 移除 `@astrojs/vercel` 适配器，改为 Astro 纯静态输出（`output: 'static'`），由 EdgeOne Pages 直接从 `dist/` 目录服务静态文件。代码改动仅限 `astro.config.mjs` 和 `package.json`，博客内容和页面组件不变。

**Tech Stack:** Astro 6.x, Node.js, npm, EdgeOne Pages

**前置条件:**
- 腾讯云账号（需实名认证）
- GitHub 仓库已包含完整博客代码
- （可选）已注册的域名，用于自定义域名绑定

---

### Task 1: 移除 Vercel 适配器

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: 修改 astro.config.mjs**

将文件内容改为：

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
```

改动说明：删除了 `import vercel from '@astrojs/vercel'` 和 `adapter: vercel(),`，其余配置不变。

- [ ] **Step 2: 运行 astro check 验证配置**

```bash
npx astro check
```

Expected: 无类型错误，正常退出。

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat: remove @astrojs/vercel adapter, switch to pure static output"
```

---

### Task 2: 卸载 @astrojs/vercel 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 卸载依赖**

```bash
npm uninstall @astrojs/vercel
```

Expected: `@astrojs/vercel` 从 `node_modules/` 和 `package.json` 的 `dependencies` 中移除。

- [ ] **Step 2: 确认 package.json 变更**

```bash
node -e "const p = require('./package.json'); console.log(JSON.stringify({deps: Object.keys(p.dependencies||{}), devDeps: Object.keys(p.devDependencies||{})}, null, 2))"
```

Expected: `deps` 中不再包含 `@astrojs/vercel`，应只有 `@astrojs/check`、`astro`、`typescript`。

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: uninstall @astrojs/vercel"
```

---

### Task 3: 删除 vercel.json

**Files:**
- Delete: `vercel.json`

- [ ] **Step 1: 删除 vercel.json**

```bash
rm vercel.json
```

- [ ] **Step 2: 确认文件已删除**

```bash
ls vercel.json 2>&1
```

Expected: `ls: cannot access 'vercel.json': No such file or directory`

- [ ] **Step 3: Commit**

```bash
git rm vercel.json
git commit -m "chore: remove vercel.json, no longer deploying to Vercel"
```

---

### Task 4: 本地构建验证

- [ ] **Step 1: 安装依赖并构建**

```bash
npm install
npm run build
```

Expected: 构建成功，输出类似：
```
12:34:56 [build] Complete! (XX files built in X.XXs)
```

- [ ] **Step 2: 检查 dist/ 输出结构**

```bash
ls dist/
```

Expected: 看到 `index.html`、`posts/`、`tags/`、`archive/`、`404.html` 等目录和文件。

- [ ] **Step 3: 本地预览验证**

```bash
npx astro preview
```

打开 `http://localhost:4321`，逐页检查：
- `/` — 首页，已发布文章列表，草稿不出现
- `/posts/<任意文章slug>/` — 文章详情，Markdown 渲染正常，代码块有语法高亮
- `/tags/` — 标签总览
- `/tags/<某标签>/` — 标签筛选
- `/archive/` — 归档页，按年-月分组
- `/nonexistent` — 404 页面

全部确认后 `Ctrl+C` 停止预览。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: verify static build output works locally"
```

---

### Task 5: EdgeOne Pages 创建项目并连接 GitHub

**Files:** 无（平台控制台操作）

- [ ] **Step 1: 开通 EdgeOne Pages 服务**

1. 浏览器打开 [https://console.cloud.tencent.com/edgeone/pages](https://console.cloud.tencent.com/edgeone/pages)
2. 使用腾讯云账号登录（如无账号先注册并完成实名认证）
3. 首次进入可能需要开通服务，点击「立即开通」

- [ ] **Step 2: 创建新项目**

1. 点击「创建项目」或「新建项目」
2. 选择「从 Git 仓库导入」
3. 授权 EdgeOne Pages 访问 GitHub 账号
4. 在仓库列表中选择当前博客仓库
5. 确认框架被自动检测为 **Astro**（如未检测到，手动选择）
6. 确认构建配置：
   - **构建命令**: `npm run build`
   - **输出目录**: `dist/`
   - **Node.js 版本**: 默认（或选 18+）
7. 点击「部署」

- [ ] **Step 3: 等待首次构建完成**

构建通常 1-3 分钟。在控制台「部署日志」中观察进度。如构建失败，检查日志中的错误信息：

常见问题：
- Node.js 版本过低 → 在项目设置中调整为 18 或 20
- 依赖安装失败 → 确认 `package.json` 中的包版本正确
- 构建命令错误 → 确认命令为 `npm run build`

- [ ] **Step 4: 获取默认域名**

构建成功后，EdgeOne Pages 会分配一个默认域名，格式类似：
```
<project-name>-<hash>.edgeone.app
```
记录这个域名，后续步骤使用。

- [ ] **Step 5: 访问默认域名验证部署**

在浏览器中打开默认域名，重复 Task 4 Step 3 的检查列表：
- `/` — 首页文章列表
- `/posts/<slug>/` — 文章详情
- `/tags/`、`/tags/<tag>/` — 标签系统
- `/archive/` — 归档
- `/nonexistent` — 404

---

### Task 6: 验证 Git Push 自动部署

**Files:**
- Modify: `src/content/blog/<某篇文章>.md`（临时测试修改）

- [ ] **Step 1: 对文章做一个小修改**

选择一篇现有文章，在正文末尾添加一行测试文字：

文件: `src/content/blog/2026-06-19-claude-code-leak.md`（选择实际存在的文章）

在正文末尾添加：
```md
<!-- 自动部署测试 - 确认后可删除此行 -->
```

- [ ] **Step 2: Commit 并 push**

```bash
git add src/content/blog/
git commit -m "test: verify EdgeOne Pages auto-deploy"
git push origin master
```

- [ ] **Step 3: 确认 EdgeOne Pages 自动触发构建**

1. 打开 EdgeOne Pages 控制台 → 项目 → 部署记录
2. 确认看到一条新的构建记录，状态为「构建中」→「部署成功」
3. 等待部署完成后，刷新博客页面，确认新内容已上线

- [ ] **Step 4: 回退测试修改**

```bash
# 编辑文章，删除刚才添加的测试行
git add src/content/blog/
git commit -m "chore: revert test change"
git push origin master
```

确认 EdgeOne Pages 再次自动部署，文章恢复原样。

---

### Task 7: 绑定自定义域名（可选）

> 如果目前没有域名或尚未备案，可先跳过此 Task。EdgeOne Pages 默认域名在国内基本可访问。

**前置条件:** 已注册域名，且已在域名服务商处管理 DNS。

- [ ] **Step 1: 在 EdgeOne Pages 添加自定义域名**

1. 进入项目 → 设置 → 域名管理
2. 点击「添加域名」
3. 输入自定义域名（如 `blog.yourdomain.com`）
4. 确认添加

- [ ] **Step 2: 获取 CNAME 目标地址**

添加域名后，EdgeOne Pages 会显示一个 CNAME 目标地址，格式类似：
```
<project-name>.edgeone.app
```
或提供一个特定的 CNAME 值。记录此值。

- [ ] **Step 3: 配置 DNS CNAME 记录**

在域名服务商（如腾讯云 DNSPod、阿里云 DNS、Cloudflare）的 DNS 管理页面：

1. 添加一条 **CNAME 记录**
2. **主机记录**: `blog`（对应 `blog.yourdomain.com`，如用根域名则填 `@`）
3. **记录类型**: `CNAME`
4. **记录值**: `<Step 2 获取的 CNAME 目标地址>`
5. **TTL**: 默认（600）
6. 保存

- [ ] **Step 4: 等待 DNS 生效并验证**

DNS 生效通常需要几分钟到几小时。

验证命令：
```bash
nslookup blog.yourdomain.com
```

Expected: 返回结果中包含 EdgeOne Pages 相关的 CNAME 记录。

然后用浏览器访问 `https://blog.yourdomain.com`，确认：
- 页面正常加载
- 浏览器地址栏显示 HTTPS 锁图标（SSL 证书正常）
- 所有页面可正常浏览

- [ ] **Step 5: （如需国内 CDN 节点）完成 ICP 备案**

如果域名尚未备案：

1. 在域名注册商（腾讯云/阿里云等）的备案系统中提交「个人网站」备案申请
2. 按指引填写信息（网站名称、用途说明等）
3. 提交后等待管局审核（通常 7-20 天）
4. 备案通过后，在 EdgeOne Pages 控制台 → 域名设置 → 启用国内加速

备案期间可使用 EdgeOne Pages 默认域名正常访问，不受影响。

---

### Task 8: 国内/海外访问验证

- [ ] **Step 1: 国内网络访问测试**

从国内网络（关闭 VPN/代理）访问：
1. EdgeOne Pages 默认域名：加载所有页面，确认首屏加载 < 5 秒
2. 自定义域名（如已配置）：同上

- [ ] **Step 2: 海外网络访问测试**

使用 VPN 切换到海外节点，或请海外朋友帮忙访问同一域名。确认：
- 所有页面正常加载
- 访问速度可接受

- [ ] **Step 3: 移动端访问测试**

用手机浏览器（国内网络）打开博客：
- 确认移动端排版正常（响应式布局生效）
- 文章阅读体验良好
- 导航栏链接可点击

---

### Task 9: 收尾清理

- [ ] **Step 1: 删除 Vercel 项目（等新部署稳定一周后）**

确认 EdgeOne Pages 稳定运行至少一周、自动部署正常后：

1. 打开 [vercel.com](https://vercel.com) 控制台
2. 找到该博客项目
3. 项目设置 → Delete Project
4. 确认删除

> 也可以仅停止 Vercel 的自动部署（Disconnect Git），保留项目作为历史。

- [ ] **Step 2: 更新 README（如存在）**

如果项目有 README.md，更新部署相关描述：

```markdown
## 部署

本博客使用 [EdgeOne Pages](https://edgeone.ai/products/pages) 部署，git push 到 master 分支后自动构建发布。

- 构建命令: `npm run build`
- 输出目录: `dist/`
- 框架: Astro (Static)
```

- [ ] **Step 3: 最终 Commit**

```bash
git add README.md
git commit -m "docs: update README with EdgeOne Pages deployment info"
git push origin master
```
