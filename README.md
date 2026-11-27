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
| `music/` | 放可随网站公开发布的音频。当前生产构建使用一首原创试听曲。 |

活动级 `music` 配置一首曲目，`title` 为曲名，`volume` 是 0–1 的初始增益，`fallback` 为本机曲目缺失时和生产环境使用的试听曲。将来具备公开发布条件时，可在 `music.src` 设置活动目录内的相对路径。`music.cues` 按播放秒数切换环境色，章节的 `enter` 可填 `fade` 或 `rise`，`exit` 可填 `fade`，`animations` 可关闭活动过场。海报的 `poster` 可配置 `message`、`accent` 和可选的 `artwork`。

## 《ドキュメント》本机配乐

`local-media/document-original.flac` 保留 44.1 kHz、16 bit 双声道原件（31,947,810 字节）。`local-media/document-web.mp3` 是 44.1 kHz、192 kbps 双声道预览转码（6,837,437 字节）。FFprobe 实测约 4 分 44.814 秒。源文件在最后约 0.3 秒的近静音区有解码告警，导出的 MP3 可完整解码。此目录由 Git 忽略并排除在站点构建之外。启动 Vite 后只在本机开发预览载入该 MP3。生产构建仍使用试听曲。

拆信启动音乐，翻页、落幕和进入海报沿用同一个播放进度。约 800 个中文字可按 4～5 分钟安排，实际阅读由读者自主翻阅。早读完可以留在海报页继续听。读得更久时，歌曲自然结束，读者可选择重播。播放器提供静音、暂停、继续和音量调节。

下表用 FFmpeg 解码实际音源，按 8 秒窗测量波形 RMS 与频谱变化，并以频谱起音包络估算节奏。稳定脉冲约 160～162 次/分，也可按约 80 拍/分感受。边界为近似时间，供画面使用。

| 时间 | 音源观测 | 视觉参考 |
| --- | --- | --- |
| 0:00–0:12 | 低能量开场，低频逐步出现，约 0:12 能量明显跃升 | 保持夜色，让暖光慢慢抬起 |
| 0:12–1:52 | 节奏周期较稳定，能量多在 −11 至 −9 dBFS | 保持稳定环境光 |
| 1:52–2:33 | 频谱变化加密，平均能量升至约 −8 dBFS，约 2:24–2:32 更强 | 环境色略亮 |
| 2:33–3:15 | 平均能量回落，低频占比回升 | 降低环境亮度 |
| 3:15–4:32 | 进入持续高能量段，频谱变化再次加密 | 逐步加深蓝金层次 |
| 4:32–4:44.8 | 明显衰减，尾部趋近静音 | 若已打开落幕或海报，缓慢浮现柔和边光 |

## Cloudflare Pages

静态页面可用 Cloudflare Pages 免费方案构建和托管。原型先在本机审看，正式发布前确认正文、图片、落款、可公开播放的音乐与解封保密要求。[Cloudflare Pages 免费方案限制](https://developers.cloudflare.com/pages/platform/limits/)

1. 将验收后的源码推送到 GitHub 私有仓库。Cloudflare 控制台中打开 **Workers & Pages → Create application → Pages → Connect to Git**，授权 Cloudflare 访问 `Jacky-zhengH/Fmm-website`。Git 集成会在生产分支更新时构建。[Cloudflare Git 集成](https://developers.cloudflare.com/pages/get-started/git-integration/)
2. 选择 Vue/Vite，Production branch 填 `main`，Build command 填 `npm run build`，Build output directory 填 `dist`，Root directory 留空。`.node-version` 选择 Node.js 22 LTS。需要手动指定时，设置 `NODE_VERSION=22`。[Cloudflare 构建环境](https://developers.cloudflare.com/pages/configuration/build-image/)
3. 确定 `pages.dev` 域名后，将其 HTTPS 来源设为构建环境变量 `SITE_ORIGIN`（无需尾部斜线），再部署以生成绝对分享图片地址。部署后检查两条路由及刷新、分享卡片、手机播放和海报保存，并用中国大陆网络验证访问。发送给收信人的链接使用 `/memories/nemu-200/`。

Cloudflare 分支预览的链接默认可公开访问。需要在线审阅草稿时，可在预览设置里启用 Cloudflare Access，并在提交正式内容前验证访问限制。[Cloudflare 预览访问设置](https://developers.cloudflare.com/pages/configuration/preview-deployments/#customize-preview-deployments-access)

两个 HTML 和 Cloudflare 的 `_headers` 都声明了 `noindex`。纯前端时间锁依赖访客设备时间。静态托管会公开 `letter.md` 和其他资源，知道路径的人在解封前也能请求。若正文必须等到零点才可获取，请先留在本地，待零点后发布正文或另行确认服务端方案。
