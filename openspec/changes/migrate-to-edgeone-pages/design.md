## Context

当前博客是一个 Astro 纯静态站点，部署在 Vercel 上。由于 Vercel 的域名和 IP 在国内被 GFW 封锁，国内访客无法访问。需要将部署目标切换到国内可访问的 EdgeOne Pages。

EdgeOne Pages 是腾讯云推出的静态网站托管服务，与 Vercel/Cloudflare Pages 功能类似：
- 支持连接 GitHub 仓库，git push 自动触发构建部署
- 内置全球 CDN，国内节点加速效果显著
- 提供免费 SSL 证书和自定义域名绑定
- 免费额度包含每月一定的构建次数和带宽

## Goals / Non-Goals

**Goals:**
- 将部署目标从 Vercel 切换到 EdgeOne Pages
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

### EdgeOne Pages 配置方式

EdgeOne Pages 通过控制台（或 `wrangler` 风格的 CLI）配置项目，无需在代码仓库中放置平台配置文件（如 `vercel.json`）。EdgeOne Pages 会自动识别 Astro 项目框架。

### 自定义域名配置

通过 EdgeOne Pages 控制台绑定自定义域名，平台自动提供 SSL 证书（Let's Encrypt）。DNS 需在域名服务商处添加 CNAME 记录指向 EdgeOne Pages 提供的域名。

**域名备案注意事项**: 如果域名要使用国内 CDN 节点，域名必须完成 ICP 备案。备案流程由域名注册商（如腾讯云、阿里云）提供，个人博客选择「个人网站」类型。

## Risks / Trade-offs

- **域名备案周期** → 备案通常需要 7-20 天，期间可以使用 EdgeOne Pages 提供的默认域名（`*.edgeone.app`）访问，该域名在国内基本可访问
- **EdgeOne Pages 稳定性** → 相比 Vercel 成熟度稍低，但基础静态托管功能稳定，免费额度对个人博客足够
- **GitHub 连接国内不稳定** → EdgeOne Pages 连接 GitHub 仓库可能受 GitHub 国内访问影响。如遇问题，可改用 Gitee 仓库作为镜像或使用 EdgeOne Pages 的 CLI/直接上传方式部署
- **海外访问速度** → EdgeOne 有海外 CDN 节点，海外访问速度会略有下降但仍然可用（相比 Vercel 的海外访问会稍慢一些，但差距不大）

## Migration Plan

1. 修改 `astro.config.mjs`，移除 `@astrojs/vercel` 适配器
2. 卸载 `@astrojs/vercel` 依赖
3. 删除 `vercel.json`（不再需要）
4. 本地构建验证 `npm run build` 正常
5. 在 EdgeOne Pages 控制台创建项目，连接 GitHub 仓库
6. 配置构建参数（构建命令 `npm run build`，输出目录 `dist/`）
7. （可选）绑定自定义域名，配置 DNS
8. 测试自动部署：修改一篇文章 → git push → 验证 EdgeOne Pages 自动构建部署
9. 验证国内访问：从国内网络访问 EdgeOne Pages 提供的域名
10. Vercel 项目可以保留或删除（建议确认新部署稳定后再删除）

## Open Questions

- 是否需要保留 Vercel 部署作为备份？（建议：确认 EdgeOne 稳定运行一周后再决定）
- 是否已有域名和备案？（如没有，需先准备）
