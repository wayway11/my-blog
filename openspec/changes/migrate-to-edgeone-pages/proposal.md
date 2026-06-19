## Why

当前博客部署在 Vercel，其域名和 IP 在国内被 GFW 封锁或严重限速，国内访客无法访问。需要将部署迁移到国内可访问的平台，同时保持 git push 自动部署的体验。

## What Changes

- 移除 `@astrojs/vercel` 适配器，切换为静态输出（无需平台适配器）
- 将代码仓库从 GitHub 迁移到 Gitee（码云），解决国内 git push 超时/失败问题
- 配置项目部署到腾讯云 EdgeOne Pages（支持 Gitee 仓库对接，push 自动构建部署）
- 配置自定义域名，绑定到 EdgeOne Pages 服务
- 国内访客通过 EdgeOne CDN 加速访问，海外访客也可正常访问

## Capabilities

### New Capabilities

- `edgeone-deploy`: 将 Astro 静态站点部署到腾讯云 EdgeOne Pages，通过 Gitee 仓库对接实现 git push 自动构建和部署，国内 CDN 加速分发
- `custom-domain`: 为博客配置自定义域名，绑定到 EdgeOne Pages 服务，国内和海外均可通过同一域名访问

### Modified Capabilities

<!-- 无现有 capability 需要修改，所有能力均为新增 -->

## Impact

- 无需修改博客代码或内容结构（Content Collections、页面组件、样式均不变）
- 替换 `@astrojs/vercel` 适配器为纯静态输出（`output: 'static'`，无需 adapter）
- 需要腾讯云账号、EdgeOne Pages 服务开通、Gitee 账号及仓库、域名及 ICP 备案
- 代码仓库从 GitHub 迁移到 Gitee（码云），解决国内访问 GitHub 不稳定的问题
- 部署目标从 vercel.com 变更为 edgeone.app（或自定义域名）
