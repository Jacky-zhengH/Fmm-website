# Midnight Letters 项目约定

- `fmm-website` 是独立的 Vue 3 / TypeScript / Vite 网站，使用独立 Git 仓库。网站改动仅在本目录执行。远端是 `Jacky-zhengH/Fmm-website`，上线目标为 Cloudflare Pages。
- 两个静态入口是 `index.html` 与 `memories/nemu-200/index.html`。保留可直接访问和刷新的纪念链接。阅读、音乐、过场与海报逻辑放在 `src/`，活动内容放在 `public/memories/<活动>/`。
- 正式正文、真实经历、署名、角色素材和音乐由用户确认。未确认的内容维持为草稿或预览。保留用户提供的原件，确认公开传播权后再加入公开构建。`local-media/` 用于原始文件和本机试听。
- 倒计时基于含时区的绝对时间。开发模拟不得进入生产运行路径。音乐需由访客主动开启，尊重静音与减少动态效果偏好。
- 交付前运行 `npm run build`，验证直接链接、解封边界、拆信与章节导航、静音、三种海报尺寸和移动端阅读。生产发布由用户确认。更新已有指南，避免衍生重复文档。
- 当前首篇特辑的核心流程可在本地预览。正文、角色正稿和正式配乐待用户提供，Cloudflare Pages 尚待接入。上架操作见 `README.md`。
