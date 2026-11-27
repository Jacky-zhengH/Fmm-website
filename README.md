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
| `music/` | 存放网站使用的音频。当前使用《ドキュメント》的 192 kbps 网页 MP3。 |

活动级 `music` 配置一首曲目，`title` 为曲名，`volume` 是 0–1 的初始增益，`music.src` 是活动目录内的相对路径。`music.cues` 按播放秒数切换环境色，章节的 `enter` 可填 `fade` 或 `rise`，`exit` 可填 `fade`，`animations` 可关闭活动过场。海报的 `poster` 可配置 `message`、`accent` 和可选的 `artwork`。

## 《ドキュメント》配乐

`local-media/document-original.flac` 保留 44.1 kHz、16 bit 双声道原件（31,947,810 字节）。FFprobe 实测约 4 分 44.814 秒。源文件在最后约 0.3 秒的近静音区有解码告警。网站使用可完整解码的 44.1 kHz、192 kbps 双声道转码（6,837,437 字节），发布文件为 `public/memories/nemu-200/music/document-web.mp3`。Vite 优先使用忽略目录中的同名本机 MP3，便于同时使用本机歌词预览。

拆信启动音乐，翻页、落幕和进入海报沿用同一个播放进度。早读完可以留在海报页继续听。读得更久时，歌曲自然结束，读者可选择重播。播放器提供进度拖动、静音、暂停、继续和音量调节。

下表用 FFmpeg 解码实际音源，按 8 秒窗测量波形 RMS 与频谱变化，并以频谱起音包络估算节奏。稳定脉冲约 160～162 次/分，也可按约 80 拍/分感受。边界为近似时间，供画面使用。

| 时间 | 音源观测 | 视觉参考 |
| --- | --- | --- |
| 0:00–0:12 | 低能量开场，低频逐步出现，约 0:12 能量明显跃升 | 保持夜色，让暖光慢慢抬起 |
| 0:12–1:52 | 节奏周期较稳定，能量多在 −11 至 −9 dBFS | 保持稳定环境光 |
| 1:52–2:33 | 频谱变化加密，平均能量升至约 −8 dBFS，约 2:24–2:32 更强 | 环境色略亮 |
| 2:33–3:15 | 平均能量回落，低频占比回升 | 降低环境亮度 |
| 3:15–4:32 | 进入持续高能量段，频谱变化再次加密 | 逐步加深蓝金层次 |
| 4:32–4:44.8 | 明显衰减，尾部趋近静音 | 若已打开落幕或海报，缓慢浮现柔和边光 |

### 双语字幕与正文长度

特辑的 UTF-8 字幕为 `public/memories/nemu-200/lyrics/document.ja.lrc` 和 `document.zh.lrc`，在 `music.lyrics.japanese` 和 `music.lyrics.chinese` 指定相对路径。日语时间轴沿用用户提供的 LRC，中文逐句使用同一时间戳。第一句在 0:36.64。文件在 2:30.69 和 4:11.72 用空字幕标记间奏和尾奏。

读取到配对歌词后，阅读和海报页面的播放器会显示歌词开关。电脑端同时呈现前一句、当前句和后一句，手机端只显示当前句。海报旁的字幕继续跟随歌曲进度，导出的 PNG 只包含海报画布。缺失歌词时自动隐藏字幕和开关。

两份文件用相同的时间戳（例如 `[00:12.34]`）配对。`[offset:+250]` 可让字幕提前 250 毫秒，负值用于延后。中文文件省略 `offset` 时沿用日语偏移。若两份都注明偏移，按调整后的时间配对。每句最多保留 8 秒。没有设置活动歌词时，Vite 开发版可读取 `local-media/document.ja.lrc` 和 `local-media/document.zh.lrc`。

建议默读版正文保留 **800–900 个汉字**，标题和歌词另计。按每分钟 230 字的编排节奏估算，正文约占 3:29–3:55，在 4:44.814 的配乐里留约 50–76 秒给插图、偶尔抬眼看字幕和落幕。宽屏把正文与插图并排，窄屏上下排列。纸张底部可翻页，电脑也可用方向键左右翻章，较长的正文可以自然滚动。

## Cloudflare Pages

静态页面可用 Cloudflare Pages 免费方案构建和托管。原型先在本机审看，正式发布前确认正文、图片、落款、可公开播放的音乐与解封保密要求。[Cloudflare Pages 免费方案限制](https://developers.cloudflare.com/pages/platform/limits/)

1. 将可公开发布的源码推送到 GitHub 仓库。Cloudflare 控制台中打开 **Workers & Pages → Create application → Pages → Connect to Git**，授权 Cloudflare 访问 `Jacky-zhengH/Fmm-website`。Git 集成会在生产分支更新时构建。[Cloudflare Git 集成](https://developers.cloudflare.com/pages/get-started/git-integration/)
2. 选择 Vue/Vite，Production branch 填 `main`，Build command 填 `npm run build`，Build output directory 填 `dist`，Root directory 留空。`.node-version` 选择 Node.js 22 LTS。需要手动指定时，设置 `NODE_VERSION=22`。[Cloudflare 构建环境](https://developers.cloudflare.com/pages/configuration/build-image/)
3. 确定 `pages.dev` 域名后，将其 HTTPS 来源设为构建环境变量 `SITE_ORIGIN`（无需尾部斜线），再部署以生成绝对分享图片地址。部署后检查两条路由及刷新、分享卡片、手机播放和海报保存，并用中国大陆网络验证访问。发送给收信人的链接使用 `/memories/nemu-200/`。

内测分支固定为 `codex/internal-review`。Cloudflare Pages 构建注入的 `CF_PAGES_BRANCH` 与分支完全一致时，预览域名下的 `/memories/nemu-200/` 直接进入已解封的信封，沿用正式的拆信、阅读和海报流程。搭建分支预览前在 Cloudflare Pages 启用 Access 并核实未登录访客会被拦截。本机可在运行 `npm run build` 前将 `CF_PAGES_BRANCH` 设为该分支值，构建后清除该变量，再用 `npm run preview` 查看产物。[Cloudflare 预览访问设置](https://developers.cloudflare.com/pages/configuration/preview-deployments/#customize-preview-deployments-access)

两个 HTML 和 Cloudflare 的 `_headers` 都声明了 `noindex`。纯前端时间锁依赖访客设备时间。静态托管会公开 `letter.md` 和其他资源，知道路径的人在解封前也能请求。若正文必须等到零点才可获取，请先留在本地，待零点后发布正文或另行确认服务端方案。
