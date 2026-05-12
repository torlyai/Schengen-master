# Schengen-master · 中文安装与配置指南

> Read this in: [English](README.md) · **中文**
>
> 由 [**Torly AI**](https://torly.ai) 开发 — 我们专注于打造签证申请类
> AI 助手。Schengen Visa Master 代理完全开源；我们的英国创新创始人
> （UK Innovator Founder）签证 AI 助手是另一个独立项目。

本仓库提供一款**隐私优先的 Chrome 扩展** — *Visa Master 预约监控* —
它会监控你的 TLScontact 预约页面，一旦有时段开放立刻提醒你。
完全在你自己的浏览器里运行，不会把任何账号信息上传到服务器。

> **隐私设计原则。** 本仓库**只放模板**，不包含任何真实姓名、地址、
> 日期、证件号码或行程细节 — 个人数据由你自己在本地填写，并通过
> `.gitignore` 的"默认拒绝"策略阻止误提交。
>
> **状态：** 扩展 v1.0.0 仅支持手动加载 — Chrome 应用商店上架尚未完成。

---

## 目录

- [扩展能做什么](#扩展能做什么)
- [系统要求](#系统要求)
- [安装步骤](#安装步骤)
- [Telegram 手机通知设置（可选但推荐）](#telegram-手机通知设置可选但推荐)
- [配置选项](#配置选项)
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

| 组件 | 要求 | 检查方式 |
| --- | --- | --- |
| Git | 近期任意版本 | `git --version` |
| Node.js | **≥ 20.0**（扩展使用 Vite 5 和 `@crxjs/vite-plugin` v2） | `node --version` |
| npm | 随 Node 20+ 一起安装 | `npm --version` |
| Chrome / Chromium | **≥ 110**（支持 Manifest V3） | 浏览器地址栏输入 `chrome://version` |

如果没有 Node 20，建议用 [nvm](https://github.com/nvm-sh/nvm) 安装：

```sh
nvm install 20
nvm use 20
```

---

## 安装步骤

### 第 1 步 — 克隆仓库

```sh
git clone https://github.com/torlyai/Schengen-master.git
cd Schengen-master/extension
```

### 第 2 步 — 安装依赖

```sh
npm install
```

会拉取 React 18、Vite 5、`@crxjs/vite-plugin`、TypeScript 和 Chrome
类型定义。约 250 MB，需要 30–60 秒。

### 第 3 步 — 构建扩展

```sh
npm run build
```

Vite 会把 TypeScript 服务工作线程、内容脚本和 React UI 编译进
`extension/dist/`。输出的就是一个可加载的 Chrome MV3 扩展。

> 注意：`dist/` 目录**不会**提交到仓库。必须先构建，否则下一步加载
> 时会报"Could not load manifest"。

### 第 4 步 — 在 Chrome 中加载扩展

1. 在 Chrome 地址栏打开 `chrome://extensions`。
2. 右上角开启**开发者模式**。
3. 点击**加载已解压的扩展程序**。
4. 选择刚才构建出来的 `extension/dist/` 文件夹。
5. 扩展会出现在工具栏，名称是 *Visa Master — Appointment Watcher*。
   建议右键固定到工具栏。

### 第 5 步 — 首次运行

扩展在安装后会自动弹出欢迎页。在那里选择语言（English / 中文），
然后按页面引导完成：

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
