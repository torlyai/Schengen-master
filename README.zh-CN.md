# Schengen-master · 中文安装与配置指南
<img width="1136" height="675" alt="image" src="https://github.com/user-attachments/assets/f1dba5a4-a882-4357-bf09-3cbe24be746a" />

> Read this in: [English](README.md) · **中文**
>
> 由 [**Torly AI**](https://torly.ai) 开发 — 我们专注于打造签证申请类
> AI 助手。Schengen Visa Master 代理完全开源；我们的英国创新创始人
> （UK Innovator Founder）签证 AI 助手是另一个独立项目。

本仓库提供三样东西：

1. **隐私优先的 Chrome 扩展** — *Visa Master 预约监控* — 监控你的
   TLScontact 预约页面，时段开放时立刻提醒。完全在你自己的浏览器里运行，
   不把任何账号信息上传服务器。
2. **文档模板** — 各家庭在本地维护的申请文档骨架（家庭档案、行动计划、
   行程、状态仪表盘、审计日志），以及扩展背后的产品规范和平台设计说明。
3. **AI 技能工具集** — *vstack* — 36 个 Claude Code 斜杠命令，全程带你
   走完法国申根申请：行程规划师、文件工程师、会计、未成年人专家、
   表格专家、预约协调员、申请审计师、补救顾问。全 Markdown，全免费，
   EN+中文双语。见 [`skills/`](skills/) 与
   [`skills/README.zh-CN.md`](skills/README.zh-CN.md)。

> **隐私设计原则。** 本仓库**只放模板**，不包含任何真实姓名、地址、
> 日期、证件号码或行程细节 — 个人数据由你自己在本地填写，并通过
> `.gitignore` 的"默认拒绝"策略阻止误提交。
>
> **状态（2026-05-24）：** 扩展 **v1.2.0 已在 Chrome 应用商店上架** —
> 可从[官方商店页面](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm)
> 一键安装。如需手动安装或在安装前审计源码，仍可从[最新发布页](https://github.com/torlyai/Schengen-master/releases/latest)
> 下载**预构建 ZIP 包** — **不需要 Node、不需要终端、不需要任何编译步骤**。
>
> **vstack 技能工具集**已发布至 **v1.0.0** — 法国申根短期签证完整的 37
> 技能目录全部完成。安装方法见下方[技能工具集](#vstack-技能工具集)章节。
>
> **v1.2.0 新增功能** — 24 小时退款窗口结束后自动继续监控
> （方便为家庭成员预订后续时段）、退款时需说明 TLS 取消原因（增加退款
> 真实性审计）、Premium 用户新增邮件通知通道（与 Telegram、桌面通知并行）、
> 安装元数据采集（扩展版本、浏览器、来源渠道）。详见
> [v1.2.0 发布说明](https://github.com/torlyai/Schengen-master/releases/tag/v1.2.0)。

---

## 目录

- [扩展能做什么](#扩展能做什么)
- [系统要求](#系统要求)
- [安装步骤（推荐路径 — 下载 ZIP）](#安装步骤推荐路径--下载-zip)
- [Telegram 手机通知设置（可选但推荐）](#telegram-手机通知设置可选但推荐)
- [配置选项](#配置选项)
- [vstack 技能工具集](#vstack-技能工具集)
- [隐私说明](#隐私说明)
- [常见问题](#常见问题)
- [关于 Torly AI](#关于-torly-ai)
- [许可证](#许可证)

---

## 扩展能做什么

- 在你打开 TLScontact 预约页面并登录后，自动开始监控。
- 检测到时段开放时，立即弹出系统通知，并把标签页标题改成 ⚠ 红色，
  播放提示音（可选）。
- 支持**英国时区**的"放号时段"配置（默认 06:00–09:30 和 23:30–00:30）—
  这些时段里轮询更频繁，节省 CPU。
- 可选**Telegram 手机推送** — 即使笔记本休眠、你出门遛狗，时段开放
  时手机也会响。

扩展**不会**：

- 读取你的密码 / Cookie。
- 替你自动预约。
- 把网页 HTML 上传到任何服务器。
- 设置任何远程账号。

---

## 系统要求

### 普通用户（推荐路径 — 下载 ZIP 安装）

| 组件 | 要求 | 检查方式 |
| --- | --- | --- |
| Chrome / Chromium | **≥ 110**（支持 Manifest V3） | 浏览器地址栏输入 `chrome://version` |

仅此一项 — 不需要 Git、不需要 Node.js、不需要命令行。

---

## 安装步骤（推荐路径 — 下载 ZIP）

**不需要 Node、不需要终端、不需要编译。** 这是普通用户的路径，
全程大约 2 分钟。

### 第 1 步 — 下载 ZIP 包

打开[最新发布页](https://github.com/torlyai/Schengen-master/releases/latest)，
在 **Assets** 区域下载 `visa-master-v<版本号>.zip`（例如
`visa-master-v1.0.0.zip`）。

如果没看到 "Assets"，点击发布说明下面的"Show all"或下拉箭头展开。

### 第 2 步 — 解压

双击下载好的 ZIP — macOS 和 Windows 都会自动解压。
你会得到**一个文件夹**，名字类似 `visa-master-v1.0.0/`。

请记住这个文件夹的位置（比如 `~/Downloads/visa-master-v1.0.0/`），
Chrome 会一直从这个文件夹加载扩展。**安装后不要删除或移动这个
文件夹**，否则扩展会停止工作，直到你重新添加。

### 第 3 步 — 打开 Chrome 扩展页面

在 Chrome 地址栏输入 `chrome://extensions` 然后按回车。

### 第 4 步 — 开启开发者模式

在扩展页面**右上角**，把 **开发者模式 / Developer mode** 开关
打开。开关打开后，左上角会多出三个按钮 —
*加载已解压的扩展程序* / *打包扩展程序* / *更新*。

> **为什么要开发者模式？** Chrome 要求所有不是从 Chrome 应用商店
> 安装的扩展都启用开发者模式。Visa Master 是开源项目、ZIP 是
> GitHub Actions 用公开源码构建的 — 但因为我们还没上架 Chrome
> 应用商店，所以仍然要走"本地文件夹加载"这条路，Chrome 把这
> 叫作"开发者模式"，无论谁构建的 ZIP 都一样。

### 第 5 步 — 加载已解压的扩展程序

点击**加载已解压的扩展程序**。在文件选择框里找到第 2 步解压
出来的 `visa-master-v<版本号>/` 文件夹 — **选这个文件夹本身**，
不是里面的某个文件。点*打开 / 选择文件夹*。

扩展会立刻出现在扩展页面的卡片列表里，也会出现在 Chrome 工具栏
（如果没看到，点击拼图图标 → *固定* 扩展）。一个欢迎页会自动打开。

### 第 6 步 — 首次运行

在欢迎页选择语言（English / 中文），然后按页面引导完成：

1. 在另一个标签页打开你的 TLScontact 预约页面并登录。
2. 回到欢迎页 — 扩展会自动识别被监控的标签页，工具栏图标会变绿色。
3. 点开扩展弹窗，确认轮询节奏和通知设置（默认：在配置的"放号
   时段"里每 2 分钟轮询一次，时段外每 6 分钟一次；按英国本地时间）。

监控启动后，你可以让 Chrome 在后台运行。一旦检测到时段开放，扩展
会弹出系统通知，把标签页标题/图标改成 ⚠ 红色，可选播放提示音。

> **打开扩展时看到"页面我不认识"或"等待中"的提示？** 如果你点扩展
> 图标时不在预约页面（Idle 弹窗），或者在 TLScontact 的其他子页面
> （Unknown 弹窗），新版弹窗会顶部显示一个绿色的**"去我的预约页面"**
> 按钮 — 一键就能跳到你保存的预约 URL；如果还没保存过目标，就跳到
> TLScontact 首页。

### 更新到新版本

发布新版本时：

1. 从[发布页](https://github.com/torlyai/Schengen-master/releases/latest)
   下载新的 ZIP。
2. 解压 — 你会得到一个版本号更新的文件夹（例如 `visa-master-v1.0.1/`）。
3. 在 `chrome://extensions`，先在旧扩展卡片上点 **移除**，
   然后用**加载已解压的扩展程序**加载新文件夹。
   你的设置存在 `chrome.storage.local`，重装不会丢失。

如果只是源码改了一点点（同一个 ZIP 文件夹），直接在扩展卡片上
点 **重新载入** 图标即可，Chrome 会重新读取那个文件夹。

---

---

## Telegram 手机通知设置（可选但推荐）

默认情况下扩展只发**桌面**通知。如果你希望时段开放时**手机**也响
（这样可以关掉笔记本去做别的事），扩展内置了 Telegram 推送通道：

1. 打开 **Settings → Phone notifications (Telegram)**，把总开关打开。
2. 跟随 5 步向导完成配置 — 它会引导你安装 Telegram、创建 bot、粘贴
   token、给 bot 发消息、获取 Chat ID。
3. 点 **Send test message**，手机会在 1–2 秒内收到提示。

总耗时约 2–3 分钟。向导第 1 步包含 iOS / Android / 桌面 / 网页版
Telegram 的下载链接；第 2 步有"打开 @BotFather"的一键深链接，
不用手动搜索。

会发送到 Telegram 的消息类型：

| 事件 | 触发条件 |
|---|---|
| **时段开放（Slot found）** | 只要 Telegram 通道开启，就一定发送。 |
| **Cloudflare 校验 / 登录过期** | 仅在打开"也通知阻塞事件"开关时。 |
| **开始 / 恢复监控** | 仅在打开"开始监控时通知我"开关时。 |

隐私说明：每条消息只包含**服务中心名称、国家代码、签证代码、时间戳** —
绝对不会发送你的 TLScontact 登录信息、Cookie、URL、护照号，或页面
上的任何表单数据。Bot token 和 Chat ID 仅存在 `chrome.storage.local`
里（卸载扩展即清除）。完整隐私设计详见 PRD Appendix A。

---

## 配置选项

扩展的所有配置都在浏览器内完成（右键工具栏图标 → **选项**）。
没有任何环境变量、没有 `.env` 文件、没有远程配置服务器。

配置项保存在 `chrome.storage.local`（卸载扩展即清除）。主要选项：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| 轮询模式 | `smart` | `smart` 使用放号时段；`aggressive` 始终每 2 分钟轮询；`relaxed` 每 10 分钟。 |
| 放号时段 | 06:00–09:30 + 23:30–00:30（英国时间） | TLScontact 历史上常见的放号时间窗口。 |
| 通知声音 | 开 | 系统通知无论如何都会发。 |
| 标签页标题变色 | 开 | 监控的标签页标题会变成 ⚠ + 提示符。 |
| 界面语言 | 自动 | English / 中文。 |
| Telegram 手机通知 | 关 | 需手动启用。配置向导见上文。 |
| 阻塞事件也通知 | 关 | 监控被 Cloudflare / 登录过期阻塞时，手机也响。 |
| 开始监控时通知 | 关 | 扩展开始监控后会发一条简短的确认消息。 |

---

## vstack 技能工具集

`skills/` 目录下是 **vstack** — 36 个
[Claude Code](https://docs.anthropic.com/en/docs/claude-code) 斜杠命令，
全程带你走完法国申根申请：行程规划、文件清单、照片+保险+求情信审计、
财务证据审核、France-Visas+TLScontact 表格陪同、抢时段、赴约准备、
申请审计、拒签申诉、批准后入境指引。EN+中文双语。

**前置条件：** [Claude Code](https://docs.anthropic.com/en/docs/claude-code)、
[Git](https://git-scm.com/)。

**一行安装** — 粘贴到 Claude Code：

```bash
curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
```

通过 sparse-checkout 安装到 `~/.claude/skills/schengen-master/`（仅技能，
不含扩展或模板）。任何时候重跑此命令即可更新。

**然后在任何 Claude Code 会话中：**

```
/start-here
```

— 通过 6 个关键问题摸清你的行程，并路由到合适的技能。完整目录+角色分解+
架构图见 [`skills/README.zh-CN.md`](skills/README.zh-CN.md)
（[English](skills/README.md)）。

**隐私：** 技能在 Claude Code 中本地运行。技能本身不会把你的申请信息
上传到任何地方。选择性 `/learn` 技能会写一份本地 JSON 文件由你控制 —
不会上传服务器。

---

## 隐私说明

完整内容见 [`privacy/GUARDRAILS.md`](privacy/GUARDRAILS.md)。简要说明：

**会留在仓库里：**

- 带 `{{PLACEHOLDER}}` 占位符的模板（`docs/templates/`）。
- 扩展源代码。
- 产品需求文档、架构与设计文档（不含任何申请人个人数据）。
- 公开参考资料（如英国学校学期 PDF，已在 `.gitignore` 中加白）。

**始终被 `.gitignore` 排除：**

- 按规范路径列出的个人申请文档（`docs/00-family-profile.md`、
  `docs/05-master-action-plan.md`、`DASHBOARD.md` 等）。
- `forms/`、`appointments/`、`insurance/` — 你填好的信件、预约
  确认单、保单本身就放这些目录里，整目录被排除。
- 所有图片（`*.png`、`*.jpg`、`*.heic`...）— 防止护照扫描件误提交。
- 所有 Office 文档和 PDF（除了 `Term-Dates-*.pdf` 这类公开资料）。
- 所有压缩包、`.env` 文件、密钥、证书。

`.gitignore` 采用**默认拒绝**策略：如果你忘了考虑某种新文件类型，
默认就是"排除"。要想纳入跟踪，必须主动把它从忽略名单里去掉。

**关于 Telegram 通道（可选启用）：** 一旦你开启
*Settings → Phone notifications*，短结构化字符串（服务中心名称、
国家代码、签证代码、时间戳）会被发送到 Telegram 服务器，以便推送到
你的手机。你提供的 bot token 和 chat ID 只保存在
`chrome.storage.local` 本地。**没有任何原始页面内容、Cookie、登录
信息或 URL 离开过你的设备。** 默认关闭，严格选入。

---

## 常见问题

| 现象 | 原因 | 解决方法 |
| --- | --- | --- |
| `chrome://extensions` 提示"Could not load manifest" | 选错文件夹了。 | 选 `extension/dist/`，不是 `extension/` 也不是仓库根目录。 |
| `npm install` 在 `node-gyp` / `sharp` 上失败 | Node 版本不兼容。 | 用 Node 20（`nvm install 20 && nvm use 20`）。图标生成脚本没有原生依赖，不需要编译 `sharp`。 |
| 构建成功但 `dist/` 是空的 | Vite 缓存过期。 | `rm -rf node_modules dist && npm install && npm run build`。 |
| 工具栏图标一直灰色 | 没检测到监控的标签页。 | 确认 TLScontact 标签页打开着，并且 URL 里包含 `tlscontact.com/workflow/` — 只有这类 URL 会触发内容脚本。 |
| 系统通知不弹 | 系统通知权限。 | macOS：系统设置 → 通知 → Chrome → 允许。Windows：设置 → 系统 → 通知 → Chrome。 |
| 时段开放时标签页标题没变色 | 某些 TLS 页面会在每次渲染时覆盖标题。 | 已知限制；图标徽章 + 声音 + 系统通知仍会触发。 |
| Telegram 测试消息失败：「Forbidden: bot was blocked by the user」 | 你还没给 bot 发过消息，或把它拉黑了。 | 在 Telegram 里打开 bot 对话，点「开始」（Start），然后重新测试。 |
| Telegram 测试消息失败：「chat not found」 | Chat ID 填错了（常见原因：多了空格、符号、或者把 bot ID 复制成 Chat ID）。 | 重新点向导第 5 步的「查找 Chat ID」按钮；复制 `chat.id` 后面的纯数字。 |
| getUpdates 页面返回 `"result": []` | 你还没给新建的 bot 发过任何消息。 | 在 Telegram 里打开你新建的 bot，发一条任意消息（点「开始」或输入 "hi"）。然后刷新 getUpdates 页面。 |

---

## 关于 Torly AI

[**Torly AI (torly.ai)**](https://torly.ai) 专注于打造签证申请类
AI 助手。我们的项目包括：

- **Schengen Visa Master 代理** — 当前这个项目，完全开源（MIT），
  你可以自己审计每一行代码。
- **英国创新创始人签证（UK Innovator Founder）AI 助手** — 一个独立的
  相关项目，帮助海外创业者准备英国 Innovator Founder 类签证申请。

我们认为：**当工具触碰你的签证申请时，"开源 + 可审计"是建立信任的
唯一靠谱方式。** 你可以在自己的电脑上随时检查代码做了什么、没做
什么。

有反馈、bug 报告、或合作意向，欢迎：

- GitHub Issues：<https://github.com/torlyai/Schengen-master/issues>
- 访问官网：<https://torly.ai>

---

## 许可证

MIT — 详见 [`LICENSE`](LICENSE)。开源是设计原则；可审计性是隐私优先
扩展赢得信任的合同。
