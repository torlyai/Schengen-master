# Schengen-master 技能集

> Read this in: [English](README.md) · **中文**
>
> 由九位虚拟专家协助你申请申根签证 — 行程规划师、文件工程师、会计、表格专家、未成年人专家、担保专家、预约协调员、申请审计师、补救顾问。全部 Claude Code 斜杠命令。全部 markdown。免费、开源、MIT 协议。

v0.1.0 提供 10 个技能（目标 v1.0 提供 36 个完整技能）。v0.1 专注**法国申根短期签证申请**；其他申根国家在 v1.x 上线。

---

## 安装（30 秒）

打开 Claude Code，粘贴以下命令 — 剩下的交给 Claude：

```bash
curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
```

就这么简单。下次启动 Claude Code 会话时，输入 `/start-here` 即可开始。

**重新运行同一条命令**可更新到最新版本。安装是幂等的、速度快。

**自定义安装路径：**
```bash
SCHENGEN_SKILLS_DEST=~/some/other/path curl -sSL ...install.sh | sh
```

## 快速入门

| 你说什么 | 触发什么技能 |
|---|---|
| "我想申请法国申根签证" | `/start-here` |
| "我需要哪些文件？" | `/document-checklist` |
| "帮我检查照片是否符合要求" | `/photo-check` *（附上图片时启用视觉识别）* |
| "我的旅行保险符合申根要求吗？" | `/insurance-check` |
| "帮我写求情信" | `/cover-letter` |
| "我和孩子一起申请" | `/minor-application` |
| "我的配偶担保我" | `/sponsored-application` |
| "我准备好提交申请了吗？" | `/audit-application` |
| "我找不到 TLS 预约时段" | `/find-slot` |

## v0.1 的 10 个技能

| 技能 | 角色 | 功能 |
|---|---|---|
| `/start-here` | 行程规划师 | 入口；6 个关键问题；引导你进入下一步 |
| `/document-checklist` | 文件工程师 | 根据你的目的 + 家庭 + 担保情况，定制文件清单 |
| `/photo-check` | 文件工程师 | 启用视觉识别的护照照片合规性检查 |
| `/insurance-check` | 文件工程师 | 旅行保险证明对申根要求的合规性检查（€30000+、全程覆盖、医疗遣返） |
| `/cover-letter` | 文件工程师 | 起草个性化求情信，说明出行目的 + 回国承诺 |
| `/minor-application` | 未成年人专家 | 儿童申请入口 — 出生证明、父母同意书、学校证明、父母证件 |
| `/minor-parent-consent` | 未成年人专家 | 父母一方或双方不随行时的同意书 |
| `/sponsored-application` | 担保专家 | 配偶/父母/朋友/雇主担保 — 根据担保人类型自动调整 |
| `/audit-application` | 申请审计师 | 提交前审计；阅读全部材料，标出不一致、遗漏和薄弱环节 |
| `/find-slot` | 预约协调员 | TLScontact 预约策略 + 与 [Visa Master 扩展](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm) 集成 |

## v1.0 路线图

后续将补充另外 26 个技能，形成完整的 36 技能目录：行程规划技能（`/plan-trip`、`/itinerary-builder`、`/decide-visa-type`、`/timeline-planner`）、更多文件技能（`/accommodation-verify`、`/translate-doc`、`/apostille`）、财务证明技能（`/employment-letter`、`/bank-statement-check`、`/cost-estimate`）、更多未成年人技能（`/minor-birth-certificate`、`/minor-school-letter`、`/minor-parent-docs`）、表格指南（`/france-visas-form`、`/tlscontact-form`、`/group-application`）、预约日准备（`/book-appointment`、`/appointment-prep`、`/appointment-day`）、面试准备（`/mock-interview`）、申请后补救（`/track-application`、`/refusal-appeal`、`/first-trip`）、以及元工具（`/learn`、`/audit-log`）。

详见 [CHANGELOG.md](CHANGELOG.md)。

## 关联产品

| 产品 | 角色 | 位置 |
|---|---|---|
| **Visa Master Chrome 扩展** | 监控 TLScontact 时段开放 — 免费版通知你，Premium 版自动预订 | [Chrome 应用商店](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm) |
| **Schengen-master 仓库** | 当前仓库 — 扩展、模板、技能集的发布渠道 | github.com/torlyai/Schengen-master |
| **签证申请模板** | 技能引用的可打印模板（求情信、文件清单、照片规范等） | [`docs/templates/visa-application/`](../docs/templates/visa-application/) |

## 设计理念

这些技能基于 **[Schengen-master 设计理念](ETHOS.md)** — 12 条原则，塑造每个技能的思考、建议方式。如果你要贡献代码、或想理解某个技能为何给出某个建议，请先阅读。

核心原则：
- **申请就是审计轨迹。** 各文件之间必须严格一致。
- **最便宜的成本是不返工的成本。** 在前期就做好审计。
- **无聊的文件最重要。** 银行流水 + 保险 + 工作证明比求情信修辞更重要。
- **绝不撒谎。** VIS 数据库会交叉核对一切。
- **我们是模板，不是律师。** 始终对照官方来源核实。

## 更新与卸载

| 操作 | 命令 |
|---|---|
| 更新到最新 | 重新运行安装命令，或 `cd ~/.claude/skills/schengen-master && git pull` |
| 查看已安装版本 | `cat ~/.claude/skills/schengen-master/VERSION` |
| 卸载 | `rm -rf ~/.claude/skills/schengen-master` |

## 贡献

如果你发现某个技能信息有误、过时、或可以改进 — 请到 https://github.com/torlyai/Schengen-master/issues 提交 issue。签证规则会变；社区反馈是我们保持准确的途径。

如要添加新技能：复制 `SKILL.md.tmpl`，按格式编写，然后提交 PR。提交前请先阅读 `ETHOS.md` — 你的技能应该体现这些原则。

## 许可证

MIT。Fork 它。改进它。让它变成你的。如果它帮助你拿到签证，那就是胜利。

---

**灵感来自** [garrytan/gstack](https://github.com/garrytan/gstack) — 业界标杆的 AI 技能工具集。我们借鉴了其架构；签证申请这个领域是我们自己的。
