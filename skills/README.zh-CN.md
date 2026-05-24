# Schengen-master 技能集

> Read this in: [English](README.md) · **中文**
>
> 一份申根签证申请，是一堆文件、一大堆细枝末节的规则，外加几乎不给你犯错的空间。照片不合规——拒签。保险只买了 €20000、差 €30000 一万——拒签。银行流水里有一笔可疑入账——拒签。求情信跟 France-Visas 表里写的不一致——拒签。TLScontact 当天没带打印的条码——直接被请回家。
>
> 我不想全部记下来、再学第二次，所以干脆造了一个九人的虚拟团队替我打理。

这是一套 Claude Code 技能工具集，专门处理**申根短期签证申请**，v0.x 从英国申请法国开始。它把 Claude Code 变成九位虚拟专家，全程陪你走完整个流程 — 行程规划师拷问你的场景、文件工程师搭建你的文件包、会计审核你的财务、表格专家逐行带你填 France-Visas 和 TLScontact、未成年人专家处理小孩、担保专家处理配偶/父母/雇主担保、预约协调员去抢时段、申请审计师做提交前的最后一道关卡、补救顾问在出问题时兜底。

**v0.2.0 共 20 个技能**，全 Markdown，全免费，MIT 协议。v0.x 专注法国；其他申根国家 v1.x 上线。每个技能都是双语（英文 + 简体中文），所以一家人申请时各自用自己习惯的语言。

**适合谁：**

- **第一次申请的游客** — 没做过申根签证、不知道从哪开始
- **家庭出行者** — 小孩、父母、配偶在同一行程上 — 每人文件都不一样
- **被担保人** — 配偶、父母、朋友或雇主出钱 — 担保人的文件需要干净地组合起来
- **被拒签的申请人** — 收到拒签信、需要在申诉和重新申请之间抉择
- **商务出行者** — 邀请函、雇主信、报销证明
- **讨厌重复填表的人** — 这些技能强制各文件之间只有一个真实来源

## 什么是技能（Skills）？

技能是给 Claude Code 注入"特定任务的专业知识和工作流"的 Markdown 文件。装上后，当你做申根签证申请相关的事情，Claude 会自动认出来并应用正确的框架、文件模板和规则 — 不需要你记任何提示词。

每个技能都是一个 `SKILL.md` 文件，含 YAML 前置（名字、描述、触发短语）+ 主体（告诉 Claude 该技能激活时如何表现）。你可以直接调用某个技能（`/start-here`），或者用自然语言描述你在做什么，对应的技能就会激活。

## 技能之间如何协作

技能不是独立的 — 它们互相引用，并基于共享上下文构建。`/start-here` 是地基：所有其他技能都假设你已经跑过它（或知道如何在你没跑时补救）。行程规划师塑造行程；文件工程师+会计搭建文件包；表格专家+预约协调员把一切送入门户；申请审计师在提交前核查；补救顾问处理任何返回结果。

```
                              ┌─────────────────────────────────────────┐
                              │              /start-here                │
                              │     （入口 — 所有技能首先读它）         │
                              └────────────────────┬────────────────────┘
                                                   │
   ┌────────────┬────────────┬────────────┬────────┴───────┬────────────┬────────────┬────────────┐
   ▼            ▼            ▼            ▼                ▼            ▼            ▼            ▼
┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 行程   │ │ 文件     │ │ 会计     │ │ 未成年人 │ │ 担保     │ │ 表格     │ │ 预约     │ │ 补救     │
│规划师  │ │工程师    │ │（签证   │ │ 专家     │ │ 专家     │ │ 专家     │ │协调员    │ │顾问      │
│        │ │          │ │ 专用）  │ │          │ │          │ │          │ │          │ │          │
├────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤
│plan-   │ │document- │ │employ-   │ │minor-    │ │sponsored-│ │france-   │ │find-     │ │track-    │
│ trip   │ │ checklist│ │ ment-    │ │  applica-│ │  applica-│ │ visas-   │ │ slot     │ │  applica-│
│itiner- │ │photo-    │ │  letter  │ │   tion   │ │   tion   │ │  form    │ │book-     │ │    tion  │
│ ary-   │ │ check    │ │bank-     │ │minor-    │ │          │ │tls-      │ │ appoint- │ │refusal-  │
│ builder│ │insurance-│ │ statement│ │  parent- │ │          │ │ contact- │ │  ment    │ │  appeal  │
│decide- │ │ check    │ │ -check   │ │  consent │ │          │ │  form    │ │          │ │          │
│ visa-  │ │cover-    │ │cost-     │ │          │ │          │ │group-    │ │          │ │          │
│  type  │ │ letter   │ │ estimate │ │          │ │          │ │  applica-│ │          │ │          │
│timeline│ │          │ │financial-│ │          │ │          │ │   tion   │ │          │ │          │
│ -planner│ │         │ │ checklist│ │          │ │          │ │          │ │          │ │          │
└────┬───┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │          │            │            │            │            │            │            │
     └──────────┴────────┬───┴────────────┴────────────┴────────────┴────────────┴────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │    申请审计师        │
              │  /audit-application  │
              │   （读取一切）       │
              └──────────────────────┘

技能之间互相引用：
  cover-letter ↔ employment-letter ↔ cost-estimate
  bank-statement-check → cover-letter、audit-application
  minor-application → minor-parent-consent → document-checklist
  group-application → minor-application + sponsored-application
  france-visas-form → tlscontact-form → find-slot → book-appointment
  track-application → refusal-appeal
  audit-application 提交前读取一切
```

每个技能的 **路由规则**（在 `<skill>/SKILL.md` 内）有完整的逐技能依赖图。

## 快速入门

1. 安装技能（30 秒 — 见下方）
2. 运行 `/start-here` — 回答 6 个关键问题
3. 运行 `/document-checklist` — 拿到个性化的可打印清单
4. 觉得准备好了就运行 `/audit-application`
5. 到这一步你就知道这套是否适合你

## 安装 — 30 秒

**前置：** [Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[Git](https://git-scm.com/)

打开 Claude Code，粘贴以下命令 — 剩下的交给 Claude：

```bash
curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
```

就这么简单。下次启动 Claude Code 会话时，输入 `/start-here` 即可开始。

**重新运行同一条命令**可更新到最新版本。安装是幂等的、用 sparse-checkout、速度快。

**自定义安装路径：**

```bash
SCHENGEN_SKILLS_DEST=~/some/other/path curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
```

## 看它怎么跑

```
你：   我想申请下个月去法国的申根签证。
你：   /start-here

Claude: 在路由你到合适的技能之前，先 6 个关键问题。

        1. 国家：法国 ✓
        2. 目的：旅游、商务、探亲、留学、过境？
        3. 同行：独自、配偶、孩子？
        4. 资金：自费还是有人担保？
        5. 行程日期：什么时候、多久？
        6. 居住国：英国？

你：   旅游，和妻子加 8 岁的儿子一起，自费，7 月 15 日到 22 日，英国居民。

Claude: 好的 — 这是一个含一名未成年人的团体申请。我把你路由到：
          → /minor-application（处理你儿子）
          → /group-application（处理家庭预订流程）
          → /document-checklist（每位成年人）
        按这个顺序走。要不要从第一个开始？

你：   好。
        [/minor-application 走完出生证明 + 学校证明 + 父母同意书 —
         因为父母双方都同行，所以"是否需要同意书"会自动回答：本案无需。]

你：   /group-application

Claude: 团体规则：每位申请人都需要自己的 France-Visas 参考号，
        但共用一个 TLScontact 团队 ID 和一个预约时段。
        这是你的申请人矩阵...

你：   /france-visas-form

Claude: 逐页走 France-Visas 门户。我会标出会导致 TLS
        拒绝你参考号的常见错字...

你：   /audit-application

Claude: 跨申请人审计。发现 3 个问题：
        - 妻子的保险证明没有列出儿子
        - 求情信提了巴黎，住宿订单是尼斯
        - 银行流水 18 号有一笔 £4,200 的入账 — 需要说明
        修正后重跑。

你：   [修完]
        /book-appointment

Claude: 伦敦排到 4 周后了。爱丁堡下周二+周四有时段。
        LNER 往返车票约 £140，对比在伦敦花 £80 买 Prime Time —
        而 Prime Time 并不会更快。建议爱丁堡。
```

你说"我要申根签证"，工具集说"你是一家三口、含一名未成年人、按团体申请，实际顺序是这样"。这不是聊天机器人，这是一个团队。

## 签证之旅

这些技能不是一堆零散工具。它们是按**真实申请发生的顺序**排好的。

**发现 → 计划 → 准备 → 审计 → 提交 → 等待 → 补救**

每个阶段喂给下一个。`/start-here` 摸清你的场景再路由。`/document-checklist` 产生清单，让 `/cover-letter` + `/employment-letter` + `/bank-statement-check` + `/insurance-check` 来填。`/audit-application` 在你预约之前读完所有材料。`/track-application` 陪你等。`/refusal-appeal` 在出问题时兜底。

| 阶段 | 发生什么 | 技能 |
|---|---|---|
| **发现** | 摸清场景、决定你需要哪些技能 | `/start-here` |
| **计划** | 根据你的情况个性化文件清单 | `/document-checklist`、`/minor-application`、`/sponsored-application`、`/group-application` |
| **准备** | 搭建每份文件 — 信件、财务、照片、保险 | `/cover-letter`、`/employment-letter`、`/bank-statement-check`、`/cost-estimate`、`/financial-checklist`、`/photo-check`、`/insurance-check`、`/minor-parent-consent` |
| **审计** | 提交前交叉检查 — 一致性、遗漏、薄弱环节 | `/audit-application` |
| **提交** | 填门户、订时段、参加预约 | `/france-visas-form`、`/tlscontact-form`、`/find-slot`、`/book-appointment` |
| **等待** | 解读追踪器、设现实预期、必要时升级 | `/track-application` |
| **补救** | 拒签？申诉还是重新申请 — 一起决定 | `/refusal-appeal` |

## 24 个技能 — 你的虚拟签证团队

每个技能都是一个角色。你不需要想"我需要哪个技能"，你只需要想"我想跟哪位专家聊"。

### 行程规划师 — *你的第一个对话对象*

像一位聪明的旅行顾问，先拷问你的场景、塑造行程、决定哪个签证合适、并在你花一分钱前倒推时间表。

| 技能 | 功能 |
|---|---|
| `/start-here` | 6 个关键问题（国家、目的、同行、担保、日期、居住地）决定你真正需要哪些其他技能。基于你的回答路由到接下来 2-3 个正确的技能。始终先跑这个。 |
| `/plan-trip` | **v0.3 新增。** 迭代式行程规划向导。从"我们想去法国"到具体的"行程骨架"（城市+夜数+住宿类型+交通+预算），内置领事可信度检查。 |
| `/itinerary-builder` | **v0.3 新增。** 把骨架扩展为可附到 France-Visas 的逐日行程。交叉检查每晚有住宿、过渡现实、活动匹配季节+同行组成。 |
| `/decide-visa-type` | **v0.3 新增。** 向导落到正确签证类型（A/C/D）、入境模式（单次/两次/多次）、目的分类，并确认法国是负责领事。 |
| `/timeline-planner` | **v0.3 新增。** 从出行日倒推。计算关键路径截止（apostille 3 周准备；Attestation 4 周；等等），给今日"做/紧/不做"裁决。 |

### 文件工程师 — *打造你文件包的完美主义者*

把申根的每条规则烂熟于心：照片尺寸、保险下限、求情信惯例。专门接住领事官员拒签的细节。

| 技能 | 功能 |
|---|---|
| `/document-checklist` | 个性化可打印清单，基于你的目的 + 家庭组成 + 担保情况 + 英国居民细节。自动叠加对应要求。 |
| `/photo-check` | 启用视觉的护照照片合规性检查。附上你的照片，按申根标准（35×45mm、白底、不戴眼镜、表情中性、≤6 个月）出判断。 |
| `/insurance-check` | 旅行保险证明审计。核实 €30k+ 欧元保额、医疗遣返、覆盖全程、覆盖整个申根区。告诉你具体缺什么。 |
| `/cover-letter` | 起草 300 字以内的个性化求情信。旅游、商务、探亲变体。说明目的 + 回国承诺 + 与居住国的关联。 |

### 会计（签证专用） — *一丝不苟的钱袋子* — **v0.2 新增**

像领事官员一样审你的财务故事。专门接住可疑入账、不匹配出行成本的薪资、忘了写假期审批的雇主信。

| 技能 | 功能 |
|---|---|
| `/employment-letter` | 起草合规雇主信（英国或跨国模板）。标记缺失字段：薪资、职位、合同类型、假期批准条款、返岗承诺。 |
| `/bank-statement-check` | 按 €65/天规则审 3 个月流水。标记需要解释的可疑入账。检查流水名字与申请一致。 |
| `/cost-estimate` | 分项出行成本核算（机票、住宿、日支、保险、签证费、备用）。生成你会在求情信里引用的那个数字。 |
| `/financial-checklist` | 整合财务证据包。按你的场景（在职 / 自雇 / 退休 / 学生 / 被担保）以正确顺序路由你走上述三个技能。 |

### 未成年人专家 — *懂小孩规则的那位*

带孩子出行是签证的一个独立子领域。出生证明、父母同意书、学校证明、父母的完整文件包要跟孩子的一起提交。

| 技能 | 功能 |
|---|---|
| `/minor-application` | 儿童申请入口。走完出生证 + 父母同意 + 学校证明 + 父母证件要求。按哪些父母同行做分支。 |
| `/minor-parent-consent` | 父母一方或双方**不**随行时的公证同意书。包含领事预期的法律表述。 |

### 担保专家 — *给别人买单的情况*

配偶、父母、朋友、雇主 — 全包。担保人文件（银行流水、雇主信、身份证件）需要干净地组合起来，附上正确的关系证明。

| 技能 | 功能 |
|---|---|
| `/sponsored-application` | 通用担保处理。按担保类型（配偶 / 父母 / 朋友 / 雇主）自动调整。起草担保支持信、列出担保人需提供的文件、确保关系有据可查。 |

### 表格专家 — *耐心读小字的那位* — **v0.2 新增**

France-Visas 门户和 TLScontact 都不友好。字段名晦涩、顺序反直觉、参考号一个错字 TLS 就拒。这个角色替你读小字。

| 技能 | 功能 |
|---|---|
| `/france-visas-form` | France-Visas 门户逐页指引。标出会导致 TLS 拒你参考号的错字。边填边保存进度。 |
| `/tlscontact-form` | TLScontact 账户创建 + 参考号关联 + 预约流程配置。处理两个门户之间笨拙的衔接。 |
| `/group-application` | 家庭/团体结构规则（每人 1 个 France-Visas、1 个 TLS 团队 ID、1 个预约时段）。带团队负责人把所有人加到同一个预订。 |

### 预约协调员 — *帮你抢到时段的那位*

TLScontact 时段稀缺，伦敦 5-8 月尤其。这个角色知道在哪找、什么时候找、怎么把 `/find-slot` 跟 Visa Master Chrome 扩展配合起来抓到临时释放的时段。

| 技能 | 功能 |
|---|---|
| `/find-slot` | 无时段可用时的策略。推荐 [Visa Master 扩展](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm) 监视时段、给中心切换建议（伦敦没时段时爱丁堡 + 贝尔法斯特通常还有）、以及最后手段。 |
| `/book-appointment` | **v0.2 新增。** 时段存在后的完整预订机制指引。中心比较、时段时间策略、附加项建议（拒掉几乎所有推销）、当天清单。 |

### 申请审计师 — *提交前的第二双眼睛*

最重要的角色。提交前读完所有材料、标出领事官员会抓到的不一致。

| 技能 | 功能 |
|---|---|
| `/audit-application` | 五层提交前审计：完整性（文件齐了吗？）、一致性（日期/姓名/地址跨文件一致吗？）、可信度（财务故事合理吗？）、合规性（保险 + 照片 + 求情信对申根规范）、可受理性（你符合签证资格吗？）。PASS / HOLD / FAIL 裁决 + 建议修正。 |

### 补救顾问 — *出问题时的兜底* — **v0.2 新增**

TLS 追踪器两周不动、或拒签信到了，跟这位聊。读情况、设预期、建议行动。

| 技能 | 功能 |
|---|---|
| `/track-application` | TLS 追踪器状态解读。把"Documents in transit"翻译成"这是正常的、仅在转运中"。设现实时间线（法国从英国 7-15 个工作日）。标出真正需要担心的时刻，与只需耐心的时刻。 |
| `/refusal-appeal` | 解读拒签代码 1-9，识别哪些可修、哪些不可修。可申诉时起草申诉信。不值得申诉时建议重新申请（更便宜、更快）。 |

## 我该用哪个技能？

| 你处在这个阶段 | 跑这个 | 为什么 |
|---|---|---|
| 刚开始 | `/start-here` | 始终先跑 — 路由其他一切 |
| 有清单、要做文件 | `/document-checklist` | 个性化可打印 |
| 和小孩同行 | `/minor-application` | 别跳过 — 小孩单独处理 |
| 有人付钱 | `/sponsored-application` | 担保人文件自成一体 |
| 3+ 人申请 | `/group-application` | 团体流程结构不同 |
| 卡在表格上 | `/france-visas-form` 或 `/tlscontact-form` | 逐页带 |
| 财务担心 | `/financial-checklist` | 路由到正确的财务技能 |
| 准备提交了？ | `/audit-application` | 飞前检查 — 别跳过 |
| 没预约时段 | `/find-slot` | 策略，而不仅是焦虑 |
| 该预订了 | `/book-appointment` | 中心 + 时段 + 附加项建议 |
| 等决定 | `/track-application` | 解读追踪器、设预期 |
| 被拒了 | `/refusal-appeal` | 在申诉和重新申请之间抉择 |

## 法国知识库 — **v0.2 新增**

`countries/france/KNOWLEDGE.md` 是法国特定事实的唯一真实来源：签证费、处理时间、拒签代码 1-9、文件要求、常见怪癖。技能读它，不会引用过期规则。

英国每个 TLScontact 中心的细节：

| 文件 | 内容 |
|---|---|
| `countries/france/consulate-london.md` | Holborn 中心 — 地址、营业时间、时段模式、旺季策略 |
| `countries/france/consulate-manchester.md` | Trafford Park 中心 — 适合英格兰中部+西北 |
| `countries/france/consulate-edinburgh.md` | Atholl Crescent 中心 — 英国竞争最小 |
| `countries/france/consulate-belfast.md` | Donegall Square 中心 — 仅周二+周四，需早规划 |

## 配套工具 — Visa Master Chrome 扩展

这些技能是**准备**侧。Visa Master Chrome 扩展是**运行时**侧 — 准备完毕后，它监视 TLScontact 时段开放，并（Premium 版）自动预订。

| 产品 | 层级 | 功能 | 成本 |
|---|---|---|---|
| **Visa Master 免费版** | Free | TLS 时段开放时通知你（桌面 + 声音 + 可选 Telegram） | £0 |
| **Visa Master Premium** | Premium | 免费版 + 自动登录 + 自动预约时段；24h 退款窗口 | £19/次成功预订 |

安装：[Chrome 应用商店](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm) · 源代码+隐私：https://github.com/torlyai/Schengen-master

技能知道它的存在：`/find-slot` 推荐免费版做时段监视、`/book-appointment` 解释如何与手动预约互补、整套 ETHOS 把 Premium 视为带明确信任边界的选择项（Free 版从不向 torly.ai 发送任何东西）。

## 模板 — 可打印文件

公共仓库的 `docs/templates/visa-application/` 存放技能引用的可打印模板：求情信模板、文件清单 PDF、照片规范卡、雇主信样本、担保信样本。技能生成个性化内容；模板提供版式。

## 设计理念 — ETHOS

这些技能基于 **[Schengen-master 设计理念](ETHOS.md)** — 12 条原则，塑造每个技能的思考、建议方式。如果你要贡献代码、或想理解某个技能为何做出某个判断，请先阅读。

核心原则：

- **申请就是审计轨迹。** 各文件之间必须严格一致。
- **最便宜的成本是不返工的成本。** 在前期就做好审计。
- **无聊的文件最重要。** 银行流水 + 保险 + 工作证明比求情信修辞更重要。
- **绝不撒谎。** VIS 数据库会交叉核对一切。
- **我们是模板，不是律师。** 始终对照官方来源核实。

## v0.4 → v1.0 路线图

再 12 个技能即达完整 36 技能目录：

- **更多文件：** `/accommodation-verify`、`/translate-doc`、`/apostille`
- **更多未成年人：** `/minor-birth-certificate`、`/minor-school-letter`、`/minor-parent-docs`
- **预约日准备：** `/appointment-prep`、`/appointment-day`、`/mock-interview`
- **决定后：** `/first-trip`
- **元工具：** `/learn`（记忆）、`/audit-log`、`/vstack-upgrade`

加上更多 `countries/*` 知识库 — Germany、Italy、Spain、Netherlands。

参见 [CHANGELOG.md](CHANGELOG.md) 了解每个版本发布了什么。

## 更新与卸载

| 操作 | 命令 |
|---|---|
| 更新到最新 | 重新运行安装命令，或 `cd ~/.claude/skills/schengen-master && git pull` |
| 查看已安装版本 | `cat ~/.claude/skills/schengen-master/VERSION` |
| 卸载 | `rm -rf ~/.claude/skills/schengen-master` |

## 贡献

如果你发现某个技能信息有误、过时、或可以改进 — 请到 https://github.com/torlyai/Schengen-master/issues 提交 issue。签证规则会变；社区反馈是我们保持准确的途径。

如要添加新技能：复制 `SKILL.md.tmpl`，按格式编写，然后提交 PR。提交前请先阅读 `ETHOS.md` — 你的技能应该体现这些原则。

如要翻译技能到其他语言：复制 `<skill>/SKILL.md` 到 `i18n/<locale>/<skill>/SKILL.md` 后翻译。目前提供英文 + 简体中文；乐意接入其他语言。

## 许可证

MIT。Fork 它。改进它。让它变成你的。如果它帮助你拿到签证，那就是胜利。

---

**灵感来自** [garrytan/gstack](https://github.com/garrytan/gstack) — 业界标杆的 AI 技能工具集。我们借鉴了其架构（目录即技能 + ETHOS 注入 + 角色框架 + 流程隐喻）；签证申请这个领域是我们自己的。
