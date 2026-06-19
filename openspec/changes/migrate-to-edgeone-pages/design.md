## Context

当前博客是一个 Astro 纯静态站点，部署在 Vercel 上。由于 Vercel 的域名和 IP 在国内被 GFW 封锁，国内访客无法访问。需要将部署目标切换到国内可访问的 EdgeOne Pages。

EdgeOne Pages 是腾讯云推出的静态网站托管服务，与 Vercel/Cloudflare Pages 功能类似：
- 支持连接 Gitee/GitHub 仓库，git push 自动触发构建部署
- 内置全球 CDN，国内节点加速效果显著
- 提供免费 SSL 证书和自定义域名绑定
- 免费额度包含每月一定的构建次数和带宽
- Gitee 仓库对接国内访问稳定，解决了 GitHub 在国内不稳定的问题

## Goals / Non-Goals

**Goals:**
- 将部署目标从 Vercel 切换到 EdgeOne Pages
- 将代码仓库从 GitHub 迁移到 Gitee，确保国内 git push 稳定
- 国内访客可以正常快速访问博客
- 保持 git push 自动部署的开发体验
- 自定义域名绑定，保证品牌一致性
- 海外访客也能正常访问

**Non-Goals:**
- 不会保留 Vercel 作为备用部署（避免维护两套部署）
- 不改造博客本身的代码和内容结构
- 不做双线部署（以后有需要可以加）

## Decisions

### 移除 Vercel 适配器，改为纯静态输出

当前 `astro.config.mjs` 使用 `@astrojs/vercel` 适配器。EdgeOne Pages 不需要特定框架适配器，直接使用 Astro 的静态输出模式即可。

```js
// 之前
import vercel from '@astrojs/vercel';
export default defineConfig({
  output: 'static',
  adapter: vercel(),
});

// 之后
export default defineConfig({
  output: 'static',
  // 无需 adapter，EdgeOne Pages 直接服务 dist/ 目录
});
```

**理由**: EdgeOne Pages 支持任意静态站点，不需要特定框架适配器。移除 `@astrojs/vercel` 减少了不必要的依赖。

### 构建输出目录保持 `dist/`

Astro 默认构建输出为 `dist/`，EdgeOne Pages 支持配置输出目录，保持一致即可。

### 构建命令不变

`npm run build` 即可生成完整静态站点，EdgeOne Pages 默认执行此命令。

### 环境变量直接迁移

EdgeOne Pages 支持在控制台配置环境变量，与 Vercel 体验一致。当前项目无特殊环境变量，如有后续可随时添加。

### 代码仓库：Gitee 替代 GitHub

当前代码托管在 GitHub。由于 GitHub 在国内访问不稳定（push 超时、页面加载慢），将代码仓库迁移到 Gitee（码云）。

**理由**: Gitee 是国内服务，push/pull 速度快且稳定。EdgeOne Pages 原生支持 Gitee 仓库对接，体验与 GitHub 一致。

**仓库迁移方式**:
1. 在 Gitee 创建新仓库
2. 添加 Gitee 为第二个 remote，push 代码
3. GitHub 仓库保留作为海外备份（可选），或直接删除
4. EdgeOne Pages 对接 Gitee 仓库

### EdgeOne Pages 配置方式

EdgeOne Pages 通过控制台（或 `wrangler` 风格的 CLI）配置项目，无需在代码仓库中放置平台配置文件（如 `vercel.json`）。EdgeOne Pages 会自动识别 Astro 项目框架。

### 自定义域名配置

通过 EdgeOne Pages 控制台绑定自定义域名，平台自动提供 SSL 证书（Let's Encrypt）。DNS 需在域名服务商处添加 CNAME 记录指向 EdgeOne Pages 提供的域名。

**域名备案注意事项**: 如果域名要使用国内 CDN 节点，域名必须完成 ICP 备案。备案流程由域名注册商（如腾讯云、阿里云）提供，个人博客选择「个人网站」类型。

## Risks / Trade-offs

- **域名备案周期** → 备案通常需要 7-20 天，期间可以使用 EdgeOne Pages 提供的默认域名（`*.edgeone.app`）访问，该域名在国内基本可访问
- **EdgeOne Pages 稳定性** → 相比 Vercel 成熟度稍低，但基础静态托管功能稳定，免费额度对个人博客足够
- **Gitee Pages 审核机制** → Gitee Pages 需要实名认证且发布需审核。但 EdgeOne Pages 连接 Gitee 仓库走的不是 Gitee Pages 服务，而是直接读取仓库代码自行构建，绕过 Gitee Pages 限制
- **海外访问速度** → EdgeOne 有海外 CDN 节点，海外访问速度会略有下降但仍然可用（相比 Vercel 的海外访问会稍慢一些，但差距不大）

## Migration Plan

1. ~~修改 `astro.config.mjs`，移除 `@astrojs/vercel` 适配器~~ ✅
2. ~~卸载 `@astrojs/vercel` 依赖~~ ✅
3. ~~删除 `vercel.json`~~ ✅
4. ~~本地构建验证~~ ✅
5. 在 Gitee 创建仓库，将代码推送到 Gitee
6. 在 EdgeOne Pages 控制台创建项目，连接 Gitee 仓库
7. 配置构建参数（构建命令 `npm run build`，输出目录 `dist/`）
8. （可选）绑定自定义域名，配置 DNS
9. 测试自动部署：修改一篇文章 → git push gitee → 验证 EdgeOne Pages 自动构建部署
10. 验证国内访问：从国内网络访问 EdgeOne Pages 提供的域名
11. Vercel 项目可以保留或删除（建议确认新部署稳定后再删除）

## Open Questions

- 是否需要保留 Vercel 部署作为备份？（建议：确认 EdgeOne 稳定运行一周后再决定）
- 是否需要保留 GitHub 仓库作为海外备份？（建议：保留，添加 Gitee 为主 remote 同时推两个平台）
- 是否已有域名和备案？（如没有，需先准备）
