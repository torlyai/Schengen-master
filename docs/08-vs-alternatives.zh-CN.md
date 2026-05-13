# Visa Master 与同类扩展对比 — 三款申根签证预约扩展横评

> Read this in: [English](./08-vs-alternatives.md) · **中文**
>
> **调研日期：** 2026-05-13
> **范围：** 目前在售、面向 TLScontact 申根签证预约场景的三款 Chrome 扩展。
> **方法：** 仅依据各自的 Chrome 应用商店公开页面与官方营销网站，所有数据均可溯源，原文引用使用"英文双引号"。

本文档对比 Visa Master 与目前在同一场景内发布的两款**商业付费扩展**。
面向两类读者：
1. **终端用户** — 帮助你判断该装哪一个。
2. **贡献者 / 翻译者** — 在描述 Visa Master 与对手的差异时，可以从这里直接引用，避免无凭据的断言。

下文所有数字均为调研当日 Chrome 应用商店上的数据。应用商店的版本号、
用户数、评分会随时变化，**对外发布前请重新核对**。

---

## 目录

1. [一句话对比](#1-一句话对比)
2. [各扩展事实卡片](#2-各扩展事实卡片)
3. [功能矩阵对照](#3-功能矩阵对照)
4. [三款扩展的工作原理](#4-三款扩展的工作原理)
5. [Visa Master 的差异化定位](#5-visa-master-的差异化定位)
6. [我们的 Premium 版会做什么不同](#6-我们的-premium-版会做什么不同)
7. [资料来源](#7-资料来源)

---

## 1. 一句话对比

| | **VisaReady** | **TLSContact Appointment Booker** | **Visa Master（本仓库）** |
|---|---|---|---|
| **一句话** | "免费安装，预订成功才收 £29。" | "TLScontact 一旦放号即自动预订申根签证时段。" | "停止刷新 TLScontact。时段一开放，手机和电脑同时收到通知。本地运行，不依赖服务器。" |
| **实际行为** | **替你下单** | **替你下单** | **只提醒，不下单** — 由你自己手动预订 |
| **价格** | 安装免费 + **每笔成功预订 £29**（成功费） | "免费 + 应用内购买"（其营销网站标价 **£19.99 / 两周**） | **永久免费**（MIT 开源协议） |
| **是否需注册账号** | 需要 | 需要（应用内购买） | 不需要 |
| **需要交给扩展的凭据** | TLScontact 账号密码 + 绑定 Stripe 银行卡 | TLScontact 会话（隐含） | **无** |
| **当前覆盖范围** | 英国 → 法国（伦敦） | 法国、瑞士、德国、摩洛哥"等" | 任意 TLScontact 站点（`*.tlscontact.com`） |
| **源代码** | 闭源 | 闭源 | **MIT 开源** |
| **是否依赖远端服务器** | 是 — "VisaReady 网络"协同扫描 | 是 — 173 KiB 的瘦客户端 + 自承认"间隔 > 300 秒以避免被封" | **否** — 完全在你的浏览器内运行 |
| **最后更新** | 2026-05-13 | 2026-05-12 | 2026-05-12 (v1.0.9) |
| **用户数** | 26 | 6,000 | 不适用（仅侧载） |
| **评分** | 5.0（1 条评价） | 3.2（34 条评价） | 不适用 |

---

## 2. 各扩展事实卡片

### 2.1 VisaReady — Auto-Book Your TLSContact Visa Appointment

| 字段 | 内容 |
|---|---|
| 应用商店 ID | `plplpdeonhhgbcakkfkpapbonmngjecn` |
| 版本 | 1.0.8 |
| 最后更新 | 2026 年 5 月 13 日 |
| 体积 | 173 KiB |
| 用户数 | 26 |
| 评分 | 5.0 ★（1 条评价） |
| 发布方 | VisaReady |
| 注册地址 | 16A Baldwin's Gardens, London EC1N 7RJ, GB |
| 官网 | https://visaready.ai |
| 支持邮箱 | support@visaready.ai |
| 隐私政策 | https://visaready.ai/privacy |
| 价格 | 安装免费 · **每笔预订成功收 £29**（成功费） |
| 退款 | "是 — 若 TLS 在 24 小时内取消时段则可退" |
| 支持语言 | 英文 |

**覆盖范围：** 上线即支持英国 → 法国（伦敦中心）。
计划支持：英国 → 德国、比利时、荷兰、意大利、西班牙、美国 B1/B2。

**功能清单（来源：`visaready.ai/pricing`）：**
24×7 自动登录与会话保持；"VisaReady 网络"实时槽位扫描；
带 30 分钟付款窗口的自动预订；电子邮件 + 短信通知；
暂停/取消控制；预订期间的优先客服支持。

**信任声明：** "密码在浏览器本地存储中加密保存，不上传服务端"；
"不在服务端爬取 TLSContact"；"仅匿名时段数据，不在用户之间共享个人信息"；
支付完全经由 Stripe。

### 2.2 TLSContact Appointment Booker for Schengen Visa

| 字段 | 内容 |
|---|---|
| 应用商店 ID | `cbkiaocamdmihicmjkpoefhlgiioipmb` |
| 版本 | 1.2.12 |
| 最后更新 | 2026 年 5 月 12 日 |
| 体积 | 173 KiB |
| 用户数 | **6,000** |
| 评分 | 3.2 ★（34 条评价） |
| 发布方 | Visa Agent |
| 注册地址 | 120 London Wall, London EC2Y 5ET, GB |
| 官网 | https://tlscontact.contact |
| 支持邮箱 | support@tlscontact.contact |
| 隐私政策 | https://yanzhongsu.github.io/privatepolicy/（第三方托管） |
| 价格 | "免费 + 应用内购买" · 其营销网站标价 **£19.99 / 两周** |
| 退款 | 未公开 |
| 支持语言 | 英文（描述中提及阿拉伯语、中文） |
| 应用商店徽章 | "由所列网站的所有者创建。该发布方记录良好，无违规历史。" |

**覆盖范围：** 法国、瑞士、德国、摩洛哥"等"。

**操作步骤（应用商店原文直译）：**
"1. 打开 TLSContact 预约页面…… 2. 设置你的日期范围；取消勾选『包含 Prime 时段』
以跳过付费高价时段，节省费用。 3. **将刷新间隔设置在 300 秒以上以避免被封；
德国签证可设到 60 秒以上。** 4. 在扩展弹窗中点击『开始监控』。
5. 在手机上开启邮件通知，以便时段预订成功时收到提醒。
6. **收到邮件后 30 分钟内付款，否则时段将被释放。**"

**关于品牌名的提醒。** 该产品名为 "TLSContact Appointment Booker"，
营销网站位于 `tlscontact.contact`，但该产品**不是**由 TLScontact 运营或与之有关
（TLScontact 官方使用 `tlscontact.com` 域名）。这种命名容易引起用户混淆 —
本文第 5 节会进一步讨论这对信任的影响。

### 2.3 Visa Master — Appointment Watcher（本仓库）

| 字段 | 内容 |
|---|---|
| 分发渠道 | GitHub Releases ZIP 包（侧载安装）；Chrome 应用商店尚未上架 |
| 版本 | 1.0.9 |
| 最后更新 | 2026 年 5 月 12 日 |
| 源码规模 | 约 3,133 行 TypeScript，分布在 `src/{background,content,shared,popup,settings,welcome,i18n,hooks}/**` |
| 发布方 | Torly AI |
| 仓库 | https://github.com/torlyai/Schengen-master |
| 许可证 | MIT |
| 价格 | **免费** |
| 是否需注册账号 | 否 |
| 支持语言 | 英文 + 中文（UI 与 README 均双语） |

**覆盖范围：** 所有 TLScontact 站点
（`extension/manifest.json` 中唯一的 host permission 为 `https://*.tlscontact.com/*`）。
判定规则面向法国 TLS 工作流调优，但因为采用通用信号匹配而非 URL 白名单，
德国、意大利等其他站点装上即可工作。

**所申请权限**（来自 `extension/manifest.json`，原文）：

```json
"permissions": ["alarms", "storage", "notifications", "tabs", "scripting"],
"host_permissions": ["https://*.tlscontact.com/*"],
"optional_host_permissions": ["https://api.github.com/*"]
```

`api.github.com` 是**可选**权限，仅在用户点击"检查更新"时用于查询 GitHub Releases —
无任何遥测、无任何分析上报。

**通知渠道：** `chrome.notifications` 桌面通知 + Telegram 机器人手机推送
（在「设置 → Telegram」中配置）。

---

## 3. 功能矩阵对照

| 能力 | VisaReady | TLSContact Booker | Visa Master |
|---|---|---|---|
| 检测时段是否开放 | ✅ | ✅ | ✅ |
| 桌面通知 | ✅（隐含） | ✅（邮件） | ✅ |
| 邮件通知 | ✅ | ✅ | ❌ |
| 短信通知 | ✅ | ❌ | ❌ |
| Telegram 通知 | ❌ | ❌ | ✅ |
| **替用户自动预订** | ✅ | ✅ | ❌（设计如此） |
| 自动填写申请人表单 | ❌（仅预订） | ❌（仅预订） | ❌ |
| 跨月份轮询 | ❌（未宣传） | ❌（未宣传） | ✅（可选开启） |
| 暂停 / 恢复 | ✅ | ✅（开始监控） | ✅ |
| 多申请人 | 未公开 | 未公开 | 不适用（由你自己下单） |
| 笔记本休眠 / 关闭标签后仍能工作 | ✅（服务端池） | ✅（服务端池） | ✅（Service Worker） |
| 双语 EN / 中文 | ❌（仅英文） | 部分（描述提及阿拉伯/中文） | ✅ |
| 免注册安装 | ❌ | ❌ | ✅ |
| 无需绑定银行卡 | ❌ | ❌ | ✅ |
| 不接触你的 TLS 密码 | ❌（按其说法本地加密） | 未公开 | ✅（永远不读取） |
| 开源可审计 | ❌ | ❌ | ✅ MIT |
| 对 Cloudflare 友好的轮询 | 未公开 | 未公开 — 自承认"间隔需 > 300 秒以避免被封" | ✅ 通过 `chrome.tabs.reload()` 保留 Cookie 与 Cloudflare 验证（见 PRD 附录 C，2026-05-12 实测确认） |
| 智能轮询窗口 | 未公开 | 未公开 | ✅ 英国"放号时段"内（默认 `06:00–09:30`、`23:30–00:30`）每 2 分钟，时段外每 6 分钟 |

---

## 4. 三款扩展的工作原理

VisaReady 与 TLSContact Appointment Booker 两个扩展的体积**完全相同（173 KiB）**，
这是一个非常强的信号：它们都是**瘦客户端**，真正的扫描和预订工作在远端服务器上执行。
而 Visa Master 是约 3,100 行 TypeScript 代码，完全运行在浏览器内，不依赖任何服务器。

### 4.1 VisaReady（服务端协同的预订池）

来自 `visaready.ai`：
1. 安装扩展并正常登录 TLSContact。
2. "VisaReady 验证账户健康度，确认 TLS 加载正常，然后用已绑定的卡激活服务。"
3. "你的浏览器加入交错式网络扫描；检测到时段时自动预订。"

"VisaReady network" 这个措辞加上极小的扩展体积，意味着大量用户的浏览器
组成了一个**协同轮询池**。当池子里任意一个浏览器检测到时段，
系统选定一个用户、用其本地存储的 TLS 凭据完成预订，然后用户有 30 分钟付款
（TLS 的领事费）。£29 服务费只在预订确认后才扣。

### 4.2 TLSContact Appointment Booker（单标签监控 + 应用内付费）

按应用商店描述：扩展按用户配置的间隔监控当前 TLScontact 标签
（"**间隔需 > 300 秒以避免被封；德国签证可设到 60 秒以上**"）。
检测到时段且用户已在应用内付费的情况下，自动预订并发邮件通知。
用户必须**在 30 分钟内**付款给 TLS，否则"时段会被释放"。

发布方自己写下"间隔需 > 300 秒以避免被封"这句话非常关键 ——
它**承认其轮询方式（很可能是 XHR/fetch 拦截）会被 TLScontact 的 WAF 识别并限速**，
轮询过快就会被封。

### 4.3 Visa Master（被动标签刷新 + 本地状态机）

来自 `extension/`：
1. 内容脚本（`src/content/detector.ts`）在每次页面加载和 DOM 变化时运行
   三信号分类器：`bookEnabled`、`slotCount>0`、`noSlotsTextAbsent`。
   两个及以上正信号 = `SLOT_AVAILABLE`。
2. Service Worker（`src/background/scheduler.ts`）用 `chrome.alarms` 驱动轮询 ——
   英国放号时段内每 2 分钟，时段外每 6 分钟。
3. 轮询使用 `chrome.tabs.reload()` 对用户**已登录**的标签进行刷新。
   会话 Cookie 与 Cloudflare 验证都被保留，因此请求与一个真实用户按 F5 无法区分。
4. 状态保存在 `chrome.storage.local`。Service Worker 被回收后状态机能自动重建；
   最近的 `e0cbf5d` 提交修复了告警丢失场景的自愈逻辑。
5. 一旦检测到 `SLOT_AVAILABLE`，通过桌面通知 +（可选）Telegram 推送提醒用户，
   用户自己切回标签完成预订。

扩展**永远不会**读取或存储用户的 TLS 密码，
**永远不会**替用户提交任何表单。它在设计上就是一个**通知器**，仅此而已。

---

## 5. Visa Master 的差异化定位

本节是上面事实表的"主张"对应章节。下面五条差异，是用户在三款扩展之间做选择时
**真正需要权衡的事情**。

### 5.1 信任模型

VisaReady 与 TLSContact Appointment Booker 都需要用户授权一个自动化代理
**在自己的 TLScontact 会话中操作**。VisaReady 还额外要求绑定 Stripe 银行卡，
并在本地存储加密后的 TLS 密码。两者都是闭源。

Visa Master **不接触凭据**、**不替你提交表单**，且是 MIT 开源、可审计的。
信任契约就是源代码本身 —— 任何人都可以打开 `src/content/detector.ts`
和 `src/background/scheduler.ts`，确认扩展只做了它声称的事情。

对于已经被 France-Visas 官方门户警告过"小心非授权中介"的用户，
或者对**中文圈那批反复被签证中介坑过**的人群来说，
这是三款扩展之间最重要的区别。中文 README 的存在就是为这部分用户准备的。

### 5.2 成本结构

VisaReady 的"预订成功才收 £29"是最干净的付费模式，
但用户**仍然要在收到通知后 30 分钟内**完成 TLS 服务费和领事费的付款 ——
如果通知在你开会、在你深夜睡觉时弹出，这个 UX 是相当脆弱的。

TLSContact Appointment Booker 的 £19.99 / 两周是**结果无关的固定订阅**，
不管最后有没有抢到，钱都先收了。

Visa Master 永久免费。代价是用户**自己**点击下单 ——
但反正多数用户最终也是自己付的领事费，多一步预订并没有那么糟。

### 5.3 服务条款 / 账号风险

两款自动预订扩展都会**在 TLScontact 会话内提交表单**。
TLScontact 的服务条款禁止自动化代理；账户一旦被风控识别为"自动化操作"，
**就会在你最需要时段的时候被封号**。

Visa Master 的轮询方式只是**用户的标签自己刷新一次**，
与一个真实用户按 F5 在请求层面没有任何区别。
没有表单提交、没有伪造请求头、没有脚本点击。
这是 Chrome 扩展在监控类场景下能采用的**风险最低的方式**。

### 5.4 覆盖广度

VisaReady 当前仅支持英国 → 法国（计划：DE、BE、NL、IT、ES、US）。
TLSContact Booker 覆盖 FR/CH/DE/MA"等"。两者都依赖**厂商显式适配**每一个领事流程。

Visa Master 的 host permission 是 `*.tlscontact.com/*`，
判定逻辑是一套通用三信号分类器而非按国家硬编码。
TLScontact 新增的领事流程多半装上就能用，只是"无时段"提示文案可能需要补一下翻译。

### 5.5 架构与可持续性

两款竞品都是 173 KiB 的瘦客户端，**强依赖远端服务**。
他们的服务器一旦下线，你就收不到任何通知。

Visa Master 完全本地化运行。**唯一**的远程请求是可选的 GitHub Releases 检查更新。
没有服务器会崩、没有公司会破产、没有隐私政策会偷偷修改。

---

## 6. 我们的 Premium 版会做什么不同

上面对比的免费版是 Visa Master 的"只通知"版本。我们也在做一个 **Premium 付费版** ——
完成预订这一步，和 VisaReady、TLSContact Booker 现在做的事是同一件，
但建立在和免费版同样的信任模型上，而不是他们的模型上。

完整规格见 [`09-visa-master-premium-prd.md`](./09-visa-master-premium-prd.md)。
对这份对比页来说，关键信息如下：

| 问题 | VisaReady | TLSContact Booker | **Visa Master Premium（计划中）** |
|---|---|---|---|
| 替你自动下单？ | ✅ | ✅ | ✅ |
| 价格 | 成功费 £29 | 订阅 £19.99 / 两周 | **成功费 £19** |
| TLS 在 24 小时内取消时段则退款 | ✅ | 未公开 | ✅（弹窗内一键退款） |
| 扫描架构 | 服务端协调的用户池 | 服务端瘦客户端 | **完全本地** —— 你的浏览器、你的扫描，没有共享网络 |
| TLS 凭据 | 本地存储，用于自动登录 | 未披露 | 本地存储（AES-GCM），用于自动登录 —— 在激活流程中明确告知 |
| 服务器掌握你的什么数据 | Stripe 账单 + 他们的池 | Stripe 账单 + 他们的扫描服务 | 仅 Stripe 账单 —— 一次性签发 license JWT，扫描和槽位数据从不离开浏览器 |
| 源代码 | 闭源 | 闭源 | **MIT 开源 —— 和免费版同一仓库** |
| 免费版继续可用 | 无（仅付费） | "免费 + 应用内购买"，但核心功能要付费 | **是 —— 免费版的『只通知』永久免费** |

**三个必须直说的点：**

1. **信任反转是真实存在的。** Premium 要求用户**把 TLS 密码存到本地**。
   免费版的承诺一直是"从不接触凭据"。PRD 在
   [§11.2 中专门重述这两条承诺](./09-visa-master-premium-prd.md#112-brand-promise-restatement) ——
   免费版的承诺**不变**；Premium 的承诺是**另一句话**，并且在激活时清晰可见地展示给用户。
   我们不希望用户感到自己是被"升级套路"骗走了原本更强的承诺。

2. **我们的自动预订违反 TLScontact 的服务条款。** 三款产品都违反。
   我们会在 Premium 介绍页直接说出这一点；竞品不会。
   见 [PRD §14](./09-visa-master-premium-prd.md#14-compliance-and-tos-posture-premium-specific)。

3. **£19 比 VisaReady 便宜 £10。** 这是有意的定位选择，不是不可持续的促销。
   算账之所以能撑住：我们的免费版几乎不需要花钱跑（没有服务器），
   所以 Premium 的毛利可以承担一个更低的价格锚点。

**Premium PRD 当前状态：** 2026-05-13 起草中，等待评审。
里程碑表见 [PRD §18](./09-visa-master-premium-prd.md#18-roadmap-and-milestones)。
公开发布目标日期：**2026-07-15**。封闭 beta 开始：**2026-07-01**。

如果你想在 beta 开放时收到通知，最简单的方式是在
[GitHub 仓库](https://github.com/torlyai/Schengen-master/issues)发一个 issue ——
我们目前还没有邮件订阅列表。

---

## 7. 资料来源

| 来源 | 核对日期 |
|---|---|
| VisaReady Chrome 应用商店页面 — `chromewebstore.google.com/detail/visaready-auto-book-your/plplpdeonhhgbcakkfkpapbonmngjecn` | 2026-05-13 |
| VisaReady 官网首页 — `visaready.ai` | 2026-05-13 |
| VisaReady 价格页 — `visaready.ai/pricing` | 2026-05-13 |
| TLSContact Appointment Booker — `chromewebstore.google.com/detail/tlscontact-appointment-bo/cbkiaocamdmihicmjkpoefhlgiioipmb` | 2026-05-13 |
| TLSContact Booker 营销网站 — `tlscontact.contact` | 2026-05-13 |
| Visa Master 源码 — `extension/manifest.json`、`extension/README.md`、`src/background/scheduler.ts`、`src/content/detector.ts`，以及 `docs/06-visa-master-chrome-extension-prd.md` 附录 C | 2026-05-13 |

应用商店元数据变化频繁。如果你打算在公开内容中引用本文档，
**发布当日请重新核对版本号、用户数与评分**。
