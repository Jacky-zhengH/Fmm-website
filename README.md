# Midnight Letters｜深夜来信

一个用来收藏纪念信的静态网站。首页 `/` 是纪念档案，`/memories/nemu-200/` 是芙眠眠 Nemu 的 200 天特辑。特辑于北京时间 2026 年 11 月 28 日 00:00 自动解封。

## 本地运行

推荐 Node.js 22 LTS（22.12 或以上）。在 `fmm-website` 目录运行以下命令。若 PowerShell 禁用 npm 脚本，使用 `npm.cmd` 替换 `npm`。

```powershell
npm ci
npm run dev
```

- [纪念档案](http://127.0.0.1:5173/)
- [Nemu · 200 Days](http://127.0.0.1:5173/memories/nemu-200/)
- [从零点前五秒开始预览](http://127.0.0.1:5173/memories/nemu-200/?at=2026-11-27T23%3A59%3A55%2B08%3A00)
- [直接预览零点后的信封](http://127.0.0.1:5173/memories/nemu-200/?at=2026-11-28T00%3A00%3A01%2B08%3A00)

模拟从 URL 指定的北京时间开始按实际经过时间推进。生产构建忽略 `at`。用 `npm run build` 检查类型并生成 `dist/`，然后用 `npm run preview` 预览生产产物。两条路径都有自己的 HTML，适合直接访问和刷新。

## 替换信件、图片和音乐

内容集中在 `public/memories/nemu-200/`。

| 路径 | 用途 |
| --- | --- |
| `letter.md` | 用 `## 章节名` 划分各章，段落之间空一行。标题须与配置中的 `title` 一致。 |
| `config.json` | 编辑 `recipient`、`days`、`unlockAt`、`displayDate`、`subtitle`、`signature`、章节顺序、音乐及海报。`unlockAt` 保持带时区的 ISO 时间。正式内容齐备后将 `draft` 改为 `false`。 |
| `images/` | 放 Fmm 立绘、截图和图像。推荐透明 PNG 或 WebP。章节可选 `image`、`imageAlt`、`background`。图片路径如 `images/portrait.webp`，背景也可填 CSS 颜色。 |
| `music/` | 放获得公开传播许可的网页音乐。推荐 MP3（立体声 128–160 kbps）。目前使用两首原创合成试听循环。 |

`waitingMusic`、各章的 `music` 和 `finaleMusic` 使用同样的字段。`src` 为活动目录内的相对路径，`title` 用于播放器，`volume` 是 0–1，`start` 为起播秒数，`fade` 为淡化秒数，`loop` 控制循环。可删去音乐字段以停用该场景的音乐。章节的 `enter` 可填 `fade` 或 `rise`，`exit` 可填 `fade`，`animations` 可关闭活动过场。海报的 `poster` 可配置 `message`、`accent` 和可选的 `artwork`。

原始音乐及本机试听文件放在 `local-media/`，Git 和站点构建会排除这个目录。附带的《ドキュメント》FLAC 约 31.95 MB，超过 Cloudflare Pages 的 25 MiB 单文件上限。本机已导出 `local-media/document-preview.mp3`（约 4.56 MB）供试听。原始 FLAC 转码时报告损坏帧，建议先试听检查，或用完好的源文件重新导出。网页配乐取得公开传播许可后再放入 `music/`。[Cloudflare Pages 限制](https://developers.cloudflare.com/pages/platform/limits/)

## Cloudflare Pages

静态页面可用 Cloudflare Pages 免费方案构建和托管。原型先在本机审看，正式发布前确认正文、图片、落款、可公开播放的音乐与解封保密要求。[Cloudflare Pages 免费方案限制](https://developers.cloudflare.com/pages/platform/limits/)

1. 将验收后的源码推送到 GitHub 私有仓库。Cloudflare 控制台中打开 **Workers & Pages → Create application → Pages → Connect to Git**，授权 Cloudflare 访问 `Jacky-zhengH/Fmm-website`。Git 集成会在生产分支更新时构建。[Cloudflare Git 集成](https://developers.cloudflare.com/pages/get-started/git-integration/)
2. 选择 Vue/Vite，Production branch 填 `main`，Build command 填 `npm run build`，Build output directory 填 `dist`，Root directory 留空。`.node-version` 选择 Node.js 22 LTS。需要手动指定时，设置 `NODE_VERSION=22`。[Cloudflare 构建环境](https://developers.cloudflare.com/pages/configuration/build-image/)
3. 确定 `pages.dev` 域名后，将其 HTTPS 来源设为构建环境变量 `SITE_ORIGIN`（无需尾部斜线），再部署以生成绝对分享图片地址。部署后检查两条路由及刷新、分享卡片、手机播放和海报保存，并用中国大陆网络验证访问。发送给收信人的链接使用 `/memories/nemu-200/`。

Cloudflare 分支预览的链接默认可公开访问。需要在线审阅草稿时，可在预览设置里启用 Cloudflare Access，并在提交正式内容前验证访问限制。[Cloudflare 预览访问设置](https://developers.cloudflare.com/pages/configuration/preview-deployments/#customize-preview-deployments-access)

两个 HTML 和 Cloudflare 的 `_headers` 都声明了 `noindex`。纯前端时间锁依赖访客设备时间。静态托管会公开 `letter.md` 和其他资源，知道路径的人在解封前也能请求。若正文必须等到零点才可获取，请先留在本地，待零点后发布正文或另行确认服务端方案。
